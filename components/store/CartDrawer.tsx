"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, subtotal } = useCart();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer Body */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl h-full relative z-10 flex flex-col border-l border-slate-200 dark:border-slate-800 animate-slide-in-right">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-20">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Your Cart</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Items Container */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80"
              >
                {/* Product Image */}
                <div className="relative w-16 h-16 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>

                {/* Info & Quantity Controls */}
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {item.product.name}
                  </h4>
                  <p className="text-xs font-black text-purple-600 dark:text-purple-400">
                    {formatCurrency(item.product.price)}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 px-1">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  title="Remove item"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-3">
              <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Your cart is empty</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                Explore our tech &amp; lifestyle catalog to add items.
              </p>
            </div>
          )}
        </div>

        {/* Footer Checkout Summary */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Subtotal</span>
              <span className="font-black text-slate-900 dark:text-white text-base">{formatCurrency(subtotal)}</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Taxes and shipping calculated at checkout.</p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Link
                href="/cart"
                onClick={() => setIsCartOpen(false)}
                className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-center text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                View Full Cart
              </Link>
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-center text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:scale-[1.01] transition-all"
              >
                Checkout Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
