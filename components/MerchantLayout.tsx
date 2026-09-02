"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { UnifiedMetricsData } from "@/components/MetricsOverview";
import { PerformanceMetrics } from "@/components/RecoveryPerformance";
import { FailureAnalyticsData } from "@/components/FailureAnalytics";
import { AbandonedSession } from "@/components/AbandonedCaseDrawer";

export interface Payment {
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

export interface RecoveryCase {
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

interface MerchantLayoutProps {
  children: (props: {
    authToken: string | null;
    merchantEmail: string | null;
    cases: RecoveryCase[];
    setCases: React.Dispatch<React.SetStateAction<RecoveryCase[]>>;
    metrics: UnifiedMetricsData | undefined;
    performanceData: PerformanceMetrics | null;
    performanceError: string | null;
    analyticsData: FailureAnalyticsData | null;
    analyticsError: string | null;
    abandonedSessions: AbandonedSession[];
    setAbandonedSessions: React.Dispatch<React.SetStateAction<AbandonedSession[]>>;
    abandonedCount: number;
    loadingCases: boolean;
    geminiConfigured: boolean;
    refreshing: boolean;
    fetchDashboardData: (tokenOverride?: string | null, showRefreshIndicator?: boolean) => Promise<void>;
    getHeaders: (tokenOverride?: string | null) => Record<string, string>;
  }) => React.ReactNode;
  pageTitle: string;
}

export default function MerchantLayout({ children, pageTitle }: MerchantLayoutProps) {
  const router = useRouter();

  // Auth & Merchant State
  const [merchantEmail, setMerchantEmail] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

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

  // Abandonment State
  const [abandonedSessions, setAbandonedSessions] = useState<AbandonedSession[]>([]);
  const [abandonedCount, setAbandonedCount] = useState<number>(0);

  // UI & Mobile Drawer State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Auth check & data fetch on mount
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || localStorage.getItem("revora-auth-token");

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

  // Theme initialization
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

  const headerCount = metrics?.totalAbandonedCheckouts ?? metrics?.abandonment?.abandonedSessions ?? abandonedCount;

  return (
    <div className="flex bg-slate-50 dark:bg-[#0B0A1A] min-h-screen text-slate-900 dark:text-slate-100 font-sans relative overflow-hidden transition-colors duration-200">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Sidebar Navigation */}
      <Sidebar
        geminiConfigured={geminiConfigured}
        merchantEmail={merchantEmail}
        onLogout={handleLogout}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Body */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative z-10">
        {/* Top Header navbar */}
        <header className="h-16 border-b border-slate-200/80 dark:border-purple-900/20 bg-white/80 dark:bg-[#0B0A1A]/80 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-purple-900/30 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200"
              aria-label="Open Mobile Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => fetchDashboardData(null, true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-purple-900/30 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all disabled:opacity-50 cursor-pointer"
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
              <span className="hidden sm:inline">{refreshing ? "Syncing..." : "Sync Database"}</span>
            </button>

            {headerCount > 0 && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 md:px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
                <span className="hidden lg:inline">CHECKOUT ABANDONMENTS:</span> {headerCount} DETECTED
              </span>
            )}

            <span className="hidden xl:inline-block text-[10px] font-bold text-purple-600 dark:text-slate-400 uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
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

        {/* Dynamic page content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8">
          {children({
            authToken,
            merchantEmail,
            cases,
            setCases,
            metrics,
            performanceData,
            performanceError,
            analyticsData,
            analyticsError,
            abandonedSessions,
            setAbandonedSessions,
            abandonedCount,
            loadingCases,
            geminiConfigured,
            refreshing,
            fetchDashboardData,
            getHeaders,
          })}
        </div>
      </main>
    </div>
  );
}
