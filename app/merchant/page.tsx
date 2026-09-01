"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MetricsOverview, { UnifiedMetricsData } from "@/components/MetricsOverview";
import RecoveryPerformance, { PerformanceMetrics } from "@/components/RecoveryPerformance";
import FailureAnalytics, { FailureAnalyticsData } from "@/components/FailureAnalytics";
import CasesTable from "@/components/CasesTable";
import CaseDetailsDrawer from "@/components/CaseDetailsDrawer";
import AbandonedCheckoutsSection from "@/components/AbandonedCheckoutsSection";
import AbandonedCaseDrawer, { AbandonedSession } from "@/components/AbandonedCaseDrawer";
import RecoverySourcePerformance from "@/components/RecoverySourcePerformance";
import AbandonmentAnalyticsSection from "@/components/AbandonmentAnalyticsSection";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    Razorpay: any;
  }
}

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

export default function MerchantDashboard() {
  const router = useRouter();

  // Authentication & Merchant User State
  const [merchantEmail, setMerchantEmail] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Tab control: "dashboard" or "sandbox"
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Data States
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [metrics, setMetrics] = useState<UnifiedMetricsData | undefined>(undefined);
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null);
  const [performanceError, setPerformanceError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<FailureAnalyticsData | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [loadingCases, setLoadingCases] = useState(true);
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Phase 4 & 5 Abandonment state
  const [abandonedSessions, setAbandonedSessions] = useState<AbandonedSession[]>([]);
  const [abandonedCount, setAbandonedCount] = useState<number>(0);
  const [selectedAbandonedSession, setSelectedAbandonedSession] = useState<AbandonedSession | null>(null);
  const [analyzingSessionId, setAnalyzingSessionId] = useState<string | null>(null);
  const [abandonmentAnalysisError, setAbandonmentAnalysisError] = useState<string | null>(null);

  // Selected Drawer States for Payment Failure cases
  const [selectedCase, setSelectedCase] = useState<RecoveryCase | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Sandbox States
  const [sandboxLoading, setSandboxLoading] = useState(false);

  // Theme State & View Transition Center Origin Ref
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Initial Auth Session Check
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      let token = session?.access_token || localStorage.getItem("revora-auth-token");
      
      if (!token) {
        router.push("/merchant/login");
        return;
      }

      setAuthToken(token);
      setMerchantEmail(session?.user?.email || "merchant@revora.com");
      document.cookie = `revora-auth-token=${token}; Path=/; max-age=604800; SameSite=Lax`;
      localStorage.setItem("revora-auth-token", token);

      fetchDashboardData(token);
    };

    initAuth();
  }, [router]);

  useEffect(() => {
    const saved = localStorage.getItem("revora-merchant-theme");
    const initialTheme = saved === "light" ? "light" : "dark";
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const getHeaders = (tokenOverride?: string | null) => {
    const token = tokenOverride || authToken || localStorage.getItem("revora-auth-token") || "";
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = "revora-auth-token=; Path=/; max-age=0";
    localStorage.removeItem("revora-auth-token");
    router.push("/merchant/login");
  };

  const applyThemeState = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    localStorage.setItem("revora-merchant-theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const btn = themeButtonRef.current;

    const supportsViewTransitions =
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!supportsViewTransitions || !btn) {
      applyThemeState(nextTheme);
      return;
    }

    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    document.documentElement.style.setProperty("--x", `${x}px`);
    document.documentElement.style.setProperty("--y", `${y}px`);
    document.documentElement.style.setProperty("--r", `${endRadius}px`);

    (document as any).startViewTransition(() => {
      applyThemeState(nextTheme);
    });
  };

  // Retrieve cases, metrics, performance, analytics, and abandonment data
  const fetchDashboardData = async (tokenOverride?: string | null, showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      setLoadingCases(true);

      const headers = getHeaders(tokenOverride);
      
      const [casesRes, metricsRes, analyticsRes, performanceRes, eventsRes] = await Promise.all([
        fetch("/api/recovery/cases", { headers }),
        fetch("/api/recovery/metrics", { headers }),
        fetch("/api/recovery/analytics", { headers }),
        fetch("/api/recovery/performance", { headers }),
        fetch("/api/events/track"),
      ]);

      if (casesRes.status === 401 || metricsRes.status === 401) {
        router.push("/merchant/login");
        return;
      }

      const casesData = await casesRes.json();
      const metricsData = await metricsRes.json();
      const analyticsResult = await analyticsRes.json();
      const performanceResult = await performanceRes.json();

      let eventsData: any = {};
      try {
        if (eventsRes.ok) {
          const rawText = await eventsRes.text();
          if (rawText && rawText.trim().length > 0) {
            eventsData = JSON.parse(rawText);
          }
        }
      } catch (evtErr) {
        console.warn("[REVORA DASHBOARD] Failed to parse events response JSON:", evtErr);
      }

      const casesList = casesData.cases || casesData.data || (Array.isArray(casesData) ? casesData : []);
      if (casesList && Array.isArray(casesList)) {
        setCases(casesList);
        setGeminiConfigured(!!casesData.geminiConfigured);

        if (selectedCase) {
          const updated = casesList.find((c: RecoveryCase) => c.id === selectedCase.id);
          if (updated) setSelectedCase(updated);
        }
      }

      if (metricsData) {
        setMetrics(metricsData);
      }

      if (analyticsResult.success && (analyticsResult.categories || analyticsResult.data)) {
        setAnalyticsData(analyticsResult.data || analyticsResult);
        setAnalyticsError(null);
      } else {
        setAnalyticsError(analyticsResult.error || "Failed to load failure analytics");
      }

      if (performanceResult.success && (performanceResult.metrics || performanceResult.data)) {
        setPerformanceData(performanceResult.metrics || performanceResult.data);
        setPerformanceError(null);
      } else {
        setPerformanceError(performanceResult.error || "Failed to load recovery performance analytics");
      }

      if (eventsData && eventsData.abandonmentSummary) {
        setAbandonedCount(eventsData.abandonmentSummary.abandonedCount || 0);
        setAbandonedSessions(eventsData.abandonmentSummary.abandonedSessions || []);
      }
    } catch (error: any) {
      console.error("Failed to load dashboard analytics:", error);
      setAnalyticsError(error.message || "Network error loading analytics");
      setPerformanceError(error.message || "Network error loading performance metrics");
    } finally {
      setLoadingCases(false);
      setRefreshing(false);
    }
  };

  // AI Analysis API trigger for Payment Failures
  const handleAnalyzeCase = async (caseId: string) => {
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);

      const response = await fetch("/api/recovery/analyze", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ recovery_case_id: caseId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Analysis failed");
      }

      await fetchDashboardData();
      if (selectedCase && selectedCase.id === caseId) {
        setSelectedCase((prev) => (prev ? { ...prev, ...result.data } : null));
      }
    } catch (err: any) {
      console.error("Failure analysis error:", err);
      setAnalysisError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // AI Abandonment Analysis API trigger
  const handleAnalyzeAbandonment = async (sessionId: string) => {
    try {
      setAnalyzingSessionId(sessionId);
      setAbandonmentAnalysisError(null);

      const res = await fetch("/api/recovery/abandonment-analyze", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ session_id: sessionId }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Abandonment analysis failed");
      }

      setAbandonedSessions((prev) =>
        prev.map((s) => (s.sessionId === sessionId ? { ...s, analysis: data.analysis } : s))
      );

      if (selectedAbandonedSession && selectedAbandonedSession.sessionId === sessionId) {
        setSelectedAbandonedSession((prev) => (prev ? { ...prev, analysis: data.analysis } : null));
      }
    } catch (err: any) {
      console.error("Abandonment analysis error:", err);
      setAbandonmentAnalysisError(err.message || "Failed to analyze abandonment");
    } finally {
      setAnalyzingSessionId(null);
    }
  };

  // Recovery Action API trigger
  const handleExecuteAction = async (caseId: string, actionType: string) => {
    try {
      setIsExecutingAction(true);
      setActionError(null);

      const response = await fetch("/api/recovery/action", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ recovery_case_id: caseId, action_type: actionType }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to execute recovery action");
      }

      await fetchDashboardData();
      if (selectedCase && selectedCase.id === caseId) {
        setSelectedCase((prev) => (prev ? { ...prev, ...result.data } : null));
      }
    } catch (err: any) {
      console.error("Recovery action execution error:", err);
      setActionError(err.message || "An error occurred while executing the recovery action.");
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Sandbox Razorpay payment handler
  const handlePayment = async () => {
    try {
      setSandboxLoading(true);

      const response = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 100, // ₹100
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => {
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "Revora",
          description: "Revora Sandbox Test Payment",
          order_id: data.orderId,

          handler: function (response: any) {
            console.log("Payment successful:", response);
            alert(`Payment successful!\nPayment ID: ${response.razorpay_payment_id}`);
            fetchDashboardData();
          },

          prefill: {
            name: "Revora Test User",
            email: "test@example.com",
            contact: "+919000090000",
          },

          theme: {
            color: "#6366f1",
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };

      script.onerror = () => {
        alert("Failed to load Razorpay Checkout.");
      };

      document.body.appendChild(script);
    } catch (error) {
      console.error(error);
      alert("Unable to start test payment.");
    } finally {
      setSandboxLoading(false);
    }
  };

  return (
    <div className="flex bg-slate-50 dark:bg-[#0B0A1A] min-h-screen text-slate-900 dark:text-slate-100 font-sans relative overflow-hidden transition-colors duration-200">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        geminiConfigured={geminiConfigured}
        merchantEmail={merchantEmail}
        onLogout={handleLogout}
      />

      {/* Main content body */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative z-10">
        {/* Top Header navbar */}
        <header className="h-16 border-b border-slate-200/80 dark:border-purple-900/20 bg-white/80 dark:bg-[#0B0A1A]/80 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {activeTab === "dashboard" ? "Revenue Recovery Dashboard" : "Payment Sandbox Environment"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "dashboard" && (
              <button
                onClick={() => fetchDashboardData(null, true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-purple-900/30 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all disabled:opacity-50 cursor-pointer"
              >
                <svg
                  className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
                </svg>
                {refreshing ? "Syncing..." : "Sync Database"}
              </button>
            )}

            {abandonedCount > 0 && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
                CHECKOUT ABANDONMENTS: {abandonedCount} DETECTED
              </span>
            )}

            <span className="text-[10px] font-bold text-purple-600 dark:text-slate-400 uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              V1.0.0 (AUTH PROTECTED)
            </span>
            <button
              ref={themeButtonRef}
              onClick={handleThemeToggle}
              aria-label="Toggle dark/light theme"
              className="p-2 rounded-xl border border-slate-200 dark:border-purple-900/30 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
            >
              {theme === "dark" ? (
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic tab contents */}
        <div className="flex-1 p-8 overflow-y-auto space-y-8">
          {activeTab === "dashboard" ? (
            /* Dashboard View */
            loadingCases ? (
              /* Shimmer Skeletons loading */
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
                {/* 1. Real Database Metric overview cards */}
                <MetricsOverview metrics={metrics} cases={cases} />

                {/* 2. Recovery Source Performance Breakdown & Revenue Funnel */}
                <RecoverySourcePerformance metrics={metrics} />

                {/* 3. Abandoned Checkouts Section */}
                <AbandonedCheckoutsSection
                  sessions={abandonedSessions}
                  onSelectSession={setSelectedAbandonedSession}
                  onAnalyzeSession={handleAnalyzeAbandonment}
                  analyzingId={analyzingSessionId}
                />

                {/* 4. Lightweight Abandonment Analytics */}
                <AbandonmentAnalyticsSection
                  metrics={metrics}
                  sessions={abandonedSessions}
                />

                {/* 5. Payment Recovery Performance Analytics */}
                <RecoveryPerformance
                  performance={performanceData}
                  isLoading={loadingCases}
                  error={performanceError}
                />

                {/* 6. Failure Category Analytics Section */}
                <FailureAnalytics
                  analytics={analyticsData}
                  isLoading={loadingCases}
                  error={analyticsError}
                />

                {/* 7. Payment Failure Cases Table */}
                <CasesTable
                  cases={cases}
                  onSelectCase={setSelectedCase}
                  selectedCaseId={selectedCase?.id}
                />
              </>
            )
          ) : (
            /* Premium Fintech Sandbox View */
            <div className="max-w-4xl mx-auto space-y-8 py-4">
              {/* Header & Status Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 dark:bg-[#141326]/90 dark:border-purple-900/20 shadow-md transition-colors duration-200">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    Sandbox Testing
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Test Revora&apos;s payment failure and recovery pipeline safely.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
                    RAZORPAY TEST MODE • ACTIVE
                  </span>
                </div>
              </div>

              {/* Main Card: Simulate Payment Failure */}
              <div className="p-8 rounded-2xl bg-white border border-slate-200 dark:bg-[#141326]/90 dark:border-purple-900/20 shadow-md space-y-6 transition-colors duration-200">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">SIMULATE PAYMENT FAILURE</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Trigger a test transaction to verify the Razorpay → Webhook → Supabase → Revora recovery pipeline.
                    </p>
                  </div>
                </div>

                {/* Numbered Test Instructions */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Test Instructions:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#1A1833]/60 dark:border-purple-900/20 text-slate-700 dark:text-slate-200">
                      <span className="font-bold text-purple-600 dark:text-purple-400 mr-1.5">1.</span> Click &quot;Trigger Test Payment&quot; below.
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#1A1833]/60 dark:border-purple-900/20 text-slate-700 dark:text-slate-200">
                      <span className="font-bold text-purple-600 dark:text-purple-400 mr-1.5">2.</span> Complete the Razorpay Test Mode checkout.
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#1A1833]/60 dark:border-purple-900/20 text-slate-700 dark:text-slate-200">
                      <span className="font-bold text-purple-600 dark:text-purple-400 mr-1.5">3.</span> Select your desired payment method.
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#1A1833]/60 dark:border-purple-900/20 text-slate-700 dark:text-slate-200">
                      <span className="font-bold text-purple-600 dark:text-purple-400 mr-1.5">4.</span> Simulate a successful or failed payment.
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#1A1833]/60 dark:border-purple-900/20 text-slate-700 dark:text-slate-200">
                      <span className="font-bold text-purple-600 dark:text-purple-400 mr-1.5">5.</span> Return to the Revenue Dashboard.
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#1A1833]/60 dark:border-purple-900/20 text-slate-700 dark:text-slate-200">
                      <span className="font-bold text-purple-600 dark:text-purple-400 mr-1.5">6.</span> Review logged case &amp; AI diagnosis.
                    </div>
                  </div>
                </div>

                {/* Primary CTA Button */}
                <button
                  onClick={handlePayment}
                  disabled={sandboxLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-600 to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 hover:scale-[1.005] active:scale-[0.995] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {sandboxLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading Razorpay Checkout...
                    </>
                  ) : (
                    "Trigger Test Payment (₹100)"
                  )}
                </button>
              </div>

              {/* Visual Pipeline & Webhook Status Card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-[#141326]/90 dark:border-purple-900/20 shadow-md space-y-5 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">WEBHOOK CONNECTION</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>

                {/* Compact Visual Test Pipeline */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#1A1833]/60 dark:border-purple-900/20 overflow-x-auto">
                  <div className="flex items-center justify-between min-w-[550px] text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300">Payment Test</span>
                    <span className="text-slate-400">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300">Razorpay</span>
                    <span className="text-slate-400">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">Webhook</span>
                    <span className="text-slate-400">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300">Supabase</span>
                    <span className="text-slate-400">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">Recovery Case</span>
                    <span className="text-slate-400">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-700 dark:text-pink-300">Gemini AI</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Payment events are automatically processed through the Revora recovery pipeline.
                </p>
              </div>

              {/* Test Mode Warning Banner */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex items-start gap-3 text-xs">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <span className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">TEST MODE ONLY</span>
                  <p className="mt-0.5 text-slate-700 dark:text-slate-300">
                    These transactions use Razorpay Test Mode and do not represent real customer payments.
                  </p>
                </div>
              </div>

              {/* Recent Test Activity Section (Real Data) */}
              {cases.length > 0 && (
                <div className="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-[#141326]/90 dark:border-purple-900/20 shadow-md space-y-4 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Recent Test Activity</h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{cases.slice(0, 5).length} recent transactions</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 dark:bg-[#0A0915] text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase dark:border-purple-900/20 tracking-wider">
                          <th className="px-4 py-2.5">Payment ID</th>
                          <th className="px-4 py-2.5">Amount</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5">Failure Reason</th>
                          <th className="px-4 py-2.5 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-purple-900/20 text-xs">
                        {cases.slice(0, 5).map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                            <td className="px-4 py-2.5 font-mono text-purple-600 dark:text-purple-300 text-[11px]">
                              {c.payments?.razorpay_payment_id || c.payment_id.slice(0, 12)}
                            </td>
                            <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">
                              ₹{(c.risk_amount / 100).toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                c.action_status === "completed"
                                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                  : c.action_status === "attempted"
                                  ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                                  : c.action_status === "failed"
                                  ? "bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400"
                                  : "bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400"
                              }`}>
                                {c.action_status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[200px]">
                              {c.failure_reason}
                            </td>
                            <td className="px-4 py-2.5 text-right text-slate-500 text-[10px]">
                              {new Date(c.created_at).toLocaleDateString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Payment Failure Case Details Drawer */}
      <CaseDetailsDrawer
        recoveryCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onAnalyze={handleAnalyzeCase}
        isAnalyzing={isAnalyzing}
        analysisError={analysisError}
        onExecuteAction={handleExecuteAction}
        isExecutingAction={isExecutingAction}
        actionError={actionError}
      />

      {/* Abandoned Checkout Case Drawer */}
      <AbandonedCaseDrawer
        session={selectedAbandonedSession}
        onClose={() => setSelectedAbandonedSession(null)}
        onAnalyze={handleAnalyzeAbandonment}
        isAnalyzing={!!analyzingSessionId}
        analysisError={abandonmentAnalysisError}
      />
    </div>
  );
}
