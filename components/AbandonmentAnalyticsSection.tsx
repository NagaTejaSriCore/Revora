"use client";

import React from "react";
import { UnifiedMetricsData } from "./MetricsOverview";
import { AbandonedSession } from "./AbandonedCaseDrawer";

interface AbandonmentAnalyticsSectionProps {
  metrics?: UnifiedMetricsData;
  sessions?: AbandonedSession[];
}

export default function AbandonmentAnalyticsSection({ metrics, sessions = [] }: AbandonmentAnalyticsSectionProps) {
  const toRupees = (paise: number) => paise / 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const ab = metrics?.abandonment || {
    abandonedSessions: sessions.length,
    atRiskAmount: sessions.reduce((sum, s) => sum + s.cartValue * 100, 0),
    attempts: sessions.filter((s) => s.lastCheckoutStep !== "cart_viewed").length,
    successfulRecoveries: sessions.filter((s) => s.status === "COMPLETED_CAPTURED").length,
    recoveredAmount: 0,
    outstandingAmount: 0,
    recoveryRate: 0,
  };

  const analyzedCount = sessions.filter((s) => s.analysis).length;

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-[#141326]/90 dark:border-purple-900/20 shadow-md space-y-4 my-8 font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-purple-900/20 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Abandonment Recovery Analytics
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Key metrics tracking customer checkout abandonment recovery performance.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
          CHECKOUT ABANDONMENT
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
        
        {/* Metric 1: Abandoned Count */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A0915] border border-slate-200 dark:border-purple-900/20">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Abandoned Count</span>
          <span className="text-lg font-black text-slate-900 dark:text-white mt-1 block">
            {ab.abandonedSessions}
          </span>
          <span className="text-[9px] text-slate-400 block mt-0.5">Sessions abandoned</span>
        </div>

        {/* Metric 2: Abandoned Cart Value */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A0915] border border-slate-200 dark:border-purple-900/20">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Abandoned Cart Value</span>
          <span className="text-lg font-black text-slate-900 dark:text-white mt-1 block">
            {formatCurrency(toRupees(ab.atRiskAmount))}
          </span>
          <span className="text-[9px] text-slate-400 block mt-0.5">Total cart value</span>
        </div>

        {/* Metric 3: Analyzed Count */}
        <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block uppercase">AI Diagnosed</span>
          <span className="text-lg font-black text-purple-600 dark:text-purple-300 mt-1 block">
            {analyzedCount}
          </span>
          <span className="text-[9px] text-purple-500 dark:text-purple-400 block mt-0.5">Analyzed by Gemini</span>
        </div>

        {/* Metric 4: Recovery Actions Initiated */}
        <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block uppercase">Actions Initiated</span>
          <span className="text-lg font-black text-indigo-600 dark:text-indigo-300 mt-1 block">
            {ab.attempts}
          </span>
          <span className="text-[9px] text-indigo-500 dark:text-indigo-400 block mt-0.5">Recovery links sent</span>
        </div>

        {/* Metric 5: Abandoned Revenue Recovered */}
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block uppercase">Revenue Recovered</span>
          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {formatCurrency(toRupees(ab.recoveredAmount))}
          </span>
          <span className="text-[9px] text-emerald-500 dark:text-emerald-400 block mt-0.5">Verified captures</span>
        </div>

        {/* Metric 6: Abandonment Recovery Rate */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block uppercase">Abandonment Rate</span>
          <span className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {ab.recoveryRate.toFixed(1)}%
          </span>
          <span className="text-[9px] text-amber-500 dark:text-amber-400 block mt-0.5">Conversion rate</span>
        </div>

      </div>
    </div>
  );
}
