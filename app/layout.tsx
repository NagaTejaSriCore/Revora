import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./dashboard.css";
import { CartProvider } from "@/context/CartContext";
import { CustomerThemeProvider } from "@/context/CustomerThemeContext";
import CartDrawer from "@/components/store/CartDrawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Revora Store | Premium Tech & Accessories",
  description: "Next-gen e-commerce storefront powered by Revora AI Revenue Recovery Engine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
        <CustomerThemeProvider>
          <CartProvider>
            {children}
            <CartDrawer />
          </CartProvider>
        </CustomerThemeProvider>
      </body>
    </html>
  );
}
