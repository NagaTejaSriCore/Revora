import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      amount,
      currency = "INR",
      email,
      contact,
      notes,
    } = body || {};

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing required Razorpay payment verification parameters" },
        { status: 400 }
      );
    }

    // 1. Verify Razorpay Payment Signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error("RAZORPAY_KEY_SECRET is missing");
      return NextResponse.json(
        { success: false, error: "Razorpay configuration missing" },
        { status: 500 }
      );
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error("Invalid Razorpay payment signature verification failed");
      return NextResponse.json(
        { success: false, error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // 2. Initialize Supabase Admin Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Lookup existing payment record by payment_id or order_id
    const { data: existingByPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("razorpay_payment_id", razorpay_payment_id)
      .maybeSingle();

    let existingPayment = existingByPayment;

    if (!existingPayment && razorpay_order_id) {
      const { data: existingByOrder } = await supabase
        .from("payments")
        .select("id")
        .eq("razorpay_order_id", razorpay_order_id)
        .maybeSingle();
      existingPayment = existingByOrder;
    }

    let savedPaymentRecord;

    if (existingPayment) {
      console.log(`[VERIFY PAYMENT] Updating existing payment ${existingPayment.id} to captured...`);
      const { data, error } = await supabase
        .from("payments")
        .update({
          razorpay_payment_id,
          razorpay_order_id,
          status: "captured",
          amount: amount || undefined,
          email: email || undefined,
          contact: contact || undefined,
        })
        .eq("id", existingPayment.id)
        .select()
        .single();

      if (error) {
        console.error("========== PAYMENT VERIFICATION UPDATE ERROR ==========", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      savedPaymentRecord = data;
    } else {
      console.log("[VERIFY PAYMENT] Inserting new captured payment record into payments table...");
      const paymentData = {
        razorpay_payment_id,
        razorpay_order_id,
        amount: amount || 0,
        currency,
        status: "captured",
        method: "card",
        email: email || null,
        contact: contact || null,
        failure_reason: null,
      };

      const { data, error } = await supabase
        .from("payments")
        .insert(paymentData)
        .select()
        .single();

      if (error) {
        console.error("========== PAYMENT VERIFICATION INSERT ERROR ==========", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      savedPaymentRecord = data;
    }

    console.log(`[VERIFY PAYMENT] Payment ${savedPaymentRecord.id} successfully recorded in Supabase as captured.`);

    // 4. Reconcile associated recovery case if this payment was a recovery payment
    const recoveryCaseId = notes?.recovery_case_id;
    if (recoveryCaseId) {
      await supabase
        .from("recovery_cases")
        .update({
          payment_id: savedPaymentRecord.id,
          recovered_amount: savedPaymentRecord.amount,
          action_status: "completed",
        })
        .eq("id", recoveryCaseId);
    } else {
      const { data: linkedCase } = await supabase
        .from("recovery_cases")
        .select("id")
        .eq("payment_id", savedPaymentRecord.id)
        .maybeSingle();

      if (linkedCase) {
        await supabase
          .from("recovery_cases")
          .update({
            recovered_amount: savedPaymentRecord.amount,
            action_status: "completed",
          })
          .eq("id", linkedCase.id);
      }
    }

    // 5. Reconcile associated checkout_session if this payment was for a session
    const targetSessionId = notes?.session_id || notes?.recovery_session_id;
    if (targetSessionId) {
      console.log(`[VERIFY PAYMENT] Reconciling checkout_session ${targetSessionId} to COMPLETED_CAPTURED...`);
      await supabase
        .from("checkout_sessions")
        .update({
          status: "COMPLETED_CAPTURED",
          last_checkout_step: "payment_captured",
        })
        .eq("session_id", targetSessionId);
    }

    return NextResponse.json({
      success: true,
      paymentId: savedPaymentRecord.id,
      razorpayPaymentId: savedPaymentRecord.razorpay_payment_id,
      status: savedPaymentRecord.status,
    });
  } catch (err: any) {
    console.error("Payment verification error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
