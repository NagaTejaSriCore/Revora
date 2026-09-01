"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, subtotal, total, clearCart } = useCart();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <StoreHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 space-y-8">
        
        {/* Page Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Shopping Cart
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Review your items and proceed to secure Razorpay checkout.
            </p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer"
            >
              Clear Cart
            </button>
          )}
        </div>

        {cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left 2 Cols: Cart Item List */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs"
                >
                  {/* Image & Title */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        {item.product.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        <Link href={`/product/${item.product.id}`} className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                          {item.product.name}
                        </Link>
                      </h3>
                      <p className="text-xs font-black text-slate-900 dark:text-white">
                        {formatCurrency(item.product.price)}
                      </p>
                    </div>
                  </div>

                  {/* Controls & Item Total */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 p-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold text-xs text-slate-900 dark:text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Total for item */}
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 dark:text-white block">
                        {formatCurrency(item.product.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer mt-0.5"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* Right Col: Order Summary Sidebar */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Order Summary
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Estimated Shipping</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">FREE</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Taxes</span>
                  <span className="font-bold text-slate-900 dark:text-white">Included</span>
                </div>
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm">
                  <span className="font-extrabold text-slate-900 dark:text-white">Total</span>
                  <span className="font-black text-slate-900 dark:text-white text-lg">{formatCurrency(total)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-600 to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 hover:scale-[1.005] transition-all"
              >
                Proceed to Checkout
              </Link>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">Razorpay Protected</span>
                <p>Transactions are processed via Razorpay Test Mode gateway with encrypted SSL protection.</p>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Cart State */
          <div className="py-20 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center mx-auto text-purple-600 dark:text-purple-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Cart is Currently Empty</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Looks like you haven&apos;t added any items to your shopping cart yet. Explore our catalog of tech &amp; lifestyle accessories.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-2xl bg-slate-900 dark:bg-purple-600 text-white text-xs font-bold hover:bg-purple-600 dark:hover:bg-purple-500 transition-colors shadow-md"
            >
              Explore Products
            </Link>
          </div>
        )}
      </main>

      <StoreFooter />
    </div>
  );
}
