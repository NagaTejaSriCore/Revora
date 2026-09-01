"use client";

import React from "react";
import { UnifiedMetricsData } from "./MetricsOverview";

interface RecoverySourcePerformanceProps {
  metrics?: UnifiedMetricsData;
}

export default function RecoverySourcePerformance({ metrics }: RecoverySourcePerformanceProps) {
  const toRupees = (paise: number) => paise / 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const pf = metrics?.paymentFailure || {
    opportunities: 0,
    atRiskAmount: 0,
    attempts: 0,
    successfulRecoveries: 0,
    recoveredAmount: 0,
    outstandingAmount: 0,
    recoveryRate: 0,
  };

  const ab = metrics?.abandonment || {
    abandonedSessions: 0,
    atRiskAmount: 0,
    attempts: 0,
    successfulRecoveries: 0,
    recoveredAmount: 0,
    outstandingAmount: 0,
    recoveryRate: 0,
  };

  const totalAtRiskPaise = (metrics?.totalAtRiskAmount ?? 0);
  const totalRecoveredPaise = (metrics?.totalRecoveredAmount ?? 0);
  const totalOutstandingPaise = (metrics?.totalOutstandingAmount ?? 0);
  const totalAttempts = pf.attempts + ab.attempts;
  const totalSuccesses = pf.successfulRecoveries + ab.successfulRecoveries;

  return (
    <div className="space-y-6 my-8 font-sans">
      
      {/* Section Title */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-purple-900/20 pb-3">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            Recovery Source Performance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Side-by-side performance breakdown comparing Payment Failures vs. Checkout Abandonments.
          </p>
        </div>
      </div>

      {/* Two Opportunity Source Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Source 1: Payment Failure Recovery */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-[#141326]/90 dark:border-purple-900/20 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-purple-900/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Payment Failure Recovery
                </h3>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Gateway / Bank Transaction Failures</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300">
              {pf.recoveryRate.toFixed(1)}% RECOVERY
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0915] border border-slate-200 dark:border-purple-900/20">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Opportunities</span>
              <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">{pf.opportunities} cases</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0915] border border-slate-200 dark:border-purple-900/20">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">At-Risk Revenue</span>
              <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">{formatCurrency(toRupees(pf.atRiskAmount))}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0915] border border-slate-200 dark:border-purple-900/20">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Recovery Attempts</span>
              <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">{pf.attempts} initiated</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0915] border border-slate-200 dark:border-purple-900/20">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Successful Recoveries</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{pf.successfulRecoveries} completed</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 col-span-2 sm:col-span-2">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block uppercase">Recovered Amount</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{formatCurrency(toRupees(pf.recoveredAmount))}</span>
            </div>
          </div>
        </div>

        {/* Source 2: Checkout Abandonment Recovery */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-[#141326]/90 dark:border-purple-900/20 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-purple-900/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Checkout Abandonment Recovery
                </h3>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Customer Drop-offs &amp; Inactivity</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              {ab.recoveryRate.toFixed(1)}% RECOVERY
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0915] border border-slate-200 dark:border-purple-900/20">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Abandoned Sessions</span>
              <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">{ab.abandonedSessions} sessions</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0915] border border-slate-200 dark:border-purple-900/20">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">At-Risk Revenue</span>
              <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">{formatCurrency(toRupees(ab.atRiskAmount))}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0915] border border-slate-200 dark:border-purple-900/20">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Recovery Attempts</span>
              <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">{ab.attempts} initiated</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0915] border border-slate-200 dark:border-purple-900/20">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Successful Recoveries</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{ab.successfulRecoveries} completed</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 col-span-2 sm:col-span-2">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block uppercase">Recovered Amount</span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5 block">{formatCurrency(toRupees(ab.recoveredAmount))}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Revenue Recovery Funnel Visual */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-[#141326]/90 dark:border-purple-900/20 shadow-md space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
          Unified Revenue Recovery Funnel
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          
          {/* Step 1: Total At-Risk */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A0915] border border-slate-200 dark:border-purple-900/30 text-center space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">1. Total At-Risk</span>
            <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(toRupees(totalAtRiskPaise))}</p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">{pf.opportunities + ab.abandonedSessions} Total Cases</span>
          </div>

          {/* Step 2: Recovery Attempts */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-purple-600 dark:text-purple-400 tracking-wider">2. Recovery Attempts</span>
            <p className="text-xl font-black text-purple-600 dark:text-purple-300">{totalAttempts} Actions</p>
            <span className="text-[10px] text-purple-500 dark:text-purple-400 block font-semibold">Links / Retries Initiated</span>
          </div>

          {/* Step 3: Successful Recoveries */}
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">3. Successful Recoveries</span>
            <p className="text-xl font-black text-indigo-600 dark:text-indigo-300">{totalSuccesses} Paid</p>
            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 block font-semibold">Verified Payment Captures</span>
          </div>

          {/* Step 4: Recovered Revenue */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">4. Recovered Revenue</span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(toRupees(totalRecoveredPaise))}</p>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-semibold">Outstanding: {formatCurrency(toRupees(totalOutstandingPaise))}</span>
          </div>

        </div>
      </div>

    </div>
  );
}
