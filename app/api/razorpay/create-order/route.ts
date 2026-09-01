import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recovery_order, recovery_session, amount: bodyAmount } = body || {};

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // 1. If recovery_order is provided, fetch order directly from Razorpay gateway
    if (recovery_order && typeof recovery_order === "string") {
      try {
        const order = await razorpay.orders.fetch(recovery_order);
        if (order && order.id) {
          return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount, // Authoritative amount in paise from Razorpay (e.g. 899900)
            currency: order.currency || "INR",
            keyId: process.env.RAZORPAY_KEY_ID,
            isRecovery: true,
          });
        }
      } catch (fetchErr: any) {
        console.warn(`[RAZORPAY RECOVERY ORDER FETCH WARNING] Failed to fetch ${recovery_order}:`, fetchErr.message);
      }
    }

    // 2. If recovery_session is provided, fetch authoritative cart_value from Supabase checkout_sessions table
    if (recovery_session && typeof recovery_session === "string") {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: sessionRow } = await supabase
          .from("checkout_sessions")
          .select("*")
          .eq("session_id", recovery_session)
          .maybeSingle();

        if (sessionRow && sessionRow.cart_value) {
          const authAmountPaise = Math.round(Number(sessionRow.cart_value) * 100);
          const order = await razorpay.orders.create({
            amount: authAmountPaise,
            currency: "INR",
            receipt: `rev_sess_${Date.now()}`,
            notes: { recovery_session_id: recovery_session },
          });

          return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount, // Authoritative amount in paise from Supabase cart_value
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            isRecovery: true,
          });
        }
      }
    }

    // 3. Standard customer order creation
    const amount = Number(bodyAmount);
    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid amount",
        },
        { status: 400 }
      );
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `revora_${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create Razorpay order",
      },
      { status: 500 }
    );
  }
}