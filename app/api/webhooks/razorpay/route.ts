import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";


export async function POST(request: NextRequest) {
  try {
    // 1. Get the RAW request body
    console.log("========== WEBHOOK REQUEST ==========");
console.log("Headers:");

request.headers.forEach((value, key) => {
  console.log(key, ":", value);
});

console.log("====================================");
    const rawBody = await request.text();

    // 2. Get Razorpay signature
    const signature = request.headers.get("x-razorpay-signature");

    // 3. Get Razorpay event ID
    const eventId = request.headers.get("x-razorpay-event-id");

    // 4. Get webhook secret
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

    // 5. Generate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    // 6. Compare signatures safely
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      console.error("Invalid Razorpay webhook signature");

      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // 7. Parse webhook only AFTER signature verification
    const event = JSON.parse(rawBody);

    console.log("=================================");
    console.log("RAZORPAY WEBHOOK VERIFIED");
    console.log("=================================");
    console.log("Event ID:", eventId);
    console.log("Event Type:", event.event);
    console.log("=================================");

    // 8. Handle payment.failed
    if (event.event === "payment.failed") {
      const payment = event.payload?.payment?.entity;

      console.log("PAYMENT FAILED");
      console.log("Payment ID:", payment?.id);
      console.log("Order ID:", payment?.order_id);
      console.log("Amount:", payment?.amount);
      console.log("Error Code:", payment?.error_code);
      console.log(
        "Error Description:",
        payment?.error_description
      );
    }

    // 9. Handle payment.captured
    if (event.event === "payment.captured") {
      const payment = event.payload?.payment?.entity;

      console.log("PAYMENT CAPTURED");
      console.log("Payment ID:", payment?.id);
      console.log("Order ID:", payment?.order_id);
      console.log("Amount:", payment?.amount);
    }

    // 10. Acknowledge Razorpay
    return NextResponse.json({
      success: true,
      received: true,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}