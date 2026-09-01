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
      console.error("Missing Supabase configuration for metrics route");
      return NextResponse.json(
        { error: "Database configuration missing on server" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Query recovery_cases table (Payment Failure Recovery Opportunities)
    const { data: recoveryCases, error: casesErr } = await supabase
      .from("recovery_cases")
      .select("risk_amount, recovered_amount, action_status, ai_diagnosis");

    if (casesErr) {
      console.error("Error fetching recovery cases for metrics:", casesErr.message);
      return NextResponse.json(
        { error: "Failed to fetch payment recovery analytics" },
        { status: 500 }
      );
    }

    const casesList = recoveryCases || [];
    const pfOpportunities = casesList.length;
    const pfAtRiskPaise = casesList.reduce((sum, c) => sum + (Number(c.risk_amount) || 0), 0);
    const pfAttempts = casesList.filter(
      (c) => ["attempted", "completed", "recovered"].includes(c.action_status) || Boolean(c.ai_diagnosis)
    ).length;
    const pfSuccesses = casesList.filter(
      (c) => ["completed", "recovered"].includes(c.action_status) && (Number(c.recovered_amount) || 0) > 0
    ).length;
    const pfRecoveredPaise = casesList.reduce((sum, c) => {
      if (["completed", "recovered"].includes(c.action_status) && (Number(c.recovered_amount) || 0) > 0) {
        return sum + Number(c.recovered_amount);
      }
      return sum;
    }, 0);
    const pfOutstandingPaise = Math.max(0, pfAtRiskPaise - pfRecoveredPaise);
    const pfRecoveryRate = pfAtRiskPaise > 0 ? Math.min(100, (pfRecoveredPaise / pfAtRiskPaise) * 100) : 0;

    // 2. Query checkout_sessions table (Checkout Abandonment Recovery Opportunities)
    const { data: checkoutSessions, error: sessionsErr } = await supabase
      .from("checkout_sessions")
      .select("session_id, status, cart_value, last_checkout_step, abandoned_at");

    if (sessionsErr) {
      console.error("Error fetching checkout sessions for metrics:", sessionsErr.message);
    }

    const sessionsList = checkoutSessions || [];
    const abandonedSessionsList = sessionsList.filter(
      (s) => s.status === "ABANDONED" || (s.status === "COMPLETED_CAPTURED" && s.abandoned_at)
    );
    const abSessionsCount = abandonedSessionsList.length;
    const abAtRiskPaise = abandonedSessionsList.reduce(
      (sum, s) => sum + Math.round((Number(s.cart_value) || 0) * 100),
      0
    );

    // Fetch captured payments corresponding to checkout abandonments
    const { data: capturedPayments } = await supabase
      .from("payments")
      .select("id, amount, razorpay_payment_id, notes")
      .eq("status", "captured");

    const capturedList = capturedPayments || [];
    const abCapturedPayments = capturedList.filter((p) => {
      const notes = p.notes || {};
      return notes.recovery_session_id || notes.is_recovery === "true";
    });

    const abSuccesses = sessionsList.filter((s) => s.status === "COMPLETED_CAPTURED" && s.abandoned_at).length + abCapturedPayments.length;
    const abRecoveredPaise = abCapturedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const abOutstandingPaise = Math.max(0, abAtRiskPaise - abRecoveredPaise);
    const abRecoveryRate = abAtRiskPaise > 0 ? Math.min(100, (abRecoveredPaise / abAtRiskPaise) * 100) : 0;

    // 3. Combined Unified Metrics
    const totalFailedPayments = pfOpportunities;
    const totalAbandonedCheckouts = abSessionsCount;
    const totalAtRiskAmount = pfAtRiskPaise + abAtRiskPaise;
    const totalRecoveredAmount = pfRecoveredPaise + abRecoveredPaise;
    const totalOutstandingAmount = Math.max(0, totalAtRiskAmount - totalRecoveredAmount);
    const overallRecoveryRate = totalAtRiskAmount > 0 ? Math.min(100, (totalRecoveredAmount / totalAtRiskAmount) * 100) : 0;

    return NextResponse.json({
      success: true,
      totalFailedPayments,
      totalAbandonedCheckouts,
      totalAtRiskAmount,
      totalRecoveredAmount,
      totalOutstandingAmount,
      overallRecoveryRate: Number(overallRecoveryRate.toFixed(2)),
      paymentFailure: {
        opportunities: pfOpportunities,
        atRiskAmount: pfAtRiskPaise,
        attempts: pfAttempts,
        successfulRecoveries: pfSuccesses,
        recoveredAmount: pfRecoveredPaise,
        outstandingAmount: pfOutstandingPaise,
        recoveryRate: Number(pfRecoveryRate.toFixed(2)),
      },
      abandonment: {
        abandonedSessions: abSessionsCount,
        atRiskAmount: abAtRiskPaise,
        attempts: abandonedSessionsList.filter((s) => s.last_checkout_step !== "cart_viewed").length,
        successfulRecoveries: abSuccesses,
        recoveredAmount: abRecoveredPaise,
        outstandingAmount: abOutstandingPaise,
        recoveryRate: Number(abRecoveryRate.toFixed(2)),
      },
      // Backwards-compatible aliases
      failedPayments: totalFailedPayments,
      atRiskAmount: totalOutstandingAmount,
      recoveredAmount: totalRecoveredAmount,
      recoveryRate: Number(overallRecoveryRate.toFixed(2)),
    });
  } catch (error: any) {
    console.error("Unified Metrics API error:", error);
    return NextResponse.json(
      { error: "Internal server error during metrics calculation" },
      { status: 500 }
    );
  }
}
