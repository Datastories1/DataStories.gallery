"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaDownload, FaCheckCircle } from "react-icons/fa";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found.");
      setLoading(false);
      return;
    }

    async function verifyPayment() {
      try {
        console.log("Frontend fetching verification for session:", sessionId);
        const res = await fetch(`/api/verify-session?session_id=${sessionId}`);
        const data = await res.json();

        console.log("Frontend received data payload from API:", data);

        if (res.ok) {
          // Explicitly fallback on the frontend just in case!
          const URL_TO_SET = data.downloadUrl || data.link || data.Link || "";
          console.log("Setting frontend downloadUrl state to:", URL_TO_SET);
          
          setDownloadUrl(URL_TO_SET);
          setTemplateName(data.templateName);
        } else {
          setError(data.error || "Payment verification failed.");
        }
      } catch (err) {
        console.error("Frontend verification fetch crashed:", err);
        setError("An error occurred while verifying your payment.");
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();
  }, [sessionId]);

  if (loading) return <div style={{ padding: "50px", textAlign: "center" }}>Verifying your payment...</div>;
  if (error) return <div style={{ padding: "50px", textAlign: "center", color: "red" }}>{error}</div>;

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto", padding: "40px", textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", borderRadius: "12px", fontFamily: "sans-serif" }}>
      <FaCheckCircle style={{ color: "#22c55e", fontSize: "60px", marginBottom: "20px" }} />
      <h1 style={{ color: "#1e3a8a", margin: "0 0 10px 0" }}>Thank You for Your Purchase!</h1>
      <p style={{ color: "#64748b", fontSize: "16px", marginBottom: "30px" }}>
        Your payment for <strong>{templateName || "your dashboard"}</strong> was processed successfully.
      </p>
      
      {/* DIRECT ONEDRIVE DOWNLOAD LINK */}
      {downloadUrl ? (
        <a 
          href={downloadUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "10px", 
            backgroundColor: "#2563eb", 
            color: "white", 
            padding: "14px 28px", 
            borderRadius: "8px", 
            textDecoration: "none", 
            fontWeight: "600", 
            fontSize: "16px", 
            boxShadow: "0 4px 6px rgba(37,99,235,0.2)",
            cursor: "pointer"
          }}
        >
          <FaDownload /> Download Your Dashboard
        </a>
      ) : (
        <div style={{ padding: "10px" }}>
          <p style={{ color: "#ef4444", marginBottom: "10px" }}>Preparing secure download link...</p>
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>Check your browser inspect console if this gets stuck.</p>
        </div>
      )}

      <div style={{ marginTop: "30px" }}>
        <Link href="/template" style={{ color: "#64748b", textDecoration: "none", fontSize: "14px" }}>
          ← Back to Templates
        </Link>
      </div>
    </div>
  );
}