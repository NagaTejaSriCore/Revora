import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const CATEGORY_LABELS: Record<string, string> = {
  insufficient_funds: "Insufficient Funds",
  card_declined: "Card Declined",
  authentication_failure: "Authentication Failure",
  network_error: "Network Error",
  payment_method_issue: "Payment Method Issue",
  bank_issue: "Bank Issue",
  unknown: "Unclassified / Unknown",
};

const CATEGORIES_ORDER = [
  "insufficient_funds",
  "card_declined",
  "authentication_failure",
  "network_error",
  "payment_method_issue",
  "bank_issue",
  "unknown",
];

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
      console.error("Missing Supabase server configuration for failure analytics");
      return NextResponse.json(
        { success: false, error: "Database configuration missing on server" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query recovery cases table
    const { data: recoveryCases, error } = await supabase
      .from("recovery_cases")
      .select("id, risk_amount, recovered_amount, action_status, ai_diagnosis");

    if (error) {
      console.error("Error fetching recovery cases for analytics:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch recovery analytics" },
        { status: 500 }
      );
    }

    const cases = recoveryCases || [];

    // Initialize category accumulator
    const categoryStats: Record<string, {
      caseCount: number;
      originalFailedValue: number;
      recoveredValue: number;
    }> = {};

    CATEGORIES_ORDER.forEach((cat) => {
      categoryStats[cat] = {
        caseCount: 0,
        originalFailedValue: 0,
        recoveredValue: 0,
      };
    });

    // Group cases by reason_category
    cases.forEach((c) => {
      let category = "unknown";
      if (c.ai_diagnosis) {
        try {
          const parsed = typeof c.ai_diagnosis === "string" ? JSON.parse(c.ai_diagnosis) : c.ai_diagnosis;
          if (parsed && typeof parsed.reason_category === "string" && CATEGORIES_ORDER.includes(parsed.reason_category)) {
            category = parsed.reason_category;
          }
        } catch (e) {
          category = "unknown";
        }
      }

      if (!categoryStats[category]) {
        categoryStats[category] = { caseCount: 0, originalFailedValue: 0, recoveredValue: 0 };
      }

      categoryStats[category].caseCount += 1;
      categoryStats[category].originalFailedValue += c.risk_amount || 0;

      if ((c.action_status === "completed" || c.action_status === "recovered") && c.recovered_amount > 0) {
        categoryStats[category].recoveredValue += c.recovered_amount;
      }
    });

    // Build final output array
    const categories = CATEGORIES_ORDER.map((catKey) => {
      const stat = categoryStats[catKey] || { caseCount: 0, originalFailedValue: 0, recoveredValue: 0 };
      const outstandingValue = Math.max(0, stat.originalFailedValue - stat.recoveredValue);
      const unroundedRate = stat.originalFailedValue > 0 ? (stat.recoveredValue / stat.originalFailedValue) * 100 : 0;
      const recoveryRate = Math.min(100, Number(unroundedRate.toFixed(2)));

      return {
        category: catKey,
        label: CATEGORY_LABELS[catKey] || catKey,
        caseCount: stat.caseCount,
        originalFailedValue: stat.originalFailedValue,
        recoveredValue: stat.recoveredValue,
        outstandingValue,
        recoveryRate,
        // Aliases for backwards compatibility
        failedAmount: stat.originalFailedValue,
        recoveredAmount: stat.recoveredValue,
        atRiskAmount: outstandingValue,
      };
    });

    return NextResponse.json({
      success: true,
      categories,
      totalCases: cases.length,
      data: {
        categories,
        totalCases: cases.length,
      },
    });

  } catch (error: any) {
    console.error("Failure analytics API route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error during analytics processing" },
      { status: 500 }
    );
  }
}
