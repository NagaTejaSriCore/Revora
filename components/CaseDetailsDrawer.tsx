"use client";

import React, { useMemo, useState } from "react";

interface Payment {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  email: string | null;
  contact: string | null;
  failure_reason: string;
  created_at: string;
}

interface RecoveryCase {
  id: string;
  payment_id: string;
  risk_amount: number;
  failure_reason: string;
  ai_diagnosis: string | null;
  recommended_action: string | null;
  action_status: string;
  recovered_amount: number;
  created_at: string;
  payments?: Payment;
}

interface CaseDetailsDrawerProps {
  recoveryCase: RecoveryCase | null;
  onClose: () => void;
  onAnalyze: (caseId: string) => Promise<void>;
  isAnalyzing: boolean;
  analysisError: string | null;
  onExecuteAction?: (caseId: string, actionType: string) => Promise<void>;
  isExecutingAction?: boolean;
  actionError?: string | null;
}

export default function CaseDetailsDrawer({
  recoveryCase,
  onClose,
  onAnalyze,
  isAnalyzing,
  analysisError,
  onExecuteAction,
  isExecutingAction = false,
  actionError = null,
}: CaseDetailsDrawerProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  // Safe parsing of AI Diagnosis
  const parsedDiagnosis = useMemo(() => {
    if (!recoveryCase?.ai_diagnosis) return null;
    try {
      const parsed = JSON.parse(recoveryCase.ai_diagnosis);
      if (typeof parsed === "object" && parsed !== null) {
        return {
          diagnosis: parsed.diagnosis || "",
          confidence: Number(parsed.confidence) || 0,
          reason_category: parsed.reason_category || "unknown",
          action_type: parsed.action_type || null,
          payment_link_url: parsed.payment_link_url || null,
        };
      }
    } catch (e) {
      return {
        diagnosis: recoveryCase.ai_diagnosis,
        confidence: 0.5,
        reason_category: "unknown",
        action_type: null,
        payment_link_url: null,
      };
    }
    return null;
  }, [recoveryCase?.ai_diagnosis]);

  if (!recoveryCase) return null;

  const payment = recoveryCase.payments;

  // Currency converters
  const toRupees = (paise: number) => paise / 100;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Confidence color mapper
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "bg-emerald-500 text-emerald-100";
    if (score >= 0.5) return "bg-amber-500 text-amber-100";
    return "bg-rose-500 text-rose-100";
  };

  const getConfidenceBarColor = (score: number) => {
    if (score >= 0.8) return "bg-emerald-500";
    if (score >= 0.5) return "bg-amber-500";
    return "bg-rose-500";
  };

  const isCompleted = recoveryCase.action_status === "completed" || recoveryCase.action_status === "recovered";
  const isAttempted = recoveryCase.action_status === "attempted";
  const isFailed = recoveryCase.action_status === "failed";
  const isPending = recoveryCase.action_status === "pending";

  const handleActionClick = (actionType: string) => {
    if (onExecuteAction && !isCompleted && !isExecutingAction) {
      onExecuteAction(recoveryCase.id, actionType);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-[#070612]/70 backdrop-blur-xs transition-opacity duration-200 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="w-full max-w-lg bg-white text-slate-900 dark:bg-[#0D0C1D] dark:text-slate-100 shadow-2xl h-full relative z-10 flex flex-col border-l border-slate-200 dark:border-purple-900/30 animate-slide-in-right overflow-y-auto font-sans transition-colors duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-purple-900/20 flex items-center justify-between sticky top-0 bg-white dark:bg-[#0D0C1D] z-20">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Case Details
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300">
                {payment?.razorpay_payment_id || "Unmapped"}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Failed on {formatDate(recoveryCase.created_at)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-[#141326] dark:border-purple-900/20 shadow-md">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Risk Amount</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {formatCurrency(toRupees(recoveryCase.risk_amount))}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Recovered Amount</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(toRupees(recoveryCase.recovered_amount))}
              </p>
            </div>
          </div>

          {/* Section 1: Customer & Payment Details */}
          <div className="space-y-3.5 p-5 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-[#141326] dark:border-purple-900/20 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Customer & Order Info</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Email</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{payment?.email || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Contact</span>
                <p className="font-medium text-slate-800 dark:text-slate-200">{payment?.contact || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Payment Method</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 capitalize">{payment?.method || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Razorpay Order ID</span>
                <p className="font-mono font-medium text-purple-700 dark:text-purple-300 truncate">{payment?.razorpay_order_id || "N/A"}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-purple-900/20">
              <span className="text-xs text-slate-500 dark:text-slate-400">Gateway Failure Reason</span>
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                {recoveryCase.failure_reason}
              </p>
            </div>
          </div>

          {/* Section 2: AI Diagnosis Engine */}
          <div className="pt-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Diagnosis Engine
              </h3>
              {parsedDiagnosis && (
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300">
                  {(parsedDiagnosis.confidence * 100).toFixed(0)}% confidence
                </span>
              )}
            </div>

            {isAnalyzing ? (
              /* Loading Skeleton */
              <div className="space-y-3 p-5 rounded-2xl border border-slate-200 dark:border-purple-900/20 bg-slate-50 dark:bg-[#141326] animate-pulse">
                <div className="h-4 bg-purple-500/20 rounded-md w-1/4"></div>
                <div className="h-6 bg-purple-500/20 rounded-md w-full"></div>
                <div className="h-3 bg-purple-500/20 rounded-md w-2/3"></div>
              </div>
            ) : parsedDiagnosis ? (
              /* Render Diagnosed Card */
              <div className="space-y-4">
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-purple-900/20 bg-slate-50 dark:bg-[#141326] space-y-3.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Reason Classification</span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300">
                      {parsedDiagnosis.reason_category.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">AI Diagnosis</span>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed italic">
                      &quot;{parsedDiagnosis.diagnosis}&quot;
                    </p>
                  </div>

                  {recoveryCase.recommended_action && (
                    <div className="pt-3 border-t border-slate-200 dark:border-purple-900/20">
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase block mb-1">Recommended Action</span>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed bg-purple-500/10 border border-purple-500/20 p-2.5 rounded-xl">
                        {recoveryCase.recommended_action}
                      </p>
                    </div>
                  )}

                  {/* Confidence progress bar */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      <span>CONFIDENCE RATING</span>
                      <span>{parsedDiagnosis.confidence.toFixed(2)} / 1.00</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getConfidenceBarColor(parsedDiagnosis.confidence)} rounded-full`}
                        style={{ width: `${parsedDiagnosis.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Recalculate Analyze option */}
                <button
                  onClick={() => onAnalyze(recoveryCase.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-purple-900/30 text-purple-600 dark:text-purple-300 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
                  </svg>
                  Re-Analyze failure
                </button>
              </div>
            ) : (
              /* No Diagnosis State */
              <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-purple-900/30 bg-slate-50 dark:bg-[#141326]/60 text-center space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  This failed payment has not been analyzed by Gemini. Run the diagnosis engine to identify root cause and recommended actions.
                </p>
                {analysisError && (
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                    Failed: {analysisError}
                  </p>
                )}
                <button
                  onClick={() => onAnalyze(recoveryCase.id)}
                  className="mx-auto w-full max-w-[220px] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-600/30 text-xs font-bold transition-all hover:scale-[1.01] cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Analyze Failure
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Recovery Action Suite */}
          <div className="pt-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Recovery Toolkit</h3>
              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full tracking-wide uppercase border border-amber-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
                Razorpay Test Mode
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-purple-900/20 bg-slate-50 dark:bg-[#141326] space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Action Status</span>
                <span className={`text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                  isCompleted
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : isAttempted
                    ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                    : isFailed
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                }`}>
                  {recoveryCase.action_status}
                </span>
              </div>

              {actionError && (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  Action Error: {actionError}
                </p>
              )}

              {/* Render Generated Payment Link View if URL exists */}
              {parsedDiagnosis?.payment_link_url ? (
                <div className="space-y-3.5 p-4 rounded-2xl border border-purple-500/20 bg-purple-500/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">Recovery Payment Link</span>
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">
                      Razorpay Test Mode
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Generated Link</span>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-[#0A0915] border border-slate-200 dark:border-purple-900/30 font-mono text-xs text-purple-700 dark:text-purple-300">
                      <span className="flex-1 truncate">{parsedDiagnosis.payment_link_url}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(parsedDiagnosis.payment_link_url);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-sans text-xs font-semibold shrink-0 transition-all shadow-sm cursor-pointer"
                      >
                        {copiedLink ? "Copied!" : "Copy Link"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-purple-900/20 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Status</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {recoveryCase.action_status === "completed" ? "Payment Completed" : "Recovery link generated"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Recovered</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(toRupees(recoveryCase.recovered_amount))}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Primary Action Trigger Section */
                <div className="space-y-3">
                  {(() => {
                    const actionType = parsedDiagnosis?.action_type || "payment_link";

                    let primaryActionKey = "payment_link";
                    let primaryLabel = "Generate Recovery Link";
                    let primaryLoadingLabel = "Generating Razorpay Link...";
                    let primaryHint = "AI recommends generating a Razorpay recovery payment link.";
                    let primaryIcon = (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    );

                    if (actionType === "retry_payment") {
                      primaryActionKey = "retry_payment";
                      primaryLabel = "Retry Payment";
                      primaryLoadingLabel = "Retrying Payment...";
                      primaryHint = "AI recommends retrying the transaction due to temporary network/gateway timeout.";
                      primaryIcon = (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
                        </svg>
                      );
                    } else if (actionType === "alternative_payment_method") {
                      primaryActionKey = "payment_link";
                      primaryLabel = "Generate Recovery Link";
                      primaryLoadingLabel = "Generating Recovery Link...";
                      primaryHint = "AI recommends an alternative payment method. Generating a link allows payment via UPI or Netbanking.";
                    } else if (actionType === "customer_notification") {
                      primaryActionKey = "customer_notification";
                      primaryLabel = "Notify Customer";
                      primaryLoadingLabel = "Sending Notification...";
                      primaryHint = "AI recommends notifying the customer to complete authentication or update credentials.";
                      primaryIcon = (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      );
                    }

                    return (
                      <>
                        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 text-[11px]">
                          <span className="font-bold uppercase tracking-wider block mb-0.5">AI Recommended Action</span>
                          <p className="text-slate-700 dark:text-slate-300 leading-normal">{primaryHint}</p>
                        </div>

                        <button
                          onClick={() => handleActionClick(primaryActionKey)}
                          disabled={isExecutingAction || isAttempted}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-600 to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.005] disabled:opacity-50 cursor-pointer"
                        >
                          {isExecutingAction ? (
                            <>
                              <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              {primaryLoadingLabel}
                            </>
                          ) : (
                            <>
                              {primaryIcon}
                              {primaryLabel}
                            </>
                          )}
                        </button>
                      </>
                    );
                  })()}

                  <div className="grid grid-cols-3 gap-2 text-[10px] pt-1">
                    <button
                      onClick={() => handleActionClick("retry_payment")}
                      disabled={isExecutingAction || isAttempted}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-purple-900/30 bg-white dark:bg-[#0A0915] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      Retry Payment
                    </button>
                    <button
                      onClick={() => handleActionClick("alternative_payment_method")}
                      disabled={isExecutingAction || isAttempted}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-purple-900/30 bg-white dark:bg-[#0A0915] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      Alt Method
                    </button>
                    <button
                      onClick={() => handleActionClick("customer_notification")}
                      disabled={isExecutingAction || isAttempted}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-purple-900/30 bg-white dark:bg-[#0A0915] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      Notify
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 bg-slate-100 dark:bg-[#0A0915] p-3 rounded-xl border border-slate-200 dark:border-purple-900/20">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                  Recovery payment links are generated in Razorpay Test Mode. `recovered_amount` updates automatically via webhooks when payment is captured.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Vertical Timeline */}
          <div className="pt-4 border-t border-slate-200 dark:border-purple-900/20 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Real Recovery Timeline</h3>
            <div className="flow-root p-5 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-[#141326] dark:border-purple-900/20 shadow-md">
              <ul className="-mb-8">
                {/* Event 1: Payment Attempted */}
                <li>
                  <div className="relative pb-8">
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-purple-900/30" aria-hidden="true" />
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-slate-500/10 border border-slate-500/20 flex items-center justify-center ring-8 ring-slate-50 dark:ring-[#141326]">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Payment Attempted</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{formatDate(payment?.created_at || recoveryCase.created_at)}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {formatCurrency(toRupees(payment?.amount || recoveryCase.risk_amount))} checkout attempt via {payment?.method || "card/upi"}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>

                {/* Event 2: Payment Failed */}
                <li>
                  <div className="relative pb-8">
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-purple-900/30" aria-hidden="true" />
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center ring-8 ring-slate-50 dark:ring-[#141326]">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400"></span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Payment Failed</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{formatDate(payment?.created_at || recoveryCase.created_at)}</p>
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">{recoveryCase.failure_reason}</p>
                      </div>
                    </div>
                  </div>
                </li>

                {/* Event 3: Recovery Case Created */}
                <li>
                  <div className="relative pb-8">
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-purple-900/30" aria-hidden="true" />
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center ring-8 ring-slate-50 dark:ring-[#141326]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400"></span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Recovery Case Created</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{formatDate(recoveryCase.created_at)}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Logged in Revora database for automated recovery tracking.</p>
                      </div>
                    </div>
                  </div>
                </li>

                {/* Event 4: AI Analysis */}
                <li>
                  <div className="relative pb-8">
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-purple-900/30" aria-hidden="true" />
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-slate-50 dark:ring-[#141326] ${
                          parsedDiagnosis ? "bg-purple-500/10 border border-purple-500/20" : "bg-slate-200 dark:bg-[#0A0915] border border-slate-300 dark:border-purple-900/20"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${parsedDiagnosis ? "bg-purple-600 dark:bg-purple-400" : "bg-slate-400 dark:bg-slate-600"}`}></span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5">
                        <p className={`text-xs font-bold ${parsedDiagnosis ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>AI Analysis</p>
                        {parsedDiagnosis ? (
                          <>
                            <p className="text-[10px] text-purple-600 dark:text-purple-300 mt-0.5 font-semibold">Gemini 3.6 Flash Diagnosis Completed</p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-medium italic">&quot;{parsedDiagnosis.diagnosis}&quot;</p>
                          </>
                        ) : (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 italic">
                            {isAnalyzing ? "Analyzing payment logs..." : "Awaiting AI analysis trigger..."}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>

                {/* Event 5: Recovery Strategy */}
                <li>
                  <div className="relative pb-8">
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-purple-900/30" aria-hidden="true" />
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-slate-50 dark:ring-[#141326] ${
                          recoveryCase.recommended_action ? "bg-purple-500/10 border border-purple-500/20" : "bg-slate-200 dark:bg-[#0A0915] border border-slate-300 dark:border-purple-900/20"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${recoveryCase.recommended_action ? "bg-purple-600 dark:bg-purple-400" : "bg-slate-400 dark:bg-slate-600"}`}></span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5">
                        <p className={`text-xs font-bold ${recoveryCase.recommended_action ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>Recovery Strategy</p>
                        {recoveryCase.recommended_action ? (
                          <>
                            <p className="text-[10px] text-purple-600 dark:text-purple-300 mt-0.5 font-semibold">
                              Action Strategy: {parsedDiagnosis?.action_type ? parsedDiagnosis.action_type.replace(/_/g, ' ').toUpperCase() : "PAYMENT LINK"}
                            </p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">{recoveryCase.recommended_action}</p>
                          </>
                        ) : (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 italic">Awaiting AI strategy recommendation...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>

                {/* Event 6: Recovery Action */}
                <li>
                  <div className="relative pb-8">
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-purple-900/30" aria-hidden="true" />
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-slate-50 dark:ring-[#141326] ${
                          isAttempted || isCompleted || parsedDiagnosis?.payment_link_url
                            ? "bg-indigo-500/10 border border-indigo-500/20"
                            : isFailed
                            ? "bg-rose-500/10 border border-rose-500/20"
                            : "bg-slate-200 dark:bg-[#0A0915] border border-slate-300 dark:border-purple-900/20"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isAttempted || isCompleted || parsedDiagnosis?.payment_link_url ? "bg-indigo-600 dark:bg-indigo-400" : isFailed ? "bg-rose-600 dark:bg-rose-400" : "bg-slate-400 dark:bg-slate-600"
                          }`}></span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5">
                        <p className={`text-xs font-bold ${
                          isAttempted || isCompleted || parsedDiagnosis?.payment_link_url
                            ? "text-slate-900 dark:text-white"
                            : isFailed
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-slate-400 dark:text-slate-500"
                        }`}>
                          {isFailed ? "Recovery Action Failed" : "Recovery Action"}
                        </p>
                        {isAttempted || isCompleted || parsedDiagnosis?.payment_link_url ? (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-medium">
                            Recovery action initiated. Razorpay test mode payment link active.
                          </p>
                        ) : isFailed ? (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">Recovery action attempt failed.</p>
                        ) : (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 italic">Awaiting action trigger...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>

                {/* Event 7: Payment Captured */}
                <li>
                  <div className="relative pb-8">
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-purple-900/30" aria-hidden="true" />
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-slate-50 dark:ring-[#141326] ${
                          isCompleted ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-slate-200 dark:bg-[#0A0915] border border-slate-300 dark:border-purple-900/20"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? "bg-emerald-600 dark:bg-emerald-400" : "bg-slate-400 dark:bg-slate-600"}`}></span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5">
                        <p className={`text-xs font-bold ${isCompleted ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>Payment Captured</p>
                        {isCompleted ? (
                          <>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-semibold">Verified via Razorpay payment.captured webhook</p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Customer completed payment via recovery link.</p>
                          </>
                        ) : (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 italic">Awaiting customer payment capture...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>

                {/* Event 8: Revenue Recovered */}
                <li>
                  <div className="relative">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-slate-50 dark:ring-[#141326] ${
                          isCompleted ? "bg-emerald-500/20 border border-emerald-500/40" : "bg-slate-200 dark:bg-[#0A0915] border border-slate-300 dark:border-purple-900/20"
                        }`}>
                          {isCompleted ? (
                            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600"></span>
                          )}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5">
                        <p className={`text-xs font-bold ${isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>Revenue Recovered</p>
                        {isCompleted ? (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                            {formatCurrency(toRupees(recoveryCase.recovered_amount))} successfully recovered
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 italic">Awaiting revenue recovery...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
