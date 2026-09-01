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
      console.error("Missing Supabase configuration for performance analytics");
      return NextResponse.json(
        { success: false, error: "Database configuration missing on server" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query recovery cases
    const { data: recoveryCases, error } = await supabase
      .from("recovery_cases")
      .select("id, action_status, recovered_amount, risk_amount");

    if (error) {
      console.error("Error fetching recovery cases for performance metrics:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch performance analytics" },
        { status: 500 }
      );
    }

    const cases = recoveryCases || [];

    // 1. Total Recovery Cases
    const totalRecoveryCases = cases.length;

    // 2. Recovery Attempts: cases attempted, completed, or failed
    const recoveryAttempts = cases.filter(
      (c) => c.action_status === "attempted" || c.action_status === "completed" || c.action_status === "failed" || c.recovered_amount > 0
    ).length;

    // 3. Successful Recoveries: action_status = completed/recovered AND recovered_amount > 0
    const successfulRecoveries = cases.filter(
      (c) => (c.action_status === "completed" || c.action_status === "recovered") && c.recovered_amount > 0
    ).length;

    // 4. Failed Recoveries: action_status = failed
    const failedRecoveries = cases.filter((c) => c.action_status === "failed").length;

    // 5. Pending Recoveries: action_status = pending
    const pendingRecoveries = cases.filter((c) => c.action_status === "pending").length;

    // 6. Recovery Conversion Rate: successfulRecoveries / recoveryAttempts * 100
    const unroundedRate = recoveryAttempts > 0 ? (successfulRecoveries / recoveryAttempts) * 100 : 0;
    const conversionRate = Math.min(100, Number(unroundedRate.toFixed(2)));

    // 7. Total Recovered Revenue: sum of recovered_amount (paise)
    const totalRecoveredRevenue = cases.reduce((sum, c) => {
      if ((c.action_status === "completed" || c.action_status === "recovered") && c.recovered_amount > 0) {
        return sum + c.recovered_amount;
      }
      return sum;
    }, 0);

    // 8. Average Recovered Amount: totalRecoveredRevenue / successfulRecoveries (paise)
    const averageRecoveryValue = successfulRecoveries > 0 ? Math.round(totalRecoveredRevenue / successfulRecoveries) : 0;

    const performanceMetrics = {
      totalRecoveryCases,
      recoveryAttempts,
      successfulRecoveries,
      failedRecoveries,
      pendingRecoveries,
      conversionRate,
      totalRecoveredRevenue,
      averageRecoveryValue,
    };

    return NextResponse.json({
      success: true,
      metrics: performanceMetrics,
      data: performanceMetrics,
    });

  } catch (error: any) {
    console.error("Recovery performance API route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error during performance processing" },
      { status: 500 }
    );
  }
}
