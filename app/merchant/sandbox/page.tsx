"use client";

import React, { useState } from "react";
import MerchantLayout from "@/components/MerchantLayout";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SandboxPage() {
  const [sandboxLoading, setSandboxLoading] = useState(false);

  // Sandbox Razorpay payment handler
  const handlePayment = async (fetchDashboardData: Function) => {
    try {
      setSandboxLoading(true);

      const response = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 100, // ₹100
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => {
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "Revora",
          description: "Revora Sandbox Test Payment",
          order_id: data.orderId,

          handler: function (response: any) {
            console.log("Payment successful:", response);
            alert(`Payment successful!\nPayment ID: ${response.razorpay_payment_id}`);
            fetchDashboardData();
          },

          prefill: {
            name: "Revora Test User",
            email: "test@example.com",
            contact: "+919000090000",
          },

          theme: {
            color: "#6366f1",
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };

      script.onerror = () => {
        alert("Failed to load Razorpay Checkout.");
      };

      document.body.appendChild(script);
    } catch (error) {
      console.error(error);
      alert("Unable to start test payment.");
    } finally {
      setSandboxLoading(false);
    }
  };

  return (
    <MerchantLayout pageTitle="Payment Sandbox & Test Simulator">
      {({ fetchDashboardData }) => (
        <div className="space-y-8 max-w-4xl">
          {/* Main Payment Simulator Card */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 dark:bg-[#141326]/90 dark:border-purple-900/20 shadow-xl space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-200 dark:border-purple-900/20 pb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Razorpay Sandbox Payment Simulator</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Trigger live test transactions in Razorpay Test Mode to verify payment capture and recovery workflows
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Use this simulator to initiate real Razorpay test payments (₹1.00 INR). You can simulate both successful payments and card declines using Razorpay test card credentials.
              </p>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-purple-900/20 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                  Testing Instructions:
                </span>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  <li>Click <strong>Test Razorpay Payment</strong> below to launch the modal checkout.</li>
                  <li>To test <strong>Successful Recovery</strong>: Select Card / UPI and complete with test OTP.</li>
                  <li>To test <strong>Payment Failure Recovery</strong>: Fail the payment modal or use a declined test card.</li>
                  <li>To test <strong>Checkout Abandonment</strong>: Close the payment modal or cart without paying.</li>
                </ul>
              </div>

              <button
                onClick={() => handlePayment(fetchDashboardData)}
                disabled={sandboxLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {sandboxLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Initializing Order...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Test Razorpay Payment (₹1.00)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MerchantLayout>
  );
}
