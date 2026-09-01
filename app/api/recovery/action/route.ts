import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";

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
    const { recovery_case_id, action_type } = body;

    if (!recovery_case_id) {
      return NextResponse.json(
        { success: false, error: "Missing recovery_case_id in request body" },
        { status: 400 }
      );
    }

    if (!action_type || !VALID_ACTION_TYPES.includes(action_type as any)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid or missing action_type. Must be one of: ${VALID_ACTION_TYPES.join(", ")}`
        },
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch recovery case joined with payments table
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
      console.error("Error fetching recovery case for action:", fetchError);
      return NextResponse.json(
        { success: false, error: "Recovery case not found in database" },
        { status: 404 }
      );
    }

    // Check existing diagnosis for payment_link_url
    let parsedDiagnosis: any = {};
    if (recoveryCase.ai_diagnosis) {
      try {
        parsedDiagnosis = JSON.parse(recoveryCase.ai_diagnosis);
      } catch (e) {
        parsedDiagnosis = { diagnosis: recoveryCase.ai_diagnosis };
      }
    }

    // Duplicate action handling: if already completed, prevent action
    if (recoveryCase.action_status === "completed") {
      return NextResponse.json(
        {
          success: false,
          error: "Recovery case has already been completed."
        },
        { status: 400 }
      );
    }

    // Duplicate link request check: if payment_link_url already generated and action attempted
    if (action_type === "payment_link" && parsedDiagnosis.payment_link_url && recoveryCase.action_status === "attempted") {
      return NextResponse.json(
        {
          success: false,
          error: "A recovery payment link has already been generated for this case.",
          payment_link_url: parsedDiagnosis.payment_link_url,
          case: recoveryCase,
          alreadyExisted: true
        },
        { status: 400 }
      );
    }

    // If duplicate simulation action for non-link actions
    if (action_type !== "payment_link" && (recoveryCase.action_status === "attempted")) {
      return NextResponse.json(
        {
          success: false,
          error: `Recovery action '${action_type}' has already been attempted for this case.`
        },
        { status: 400 }
      );
    }

    let generatedPaymentLinkUrl: string | undefined = undefined;

    if (action_type === "payment_link") {
      const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!razorpayKeyId || !razorpayKeySecret) {
        return NextResponse.json(
          { success: false, error: "Razorpay credentials not configured on server" },
          { status: 500 }
        );
      }

      const razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      });

      const payment = recoveryCase.payments;
      const amountInPaise = payment?.amount || recoveryCase.risk_amount || 10000;

      const linkOptions: any = {
        amount: amountInPaise,
        currency: payment?.currency || "INR",
        accept_partial: false,
        description: `Revora Recovery Payment (Case #${recovery_case_id.slice(0, 8)})`,
        customer: {
          name: payment?.email ? payment.email.split("@")[0] : "Customer",
          email: payment?.email || undefined,
          contact: payment?.contact || undefined,
        },
        notify: {
          sms: false,
          email: false,
        },
        reminder_enable: false,
        notes: {
          recovery_case_id,
          original_payment_id: payment?.razorpay_payment_id || "",
        },
        callback_url: `http://localhost:3000/?recovered=true`,
        callback_method: "get",
      };

      const paymentLink = await razorpay.paymentLink.create(linkOptions);
      generatedPaymentLinkUrl = paymentLink.short_url || (paymentLink as any).url;

      parsedDiagnosis.payment_link_url = generatedPaymentLinkUrl;
      parsedDiagnosis.payment_link_id = paymentLink.id;
      parsedDiagnosis.action_type = "payment_link";
    } else {
      parsedDiagnosis.action_type = action_type;
    }

    const updatedAiDiagnosis = JSON.stringify(parsedDiagnosis);

    // Record action attempt in database
    // Keep recovered_amount strictly at 0 (or current value)
    const { data: updatedCase, error: updateError } = await supabase
      .from("recovery_cases")
      .update({
        action_status: "attempted",
        ai_diagnosis: updatedAiDiagnosis,
        recovered_amount: recoveryCase.recovered_amount || 0
      })
      .eq("id", recovery_case_id)
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
      .single();

    if (updateError) {
      console.error("Error updating recovery case action status:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to record recovery action in database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: generatedPaymentLinkUrl
        ? "Razorpay recovery payment link generated successfully."
        : `Recovery action '${action_type}' recorded as attempted (Demo Mode).`,
      action_type,
      payment_link_url: generatedPaymentLinkUrl || parsedDiagnosis.payment_link_url,
      case: updatedCase
    });

  } catch (error: any) {
    console.error("Recovery action route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error during recovery action" },
      { status: 500 }
    );
  }
}
