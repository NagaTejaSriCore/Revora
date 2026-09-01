"use client";

import React from "react";
import Link from "next/link";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  geminiConfigured: boolean;
  merchantEmail?: string | null;
  onLogout?: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  geminiConfigured,
  merchantEmail,
  onLogout,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-white text-slate-900 border-r border-slate-200 dark:bg-[#0A0915] dark:text-slate-100 dark:border-purple-900/20 h-screen sticky top-0 shrink-0 transition-colors duration-200 flex flex-col">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-200 dark:border-purple-900/20 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white block">Revora</span>
          <span className="block text-[10px] text-purple-600 dark:text-purple-400 font-bold tracking-widest uppercase">Recovery Engine</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* Dashboard Button */}
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group cursor-pointer ${
            activeTab === "dashboard"
              ? "bg-gradient-to-r from-purple-600 via-purple-600 to-pink-500 text-white shadow-lg shadow-purple-600/25"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
          }`}
        >
          <span className={`transition-colors duration-200 ${activeTab === "dashboard" ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
          </span>
          <span className="flex-1 text-left">Dashboard</span>
        </button>

        {/* Sandbox Button */}
        <button
          onClick={() => setActiveTab("sandbox")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group cursor-pointer ${
            activeTab === "sandbox"
              ? "bg-gradient-to-r from-purple-600 via-purple-600 to-pink-500 text-white shadow-lg shadow-purple-600/25"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
          }`}
        >
          <span className={`transition-colors duration-200 ${activeTab === "sandbox" ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </span>
          <span className="flex-1 text-left">Sandbox Testing</span>
        </button>

        {/* Customer Store Front Link */}
        <Link
          href="/"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100 transition-all duration-200 group"
        >
          <span className="text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </span>
          <span className="flex-1 text-left">Store Front</span>
          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300">
            Store
          </span>
        </Link>
      </nav>

      {/* Connection & Configuration Info & Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-purple-900/20 bg-slate-50 dark:bg-[#070612]/60 space-y-3">
        {merchantEmail && (
          <div className="px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Logged In As</span>
            <span className="font-semibold text-slate-200 truncate block">{merchantEmail}</span>
          </div>
        )}

        <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase px-2">
          Engine Integrations
        </div>
        <div className="space-y-2">
          {/* Supabase Status */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200 dark:bg-white/[0.03] dark:border-purple-900/20">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Supabase Auth</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">VERIFIED</span>
            </div>
          </div>
          {/* Gemini Status */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200 dark:bg-white/[0.03] dark:border-purple-900/20">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Gemini Engine</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${geminiConfigured ? "bg-emerald-500 dark:bg-emerald-400 animate-pulse" : "bg-amber-500 dark:bg-amber-400"}`}></span>
              <span className={`text-[10px] font-bold uppercase tracking-wide ${geminiConfigured ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                {geminiConfigured ? "CONFIGURED" : "MISSING KEY"}
              </span>
            </div>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all cursor-pointer mt-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}
