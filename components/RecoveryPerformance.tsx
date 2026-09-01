"use client";

import React from "react";

export interface PerformanceMetrics {
  totalRecoveryCases: number;
  recoveryAttempts: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  pendingRecoveries: number;
  conversionRate: number;
  totalRecoveredRevenue: number;
  averageRecoveryValue: number;
}

interface RecoveryPerformanceProps {
  performance?: PerformanceMetrics | null;
  isLoading?: boolean;
  error?: string | null;
}

export default function RecoveryPerformance({
  performance,
  isLoading = false,
  error = null,
}: RecoveryPerformanceProps) {
  const toRupees = (paise: number) => paise / 100;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const p = performance || {
    totalRecoveryCases: 0,
    recoveryAttempts: 0,
    successfulRecoveries: 0,
    failedRecoveries: 0,
    pendingRecoveries: 0,
    conversionRate: 0,
    totalRecoveredRevenue: 0,
    averageRecoveryValue: 0,
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-purple-900/20 shadow-md overflow-hidden bg-white dark:bg-[#141326]/90 mb-8 transition-colors duration-200">
      {/* Section Header */}
      <div className="p-6 border-b border-slate-200 dark:border-purple-900/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Recovery Performance Analytics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time recovery conversion efficiency, attempt breakdown, and revenue yield
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          • CONVERSION ENGINE ACTIVE
        </span>
      </div>

      {/* Body Content */}
      <div className="p-6">
        {isLoading ? (
          /* Loading Skeleton */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 dark:bg-[#18162E] rounded-2xl border border-slate-200 dark:border-purple-900/20" />
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center text-xs font-semibold text-rose-500 dark:text-rose-400">
            Failed to load performance analytics: {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Primary Top Highlight Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Conversion Rate Card with Visual Bar */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-purple-900/20 dark:bg-[#1A1833] dark:border-purple-900/30 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">CONVERSION RATE</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{p.conversionRate.toFixed(1)}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {p.successfulRecoveries} of {p.recoveryAttempts} attempts converted
                  </p>
                </div>
                <div className="mt-4 w-full h-1.5 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, p.conversionRate)}%` }}
                  />
                </div>
              </div>

              {/* Total Recovered Revenue Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-emerald-500/20 dark:bg-[#1A1833] dark:border-emerald-900/30 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">REVENUE RECOVERED</span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(toRupees(p.totalRecoveredRevenue))}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Total successfully reclaimed
                  </p>
                </div>
                <div className="mt-4 w-full h-1.5 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full w-full" />
                </div>
              </div>

              {/* Average Recovery Value Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-amber-500/20 dark:bg-[#1A1833] dark:border-amber-900/30 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">AVG RECOVERY VALUE</span>
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{formatCurrency(toRupees(p.averageRecoveryValue))}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Average yield per success
                  </p>
                </div>
                <div className="mt-4 w-full h-1.5 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 dark:bg-amber-400 rounded-full w-3/4" />
                </div>
              </div>
            </div>

            {/* Secondary Lifecycle Status Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-purple-900/20 dark:bg-[#1A1833]/60 dark:border-purple-900/20">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">RECOVERY ATTEMPTS</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white block mt-1">{p.recoveryAttempts}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Actions initiated</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-emerald-500/20 dark:bg-[#1A1833]/60 dark:border-emerald-900/30">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">SUCCESSFUL RECOVERIES</span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 block mt-1">{p.successfulRecoveries}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Payment captured</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-rose-500/20 dark:bg-[#1A1833]/60 dark:border-rose-900/30">
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">FAILED RECOVERIES</span>
                <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 block mt-1">{p.failedRecoveries}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Attempt unsuccessful</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-amber-500/20 dark:bg-[#1A1833]/60 dark:border-amber-900/30">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">PENDING RECOVERIES</span>
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 block mt-1">{p.pendingRecoveries}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Awaiting action</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
