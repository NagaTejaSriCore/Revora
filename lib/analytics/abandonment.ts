import { createClient } from "@supabase/supabase-js";

export interface CheckoutSessionState {
  sessionId: string;
  status: "ACTIVE" | "COMPLETED_CAPTURED" | "COMPLETED_FAILED" | "ABANDONED";
  startedAt: string;
  lastActivityAt: string;
  cartValue: number;
  itemCount: number;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerName?: string | null;
  lastCheckoutStep: string;
  abandonedAt?: string | null;
}

// Inactivity timeout constant (Default: 5 minutes = 300,000 ms)
export const ABANDONMENT_TIMEOUT_MINUTES = Number(process.env.ABANDONMENT_TIMEOUT_MINUTES || 5);
export const ABANDONMENT_TIMEOUT_MS = ABANDONMENT_TIMEOUT_MINUTES * 60 * 1000;

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("[ABANDONMENT DB ERROR] Supabase environment variables missing.");
  }
  return createClient(url, key);
}

/**
 * Record or update customer checkout session activity directly in Supabase checkout_sessions table.
 * Supabase is the sole production source of truth. No local JSON fallback.
 */
export async function recordSessionActivity(event: string, sessionId: string, payload: any = {}): Promise<void> {
  if (!sessionId) return;

  const nowIso = new Date().toISOString();
  const supabase = getSupabaseClient();

  // 1. Fetch existing session row from Supabase
  const { data: existing, error: selectErr } = await supabase
    .from("checkout_sessions")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (selectErr) {
    console.error(`[ABANDONMENT DB ERROR] Failed to fetch session ${sessionId}:`, selectErr.message);
    throw new Error(`Database select error: ${selectErr.message}`);
  }

  let status: "ACTIVE" | "COMPLETED_CAPTURED" | "COMPLETED_FAILED" | "ABANDONED" = "ACTIVE";
  let step = payload.step || event.toLowerCase();

  if (event === "PAYMENT_CAPTURED") {
    status = "COMPLETED_CAPTURED";
    step = "payment_captured";
  } else if (event === "PAYMENT_FAILED") {
    status = "COMPLETED_FAILED";
    step = "payment_failed";
  } else if (["CHECKOUT_STARTED", "PAYMENT_PAGE_OPENED", "PAYMENT_INITIATED"].includes(event)) {
    if (existing && (existing.status === "COMPLETED_CAPTURED" || existing.status === "COMPLETED_FAILED")) {
      if (event === "CHECKOUT_STARTED") {
        status = "ACTIVE";
      } else {
        return;
      }
    } else {
      status = "ACTIVE";
    }
  } else {
    return;
  }

  const upsertPayload = {
    session_id: sessionId,
    status,
    cart_value: payload.cartValue || payload.amount || existing?.cart_value || 0,
    item_count: payload.itemCount || existing?.item_count || 1,
    customer_email: payload.customerEmail || payload.email || existing?.customer_email || null,
    customer_phone: payload.customerPhone || payload.contact || existing?.customer_phone || null,
    customer_name: payload.customerName || payload.name || existing?.customer_name || null,
    last_checkout_step: step,
    last_activity_at: nowIso,
    abandoned_at: null,
  };

  const { error: upsertErr } = await supabase
    .from("checkout_sessions")
    .upsert(upsertPayload, { onConflict: "session_id" });

  if (upsertErr) {
    console.error(`[ABANDONMENT DB ERROR] Upsert failed for session ${sessionId}:`, upsertErr.message);
    throw new Error(`Database upsert error: ${upsertErr.message}`);
  }
}

/**
 * Evaluate active checkout sessions for abandonment directly in Supabase checkout_sessions table.
 */
export async function evaluateAbandonments(overrideTimeoutMs?: number): Promise<{
  newAbandonments: CheckoutSessionState[];
  allSessions: CheckoutSessionState[];
}> {
  const timeoutMs = overrideTimeoutMs !== undefined ? overrideTimeoutMs : ABANDONMENT_TIMEOUT_MS;
  const now = Date.now();
  const nowIso = new Date().toISOString();
  const supabase = getSupabaseClient();
  const newAbandonments: CheckoutSessionState[] = [];

  // Query ACTIVE checkout sessions from Supabase
  const { data: dbSessions, error: queryErr } = await supabase
    .from("checkout_sessions")
    .select("*")
    .eq("status", "ACTIVE");

  if (queryErr) {
    console.error("[ABANDONMENT DB ERROR] Active sessions query failed:", queryErr.message);
    throw new Error(`Database query error: ${queryErr.message}`);
  }

  if (Array.isArray(dbSessions)) {
    for (const row of dbSessions) {
      const lastTime = new Date(row.last_activity_at).getTime();
      if (now - lastTime >= timeoutMs) {
        // Update status to ABANDONED in Supabase
        const { error: updateErr } = await supabase
          .from("checkout_sessions")
          .update({
            status: "ABANDONED",
            abandoned_at: nowIso,
          })
          .eq("session_id", row.session_id);

        if (updateErr) {
          console.error(`[ABANDONMENT DB ERROR] Failed to abandon session ${row.session_id}:`, updateErr.message);
        } else {
          newAbandonments.push({
            sessionId: row.session_id,
            status: "ABANDONED",
            startedAt: row.created_at || nowIso,
            lastActivityAt: row.last_activity_at,
            cartValue: Number(row.cart_value) || 0,
            itemCount: Number(row.item_count) || 1,
            customerEmail: row.customer_email,
            customerPhone: row.customer_phone,
            customerName: row.customer_name,
            lastCheckoutStep: row.last_checkout_step,
            abandonedAt: nowIso,
          });
        }
      }
    }
  }

  // Fetch all sessions for reporting
  const { data: allDb, error: allErr } = await supabase.from("checkout_sessions").select("*");

  if (allErr) {
    console.error("[ABANDONMENT DB ERROR] Fetching all sessions failed:", allErr.message);
    throw new Error(`Database select error: ${allErr.message}`);
  }

  const allSessions: CheckoutSessionState[] = (allDb || []).map((row: any) => ({
    sessionId: row.session_id,
    status: row.status,
    startedAt: row.created_at,
    lastActivityAt: row.last_activity_at,
    cartValue: Number(row.cart_value) || 0,
    itemCount: Number(row.item_count) || 1,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    customerName: row.customer_name,
    lastCheckoutStep: row.last_checkout_step,
    abandonedAt: row.abandoned_at,
  }));

  return {
    newAbandonments,
    allSessions,
  };
}

/**
 * Get summary of checkout sessions directly from Supabase database.
 */
export async function getAbandonmentSummary() {
  const { allSessions } = await evaluateAbandonments();
  const abandonedSessions = allSessions.filter((s) => s.status === "ABANDONED");
  const activeSessions = allSessions.filter((s) => s.status === "ACTIVE");
  const completedSessions = allSessions.filter(
    (s) => s.status === "COMPLETED_CAPTURED" || s.status === "COMPLETED_FAILED"
  );

  return {
    totalSessions: allSessions.length,
    abandonedCount: abandonedSessions.length,
    activeCount: activeSessions.length,
    completedCount: completedSessions.length,
    abandonedSessions,
  };
}
