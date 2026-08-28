"use client";

import { useState } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Home() {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // 1. Create Razorpay order
      const response = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 100,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      // 2. Load Razorpay Checkout
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => {
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "Revora",
          description: "Revora Test Payment",
          order_id: data.orderId,

          handler: function (response: any) {
            console.log("Payment successful:", response);

            alert(
              `Payment successful!\nPayment ID: ${response.razorpay_payment_id}`
            );
          },

          prefill: {
  name: "Revora Test User",
  email: "test@example.com",
  contact: "+919000090000",
},

          theme: {
            color: "#111827",
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
      alert("Unable to start payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900">
          Revora
        </h1>

        <p className="mt-2 text-gray-600">
          AI Revenue Recovery Agent
        </p>

        <div className="mt-8 rounded-xl bg-gray-50 p-6">
          <h2 className="text-xl font-semibold">
            Test Product
          </h2>

          <p className="mt-2 text-3xl font-bold">
            ₹100
          </p>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-black px-6 py-3 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Pay ₹100"}
          </button>
        </div>
      </div>
    </main>
  );
}