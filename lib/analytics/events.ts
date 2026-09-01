import { Product } from "@/data/products";

export type EventType =
  | "PRODUCT_VIEWED"
  | "ADD_TO_CART"
  | "CHECKOUT_STARTED"
  | "PAYMENT_PAGE_OPENED"
  | "PAYMENT_INITIATED"
  | "PAYMENT_FAILED"
  | "PAYMENT_CAPTURED"
  | "CHECKOUT_ABANDONED";

export interface AnalyticsEvent {
  event: EventType;
  sessionId: string;
  timestamp: string;
  payload?: any;
}

const SESSION_STORAGE_KEY = "revora-session-id";

// In-memory deduplication guards
const lastProductViewedTimes: Record<string, number> = {};
let lastCheckoutStartedTime = 0;
let lastPaymentPageOpenedTime = 0;
const DEDUPE_WINDOW_MS = 5000;

/**
 * Retrieve or generate a persistent client-side anonymous session identifier.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    return "server-session";
  }

  try {
    let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
      sessionId = `rev_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
    return sessionId;
  } catch (e) {
    return `rev_sess_fallback_${Date.now()}`;
  }
}

/**
 * Core event emitter. Dispatches to lightweight endpoint and logs to console.
 */
export function trackEvent(event: EventType, payload: any = {}): void {
  const sessionId = getOrCreateSessionId();
  const timestamp = new Date().toISOString();

  const eventData: AnalyticsEvent = {
    event,
    sessionId,
    timestamp,
    payload,
  };

  if (process.env.NODE_ENV === "development") {
    console.log(`[REVORA EVENT TRACKING] (${event}):`, eventData);
  }

  // Asynchronously POST event to lightweight server tracker
  if (typeof window !== "undefined" && typeof fetch !== "undefined") {
    fetch("/api/events/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    }).catch((err) => console.warn("Failed to dispatch event log:", err));
  }
}

/**
 * 1. PRODUCT_VIEWED event with deduplication guard
 */
export function trackProductViewed(product: Product): void {
  const now = Date.now();
  const lastTime = lastProductViewedTimes[product.id] || 0;
  if (now - lastTime < DEDUPE_WINDOW_MS) {
    return; // Ignore rapid duplicate view events
  }
  lastProductViewedTimes[product.id] = now;

  trackEvent("PRODUCT_VIEWED", {
    productId: product.id,
    productName: product.name,
    amount: product.price,
    category: product.category,
  });
}

/**
 * 2. ADD_TO_CART event
 */
export function trackAddToCart(product: Product, quantity: number = 1): void {
  trackEvent("ADD_TO_CART", {
    productId: product.id,
    productName: product.name,
    quantity,
    amount: product.price,
    totalAmount: product.price * quantity,
  });
}

/**
 * 3. CHECKOUT_STARTED event with deduplication guard
 */
export function trackCheckoutStarted(cart: any[], cartValue: number): void {
  const now = Date.now();
  if (now - lastCheckoutStartedTime < DEDUPE_WINDOW_MS) {
    return; // Ignore rapid re-renders
  }
  lastCheckoutStartedTime = now;

  trackEvent("CHECKOUT_STARTED", {
    cartValue,
    itemCount: cart.reduce((sum, i) => sum + i.quantity, 0),
    items: cart.map((i) => ({
      productId: i.product.id,
      productName: i.product.name,
      quantity: i.quantity,
      price: i.product.price,
    })),
    step: "shipping_info",
  });
}

/**
 * 4. PAYMENT_PAGE_OPENED event with deduplication guard
 */
export function trackPaymentPageOpened(cart: any[], cartValue: number): void {
  const now = Date.now();
  if (now - lastPaymentPageOpenedTime < DEDUPE_WINDOW_MS) {
    return;
  }
  lastPaymentPageOpenedTime = now;

  trackEvent("PAYMENT_PAGE_OPENED", {
    cartValue,
    itemCount: cart.reduce((sum, i) => sum + i.quantity, 0),
    step: "payment_ready",
  });
}

/**
 * 5. PAYMENT_INITIATED event
 */
export function trackPaymentInitiated(
  orderId: string,
  amount: number,
  customerInfo?: { email?: string; phone?: string; name?: string }
): void {
  trackEvent("PAYMENT_INITIATED", {
    orderId,
    amount,
    customerEmail: customerInfo?.email || null,
    customerPhone: customerInfo?.phone || null,
    customerName: customerInfo?.name || null,
    status: "initiated",
  });
}

/**
 * 6. PAYMENT_FAILED event
 */
export function trackPaymentFailed(error: any, orderId?: string): void {
  trackEvent("PAYMENT_FAILED", {
    orderId: orderId || null,
    errorCode: error?.code || null,
    errorDescription: error?.description || error?.message || "Payment Failed",
    status: "failed",
  });
}

/**
 * 7. PAYMENT_CAPTURED event
 */
export function trackPaymentCaptured(paymentId: string, amount: number, orderId?: string): void {
  trackEvent("PAYMENT_CAPTURED", {
    paymentId,
    orderId: orderId || null,
    amount,
    status: "captured",
  });
}

/**
 * Placeholder for future Phase 4 abandonment tracking (NOT used in Phase 3)
 */
export function trackCheckoutAbandoned(cart: any[]): void {
  trackEvent("CHECKOUT_ABANDONED", { items: cart });
}
