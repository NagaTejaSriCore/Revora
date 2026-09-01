"use client";

import React from "react";

export interface UnifiedMetricsData {
  totalFailedPayments?: number;
  totalAbandonedCheckouts?: number;
  totalAtRiskAmount?: number;
  totalRecoveredAmount?: number;
  totalOutstandingAmount?: number;
  overallRecoveryRate?: number;
  paymentFailure?: {
    opportunities: number;
    atRiskAmount: number;
    attempts: number;
    successfulRecoveries: number;
    recoveredAmount: number;
    outstandingAmount: number;
    recoveryRate: number;
  };
  abandonment?: {
    abandonedSessions: number;
    atRiskAmount: number;
    attempts: number;
    successfulRecoveries: number;
    recoveredAmount: number;
    outstandingAmount: number;
    recoveryRate: number;
  };
  // Fallback aliases
  failedPayments?: number;
  atRiskAmount?: number;
  recoveredAmount?: number;
  recoveryRate?: number;
}

interface MetricsOverviewProps {
  metrics?: UnifiedMetricsData;
  cases?: any[];
}

export default function MetricsOverview({ metrics }: MetricsOverviewProps) {
  const toRupees = (paise: number) => paise / 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const failedPaymentsCount = metrics?.totalFailedPayments ?? metrics?.failedPayments ?? 0;
  const abandonedCheckoutsCount = metrics?.totalAbandonedCheckouts ?? 0;
  const totalAtRiskPaise = metrics?.totalAtRiskAmount ?? metrics?.atRiskAmount ?? 0;
  const recoveredPaise = metrics?.totalRecoveredAmount ?? metrics?.recoveredAmount ?? 0;
  const outstandingPaise = metrics?.totalOutstandingAmount ?? Math.max(0, totalAtRiskPaise - recoveredPaise);
  const overallRate = metrics?.overallRecoveryRate ?? metrics?.recoveryRate ?? 0;

  const stats = [
    {
      name: "Failed Payments",
      value: failedPaymentsCount.toLocaleString("en-IN"),
      subtext: "Payment Failure Opportunities",
      badgeText: "Payment Recovery",
      icon: (
        <svg className="w-4 h-4 text-rose-500 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      badgeStyle: "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
    },
    {
      name: "Abandoned Checkouts",
      value: abandonedCheckoutsCount.toLocaleString("en-IN"),
      subtext: "Checkout Abandonment Sessions",
      badgeText: "Abandonment Recovery",
      icon: (
        <svg className="w-4 h-4 text-amber-500 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      badgeStyle: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
    },
    {
      name: "Total At-Risk Revenue",
      value: formatCurrency(toRupees(totalAtRiskPaise)),
      subtext: "Combined Failures + Abandonments",
      badgeText: "Combined Opportunity",
      icon: (
        <svg className="w-4 h-4 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badgeStyle: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
    },
    {
      name: "Recovered Revenue",
      value: formatCurrency(toRupees(recoveredPaise)),
      subtext: "Verified Captured Payments",
      badgeText: "Reclaimed Funds",
      icon: (
        <svg className="w-4 h-4 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
      badgeStyle: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    },
    {
      name: "Outstanding Revenue",
      value: formatCurrency(toRupees(outstandingPaise)),
      subtext: "Remaining At-Risk Value",
      badgeText: "Pending Recovery",
      icon: (
        <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badgeStyle: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
    },
    {
      name: "Overall Recovery Rate",
      value: `${overallRate.toFixed(1)}%`,
      subtext: "Combined Revora Efficiency",
      badgeText: "Unified KPI",
      icon: (
        <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      badgeStyle: "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400",
      progress: Math.min(100, overallRate),
    },
  ];

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          Unified Revenue Recovery Overview
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white border border-slate-200 dark:bg-[#141326]/90 dark:border-purple-900/20 shadow-md relative overflow-hidden flex flex-col justify-between transition-colors duration-200"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{stat.name}</span>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border shrink-0 ${stat.badgeStyle}`}>
                  {stat.icon}
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {stat.value}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">{stat.subtext}</p>
            </div>

            {/* Mini Progress Bar for Overall Recovery Rate */}
            {stat.progress !== undefined && (
              <div className="mt-4">
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${stat.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
