"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation"; 
import { FaChevronLeft, FaChevronRight, FaShoppingCart, FaArrowLeft } from "react-icons/fa";
import { useCart } from "@/context/CartContext"; 
import styles from "./Details.module.css";

export default function ViewDetailPage({ params }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams; 
  const { addToCart, sessionTrackerId } = useCart(); // 🛒 Using central synchronized tracker

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    async function getTemplateAndTrack() {
      if (!sessionTrackerId) return; // Wait until context resolves user log status

      try {
        const res = await fetch(`/api/templates`);
        const allData = await res.json();
        const found = allData.find(t => t._id === id);
        
        if (found) {
          setTemplate(found);
          
          // Fire explicit "viewed" status footprint mapped to current active account token
          await fetch("/api/tracking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              templateId: found._id,
              templateTitle: found.title || "Untitled Template",
              templatePrice: found.price || 0,
              authorName: found.authorName || "Future To BI Solutions",
              sessionTrackerId: sessionTrackerId,
              status: "viewed"
            })
          });
        }
      } catch (err) {
        console.error("Pipeline template entry error:", err);
      } finally {
        setLoading(false);
      }
    }
    getTemplateAndTrack();
  }, [id, sessionTrackerId]);

  const handleAddToCartClick = async () => {
    if (!template || !sessionTrackerId) return;
    
    setCheckoutLoading(true);

    try {
      await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template._id,
          templateTitle: template.title || "Untitled Template",
          templatePrice: template.price || 0,
          authorName: template.authorName || "Future To BI Solutions",
          sessionTrackerId: sessionTrackerId,
          status: "added to cart" 
        })
      });
    } catch (err) {
      console.error("Cart data logging bypass:", err);
    }

    addToCart(template); 
    setCheckoutLoading(false);
  };

  if (loading) return <div className={styles.container}>Loading Dashboard...</div>;
  if (!template) return notFound();

  // Images mapping sequence
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
          const cleanUrl = url.trim();
          if ((cleanUrl.startsWith('/') || cleanUrl.startsWith('http')) && !cleanUrl.includes('...')) {
            images.push(cleanUrl);
          }
        }
      });
  }

  const handleNext = () => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{template.title}</h1>
        <p className={styles.subtitle}>{template.subtitle}</p>
      </header>

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
              onClick={handleAddToCartClick}
              disabled={checkoutLoading}
            >
              <FaShoppingCart /> {checkoutLoading ? "Processing..." : "Add to Cart"}
            </button>
          </div>

          <div className={styles.navCard}>
            <Link href="/">
              <button className={styles.secondaryBtn}>
                <FaArrowLeft /> Explore More Templates
              </button>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}