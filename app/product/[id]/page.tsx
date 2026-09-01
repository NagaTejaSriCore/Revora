"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import ProductCard from "@/components/store/ProductCard";
import { PRODUCTS } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { trackProductViewed } from "@/lib/analytics/events";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const productId = params.id as string;
  const product = PRODUCTS.find((p) => p.id === productId || p.slug === productId);

  useEffect(() => {
    if (product) {
      trackProductViewed(product);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between font-sans">
        <StoreHeader />
        <div className="max-w-md mx-auto my-auto text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Product Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">The product you are looking for does not exist or has been removed.</p>
          <Link href="/" className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors">
            Back to Store
          </Link>
        </div>
        <StoreFooter />
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const relatedProducts = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <StoreHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 space-y-12">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Store</Link>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium truncate">{product.name}</span>
        </nav>

        {/* Primary Product Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          
          {/* Left Column: Product Image Gallery */}
          <div className="relative aspect-square rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/80 dark:border-slate-700/80 group">
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-xs">
              {product.category}
            </span>
          </div>

          {/* Right Column: Product Info & CTAs */}
          <div className="space-y-6">
            <div>
              {/* Rating */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center text-amber-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 ml-1">{product.rating}</span>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">({product.reviewCount} customer reviews)</span>
                <span className="ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  In Stock
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Price Display */}
              <div className="flex items-baseline gap-3 mt-3">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-slate-400 dark:text-slate-500 line-through font-medium">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
                {product.originalPrice && (
                  <span className="px-2.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-800">
                    Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
              {product.description}
            </p>

            {/* Key Features Bullet List */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Key Highlights:</h3>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {product.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quantity Selector & Action CTAs */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Quantity:</span>
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-slate-900 dark:text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => addToCart(product, quantity)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl border-2 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-900 dark:hover:bg-slate-700 hover:text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-600 to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 hover:scale-[1.01] transition-all cursor-pointer"
                >
                  Buy Now
                </button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                <span className="block font-bold text-slate-900 dark:text-white">Free Express</span> Shipping
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                <span className="block font-bold text-slate-900 dark:text-white">Razorpay</span> Secure Checkout
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                <span className="block font-bold text-slate-900 dark:text-white">1-Year Warranty</span> Coverage
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="space-y-6 pt-6">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </main>

      <StoreFooter />
    </div>
  );
}
