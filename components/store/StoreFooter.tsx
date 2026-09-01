"use client";

import React from "react";
import Link from "next/link";

export default function StoreFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 transition-colors duration-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Tagline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">Revora Store</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Premium tech &amp; lifestyle accessories engineered for seamless everyday performance.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-white transition-colors">
                  Checkout
                </Link>
              </li>
            </ul>
          </div>

          {/* Merchant & Engine Info */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Engine Integration</h4>
            <p className="text-slate-400 leading-relaxed">
              Powered by Revora AI Recovery Engine &amp; Razorpay Test Mode Payment Gateway.
            </p>
            <Link
              href="/merchant"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors pt-1"
            >
              Access Merchant Dashboard →
            </Link>
          </div>

          {/* Payment Methods Accepted */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Accepted Payments</h4>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">UPI</span>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">CARDS</span>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">NETBANKING</span>
              <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold border border-purple-500/30">RAZORPAY</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 Revora Store. Demo E-Commerce Storefront.</p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Razorpay Test Environment Active
          </p>
        </div>
      </div>
    </footer>
  );
}
