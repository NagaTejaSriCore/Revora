import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI, Type } from "@google/genai";

const VALID_REASON_CATEGORIES = [
  "insufficient_funds",
  "card_declined",
  "authentication_failure",
  "network_error",
  "payment_method_issue",
  "bank_issue",
  "unknown"
] as const;

const VALID_ACTION_TYPES = [
  "retry_payment",
  "alternative_payment_method",
  "payment_link",
  "customer_notification"
] as const;

import { verifyMerchantAuth } from "@/lib/authServer";

export async function POST(request: Request) {
  const authResult = await verifyMerchantAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const { recovery_case_id } = body;

    if (!recovery_case_id) {
      return NextResponse.json(
        { success: false, error: "Missing recovery_case_id in request body" },
        { status: 400 }
      );
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
        { success: false, error: "Gemini API key not configured on server. Please set GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    // Initialize Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch recovery case joined with payments
    const { data: recoveryCase, error: fetchError } = await supabase
      .from("recovery_cases")
      .select(`
        *,
        payments (
          razorpay_payment_id,
          razorpay_order_id,
          amount,
          currency,
          status,
          method,
          email,
          contact,
          failure_reason,
          created_at
        )
      `)
      .eq("id", recovery_case_id)
      .maybeSingle();

    if (fetchError || !recoveryCase) {
      console.error("Error fetching recovery case:", fetchError);
      return NextResponse.json(
        { success: false, error: "Recovery case not found in database" },
        { status: 404 }
      );
    }

    // Duplicate protection: if ai_diagnosis is already populated, return stored result without re-invoking Gemini
    if (recoveryCase.ai_diagnosis) {
      return NextResponse.json({
        success: true,
        case: recoveryCase,
      });
    }

    const payment = recoveryCase.payments;

    const prompt = `
You are Revora's AI payment recovery agent. Your job is to analyze details of a failed payment from Razorpay and return a structured diagnosis along with a recommended action type.

PAYMENT FAILURE DETAILS:
- Payment ID: ${payment?.razorpay_payment_id || "N/A"}
- Amount: ${payment?.amount ? payment.amount / 100 : recoveryCase.risk_amount / 100} ${payment?.currency || "INR"}
- Method: ${payment?.method || "unknown"}
- Email: ${payment?.email || "unknown"}
- Contact: ${payment?.contact || "unknown"}
- Gateway Failure Description: "${recoveryCase.failure_reason || "Payment failed"}"

CRITICAL INSTRUCTIONS:
1. Do NOT invent card-specific or account-specific failure reasons if the Gateway Failure Description is generic (e.g., "Payment failed", "Failed", "null", or no specific failure reason code is specified). In such generic cases, you MUST classify reason_category as "unknown", set confidence below 0.4, state in the diagnosis that the payment gateway did not provide a specific failure reason code, and set action_type to "payment_link" or "customer_notification".
2. If the failure description contains specific details (e.g., "incorrect OTP", "insufficient funds", "expired card", "invalid card number", "network error"), classify it under the most appropriate reason_category ("insufficient_funds", "card_declined", "authentication_failure", "network_error", "payment_method_issue", "bank_issue", or "unknown") and select the best action_type from:
   - "retry_payment" (for transient network/bank errors or timeouts)
   - "alternative_payment_method" (for card expired, card declined, or payment method issues)
   - "payment_link" (for invoice/manual recovery)
   - "customer_notification" (for authentication issues or OTP timeouts needing user action)
`;

    // Initialize Google GenAI client
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

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
              description: "Concise user-friendly description of what failed in simple business terms."
            },
            recommended_action: {
              type: Type.STRING,
              description: "Clear recommended next step to recover this payment."
            },
            confidence: {
              type: Type.NUMBER,
              description: "Float between 0.0 and 1.0 representing confidence in this diagnosis."
            },
            reason_category: {
              type: Type.STRING,
              enum: [
                "insufficient_funds",
                "card_declined",
                "authentication_failure",
                "network_error",
                "payment_method_issue",
                "bank_issue",
                "unknown"
              ],
              description: "High-level classification category of the failure reason."
            },
            action_type: {
              type: Type.STRING,
              enum: [
                "retry_payment",
                "alternative_payment_method",
                "payment_link",
                "customer_notification"
              ],
              description: "Recommended action type for the recovery toolkit."
            }
          },
          required: ["diagnosis", "recommended_action", "confidence", "reason_category", "action_type"]
        }
      }
    });

    const contentText = response.text;

    if (!contentText) {
      throw new Error("Received an empty response content from Gemini API");
    }

    let aiResult: any;
    try {
      aiResult = JSON.parse(contentText);
    } catch (parseError) {
      console.error("JSON parsing error on Gemini content:", contentText);
      throw new Error("Failed to parse Gemini AI response content as JSON");
    }

    // Validate the Gemini response before writing to Supabase
    if (
      !aiResult ||
      typeof aiResult.diagnosis !== "string" ||
      !aiResult.diagnosis.trim() ||
      typeof aiResult.recommended_action !== "string" ||
      !aiResult.recommended_action.trim() ||
      typeof aiResult.confidence !== "number" ||
      isNaN(aiResult.confidence) ||
      !VALID_REASON_CATEGORIES.includes(aiResult.reason_category) ||
      !VALID_ACTION_TYPES.includes(aiResult.action_type)
    ) {
      console.error("Invalid AI response schema received from Gemini:", aiResult);
      throw new Error("Gemini response did not match the expected schema validation");
    }

    const diagnosisText = aiResult.diagnosis.trim();
    const recommendedActionText = aiResult.recommended_action.trim();
    const confidenceScore = Math.min(Math.max(aiResult.confidence, 0), 1);
    const category = aiResult.reason_category;
    const actionType = aiResult.action_type;

    // Format serialized JSON for the DB column
    const dbAiDiagnosis = JSON.stringify({
      diagnosis: diagnosisText,
      confidence: confidenceScore,
      reason_category: category,
      action_type: actionType
    });

    // Update database recovery case record
    // Keep action_status as "pending"
    const { data: updatedCase, error: updateError } = await supabase
      .from("recovery_cases")
      .update({
        ai_diagnosis: dbAiDiagnosis,
        recommended_action: recommendedActionText,
        action_status: "pending"
      })
      .eq("id", recovery_case_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating recovery case in DB:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to save AI diagnosis in database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      case: updatedCase
    });

  } catch (error: any) {
    console.error("AI recovery analyze route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error during diagnosis" },
      { status: 500 }
    );
  }
}
