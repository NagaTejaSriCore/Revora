import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function GET() {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount: 10000,
      currency: "INR",
      receipt: `revora_test_${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
    });
  } catch (error) {
    console.error("Razorpay error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create Razorpay test order",
      },
      { status: 500 }
    );
  }
}