"use client";

import React from "react";
import { AbandonedSession } from "./AbandonedCaseDrawer";

interface AbandonedCheckoutsSectionProps {
  sessions: AbandonedSession[];
  onSelectSession: (session: AbandonedSession) => void;
  onAnalyzeSession: (sessionId: string) => Promise<void>;
  analyzingId: string | null;
}

export default function AbandonedCheckoutsSection({
  sessions = [],
  onSelectSession,
  onAnalyzeSession,
  analyzingId,
}: AbandonedCheckoutsSectionProps) {
  // Filter exclusively for currently open / unrecovered abandoned sessions (status === "ABANDONED")
  const openSessions = sessions.filter((s) => s.status === "ABANDONED");

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (!openSessions || openSessions.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-slate-200 dark:bg-[#141326]/90 dark:border-purple-900/20 shadow-md text-center space-y-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Open Abandoned Checkouts (0)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No open checkout abandonments currently awaiting recovery. All detected sessions are either active or successfully recovered.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-[#141326]/90 dark:border-purple-900/20 shadow-md space-y-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Open Abandoned Checkouts ({openSessions.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Identify and recover currently open/unrecovered customer checkout sessions using Gemini AI strategies.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 dark:bg-[#0A0915] text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase dark:border-purple-900/20 tracking-wider">
              <th className="px-4 py-3">Session ID</th>
              <th className="px-4 py-3">Cart Value</th>
              <th className="px-4 py-3">Last Step</th>
              <th className="px-4 py-3">Customer Info</th>
              <th className="px-4 py-3">AI Diagnosis</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-purple-900/20 text-xs">
            {openSessions.map((sess) => (
              <tr key={sess.sessionId} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 font-mono text-purple-600 dark:text-purple-300 text-[11px]">
                  {sess.sessionId.slice(0, 16)}...
                </td>
                <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(sess.cartValue)}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 capitalize text-[11px]">
                  {sess.lastCheckoutStep.replace("_", " ")}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-[11px] truncate max-w-[160px]">
                  {sess.customerEmail || "No email"}
                </td>
                <td className="px-4 py-3 max-w-[220px]">
                  {sess.analysis ? (
                    <div className="space-y-0.5">
                      <span className="font-semibold text-purple-600 dark:text-purple-300 text-[11px] block truncate">
                        {sess.analysis.diagnosis}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                        Action: {sess.analysis.action_type} ({Math.round(sess.analysis.confidence * 100)}%)
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Not Analyzed</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!sess.analysis && (
                      <button
                        onClick={() => onAnalyzeSession(sess.sessionId)}
                        disabled={analyzingId === sess.sessionId}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-600 text-white text-[11px] font-bold hover:bg-purple-500 transition-colors shadow-xs disabled:opacity-50"
                      >
                        {analyzingId === sess.sessionId ? "Analyzing..." : "Analyze AI"}
                      </button>
                    )}
                    <button
                      onClick={() => onSelectSession(sess)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-purple-900/30 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-all"
                    >
                      View Case
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
