"use client";

import React from "react";
import Link from "next/link";
import MerchantLayout from "@/components/MerchantLayout";
import MetricsOverview from "@/components/MetricsOverview";

export default function MerchantDashboard() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  return (
    <MerchantLayout pageTitle="Revenue Recovery Dashboard">
      {({ metrics, cases, loadingCases }) => (
        <div className="space-y-8">
          {loadingCases ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 p-4 animate-pulse space-y-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
              <div className="h-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 animate-pulse" />
            </div>
          ) : (
            <>
              {/* 1. Concise Primary KPI Overview */}
              <MetricsOverview metrics={metrics} cases={cases} />

              {/* 2. Compact Recovery Channel Comparison & Overview */}
              <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 dark:bg-[#141326]/90 dark:border-purple-900/20 shadow-xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-purple-900/20 pb-6">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                      Executive Recovery Overview
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Side-by-side performance comparison of Revora's two autonomous recovery channels
                    </p>
                  </div>
                  <Link
                    href="/merchant/analytics"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold transition-all border border-purple-500/20 w-fit"
                  >
                    View Full Revenue Analytics
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Channel A: Payment Failures */}
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-purple-900/20 space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Payment Failure Recovery</h3>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">Gateway & Bank Declines</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                        {metrics?.paymentFailure?.opportunities || 0} Cases
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-purple-900/10">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">At Risk</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {formatCurrency(metrics?.paymentFailure?.atRiskAmount || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Recovered</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(metrics?.paymentFailure?.recoveredAmount || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Efficiency</span>
                        <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                          {(metrics?.paymentFailure?.recoveryRate || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <Link
                      href="/merchant/payments"
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 text-white dark:bg-white/10 dark:hover:bg-white/20 text-xs font-bold transition-all cursor-pointer"
                    >
                      Manage Payment Failures
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>

                  {/* Channel B: Checkout Abandonments */}
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-purple-900/20 space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Checkout Abandonment Recovery</h3>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">Cart & Checkout Funnel Exits</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        {metrics?.totalAbandonedCheckouts || 0} Sessions
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-purple-900/10">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">At Risk</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {formatCurrency(metrics?.abandonment?.atRiskAmount || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Recovered</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(metrics?.abandonment?.recoveredAmount || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Efficiency</span>
                        <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                          {(metrics?.abandonment?.recoveryRate || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <Link
                      href="/merchant/abandonments"
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 text-white dark:bg-white/10 dark:hover:bg-white/20 text-xs font-bold transition-all cursor-pointer"
                    >
                      Manage Checkout Abandonments
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </MerchantLayout>
  );
}
