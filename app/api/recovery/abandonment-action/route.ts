import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";

import { verifyMerchantAuth } from "@/lib/authServer";

export async function POST(request: Request) {
  const authResult = await verifyMerchantAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const { session_id, action_type = "payment_link" } = body || {};

    if (!session_id) {
      return NextResponse.json(
        { success: false, error: "Missing session_id in request body" },
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

    // 1. Fetch authoritative checkout session from Supabase database
    const { data: sessionRow, error: fetchErr } = await supabase
      .from("checkout_sessions")
      .select("*")
      .eq("session_id", session_id)
      .maybeSingle();

    if (fetchErr || !sessionRow) {
      return NextResponse.json(
        { success: false, error: "Checkout session not found in Supabase database" },
        { status: 404 }
      );
    }

    // 2. Authoritative cart value from database row
    const authoritativeCartValue = Number(sessionRow.cart_value) || 0;
    if (authoritativeCartValue <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid cart value for checkout session" },
        { status: 400 }
      );
    }

    const amountInPaise = Math.round(authoritativeCartValue * 100);

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json(
        { success: false, error: "Razorpay credentials not configured on server" },
        { status: 500 }
      );
    }

    // 3. Create genuine Razorpay order with authoritative cart value
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `rev_rec_${Date.now()}`,
      notes: {
        session_id: session_id,
        recovery_session_id: session_id,
        customer_email: sessionRow.customer_email || "",
      },
    });

    // 4. Construct secure recovery link URL
    const origin = request.headers.get("origin") || "http://localhost:3000";
    const paymentLinkUrl = `${origin}/checkout?recovery_session=${session_id}&recovery_order=${order.id}&amount=${authoritativeCartValue}`;

    return NextResponse.json({
      success: true,
      session_id,
      order_id: order.id,
      cart_value: authoritativeCartValue,
      amount_paise: amountInPaise,
      payment_link_url: paymentLinkUrl,
    });
  } catch (error: any) {
    console.error("Abandonment action API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate recovery link" },
      { status: 500 }
    );
  }
}
