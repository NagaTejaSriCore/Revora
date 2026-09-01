"use client";

import React, { useState, useMemo } from "react";

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

interface CasesTableProps {
  cases: RecoveryCase[];
  onSelectCase: (recoveryCase: RecoveryCase) => void;
  selectedCaseId?: string;
}

export default function CasesTable({ cases, onSelectCase, selectedCaseId }: CasesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const toRupees = (paise: number) => paise / 100;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Extract distinct statuses for dynamic filter counts
  const counts = useMemo(() => {
    return {
      all: cases.length,
      pending: cases.filter(c => c.action_status === "pending" && c.ai_diagnosis === null).length,
      analyzed: cases.filter(c => c.action_status === "pending" && c.ai_diagnosis !== null).length,
      attempted: cases.filter(c => c.action_status === "attempted").length,
      recovered: cases.filter(c => (c.action_status === "completed" || c.action_status === "recovered") && c.recovered_amount > 0).length,
      failed: cases.filter(c => c.action_status === "failed").length,
    };
  }, [cases]);

  // Filtering Logic
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const payment = c.payments;
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = 
        c.failure_reason.toLowerCase().includes(searchLower) ||
        (payment?.razorpay_payment_id || "").toLowerCase().includes(searchLower) ||
        (payment?.email || "").toLowerCase().includes(searchLower) ||
        (payment?.contact || "").toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      if (statusFilter === "pending") {
        return c.action_status === "pending" && c.ai_diagnosis === null;
      } else if (statusFilter === "analyzed") {
        return c.action_status === "pending" && c.ai_diagnosis !== null;
      } else if (statusFilter === "attempted") {
        return c.action_status === "attempted";
      } else if (statusFilter === "recovered") {
        return (c.action_status === "completed" || c.action_status === "recovered") && c.recovered_amount > 0;
      } else if (statusFilter === "failed") {
        return c.action_status === "failed";
      }
      return true;
    });
  }, [cases, searchTerm, statusFilter]);

  // Action status badge styler matching theme
  const getStatusBadge = (status: string, aiDiagnosis: any) => {
    if (status === "completed" || status === "recovered") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
          Completed
        </span>
      );
    }
    
    if (status === "attempted") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400"></span>
          Attempted
        </span>
      );
    }

    if (status === "failed") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400"></span>
          Failed
        </span>
      );
    }

    if (aiDiagnosis) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400"></span>
          AI Diagnosed
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse"></span>
        Pending
      </span>
    );
  };

  // Payment method normalizer & icon rendering
  const getMethodDisplay = (method: string | null) => {
    if (!method) return <span className="text-slate-400 dark:text-slate-500">—</span>;
    const m = method.toLowerCase();
    
    let icon = (
      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    );

    if (m === "upi") {
      icon = (
        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 tracking-tighter">UPI</span>
      );
    } else if (m === "card") {
      icon = (
        <svg className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    } else if (m === "netbanking") {
      icon = (
        <svg className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    }

    return (
      <span className="flex items-center gap-1.5 capitalize text-xs text-slate-700 dark:text-slate-300 font-medium">
        {icon}
        {m}
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-purple-900/20 shadow-md overflow-hidden bg-white dark:bg-[#141326]/90 mb-8 transition-colors duration-200">
      
      {/* Header and Controls */}
      <div className="p-6 border-b border-slate-200 dark:border-purple-900/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 dark:bg-[#0A0915] p-1 rounded-xl border border-slate-200 dark:border-purple-900/20 self-start overflow-x-auto max-w-full">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              statusFilter === "all"
                ? "bg-gradient-to-r from-purple-600 via-purple-600 to-pink-500 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            All Cases
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
              {counts.all}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              statusFilter === "pending"
                ? "bg-gradient-to-r from-purple-600 via-purple-600 to-pink-500 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Pending
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
              {counts.pending}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("analyzed")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              statusFilter === "analyzed"
                ? "bg-gradient-to-r from-purple-600 via-purple-600 to-pink-500 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            AI Diagnosed
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
              {counts.analyzed}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("attempted")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              statusFilter === "attempted"
                ? "bg-gradient-to-r from-purple-600 via-purple-600 to-pink-500 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Attempted
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              {counts.attempted}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("recovered")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              statusFilter === "recovered"
                ? "bg-gradient-to-r from-purple-600 via-purple-600 to-pink-500 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Recovered
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              {counts.recovered}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("failed")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              statusFilter === "failed"
                ? "bg-gradient-to-r from-purple-600 via-purple-600 to-pink-500 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Failed
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
              {counts.failed}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search ID, email or error..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-purple-900/20 rounded-xl text-xs bg-slate-50 dark:bg-[#0A0915] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all duration-150"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-[#0A0915] text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-purple-900/20 tracking-wider">
              <th className="px-6 py-4">Payment ID</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Method</th>
              <th className="px-6 py-4">Failure Reason</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-purple-900/20">
            {filteredCases.length > 0 ? (
              filteredCases.map((c) => {
                const isSelected = selectedCaseId === c.id;
                const paymentId = c.payments?.razorpay_payment_id || c.payment_id.slice(0, 12) + "...";
                
                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelectCase(c)}
                    className={`cursor-pointer transition-all duration-150 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.02] ${
                      isSelected ? "bg-purple-500/10 border-l-2 border-purple-500" : ""
                    }`}
                  >
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-purple-600 dark:text-purple-300">
                      {paymentId}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-white">
                      {formatCurrency(toRupees(c.risk_amount))}
                    </td>
                    <td className="px-6 py-4">
                      {getMethodDisplay(c.payments?.method || null)}
                    </td>
                    <td className="px-6 py-4 text-xs max-w-xs truncate text-slate-500 dark:text-slate-400">
                      {c.failure_reason}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(c.action_status, c.ai_diagnosis)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 text-right">
                      {formatDate(c.created_at)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <span className="text-xs font-semibold">No failure recovery cases found</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
