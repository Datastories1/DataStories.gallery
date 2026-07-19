"use client";

import { useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const { clearCart, forceNewSessionToken } = useCart();
  const processedRef = useRef(false); 
  
  // Grab the values directly from the landing URL string parameters
  const paymentIntentId = searchParams.get("payment_intent");
  const urlCustomerEmail = searchParams.get("customerEmail");

  useEffect(() => {
    if (processedRef.current || !paymentIntentId) return;
    processedRef.current = true;

    // Instantly wipe layout carts to clean up interface state
    clearCart();
    forceNewSessionToken();

    async function verifyAndDispatchPurchase() {
      try {
        console.log("📤 Triggering transaction lookup for Stripe token:", paymentIntentId);
        
        await fetch("/api/tracking/success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_intent: paymentIntentId,
            customerEmail: urlCustomerEmail
          })
        });
      } catch (err) {
        console.error("Failed to execute product delivery route fetch:", err);
      }
    }

    verifyAndDispatchPurchase();
  }, [paymentIntentId, urlCustomerEmail]);

  return (
    <div style={{ padding: "80px 20px", textAlign: "center", fontFamily: "sans-serif" }}>
      <div style={{ fontSize: "60px", marginBottom: "10px" }}>🎉</div>
      <h1 style={{ color: "#16a34a", fontSize: "28px", margin: "0 0 10px 0" }}>
        Thank You For Your Purchase!
      </h1>
      <p style={{ color: "#475569", fontSize: "16px", margin: "0 0 35px 0", lineHeight: "1.5" }}>
        Your transaction was verified successfully.<br />
        Please check your inbox at <strong>{urlCustomerEmail}</strong> for your instant Power BI download links!
      </p>

      <Link href="/">
        <button style={{
          backgroundColor: "#1e3a8a",
          color: "#ffffff",
          padding: "12px 28px",
          fontSize: "15px",
          fontWeight: "600",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer"
        }}>
          Return to Marketplace
        </button>
      </Link>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ padding: "60px", textAlign: "center" }}>Verifying operational payment records...</div>}>
      <SuccessPageContent />
    </Suspense>
  );
}