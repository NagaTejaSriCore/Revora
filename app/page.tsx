"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic import of Hero Video Component with SSR disabled
const RevoraHeroVideo = dynamic(
  () => import("@/components/landing/RevoraHeroVideo"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[480px] rounded-3xl bg-[#090b16] border border-purple-500/20 flex flex-col items-center justify-center space-y-3">
        <div className="w-16 h-16 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
        <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-widest">
          Loading Engine Video...
        </span>
      </div>
    ),
  }
);

export default function RevoraLandingPage() {
  const [landingTheme, setLandingTheme] = useState<"dark" | "light">("dark");

  const toggleLandingTheme = () => {
    setLandingTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const capabilities = [
    {
      title: "AI Failure Diagnosis",
      desc: "Deep contextual analysis of gateway decline codes and bank error logs using Gemini AI.",
      icon: (
        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: "Automated Retry Logic",
      desc: "Smart time-delayed transaction retries optimized for issuing bank approval windows.",
      icon: (
        <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
        </svg>
      ),
    },
    {
      title: "Recovery Link Generation",
      desc: "Direct 1-click personalized checkout recovery payment links issued automatically.",
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    {
      title: "Abandonment Detection",
      desc: "Real-time tracking of cart, shipping, and checkout funnel customer inactivity.",
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      title: "Customer Notifications",
      desc: "Multi-channel automated reminders crafted to re-engage abandoning buyers.",
      icon: (
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      title: "Confidence Scoring",
      desc: "AI-driven probability scoring for recovery action selection and risk prevention.",
      icon: (
        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Recovery Analytics",
      desc: "Comprehensive tracking of reclaimed funds, recovery rates, and failure categories.",
      icon: (
        <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      title: "Unified Dashboard",
      desc: "Single pane of glass for monitoring all payment failures and abandoned checkouts.",
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
  ];

  const workflowSteps = [
    { num: "01", title: "Payment Attempted", desc: "Customer initiates checkout on your e-commerce storefront." },
    { num: "02", title: "Failure Detected", desc: "Gateway decline or session inactivity is instantly intercepted by Revora." },
    { num: "03", title: "AI Diagnosis", desc: "Gemini analyzes exact error logs and customer behavioral signals." },
    { num: "04", title: "Recovery Strategy", desc: "Engine selects optimal action: smart retry, link, or notification." },
    { num: "05", title: "Recovery Action", desc: "Autonomous trigger dispatches direct payment link or retry workflow." },
    { num: "06", title: "Customer Returns", desc: "Customer opens the frictionless 1-click recovery payment page." },
    { num: "07", title: "Payment Captured", desc: "Transaction is completed and funds are secured in Razorpay." },
    { num: "08", title: "Analytics Updated", desc: "Database reconciles recovered revenue and updates merchant KPIs." },
  ];

  const solutions = [
    {
      title: "Reduce Revenue Leakage",
      desc: "Plug hidden checkout funnel drop-offs and reclaim up to 30% of lost transactions automatically.",
      accent: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
    },
    {
      title: "Recover Failed Payments",
      desc: "Turn involuntary payment declines and card authorization failures into completed sales.",
      accent: "from-rose-500/20 to-pink-500/20 border-rose-500/30",
    },
    {
      title: "Win Back Abandonment",
      desc: "Re-engage high-intent buyers who dropped off during checkout with smart payment links.",
      accent: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
    },
    {
      title: "AI-Powered Insight",
      desc: "Understand exact root causes behind transaction failures with Gemini AI diagnostic intelligence.",
      accent: "from-indigo-500/20 to-purple-500/20 border-indigo-500/30",
    },
    {
      title: "Intelligent Automation",
      desc: "Zero manual merchant effort — background engine handles the entire recovery lifecycle.",
      accent: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
    },
  ];

  const isDark = landingTheme === "dark";

  return (
    <div
      className={`min-h-screen font-sans selection:bg-purple-500 selection:text-white transition-colors duration-300 relative overflow-hidden ${
        isDark ? "bg-[#0D1220] text-slate-100" : "bg-[#f8fafc] text-slate-900"
      }`}
    >
      {/* Subtle Atmospheric Light & Vignette Overlay */}
      {isDark && (
        <>
          <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-br from-purple-900/20 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(7,10,16,0.7)_100%)] pointer-events-none" />

          {/* Scattered Dust Motes & Sparkle Accents */}
          <div className="absolute top-20 left-1/4 w-1.5 h-1.5 rounded-full bg-purple-400/40 animate-ping" />
          <div className="absolute top-40 right-1/3 w-2 h-2 rounded-full bg-pink-400/30 animate-pulse" />
          <div className="absolute top-1/3 left-10 w-1 h-1 rounded-full bg-emerald-400/50" />
          <div className="absolute top-2/3 right-12 w-2 h-2 rounded-full bg-amber-400/30 animate-pulse" />
        </>
      )}

      {/* 1. NAVIGATION (Sticky, Minimal) */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 ${
          isDark
            ? "bg-[#0D1220]/80 border-purple-900/20 text-white"
            : "bg-white/80 border-slate-200 text-slate-900"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo: REVORA */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight leading-tight">REVORA</span>
              <span className="text-[9px] font-bold tracking-widest text-purple-500 uppercase">Revenue Intelligence</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold tracking-wider uppercase">
            <a href="#capabilities" className="hover:text-purple-400 transition-colors">
              Capabilities
            </a>
            <a href="#workflow" className="hover:text-purple-400 transition-colors">
              Workflow
            </a>
            <a href="#solutions" className="hover:text-purple-400 transition-colors">
              Solutions
            </a>
            <Link
              href="/store"
              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              Customer Store
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Scoped Theme Toggle */}
            <button
              onClick={toggleLandingTheme}
              aria-label="Toggle Landing Theme"
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark
                  ? "bg-white/5 border-purple-900/30 text-amber-400 hover:bg-white/10"
                  : "bg-slate-100 border-slate-200 text-purple-600 hover:bg-slate-200"
              }`}
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>

            {/* Merchant Portal Login Button */}
            <Link
              href="/merchant/login"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition-all"
            >
              Merchant Portal
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO — Left-text / Right-3D composition */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column (~44%) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              AI-POWERED REVENUE RECOVERY
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Recover Lost Revenue{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-pink-500 bg-clip-text text-transparent block sm:inline">
                Automatically.
              </span>
            </h1>

            <p className={`text-base leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Detect failed payments and abandoned checkouts, diagnose them with AI, and recover the revenue automatically — before it&apos;s gone for good.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/store"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
              <Link
                href="/merchant/login"
                className={`px-6 py-3.5 rounded-2xl border font-bold text-sm transition-all ${
                  isDark
                    ? "border-purple-900/40 bg-white/5 hover:bg-white/10 text-white"
                    : "border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-900"
                }`}
              >
                Merchant Portal
              </Link>
            </div>
          </div>

          {/* Right Column (~56%) — Revora AI Core Video Engine */}
          <div className="lg:col-span-7 relative">
            {/* Video Engine Component */}
            <RevoraHeroVideo />

            {/* Floating Illustrative Payment Cards (Integrated with Video Stream Flow) */}
            {/* Input Side (Top Left - Red Failure Stream) */}
            <div className="absolute top-12 left-1 sm:left-4 z-20 p-3 rounded-2xl bg-[#0d0a1d]/90 border border-rose-500/30 backdrop-blur-md shadow-lg shadow-rose-900/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider block">
                  Payment Failed
                </span>
              </div>
              <span className="text-sm font-black text-white block mt-0.5">₹4,999</span>
            </div>

            {/* Input Side (Bottom Left - Amber Abandonment Stream) */}
            <div className="absolute bottom-12 left-1 sm:left-4 z-20 p-3 rounded-2xl bg-[#0d0a1d]/90 border border-amber-500/30 backdrop-blur-md shadow-lg shadow-amber-900/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                  Checkout Abandoned
                </span>
              </div>
              <span className="text-sm font-black text-white block mt-0.5">₹12,999</span>
            </div>

            {/* Output Side (Top Right - Green Captured Stream) */}
            <div className="absolute top-12 right-1 sm:right-4 z-20 p-3 rounded-2xl bg-[#0d0a1d]/90 border border-emerald-500/30 backdrop-blur-md shadow-lg shadow-emerald-900/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                  Payment Captured
                </span>
              </div>
              <span className="text-sm font-black text-white block mt-0.5">₹4,999</span>
            </div>

            {/* Output Side (Bottom Right - Green Recovered Stream) */}
            <div className="absolute bottom-12 right-1 sm:right-4 z-20 p-3 rounded-2xl bg-[#0d0a1d]/90 border border-emerald-500/30 backdrop-blur-md shadow-lg shadow-emerald-900/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                  Revenue Recovered
                </span>
              </div>
              <span className="text-sm font-black text-white block mt-0.5">₹12,999</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CAPABILITIES (8-card grid) */}
      <section id="capabilities" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-[11px] font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            CAPABILITIES
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Powerful AI recovery features
          </h2>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            End-to-end intelligent automation designed to capture every lost transaction dollar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {capabilities.map((cap, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 ${
                isDark
                  ? "bg-[#141326]/80 border-purple-900/20 hover:border-purple-500/40 shadow-xl"
                  : "bg-white border-slate-200 hover:border-purple-400 shadow-md"
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                {cap.icon}
              </div>
              <h3 className="text-base font-bold mb-2">{cap.title}</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {cap.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. WORKFLOW (8-step numbered pipeline) */}
      <section id="workflow" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-[11px] font-bold uppercase tracking-widest text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
            PIPELINE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            How Revora works
          </h2>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            An autonomous 8-stage lifecycle from transaction failure to reconciled revenue.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((step, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-3xl border transition-all relative ${
                isDark
                  ? "bg-[#141326]/60 border-purple-900/20"
                  : "bg-white border-slate-200"
              }`}
            >
              <span className="text-xs font-mono font-black text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20 mb-3 inline-block">
                {step.num}
              </span>
              <h3 className="text-sm font-bold mb-2">{step.title}</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. SOLUTIONS (5-card grid) */}
      <section id="solutions" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            SOLUTIONS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Smart recovery for modern merchants
          </h2>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Purpose-built automation for high-volume e-commerce storefronts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {solutions.slice(0, 3).map((sol, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-3xl border bg-gradient-to-b ${sol.accent} space-y-3 transition-all`}
            >
              <h3 className="text-lg font-bold">{sol.title}</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                {sol.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {solutions.slice(3).map((sol, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-3xl border bg-gradient-to-b ${sol.accent} space-y-3 transition-all`}
            >
              <h3 className="text-lg font-bold">{sol.title}</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                {sol.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CONTACT / FINAL CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="p-10 md:p-16 rounded-3xl bg-gradient-to-r from-purple-900/80 via-indigo-950 to-slate-900 border border-purple-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Turn lost revenue into recovered revenue
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Ready to start recovering lost sales automatically? Access your merchant portal to monitor live recoveries and AI diagnoses.
            </p>
            <div className="pt-4">
              <Link
                href="/merchant/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition-all transform hover:scale-105"
              >
                Open Merchant Portal
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer
        className={`border-t py-12 transition-colors duration-300 ${
          isDark ? "border-purple-900/20 bg-[#0A0E16] text-slate-400" : "border-slate-200 bg-slate-100 text-slate-600"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs font-semibold">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span>© 2026 Revora Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#capabilities" className="hover:text-purple-400 transition-colors">
              Features
            </a>
            <a href="#workflow" className="hover:text-purple-400 transition-colors">
              Workflow
            </a>
            <a href="#solutions" className="hover:text-purple-400 transition-colors">
              Solutions
            </a>
            <Link href="/merchant/login" className="hover:text-purple-400 transition-colors">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}