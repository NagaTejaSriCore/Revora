"use client";

import React, { useState, useEffect } from "react";

export interface AbandonedSession {
  sessionId: string;
  status: string;
  startedAt: string;
  lastActivityAt: string;
  cartValue: number;
  itemCount: number;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerName?: string | null;
  lastCheckoutStep: string;
  abandonedAt?: string | null;
  analysis?: {
    diagnosis: string;
    recommended_action: string;
    confidence: number;
    reason_category: string;
    action_type: string;
  } | null;
}

interface AbandonedCaseDrawerProps {
  session: AbandonedSession | null;
  onClose: () => void;
  onAnalyze: (sessionId: string) => Promise<void>;
  isAnalyzing: boolean;
  analysisError: string | null;
}

export default function AbandonedCaseDrawer({
  session,
  onClose,
  onAnalyze,
  isAnalyzing,
  analysisError,
}: AbandonedCaseDrawerProps) {
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Reset local state whenever active session changes
  useEffect(() => {
    setGeneratedLink(null);
    setActionMsg(null);
    setNotificationSent(false);
  }, [session?.sessionId]);

  if (!session) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleGenerateLink = async () => {
    try {
      setIsGeneratingLink(true);
      setActionMsg(null);

      // Call server endpoint to fetch authoritative session cart_value & generate exact Razorpay recovery order
      const res = await fetch("/api/recovery/abandonment-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.sessionId,
          action_type: "payment_link",
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create recovery order");
      }

      setGeneratedLink(data.payment_link_url);
      setActionMsg(
        `Recovery link generated successfully for ₹${data.cart_value.toLocaleString("en-IN")}. Note: Recovered amount will update only after payment is captured.`
      );
    } catch (err: any) {
      console.error("Error generating recovery link:", err);
      setActionMsg(`Failed to generate link: ${err.message}`);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleNotifyCustomer = () => {
    setNotificationSent(true);
    setActionMsg(`Safe Notification Logged: Simulation reminder queued for ${session.customerEmail || "customer"}. No real emails sent automatically.`);
  };

  const handleRetryPayment = () => {
    setActionMsg(`Payment Retry Simulation Logged: Razorpay checkout session reactivated for order amount ${formatCurrency(session.cartValue)}.`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-[#121026] text-slate-900 dark:text-slate-100 shadow-2xl border-l border-slate-200 dark:border-purple-900/30 flex flex-col justify-between transition-colors duration-200">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-purple-900/20 flex items-center justify-between bg-slate-50/50 dark:bg-[#161430]/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  CHECKOUT ABANDONMENT
                </span>
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                  {session.sessionId.slice(0, 16)}...
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                Abandoned Checkout Case
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 dark:border-purple-900/30 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 flex-1 overflow-y-auto space-y-6">

            {/* Session Metadata Card */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#1A1833]/60 border border-slate-200 dark:border-purple-900/20 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[10px] uppercase">Cart Value</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-base">
                  {formatCurrency(session.cartValue)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[10px] uppercase">Item Count</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {session.itemCount} item(s)
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[10px] uppercase">Last Checkout Step</span>
                <span className="font-bold text-purple-600 dark:text-purple-400 text-xs capitalize">
                  {session.lastCheckoutStep.replace("_", " ")}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200/60 dark:border-purple-900/20">
                <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[10px] uppercase">Customer Info</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  {session.customerEmail || "No email provided"} {session.customerPhone ? `(${session.customerPhone})` : ""}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[10px] uppercase">Abandonment Time</span>
                <span className="font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                  {session.abandonedAt ? new Date(session.abandonedAt).toLocaleString("en-IN") : "Pending timeout"}
                </span>
              </div>
            </div>

            {/* AI Diagnosis & Strategy Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#141326] border border-slate-200 dark:border-purple-900/30 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Gemini AI Abandonment Diagnosis
                  </h3>
                </div>

                {!session.analysis && (
                  <button
                    onClick={() => onAnalyze(session.sessionId)}
                    disabled={isAnalyzing}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-colors shadow-md disabled:opacity-50"
                  >
                    {isAnalyzing ? "Analyzing..." : "Analyze Abandonment"}
                  </button>
                )}
              </div>

              {analysisError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  {analysisError}
                </div>
              )}

              {session.analysis ? (
                <div className="space-y-4 text-xs pt-1">
                  {/* Diagnosis */}
                  <div>
                    <span className="font-bold text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Diagnosis</span>
                    <p className="text-slate-900 dark:text-slate-100 font-semibold leading-relaxed mt-0.5">
                      {session.analysis.diagnosis}
                    </p>
                  </div>

                  {/* Recommended Action */}
                  <div>
                    <span className="font-bold text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Recommended Strategy</span>
                    <p className="text-purple-600 dark:text-purple-300 font-bold leading-relaxed mt-0.5">
                      {session.analysis.recommended_action}
                    </p>
                  </div>

                  {/* Metrics Badges */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-purple-900/20">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-purple-900/30 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      Reason: <strong className="text-purple-600 dark:text-purple-400">{session.analysis.reason_category}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-purple-900/30 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      Action Type: <strong className="text-purple-600 dark:text-purple-400">{session.analysis.action_type}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Confidence: {Math.round(session.analysis.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click &quot;Analyze Abandonment&quot; to run Gemini AI diagnosis on this customer session.
                </p>
              )}
            </div>

            {/* Action Feedback Message */}
            {actionMsg && (
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold leading-relaxed">
                {actionMsg}
              </div>
            )}

            {/* Generated Recovery Link */}
            {generatedLink && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1A1833] border border-slate-200 dark:border-purple-900/30 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Generated Recovery Payment Link</span>
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-purple-600 dark:text-purple-300 select-all"
                />
              </div>
            )}

            {/* Merchant Action CTAs */}
            {session.analysis && (
              <div className="p-5 rounded-2xl bg-white dark:bg-[#141326] border border-slate-200 dark:border-purple-900/30 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Execute Merchant Action</h4>

                {(session.analysis.action_type === "payment_link" || session.analysis.action_type === "alternative_payment_method") && (
                  <button
                    onClick={handleGenerateLink}
                    disabled={isGeneratingLink}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-xs shadow-md hover:scale-[1.005] active:scale-[0.995] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingLink ? "Creating Order Link..." : "Generate Recovery Link"}
                  </button>
                )}

                {session.analysis.action_type === "customer_notification" && (
                  <button
                    onClick={handleNotifyCustomer}
                    disabled={notificationSent}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md hover:bg-indigo-500 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {notificationSent ? "Notification Logged" : "Notify Customer"}
                  </button>
                )}

                {session.analysis.action_type === "retry_payment" && (
                  <button
                    onClick={handleRetryPayment}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-500 transition-colors cursor-pointer"
                  >
                    Retry Payment
                  </button>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-purple-900/20 bg-slate-50/50 dark:bg-[#161430]/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
            >
              Close Drawer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
