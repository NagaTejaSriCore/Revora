import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI, Type } from "@google/genai";

const VALID_REASON_CATEGORIES = [
  "checkout_friction",
  "payment_uncertainty",
  "payment_method_issue",
  "price_sensitivity",
  "technical_issue",
  "customer_inactivity",
  "unknown",
] as const;

const VALID_ACTION_TYPES = [
  "retry_payment",
  "alternative_payment_method",
  "payment_link",
  "customer_notification",
] as const;

// In-memory cache to prevent duplicate Gemini API calls for the same session
const analysisCache = new Map<string, any>();

import { verifyMerchantAuth } from "@/lib/authServer";

export async function POST(request: Request) {
  const authResult = await verifyMerchantAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const { session_id } = body || {};

    if (!session_id) {
      return NextResponse.json(
        { success: false, error: "Missing session_id in request body" },
        { status: 400 }
      );
    }

    // Duplicate protection: Check if analysis is already cached for this session
    if (analysisCache.has(session_id)) {
      console.log(`[ABANDONMENT AI] Returning cached analysis for session ${session_id}`);
      return NextResponse.json({
        success: true,
        session_id,
        analysis: analysisCache.get(session_id),
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: "Supabase configuration missing on server" },
        { status: 500 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { success: false, error: "Gemini API key not configured on server." },
        { status: 500 }
      );
    }

    // Initialize Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch checkout session from Supabase
    const { data: session, error: fetchErr } = await supabase
      .from("checkout_sessions")
      .select("*")
      .eq("session_id", session_id)
      .maybeSingle();

    if (fetchErr || !session) {
      return NextResponse.json(
        { success: false, error: "Checkout session not found in Supabase database" },
        { status: 404 }
      );
    }

    if (session.status !== "ABANDONED") {
      return NextResponse.json(
        { success: false, error: `Session status is '${session.status}', not 'ABANDONED'` },
        { status: 400 }
      );
    }

    const cartVal = Number(session.cart_value) || 0;

    const prompt = `
You are Revora's AI checkout abandonment recovery agent. Your job is to analyze details of an abandoned customer checkout session and return a structured diagnosis along with a recommended recovery strategy.

ABANDONED CHECKOUT SESSION DETAILS:
- Session ID: ${session.session_id}
- Cart Value: ₹${cartVal}
- Item Count: ${session.item_count || 1}
- Customer Email: ${session.customer_email || "not provided"}
- Customer Phone: ${session.customer_phone || "not provided"}
- Customer Name: ${session.customer_name || "not provided"}
- Last Checkout Step: ${session.last_checkout_step || "unknown"}
- Last Activity Time: ${session.last_activity_at || "unknown"}
- Abandonment Time: ${session.abandoned_at || "unknown"}

CRITICAL INSTRUCTIONS:
1. Reason Categories allowed: "checkout_friction", "payment_uncertainty", "payment_method_issue", "price_sensitivity", "technical_issue", "customer_inactivity", "unknown".
2. Action Types allowed: "retry_payment", "alternative_payment_method", "payment_link", "customer_notification".
3. Do NOT claim certainty if available information is insufficient (e.g., if the customer simply left at the payment page and there is no error code, classify reason_category as "customer_inactivity" or "unknown" and state clearly in the diagnosis that the exact reason cannot be determined with certainty). Do not invent facts.
4. RECOVERY STRATEGY SELECTION RULE:
- If checkout session status is ABANDONED and cart_value > 0 and no payment has completed, the preferred action_type MUST be "payment_link" so the merchant can issue a direct recovery payment link for ₹${cartVal}.
- Select "customer_notification" ONLY if cart_value is 0/missing or no payment link can safely be generated.
`;

    // Initialize Google GenAI client
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    let contentText: string | undefined;

    // Retry loop in case Gemini API free tier rate limits (429) occur
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                diagnosis: {
                  type: Type.STRING,
                  description: "Concise analysis of why the checkout was abandoned without inventing unverified facts.",
                },
                recommended_action: {
                  type: Type.STRING,
                  description: "Clear recommended recovery strategy for the merchant to execute.",
                },
                confidence: {
                  type: Type.NUMBER,
                  description: "Confidence score between 0.0 and 1.0.",
                },
                reason_category: {
                  type: Type.STRING,
                  enum: [
                    "checkout_friction",
                    "payment_uncertainty",
                    "payment_method_issue",
                    "price_sensitivity",
                    "technical_issue",
                    "customer_inactivity",
                    "unknown",
                  ],
                  description: "Classification category of abandonment.",
                },
                action_type: {
                  type: Type.STRING,
                  enum: [
                    "retry_payment",
                    "alternative_payment_method",
                    "payment_link",
                    "customer_notification",
                  ],
                  description: "Recommended recovery action type.",
                },
              },
              required: ["diagnosis", "recommended_action", "confidence", "reason_category", "action_type"],
            },
          },
        });
        contentText = response.text;
        if (contentText) break;
      } catch (geminiErr: any) {
        console.warn(`[GEMINI API ATTEMPT ${attempt}] Error:`, geminiErr?.message || geminiErr);
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 2000)); // Wait 2s before retry
        }
      }
    }

    let validatedAnalysis: any;

    if (contentText) {
      try {
        const aiResult = JSON.parse(contentText);
        if (
          aiResult &&
          typeof aiResult.diagnosis === "string" &&
          aiResult.diagnosis.trim() &&
          typeof aiResult.recommended_action === "string" &&
          aiResult.recommended_action.trim() &&
          typeof aiResult.confidence === "number" &&
          VALID_REASON_CATEGORIES.includes(aiResult.reason_category) &&
          VALID_ACTION_TYPES.includes(aiResult.action_type)
        ) {
          validatedAnalysis = {
            diagnosis: aiResult.diagnosis.trim(),
            recommended_action: aiResult.recommended_action.trim(),
            confidence: Math.min(Math.max(aiResult.confidence, 0), 1),
            reason_category: aiResult.reason_category,
            action_type: aiResult.action_type,
          };
        }
      } catch (pErr) {
        console.error("JSON parse error on Gemini content:", pErr);
      }
    }

    // Fallback structured diagnosis if Gemini API rate limits/throttles
    if (!validatedAnalysis) {
      validatedAnalysis = {
        diagnosis: `Customer exited at ${session.last_checkout_step || "payment page"} without completing payment. Exact cause cannot be determined with certainty due to lack of error logs.`,
        recommended_action: cartVal > 0
          ? `Generate a custom recovery payment link for ₹${cartVal.toLocaleString("en-IN")} allowing the customer to complete their outstanding checkout directly.`
          : "Log customer notification reminder for abandoned session.",
        confidence: 0.75,
        reason_category: "customer_inactivity",
        action_type: cartVal > 0 ? "payment_link" : "customer_notification",
      };
    }

    // Action Selection Rule: If abandoned session has recoverable cart_value > 0 and no completed payment, enforce payment_link as preferred action_type
    if (cartVal > 0 && session.status === "ABANDONED") {
      validatedAnalysis.action_type = "payment_link";
      if (!validatedAnalysis.recommended_action || validatedAnalysis.recommended_action.includes("notification")) {
        validatedAnalysis.recommended_action = `Generate a custom recovery payment link for ₹${cartVal.toLocaleString("en-IN")} allowing the customer to complete their outstanding checkout directly.`;
      }
    }

    // Cache the analysis result for duplicate protection
    analysisCache.set(session_id, validatedAnalysis);

    return NextResponse.json({
      success: true,
      session_id,
      analysis: validatedAnalysis,
    });
  } catch (error: any) {
    console.error("Abandonment analyze route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error during abandonment analysis" },
      { status: 500 }
    );
  }
}
