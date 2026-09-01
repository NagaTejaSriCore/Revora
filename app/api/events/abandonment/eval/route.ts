import { NextRequest, NextResponse } from "next/server";
import { evaluateAbandonments, getAbandonmentSummary } from "@/lib/analytics/abandonment";

export async function GET(req: NextRequest) {
  try {
    // 1. Authorization check for production / cron execution
    const authHeader = req.headers.get("authorization");
    const cronSecretHeader = req.headers.get("x-cron-secret");
    const configuredSecret = process.env.CRON_SECRET;

    if (configuredSecret) {
      const isAuthorized =
        cronSecretHeader === configuredSecret ||
        authHeader === `Bearer ${configuredSecret}`;

      if (!isAuthorized) {
        return NextResponse.json(
          { success: false, error: "Unauthorized cron evaluation request" },
          { status: 401 }
        );
      }
    }

    // 2. Allow optional test override timeout via query param (?overrideTimeoutMs=...)
    const url = new URL(req.url);
    const overrideTimeoutParam = url.searchParams.get("overrideTimeoutMs");
    const overrideTimeoutMs = overrideTimeoutParam ? Number(overrideTimeoutParam) : undefined;

    // 3. Evaluate active checkout sessions
    const { newAbandonments, allSessions } = await evaluateAbandonments(overrideTimeoutMs);
    const summary = await getAbandonmentSummary();

    if (process.env.NODE_ENV === "development" && newAbandonments.length > 0) {
      console.log(
        `[ABANDONMENT EVALUATOR] Evaluated ${allSessions.length} sessions. Detected ${newAbandonments.length} new checkout abandonments.`
      );
    }

    return NextResponse.json({
      success: true,
      evaluatedSessionsCount: allSessions.length,
      newlyAbandonedCount: newAbandonments.length,
      abandonedSessions: newAbandonments,
      summary,
    });
  } catch (error: any) {
    console.error("[ABANDONMENT EVALUATOR ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to evaluate abandonments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
