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

      console.log("PAYMENT FAILED");
      console.log("Payment ID:", payment.id);
      console.log("Order ID:", payment.order_id);
      console.log("Amount:", payment.amount);
      console.log("Currency:", payment.currency);
      console.log("Method:", payment.method);
      console.log("Email:", payment.email);
      console.log("Contact:", payment.contact);
      console.log(
        "Failure:",
        payment.error_description
      );

      // ============================================
      // 8. CHECK IF PAYMENT ALREADY EXISTS
      // ============================================

      const { data: existingPayment, error: existingError } =
        await supabase
          .from("payments")
          .select("id")
          .eq("razorpay_payment_id", payment.id)
          .maybeSingle();

      if (existingError) {
        console.error(
          "Error checking existing payment:",
          existingError
        );

        return NextResponse.json(
          { error: "Database lookup failed" },
          { status: 500 }
        );
      }

      let paymentRecord;

      // ============================================
      // 9. INSERT OR UPDATE PAYMENT
      // ============================================

      if (existingPayment) {
        const { data, error } = await supabase
          .from("payments")
          .update({
            status: "failed",
            failure_reason:
              payment.error_description || "Payment failed",
            method: payment.method || null,
            email: payment.email || null,
            contact: payment.contact || null,
          })
          .eq("id", existingPayment.id)
          .select()
          .single();

        if (error) {
          console.error(
            "Error updating payment:",
            error
          );

          return NextResponse.json(
            { error: "Payment update failed" },
            { status: 500 }
          );
        }

        paymentRecord = data;
      } else {
        const { data, error } = await supabase
          .from("payments")
          .insert({
            razorpay_payment_id: payment.id,
            razorpay_order_id: payment.order_id,
            amount: payment.amount,
            currency: payment.currency,
            status: "failed",
            method: payment.method || null,
            email: payment.email || null,
            contact: payment.contact || null,
            failure_reason:
              payment.error_description || "Payment failed",
          })
          .select()
          .single();

        if (error) {
          console.error(
            "Error inserting payment:",
            error
          );

          return NextResponse.json(
            { error: "Payment insertion failed" },
            { status: 500 }
          );
        }

        paymentRecord = data;
      }

      console.log(
        "Payment saved:",
        paymentRecord.id
      );

      // ============================================
      // 10. CREATE RECOVERY CASE
      // ============================================

      const { data: existingCase, error: caseCheckError } =
        await supabase
          .from("recovery_cases")
          .select("id")
          .eq("payment_id", paymentRecord.id)
          .maybeSingle();

      if (caseCheckError) {
        console.error(
          "Error checking recovery case:",
          caseCheckError
        );

        return NextResponse.json(
          { error: "Recovery case lookup failed" },
          { status: 500 }
        );
      }

      if (!existingCase) {
        const { data: recoveryCase, error } =
          await supabase
            .from("recovery_cases")
            .insert({
              payment_id: paymentRecord.id,

              risk_amount: payment.amount,

              failure_reason:
                payment.error_description ||
                "Payment failed",

              ai_diagnosis: null,

              recommended_action: null,

              action_status: "pending",

              recovered_amount: 0,
            })
            .select()
            .single();

        if (error) {
          console.error(
            "Error creating recovery case:",
            error
          );

          return NextResponse.json(
            { error: "Recovery case creation failed" },
            { status: 500 }
          );
        }

        console.log(
          "Recovery case created:",
          recoveryCase.id
        );
      } else {
        console.log(
          "Recovery case already exists:",
          existingCase.id
        );
      }
    }

    // ============================================
    // 11. HANDLE PAYMENT CAPTURED
    // ============================================

    if (event.event === "payment.captured") {
      const payment = event.payload?.payment?.entity;

      if (payment) {
        console.log("PAYMENT CAPTURED");
        console.log("Payment ID:", payment.id);
        console.log("Order ID:", payment.order_id);

        const { error } = await supabase
          .from("payments")
          .update({
            status: "captured",
          })
          .eq("razorpay_payment_id", payment.id);

        if (error) {
          console.error(
            "Error updating captured payment:",
            error
          );

          return NextResponse.json(
            { error: "Payment update failed" },
            { status: 500 }
          );
        }
      }
    }

    // ============================================
    // 12. SUCCESS RESPONSE
    // ============================================

    return NextResponse.json({
      success: true,
      received: true,
    });
  } catch (error) {
    console.error(
      "Webhook processing error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}