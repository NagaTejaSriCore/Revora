import { NextRequest, NextResponse } from "next/server";
import {
  recordSessionActivity,
  evaluateAbandonments,
  getAbandonmentSummary,
} from "@/lib/analytics/abandonment";

// Lightweight in-memory event store for dev testing & verification
const trackedEventsBuffer: any[] = [];
const MAX_BUFFER_SIZE = 100;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, sessionId, timestamp, payload } = body || {};

    if (!event || !sessionId) {
      return NextResponse.json(
        { success: false, error: "Missing required event or sessionId" },
        { status: 400 }
      );
    }

    const eventRecord = {
      event,
      sessionId,
      timestamp: timestamp || new Date().toISOString(),
      payload: payload || {},
    };

    // Store in buffer
    trackedEventsBuffer.unshift(eventRecord);
    if (trackedEventsBuffer.length > MAX_BUFFER_SIZE) {
      trackedEventsBuffer.pop();
    }

    // Record session state for abandonment tracking (persisted to Supabase/store)
    try {
      await recordSessionActivity(event, sessionId, payload);
    } catch (recordErr: any) {
      console.error("[REVORA EVENT API] recordSessionActivity error:", recordErr.message);
    }

    // Evaluate if any active sessions timed out
    let newAbandonments: any[] = [];
    try {
      const evalRes = await evaluateAbandonments();
      newAbandonments = evalRes.newAbandonments || [];
    } catch (evalErr: any) {
      console.error("[REVORA EVENT API] evaluateAbandonments error:", evalErr.message);
    }

    newAbandonments.forEach((abandonedSession) => {
      trackedEventsBuffer.unshift({
        event: "CHECKOUT_ABANDONED",
        sessionId: abandonedSession.sessionId,
        timestamp: abandonedSession.abandonedAt || new Date().toISOString(),
        payload: {
          cartValue: abandonedSession.cartValue,
          itemCount: abandonedSession.itemCount,
          customerEmail: abandonedSession.customerEmail || null,
          customerPhone: abandonedSession.customerPhone || null,
          lastCheckoutStep: abandonedSession.lastCheckoutStep,
          lastActivityAt: abandonedSession.lastActivityAt,
          abandonedAt: abandonedSession.abandonedAt,
        },
      });
    });

    if (process.env.NODE_ENV === "development") {
      console.log(`[REVORA EVENT API] Received ${event} for Session ${sessionId}`);
    }

    let summary: any = {
      totalSessions: 0,
      abandonedCount: 0,
      activeCount: 0,
      completedCount: 0,
      abandonedSessions: [],
    };

    try {
      summary = await getAbandonmentSummary();
    } catch (sumErr: any) {
      console.error("[REVORA EVENT API] getAbandonmentSummary error:", sumErr.message);
    }

    return NextResponse.json({
      success: true,
      event: eventRecord,
      totalTracked: trackedEventsBuffer.length,
      count: trackedEventsBuffer.length,
      events: trackedEventsBuffer,
      abandonmentSummary: summary,
    });
  } catch (error: any) {
    console.error("Error logging event in POST /api/events/track:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to log event",
        totalTracked: trackedEventsBuffer.length,
        count: trackedEventsBuffer.length,
        events: trackedEventsBuffer,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Allow optional ?overrideTimeoutMs=... for testing
    const url = new URL(req.url);
    const overrideTimeoutParam = url.searchParams.get("overrideTimeoutMs");
    const overrideTimeoutMs = overrideTimeoutParam ? Number(overrideTimeoutParam) : undefined;

    let newAbandonments: any[] = [];
    try {
      const evalRes = await evaluateAbandonments(overrideTimeoutMs);
      newAbandonments = evalRes.newAbandonments || [];
    } catch (evalErr: any) {
      console.error("[REVORA EVENT API GET] evaluateAbandonments error:", evalErr.message);
    }

    newAbandonments.forEach((abandonedSession) => {
      trackedEventsBuffer.unshift({
        event: "CHECKOUT_ABANDONED",
        sessionId: abandonedSession.sessionId,
        timestamp: abandonedSession.abandonedAt || new Date().toISOString(),
        payload: {
          cartValue: abandonedSession.cartValue,
          itemCount: abandonedSession.itemCount,
          customerEmail: abandonedSession.customerEmail || null,
          customerPhone: abandonedSession.customerPhone || null,
          lastCheckoutStep: abandonedSession.lastCheckoutStep,
          lastActivityAt: abandonedSession.lastActivityAt,
          abandonedAt: abandonedSession.abandonedAt,
        },
      });
    });

    let summary: any = {
      totalSessions: 0,
      abandonedCount: 0,
      activeCount: 0,
      completedCount: 0,
      abandonedSessions: [],
    };

    try {
      summary = await getAbandonmentSummary();
    } catch (sumErr: any) {
      console.error("[REVORA EVENT API GET] getAbandonmentSummary error:", sumErr.message);
    }

    return NextResponse.json({
      success: true,
      count: trackedEventsBuffer.length,
      events: trackedEventsBuffer,
      abandonmentSummary: summary,
    });
  } catch (error: any) {
    console.error("Error in GET /api/events/track:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve events",
        count: trackedEventsBuffer.length,
        events: trackedEventsBuffer,
        abandonmentSummary: {
          totalSessions: 0,
          abandonedCount: 0,
          activeCount: 0,
          completedCount: 0,
          abandonedSessions: [],
        },
      },
      { status: 500 }
    );
  }
}
