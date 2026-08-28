import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .limit(5);

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payments: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Supabase connection failed",
      },
      { status: 500 }
    );
  }
}