import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function verifyMerchantAuth(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { success: false, error: "Server configuration missing" },
        { status: 500 }
      ),
    };
  }

  // 1. Check Authorization header: Bearer <token>
  const authHeader = req.headers.get("authorization");
  let token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;

  // 2. Fallback to cookies if Bearer header is omitted
  if (!token) {
    const cookieHeader = req.headers.get("cookie") || "";
    const match =
      cookieHeader.match(/revora-auth-token=([^;]+)/) ||
      cookieHeader.match(/sb-access-token=([^;]+)/) ||
      cookieHeader.match(/sb-[a-z0-9]+-auth-token=([^;]+)/);
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  if (!token) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized: Merchant login required" },
        { status: 401 }
      ),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or expired merchant session" },
        { status: 401 }
      ),
    };
  }

  return { authenticated: true, user: data.user };
}
