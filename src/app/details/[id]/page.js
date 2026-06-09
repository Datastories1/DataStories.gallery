"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation"; 
import { useSession } from "next-auth/react"; 
import { FaChevronLeft, FaChevronRight, FaShoppingCart, FaArrowLeft } from "react-icons/fa";
import styles from "./Details.module.css";

export default function ViewDetailPage({ params }) {
  const { id } = params; 
  const router = useRouter();
  const { data: session } = useSession(); 

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  // 🎯 State to control the visibility of the custom Auth Pop-up Modal
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    async function getTemplate() {
      try {
        const res = await fetch(`/api/templates`);
        const allData = await res.json();
        const found = allData.find(t => t._id === id);
        if (found) setTemplate(found);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        loading && setLoading(false);
      }
    }
    getTemplate();
  }, [id]);

  const handleStripeCheckout = async () => {
    // 🛑 If logged out, trigger our custom pop-up modal instead of an alert window
    if (!session) {
      setShowAuthModal(true);
      return;
    }

    try {
      setCheckoutLoading(true);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: id,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Could not launch Stripe Checkout Session.");
        setCheckoutLoading(false);
      }
    } catch (err) {
      console.error("Payment initialization error:", err);
      alert("Something went wrong with the connection. Please try again.");
      setCheckoutLoading(false);
    }
  };

  if (loading) return <div className={styles.container}>Loading Dashboard...</div>;
  if (!template) return notFound();

  // --- DYNAMIC IMAGE COLLECTION ---
  const images = [];
  if (template.details) {
    Object.keys(template.details)
      .filter(key => key.startsWith("galleryImages"))
      .sort((a, b) => {
        const numA = parseInt(a.replace("galleryImages", "")) || 0;
        const numB = parseInt(b.replace("galleryImages", "")) || 0;
        return numA - numB;
      })
      .forEach(key => {
        const url = template.details[key];
        if (url && typeof url === "string") {
          const cleanUrl = url.replace(/\s/g, '');
          if (cleanUrl.startsWith('http') && !cleanUrl.includes('...')) {
            images.push(cleanUrl);
          }
        }
      });
  }

  const handleNext = () => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  // Capture current URL destination path context to loop back post-auth
  const currentUrlPath = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className={styles.container}>
      {/* HEADER SECTION */}
      <header className={styles.header}>
        <h1 className={styles.title}>{template.title}</h1>
        <p className={styles.subtitle}>{template.subtitle}</p>
      </header>

      {/* CAROUSEL SECTION */}
      <div className={styles.galleryWrapper}>
        {images.length > 0 ? (
          <>
            <img 
              src={images[currentIndex]} 
              alt={`Preview ${currentIndex + 1}`} 
              className={styles.mainImage} 
            />
            
            {images.length > 1 && (
              <>
                <button onClick={handlePrev} className={`${styles.navBtn} ${styles.prev}`}>
                  <FaChevronLeft />
                </button>
                <button onClick={handleNext} className={`${styles.navBtn} ${styles.next}`}>
                  <FaChevronRight />
                </button>
                <div className={styles.imageCounter}>
                   {currentIndex + 1} / {images.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className={styles.noImagePlaceholder}>
            No gallery images found. Check MongoDB fields.
          </div>
        )}
      </div>

      {/* CONTENT GRID */}
      <div className={styles.contentGrid}>
        <div className={styles.descriptionBox}>
          <h3>About this Dashboard</h3>
          <p className={styles.descriptionText}>
            {template.details?.fullDescription}
          </p>
          
          <h3 style={{ marginTop: '30px' }}>How to Use</h3>
          <p className={styles.descriptionText}>{template.details?.howToUse}</p>
        </div>
        <aside className={styles.sideColumn}>
          <div className={styles.specCard}>
            <div className={styles.priceTag}>${template.price}</div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Visuals:</span>
              <span className={styles.specValue}>{template.details?.visualsCount}</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Pages:</span>
              <span className={styles.specValue}>{template.details?.pagesCount}</span>
            </div>
            
            <button 
              className={styles.buyBtn} 
              onClick={handleStripeCheckout}
              disabled={checkoutLoading}
            >
              <FaShoppingCart /> {checkoutLoading ? "Processing Payment..." : "Buy Now"}
            </button>
          </div>

          <div className={styles.navCard}>
            <Link href="/template">
              <button className={styles.secondaryBtn}>
                <FaArrowLeft /> Explore More Templates
              </button>
            </Link>
          </div>
        </aside>
      </div>

      {/* ==================== CUSTOM AUTH POP-UP MODAL ==================== */}
      {showAuthModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            padding: "40px 30px",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "420px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            position: "relative",
            textAlign: "center",
            fontFamily: "sans-serif"
          }}>
            {/* Close Cross Button Top Right Corner */}
            <button 
              onClick={() => setShowAuthModal(false)}
              style={{
                position: "absolute",
                top: "15px",
                right: "20px",
                background: "none",
                border: "none",
                fontSize: "24px",
                color: "#94a3b8",
                cursor: "pointer",
                lineHeight: "1"
              }}
              aria-label="Close modal"
            >
              &times;
            </button>

            <h3 style={{ color: "#1e3a8a", fontSize: "22px", margin: "10px 0 15px 0" }}>
              Authentication Required
            </h3>
            
            <p style={{ color: "#64748b", fontSize: "15px", lineHeight: "1.5", marginBottom: "30px" }}>
              Please log in to your account to complete your purchase. If you don't have an account yet, sign up to get started!
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Login CTA Route */}
              <button 
                onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent(currentUrlPath)}`)}
                style={{
                  backgroundColor: "#1e3a8a",
                  color: "#ffffff",
                  padding: "12px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "15px"
                }}
              >
                Log In
              </button>

              {/* Sign Up CTA Route */}
              <button 
                onClick={() => router.push(`/signup?callbackUrl=${encodeURIComponent(currentUrlPath)}`)}
                style={{
                  backgroundColor: "#f1f5f9",
                  color: "#334155",
                  padding: "12px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  border: "1px solid #cbd5e1",
                  cursor: "pointer",
                  fontSize: "15px"
                }}
              >
                Create an Account (Sign Up)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}