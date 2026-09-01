"use client";

import React, { useState } from "react";

export interface CategoryAnalytics {
  category: string;
  label: string;
  caseCount: number;
  originalFailedValue: number;
  recoveredValue: number;
  outstandingValue: number;
  recoveryRate: number;
  failedAmount?: number;
  recoveredAmount?: number;
  atRiskAmount?: number;
}

export interface FailureAnalyticsData {
  categories: CategoryAnalytics[];
  totalCases: number;
}

interface FailureAnalyticsProps {
  analytics?: FailureAnalyticsData | null;
  isLoading?: boolean;
  error?: string | null;
}

export default function FailureAnalytics({
  analytics,
  isLoading = false,
  error = null,
}: FailureAnalyticsProps) {
  const [selectedView, setSelectedView] = useState<"chart" | "table">("chart");

  const toRupees = (paise: number) => paise / 100;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const categories = analytics?.categories || [];
  const activeCategories = categories.filter((c) => c.caseCount > 0);
  const totalOriginalFailedVolume = categories.reduce(
    (sum, c) => sum + (c.originalFailedValue ?? c.failedAmount ?? 0),
    0
  );

  // Category Theme Mapper
  const getCategoryTheme = (catKey: string) => {
    switch (catKey) {
      case "insufficient_funds":
        return { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", bar: "bg-amber-500 dark:bg-amber-400" };
      case "card_declined":
        return { color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", bar: "bg-rose-500 dark:bg-rose-400" };
      case "authentication_failure":
        return { color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", bar: "bg-purple-500 dark:bg-purple-400" };
      case "network_error":
        return { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", bar: "bg-blue-500 dark:bg-blue-400" };
      case "payment_method_issue":
        return { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", bar: "bg-orange-500 dark:bg-orange-400" };
      case "bank_issue":
        return { color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", bar: "bg-indigo-500 dark:bg-indigo-400" };
      default:
        return { color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", bar: "bg-slate-500 dark:bg-slate-400" };
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-purple-900/20 shadow-md overflow-hidden bg-white dark:bg-[#141326]/90 mb-8 transition-colors duration-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-purple-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Failure Category Analytics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Breakdown of original failed volume, recovered amount, and outstanding exposure by failure category
              </p>
            </div>
          </div>
        </div>

        {/* View Toggle Switch */}
        <div className="flex bg-slate-100 dark:bg-[#0A0915] p-1 rounded-xl border border-slate-200 dark:border-purple-900/20 self-start sm:self-auto">
          <button
            onClick={() => setSelectedView("chart")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedView === "chart"
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Visual Chart
          </button>
          <button
            onClick={() => setSelectedView("table")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedView === "table"
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7-8v8m14-8v8" />
            </svg>
            Data Table
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-6">
        {isLoading ? (
          /* Loading Skeleton */
          <div className="space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 dark:bg-[#18162E] rounded-xl border border-slate-200 dark:border-purple-900/20" />
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center text-xs font-semibold text-rose-500 dark:text-rose-400">
            Failed to load failure analytics: {error}
          </div>
        ) : activeCategories.length === 0 ? (
          /* Empty State */
          <div className="py-12 text-center text-slate-400">
            <svg className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No failed payment cases recorded yet</p>
          </div>
        ) : selectedView === "chart" ? (
          /* Horizontal Visual Chart View */
          <div className="space-y-4">
            {categories
              .filter((c) => c.caseCount > 0)
              .map((cat) => {
                const theme = getCategoryTheme(cat.category);
                const origVal = cat.originalFailedValue ?? cat.failedAmount ?? 0;
                const recVal = cat.recoveredValue ?? cat.recoveredAmount ?? 0;
                const outVal = cat.outstandingValue ?? cat.atRiskAmount ?? 0;
                const volumeShare = totalOriginalFailedVolume > 0 ? (origVal / totalOriginalFailedVolume) * 100 : 0;

                return (
                  <div
                    key={cat.category}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#1A1833]/60 dark:border-purple-900/20 space-y-2.5 transition-all hover:border-purple-500/30"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${theme.bg} ${theme.color} ${theme.border}`}>
                          {cat.label}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {cat.caseCount} {cat.caseCount === 1 ? "case" : "cases"} ({volumeShare.toFixed(0)}% share)
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium">
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          Original Failed Value: <strong className="text-slate-900 dark:text-white font-bold">{formatCurrency(toRupees(origVal))}</strong>
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          Recovered: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(toRupees(recVal))}</strong>
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          Outstanding: <strong className="text-amber-600 dark:text-amber-400 font-bold">{formatCurrency(toRupees(outVal))}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 font-bold text-[11px]">
                          {cat.recoveryRate.toFixed(1)}% Rate
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden flex">
                      {/* Recovered Portion */}
                      <div
                        className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-500"
                        style={{
                          width: `${origVal > 0 ? (recVal / origVal) * 100 : 0}%`,
                        }}
                        title={`Recovered: ${formatCurrency(toRupees(recVal))}`}
                      />
                      {/* Outstanding Portion */}
                      <div
                        className={`h-full ${theme.bar} opacity-60 transition-all duration-500`}
                        style={{
                          width: `${origVal > 0 ? (outVal / origVal) * 100 : 0}%`,
                        }}
                        title={`Outstanding: ${formatCurrency(toRupees(outVal))}`}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          /* Detailed Data Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[#0A0915] dark:bg-[#0A0915] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase dark:border-purple-900/20 tracking-wider">
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Case Count</th>
                  <th className="px-4 py-3">Original Failed Value</th>
                  <th className="px-4 py-3">Recovered</th>
                  <th className="px-4 py-3">Outstanding</th>
                  <th className="px-4 py-3 text-right">Recovery Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-purple-900/20 text-xs">
                {categories.map((cat) => {
                  const theme = getCategoryTheme(cat.category);
                  const origVal = cat.originalFailedValue ?? cat.failedAmount ?? 0;
                  const recVal = cat.recoveredValue ?? cat.recoveredAmount ?? 0;
                  const outVal = cat.outstandingValue ?? cat.atRiskAmount ?? 0;

                  return (
                    <tr key={cat.category} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${theme.bg} ${theme.color} ${theme.border}`}>
                          {cat.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-800 dark:text-slate-200">
                        {cat.caseCount}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(toRupees(origVal))}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(toRupees(recVal))}
                      </td>
                      <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">
                        {formatCurrency(toRupees(outVal))}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-purple-600 dark:text-purple-400">
                        {cat.recoveryRate.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
