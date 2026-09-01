import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    // ============================================
    // 1. READ RAW BODY
    // ============================================

    const rawBody = await request.text();

    // ============================================
    // 2. GET RAZORPAY HEADERS
    // ============================================

    const signature = request.headers.get("x-razorpay-signature");
    const eventId = request.headers.get("x-razorpay-event-id");

    // ============================================
    // 3. GET WEBHOOK SECRET
    // ============================================

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is missing");

      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    if (!signature) {
      console.error("Missing Razorpay signature");

      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // ============================================
    // 4. VERIFY RAZORPAY SIGNATURE
    // ============================================

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const receivedBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      console.error("Invalid Razorpay webhook signature");

      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // ============================================
    // 5. PARSE EVENT AFTER SIGNATURE VERIFICATION
    // ============================================

    const event = JSON.parse(rawBody);

    console.log("=================================");
    console.log("RAZORPAY WEBHOOK VERIFIED");
    console.log("Event ID:", eventId);
    console.log("Event Type:", event.event);
    console.log("=================================");

    // ============================================
    // 6. CREATE SUPABASE SERVER CLIENT
    // ============================================

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase server environment variables missing");

      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    );

    // Diagnostic information
    console.log("========== SUPABASE CONNECTION ==========");
    console.log("Supabase URL:", supabaseUrl);
    console.log("Service key exists:", !!supabaseServiceKey);
    console.log("==========================================");

    // ============================================
    // 7. HANDLE PAYMENT FAILED
    // ============================================

    if (event.event === "payment.failed") {
      const payment = event.payload?.payment?.entity;

      if (!payment) {
        console.error("Payment data missing from webhook");

        return NextResponse.json(
          { error: "Payment data missing" },
          { status: 400 }
        );
      }

      console.log("PAYMENT FAILED WEBHOOK RECORDED");
      console.log("Payment ID:", payment.id);
      console.log("Order ID:", payment.order_id);
      console.log("Amount:", payment.amount);
      console.log("Currency:", payment.currency);

      // ============================================
      // 8. CHECK IF PAYMENT ALREADY EXISTS BY PAYMENT ID OR ORDER ID
      // ============================================

      const { data: existingByPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("razorpay_payment_id", payment.id)
        .maybeSingle();

      let existingPayment = existingByPayment;

      if (!existingPayment && payment.order_id) {
        const { data: existingByOrder } = await supabase
          .from("payments")
          .select("id")
          .eq("razorpay_order_id", payment.order_id)
          .maybeSingle();
        existingPayment = existingByOrder;
      }

      let paymentRecord;

      // ============================================
      // 9. INSERT OR UPDATE PAYMENT
      // ============================================

      if (existingPayment) {
        console.log("Payment/Order record exists. Updating to failed...", existingPayment.id);

        const { data, error } = await supabase
          .from("payments")
          .update({
            razorpay_payment_id: payment.id,
            status: "failed",
            failure_reason: payment.error_description || "Payment failed",
            method: payment.method || null,
            email: payment.email || null,
            contact: payment.contact || null,
          })
          .eq("id", existingPayment.id)
          .select()
          .single();

        if (error) {
          console.error("========== PAYMENT UPDATE ERROR ==========", error);
          return NextResponse.json(
            { error: "Payment update failed" },
            { status: 500 }
          );
        }

        paymentRecord = data;
      } else {
        console.log("========== INSERTING FAILED PAYMENT ==========");

        const paymentData = {
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id || null,
          amount: payment.amount,
          currency: payment.currency || "INR",
          status: "failed",
          method: payment.method || null,
          email: payment.email || null,
          contact: payment.contact || null,
          failure_reason: payment.error_description || "Payment failed",
        };

        const { data, error } = await supabase
          .from("payments")
          .insert(paymentData)
          .select()
          .single();

        if (error) {
          console.error("========== SUPABASE PAYMENT INSERT ERROR ==========", error);
          return NextResponse.json(
            { error: "Payment insertion failed" },
            { status: 500 }
          );
        }

        paymentRecord = data;
      }

      console.log("Failed payment record saved:", paymentRecord.id);

      // ============================================
      // 10. CREATE RECOVERY CASE FOR FAILED PAYMENT
      // ============================================

      const { data: existingCase } = await supabase
        .from("recovery_cases")
        .select("id")
        .eq("payment_id", paymentRecord.id)
        .maybeSingle();

      if (!existingCase) {
        console.log("========== CREATING RECOVERY CASE ==========");

        const recoveryData = {
          payment_id: paymentRecord.id,
          risk_amount: payment.amount,
          failure_reason: payment.error_description || "Payment failed",
          ai_diagnosis: null,
          recommended_action: null,
          action_status: "pending",
          recovered_amount: 0,
        };

        const { data: recoveryCase, error } = await supabase
          .from("recovery_cases")
          .insert(recoveryData)
          .select()
          .single();

        if (error) {
          console.error("========== SUPABASE RECOVERY CASE ERROR ==========", error);
          return NextResponse.json(
            { error: "Recovery case creation failed" },
            { status: 500 }
          );
        }

        console.log("Recovery case created:", recoveryCase.id);
      }
    }

    // ============================================
    // 11. HANDLE PAYMENT CAPTURED
    // ============================================

    if (event.event === "payment.captured") {
      const payment = event.payload?.payment?.entity;

      if (payment) {
        console.log("PAYMENT CAPTURED WEBHOOK RECEIVED");
        console.log("Razorpay Payment ID:", payment.id);
        console.log("Razorpay Order ID:", payment.order_id);
        console.log("Amount:", payment.amount);

        // 1. Lookup existing payment record in database by payment_id or order_id
        const { data: existingByPayment } = await supabase
          .from("payments")
          .select("id")
          .eq("razorpay_payment_id", payment.id)
          .maybeSingle();

        let existingPayment = existingByPayment;

        if (!existingPayment && payment.order_id) {
          const { data: existingByOrder } = await supabase
            .from("payments")
            .select("id")
            .eq("razorpay_order_id", payment.order_id)
            .maybeSingle();
          existingPayment = existingByOrder;
        }

        let capturedPaymentRecord;

        if (existingPayment) {
          console.log("Updating existing payment status to captured:", existingPayment.id);
          const { data, error } = await supabase
            .from("payments")
            .update({
              razorpay_payment_id: payment.id,
              razorpay_order_id: payment.order_id || null,
              status: "captured",
              amount: payment.amount,
              method: payment.method || undefined,
              email: payment.email || undefined,
              contact: payment.contact || undefined,
              failure_reason: null,
            })
            .eq("id", existingPayment.id)
            .select()
            .single();

          if (error) {
            console.error("========== CAPTURED PAYMENT UPDATE ERROR ==========", error);
            return NextResponse.json({ error: "Payment update failed" }, { status: 500 });
          }
          capturedPaymentRecord = data;
        } else {
          console.log("Inserting new captured payment record into payments table...");
          const paymentData = {
            razorpay_payment_id: payment.id,
            razorpay_order_id: payment.order_id || null,
            amount: payment.amount,
            currency: payment.currency || "INR",
            status: "captured",
            method: payment.method || null,
            email: payment.email || null,
            contact: payment.contact || null,
            failure_reason: null,
          };

          const { data, error } = await supabase
            .from("payments")
            .insert(paymentData)
            .select()
            .single();

          if (error) {
            console.error("========== CAPTURED PAYMENT INSERT ERROR ==========", error);
            return NextResponse.json({ error: "Payment insertion failed" }, { status: 500 });
          }
          capturedPaymentRecord = data;
        }

        console.log("Captured payment record processed:", capturedPaymentRecord.id);

        // 2. Reconcile associated recovery case if this payment was a recovery payment
        const recoveryCaseId = payment.notes?.recovery_case_id;

        if (recoveryCaseId) {
          console.log("Updating recovery case from notes:", recoveryCaseId);
          const { error: caseUpdateError } = await supabase
            .from("recovery_cases")
            .update({
              payment_id: capturedPaymentRecord.id,
              recovered_amount: payment.amount,
              action_status: "completed"
            })
            .eq("id", recoveryCaseId);

          if (caseUpdateError) {
            console.error("========== RECOVERY CASE UPDATE ERROR ==========", caseUpdateError);
          } else {
            console.log("Recovery case successfully reconciled and marked as completed!");
          }
        } else {
          // Fallback check: update recovery case linked via payment_id
          const { data: linkedCase } = await supabase
            .from("recovery_cases")
            .select("id")
            .eq("payment_id", capturedPaymentRecord.id)
            .maybeSingle();

          if (linkedCase) {
            console.log("Updating recovery case from linked payment:", linkedCase.id);
            await supabase
              .from("recovery_cases")
              .update({
                recovered_amount: payment.amount,
                action_status: "completed"
              })
              .eq("id", linkedCase.id);
          }
        }
      }
    }

    // ============================================
    // 12. SUCCESS RESPONSE
    // ============================================

    console.log("=================================");
    console.log("WEBHOOK PROCESSING COMPLETED");
    console.log("=================================");

    return NextResponse.json({
      success: true,
      received: true,
    });
  } catch (error) {
    console.error("========== WEBHOOK PROCESSING ERROR ==========", error);

    return NextResponse.json(
      {
        success: false,
        error: "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}