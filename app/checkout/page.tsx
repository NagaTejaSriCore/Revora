"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import { useCart } from "@/context/CartContext";
import {
  trackCheckoutStarted,
  trackPaymentPageOpened,
  trackPaymentInitiated,
  trackPaymentFailed,
  trackPaymentCaptured,
} from "@/lib/analytics/events";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function CheckoutForm() {
  const { cart, total, clearCart } = useCart();
  const searchParams = useSearchParams();

  // Recovery Mode State
  const [recoveryOrderId, setRecoveryOrderId] = useState<string | null>(null);
  const [recoverySessionId, setRecoverySessionId] = useState<string | null>(null);
  const [recoveryAmount, setRecoveryAmount] = useState<number | null>(null);
  const [isVerifyingRecovery, setIsVerifyingRecovery] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    phone: "+919876543210",
    address: "Flat 402, Green Valley Apartments, MG Road",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  // Read query parameters & verify authoritative amount server-side ONCE
  useEffect(() => {
    const recOrder = searchParams?.get("recovery_order");
    const recSession = searchParams?.get("recovery_session");
    const amtStr = searchParams?.get("amount");

    if (recOrder || recSession) {
      setRecoveryOrderId(recOrder || null);
      setRecoverySessionId(recSession || null);

      if (amtStr && !isNaN(Number(amtStr)) && Number(amtStr) > 0) {
        setRecoveryAmount(Number(amtStr));
      }

      // Verify recovery order or session server-side directly from Razorpay / Supabase
      setIsVerifyingRecovery(true);
      fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recovery_order: recOrder || undefined,
          recovery_session: recSession || undefined,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.amount) {
            // Authoritative amount in INR (converted from paise)
            setRecoveryAmount(Math.round(data.amount / 100));
            if (data.orderId) setRecoveryOrderId(data.orderId);
          }
        })
        .catch((err) => {
          console.error("Error verifying recovery order server-side:", err);
        })
        .finally(() => {
          setIsVerifyingRecovery(false);
        });
    }
  }, [searchParams]);

  const isRecoveryMode = Boolean(recoveryOrderId || recoverySessionId);

  // Emit analytics events for normal customer checkout mode only
  useEffect(() => {
    if (!isRecoveryMode && cart.length > 0) {
      trackCheckoutStarted(cart, total);
      trackPaymentPageOpened(cart, total);
    }
  }, [isRecoveryMode, cart.length, total]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isRecoveryMode && cart.length === 0) {
      setErrorMsg("Your cart is empty.");
      return;
    }

    if (!formData.fullName || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.pincode) {
      setErrorMsg("Please complete all required customer fields.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      // Determine payment amount (in INR)
      const checkoutAmount = isRecoveryMode ? (recoveryAmount || 0) : total;

      let activeOrderId = recoveryOrderId;
      let activeAmountPaise = isRecoveryMode && recoveryAmount ? Math.round(recoveryAmount * 100) : 0;
      let razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

      // 1. If not already verified recovery order ID, call /api/razorpay/create-order ONCE
      if (!activeOrderId || !activeAmountPaise) {
        const response = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recovery_order: recoveryOrderId || undefined,
            recovery_session: recoverySessionId || undefined,
            amount: checkoutAmount,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to create Razorpay order.");
        }

        activeOrderId = data.orderId;
        activeAmountPaise = data.amount;
        if (data.keyId) razorpayKeyId = data.keyId;
      }

      // Track PAYMENT_INITIATED for normal checkout
      if (!isRecoveryMode && activeOrderId) {
        trackPaymentInitiated(activeOrderId, checkoutAmount, {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        });
      }

      // 2. Load Razorpay SDK modal
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => {
        const options = {
          key: razorpayKeyId || "rzp_test_TUN1n36ln4frCU",
          amount: activeAmountPaise,
          currency: "INR",
          name: isRecoveryMode ? "Revora Payment Recovery" : "Revora Store",
          description: isRecoveryMode ? `Recovery Order ${activeOrderId}` : `Order ${activeOrderId}`,
          order_id: activeOrderId,

          handler: async function (res: any) {
            console.log("Payment captured via Razorpay modal:", res);
            
            // Server verification and Supabase database insertion
            try {
              const verifyRes = await fetch("/api/razorpay/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: res.razorpay_payment_id,
                  razorpay_order_id: res.razorpay_order_id,
                  razorpay_signature: res.razorpay_signature,
                  amount: activeAmountPaise,
                  currency: "INR",
                  email: formData.email,
                  contact: formData.phone,
                  notes: {
                    recovery_order_id: activeOrderId,
                    recovery_session_id: recoverySessionId || undefined,
                  },
                }),
              });
              const verifyData = await verifyRes.json();
              console.log("[CHECKOUT VERIFICATION RESULT]:", verifyData);
            } catch (verifyErr) {
              console.error("Verification API call error:", verifyErr);
            }

            if (!isRecoveryMode) {
              trackPaymentCaptured(res.razorpay_payment_id, checkoutAmount, activeOrderId || undefined);
              clearCart();
            }

            setPaymentSuccess(res.razorpay_payment_id);
          },

          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.phone,
          },

          notes: {
            customer_name: formData.fullName,
            customer_email: formData.email,
            shipping_address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
            is_recovery: isRecoveryMode ? "true" : "false",
          },

          theme: {
            color: isRecoveryMode ? "#d97706" : "#8b5cf6",
          },
        };

        const razorpay = new window.Razorpay(options);
        
        razorpay.on("payment.failed", function (response: any) {
          console.warn("Payment failed in checkout:", response.error);
          if (!isRecoveryMode && activeOrderId) {
            trackPaymentFailed(response.error, activeOrderId);
          }
        });

        razorpay.open();
        setLoading(false);
      };

      script.onerror = () => {
        throw new Error("Failed to load Razorpay Checkout SDK.");
      };

      document.body.appendChild(script);
    } catch (err: any) {
      console.error("Checkout payment error:", err);
      setErrorMsg(err.message || "Failed to process payment");
      setLoading(false);
    }
  };

  // Payment Success Screen
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
        <StoreHeader />
        <main className="flex-1 max-w-lg mx-auto my-auto p-8 w-full">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {isRecoveryMode ? "Recovery Payment Completed!" : "Order Placed Successfully!"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isRecoveryMode
                ? "Your outstanding recovery payment has been successfully processed and verified via Razorpay."
                : "Thank you for shopping with Revora Store. Your payment has been captured and verified via Razorpay."}
            </p>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold text-purple-600 dark:text-purple-400">
              Payment ID: {paymentSuccess}
            </div>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-block w-full py-3 px-6 rounded-2xl bg-slate-900 dark:bg-purple-600 text-white font-bold text-xs hover:bg-purple-600 dark:hover:bg-purple-500 transition-colors shadow-md"
              >
                Back to Storefront
              </Link>
            </div>
          </div>
        </main>
        <StoreFooter />
      </div>
    );
  }

  const activeCheckoutAmount = isRecoveryMode ? (recoveryAmount || 0) : total;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <StoreHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 space-y-8">
        
        {/* Recovery Payment Banner when in Recovery Mode */}
        {isRecoveryMode ? (
          <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-slate-900 dark:text-white space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950">
                RECOVERY PAYMENT
              </span>
              <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">
                Order ID: {recoveryOrderId || recoverySessionId}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">Complete your outstanding payment</h1>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              You are completing a verified recovery payment for your previous checkout session.
            </p>
          </div>
        ) : (
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Checkout
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Complete your shipping details and proceed to secure Razorpay payment.
            </p>
          </div>
        )}

        {(isRecoveryMode || cart.length > 0) ? (
          <form onSubmit={handlePayment} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left 2 Cols: Customer & Address Form */}
            <div className="lg:col-span-2 space-y-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight border-b border-slate-100 dark:border-slate-800 pb-3">
                1. Customer &amp; Shipping Address
              </h2>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    placeholder="Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="rahul.sharma@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Street Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    placeholder="House / Flat No., Building, Street"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    placeholder="Bengaluru"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    placeholder="Karnataka"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">PIN Code *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    required
                    placeholder="560001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Right Col: Order Summary & Payment Trigger */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight border-b border-slate-100 dark:border-slate-800 pb-3">
                {isRecoveryMode ? "2. Recovery Payment Details" : "2. Order Summary"}
              </h2>

              {isRecoveryMode ? (
                /* Recovery Checkout Summary (Isolated from Cart) */
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Payment Type</span>
                    <span className="font-extrabold text-amber-600 dark:text-amber-400 uppercase">RECOVERY ORDER</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Razorpay Order / Session ID</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">{recoveryOrderId || recoverySessionId}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-amber-500/20">
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">Recovery Amount</span>
                    <span className="font-black text-amber-600 dark:text-amber-400 text-xl">
                      {isVerifyingRecovery ? "Verifying..." : formatCurrency(activeCheckoutAmount)}
                    </span>
                  </div>
                </div>
              ) : (
                /* Normal Cart Items Mini List */
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                  {cart.map((item) => (
                    <div key={item.product.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                          <Image src={item.product.image} alt={item.product.name} fill sizes="40px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{item.product.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-black text-slate-900 dark:text-white shrink-0">
                        {formatCurrency(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(activeCheckoutAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Shipping</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">FREE</span>
                </div>
                <div className="flex justify-between text-slate-900 dark:text-white font-extrabold text-sm pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Total Amount</span>
                  <span className={`font-black text-lg ${isRecoveryMode ? "text-amber-600 dark:text-amber-400" : "text-purple-600 dark:text-purple-400"}`}>
                    {formatCurrency(activeCheckoutAmount)}
                  </span>
                </div>
              </div>

              {/* Primary CTA */}
              <button
                type="submit"
                disabled={loading || isVerifyingRecovery}
                className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-white font-bold text-xs shadow-lg transition-all disabled:opacity-50 cursor-pointer ${
                  isRecoveryMode
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/25 hover:scale-[1.005] active:scale-[0.995]"
                    : "bg-gradient-to-r from-purple-600 via-purple-600 to-pink-500 shadow-purple-500/25 hover:scale-[1.005] active:scale-[0.995]"
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Opening Razorpay Gateway...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {isRecoveryMode
                      ? `Complete Recovery Payment (${formatCurrency(activeCheckoutAmount)})`
                      : `Continue to Payment (${formatCurrency(activeCheckoutAmount)})`}
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 leading-normal">
                By clicking Continue to Payment, Razorpay Test Mode checkout will launch. Webhook reconciliation runs automatically in background.
              </p>
            </div>
          </form>
        ) : (
          /* Empty Checkout State */
          <div className="py-20 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Cart is Empty</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Please add items to your cart before proceeding to checkout.</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-2xl bg-slate-900 dark:bg-purple-600 text-white text-xs font-bold hover:bg-purple-600 dark:hover:bg-purple-500 transition-colors shadow-md"
            >
              Back to Storefront
            </Link>
          </div>
        )}
      </main>

      <StoreFooter />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-xs font-bold text-slate-500 animate-pulse">Loading Checkout...</div>
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  );
}
