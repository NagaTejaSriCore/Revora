"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MerchantLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@revora.app");
  const [password, setPassword] = useState("RevoraDemo123!");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    // Check if valid Supabase session already exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        document.cookie = `revora-auth-token=${session.access_token}; Path=/; max-age=604800; SameSite=Lax`;
        localStorage.setItem("revora-auth-token", session.access_token);
        router.push("/merchant");
      }
    });
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        // Real Supabase Auth Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.session?.access_token) {
          document.cookie = `revora-auth-token=${data.session.access_token}; Path=/; max-age=604800; SameSite=Lax`;
          localStorage.setItem("revora-auth-token", data.session.access_token);
          setSuccessMsg("Merchant account created! Redirecting to dashboard...");
          setTimeout(() => router.push("/merchant"), 800);
        } else {
          setSuccessMsg("Account created! Please check your email to confirm registration or sign in.");
          setIsSignUp(false);
        }
      } else {
        // Real Supabase Auth Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data?.session?.access_token) {
          document.cookie = `revora-auth-token=${data.session.access_token}; Path=/; max-age=604800; SameSite=Lax`;
          localStorage.setItem("revora-auth-token", data.session.access_token);
          setSuccessMsg("Sign in successful! Accessing merchant portal...");
          setTimeout(() => router.push("/merchant"), 500);
        }
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      setErrorMsg(err.message || "Authentication failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoLogin = async () => {
    const demoEmail = "demo@revora.app";
    const demoPass = "RevoraDemo123!";

    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Execute REAL Supabase Authentication with demo credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPass,
      });

      if (error) throw error;

      if (data?.session?.access_token) {
        const token = data.session.access_token;
        document.cookie = `revora-auth-token=${token}; Path=/; max-age=604800; SameSite=Lax`;
        localStorage.setItem("revora-auth-token", token);
        setSuccessMsg("Demo Merchant Authenticated via Supabase Auth! Redirecting...");
        setTimeout(() => router.push("/merchant"), 500);
      } else {
        throw new Error("No session token received from Supabase Auth.");
      }
    } catch (err: any) {
      console.error("Demo authentication error:", err);
      setErrorMsg(err.message || "Demo authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070612] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient Dark Fintech Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#0D0C1D]/90 backdrop-blur-xl border border-purple-900/30 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 mx-auto flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-600/30">
            R
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">Revora Merchant Portal</h1>
          <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider">
            Supabase Auth Protected
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-[#070612] p-1 rounded-xl border border-purple-900/20 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              !isSignUp ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              isSignUp ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Real Error Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2 animate-fade-in">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alerts */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-fade-in">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleAuth} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 block">Merchant Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="demo@revora.app"
              className="w-full px-4 py-3 rounded-xl border border-purple-900/30 bg-[#070612] text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-xl border border-purple-900/30 bg-[#070612] text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-purple-600 to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
                </svg>
                Authenticating...
              </span>
            ) : isSignUp ? (
              "Register Merchant Account"
            ) : (
              "Sign In to Merchant Dashboard"
            )}
          </button>
        </form>

        {/* Instant Demo Merchant Sign In Button (Uses Real Supabase Auth) */}
        <div className="pt-2 border-t border-purple-900/20 text-center space-y-2">
          <button
            type="button"
            onClick={handleInstantDemoLogin}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-xl border border-purple-900/30 bg-purple-500/10 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Instant Demo Merchant Sign In
          </button>
          <p className="text-[10px] text-slate-400 font-mono">
            Demo Credentials: demo@revora.app / RevoraDemo123!
          </p>
        </div>

        {/* Guest Return Link */}
        <div className="text-center pt-1">
          <a
            href="/"
            className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Return to Customer Storefront (Guest Mode)
          </a>
        </div>
      </div>
    </div>
  );
}
