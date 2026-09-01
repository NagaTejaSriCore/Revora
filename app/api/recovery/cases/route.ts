import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyMerchantAuth } from "@/lib/authServer";

export async function GET(req: Request) {
  const authResult = await verifyMerchantAuth(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase server environment variables");
      return NextResponse.json(
        { error: "Database configuration missing on server" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch recovery cases with their associated payments
    const { data, error } = await supabase
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
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching recovery cases:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cases: data,
      data: data,
      geminiConfigured: !!process.env.GEMINI_API_KEY,
    });
  } catch (error: any) {
    console.error("Failed to retrieve recovery cases:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
