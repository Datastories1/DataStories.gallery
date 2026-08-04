"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const { clearCart, forceNewSessionToken } = useCart();
  const processedRef = useRef(false);
  
  const paymentIntentId = searchParams.get("payment_intent");
  const urlCustomerEmail = searchParams.get("customerEmail") || "buyer@datastories.gallery";
  const urlTemplateId = searchParams.get("templateId");
  const rawTemplateIdsParam = searchParams.get("templateIds");

  const [purchasedTemplates, setPurchasedTemplates] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    // 1. Capture saved cart items before clearing them
    let savedItems = [];
    try {
      const rawCart = localStorage.getItem("data_stories_cart");
      if (rawCart) {
        const parsed = JSON.parse(rawCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          savedItems = parsed;
        }
      }
    } catch (e) {}

    // Clear cart & reset session state safely after capturing items
    clearCart();
    forceNewSessionToken();

    async function verifyAndFetchPurchases() {
      try {
        if (paymentIntentId && paymentIntentId.startsWith("pi_")) {
          await fetch("/api/tracking/success", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payment_intent: paymentIntentId,
              customerEmail: urlCustomerEmail
            })
          });
        }

        // 2. Build complete list of IDs from URL parameters (prioritizing multi-item params) or cart storage
        let allIds = [];
        
        if (rawTemplateIdsParam) {
          try {
            const parsed = JSON.parse(rawTemplateIdsParam);
            if (Array.isArray(parsed)) allIds = parsed.map(i => typeof i === 'object' ? (i._id || i.id) : i);
          } catch (e) {
            allIds = rawTemplateIdsParam.split(",").map(s => s.trim());
          }
        }

        if (allIds.length === 0 && savedItems.length > 0) {
          allIds = savedItems.map(item => item._id || item.id).filter(Boolean);
        }

        if (allIds.length === 0 && urlTemplateId) {
          allIds = urlTemplateId.includes(",") ? urlTemplateId.split(",").map(s => s.trim()) : [urlTemplateId];
        }

        // 3. Request all items from the backend API in a single query
        if (allIds.length > 0) {
          const res = await fetch(`/api/purchased-items?templateIds=${encodeURIComponent(JSON.stringify(allIds))}&customerEmail=${encodeURIComponent(urlCustomerEmail)}`);
          const data = await res.json();
          if (data.success && data.templates && data.templates.length > 0) {
            setPurchasedTemplates(data.templates);
            setLoadingItems(false);
            return;
          }
        }

        // Fallback mapping if API query returns empty
        if (savedItems.length > 0) {
          const fallbackEnriched = savedItems.map(item => ({
            _id: item._id || item.id || "default",
            title: item.title || "Power BI Dashboard Template",
            downloadUrl: `/api/download?templateId=${item._id || item.id || "default"}`
          }));
          setPurchasedTemplates(fallbackEnriched);
        } else {
          setPurchasedTemplates([{
            _id: urlTemplateId || "default",
            title: "Power BI Dashboard Template",
            downloadUrl: `/api/download?templateId=${urlTemplateId || "default"}`
          }]);
        }
      } catch (err) {
        console.error("Failed to fetch purchased items:", err);
        setPurchasedTemplates([{
          _id: urlTemplateId || "default",
          title: "Power BI Dashboard Template",
          downloadUrl: `/api/download?templateId=${urlTemplateId || "default"}`
        }]);
      } finally {
        setLoadingItems(false);
      }
    }

    verifyAndFetchPurchases();
  }, [paymentIntentId, urlCustomerEmail, urlTemplateId, rawTemplateIdsParam, clearCart, forceNewSessionToken]);

  return (
    <div style={{ padding: "60px 20px", textAlign: "center", fontFamily: "sans-serif", maxWidth: "700px", margin: "0 auto" }}>
      <div style={{ fontSize: "60px", marginBottom: "10px" }}>🎉</div>
      <h1 style={{ color: "#16a34a", fontSize: "28px", margin: "0 0 10px 0" }}>
        Thank You For Your Purchase!
      </h1>
      <p style={{ color: "#475569", fontSize: "16px", margin: "0 0 25px 0", lineHeight: "1.5" }}>
        Your transaction was verified successfully.<br />
        Download your purchased Power BI templates instantly below, or check your inbox at <strong>{urlCustomerEmail}</strong>.
      </p>

      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", marginBottom: "30px", textAlign: "left" }}>
        <h3 style={{ margin: "0 0 15px 0", color: "#0f172a", fontSize: "18px" }}>📦 Your Purchased Templates:</h3>
        
        {loadingItems ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "20px", color: "#64748b" }}>
            <div style={{
              width: "24px",
              height: "24px",
              border: "3px solid #e2e8f0",
              borderTop: "3px solid #2563eb",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }} />
            <span style={{ fontSize: "15px", fontWeight: "500" }}>Loading your secure download assets...</span>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          purchasedTemplates.map((template) => (
            <div key={template._id || template.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "14px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", marginBottom: "12px" }}>
              <span style={{ fontWeight: "600", color: "#1e293b", fontSize: "15px" }}>📊 {template.title}</span>
              <a 
                href={template.downloadUrl || `/api/download?templateId=${template._id || template.id}`}
                style={{
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "600",
                  textDecoration: "none",
                  boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)"
                }}
              >
                📥 Download Zip
              </a>
            </div>
          ))
        )}
      </div>

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