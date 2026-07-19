"use client";

import { useState, useEffect, Suspense } from "react";
import { FaEye, FaSearch, FaShoppingCart } from "react-icons/fa";
import { LuListFilter } from "react-icons/lu";
import Link from "next/link";
import { useSearchParams } from "next/navigation"; 
import { useCart } from "@/context/CartContext"; 
import "./TemplatesPage.css";

const categories = ["All Templates", "Sales", "Finance", "Banking", "HR", "Marketing", "Operations", "Executive"];
const priceFilters = ["All Prices", "Under 50$", "$50 – $60", "$60+"];
const sortOptions = ["Newest first", "Most Popular", "Price: lower to higher", "Price: higher to lower"];

const marqueeItems = [
  "Unique Designs", "◈", "DAX Included", "◈", "Instant Delivery", "◈", "Ready in Minutes", "◈",
  "Unique Designs", "◈", "DAX Included", "◈", "Instant Delivery", "◈", "Ready in Minutes", "◈"
];

function TemplatesContent() {
  const searchParams = useSearchParams(); 
  const { addToCart } = useCart(); 

  const [allTemplates, setAllTemplates] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All Templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("All Prices");
  const [sortOrder, setSortOrder] = useState("Most Popular");
  const [sessionTrackerId, setSessionTrackerId] = useState("");

  // Establish a single, persistent session identifier for the browser session context
  useEffect(() => {
    if (typeof window !== "undefined") {
      let currentSession = localStorage.getItem("sessionTrackerId");
      if (!currentSession) {
        currentSession = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        localStorage.setItem("sessionTrackerId", currentSession);
      }
      setSessionTrackerId(currentSession);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/templates");
        const data = await res.json();
        if (Array.isArray(data)) {
          setAllTemplates(data);
        } else {
          setAllTemplates([]);
        }
      } catch (err) {
        console.error("Failed to fetch templates:", err);
        setAllTemplates([]);
      } finally {
        // 🚀 FIX: Correctly call the state setter function instead of treating boolean variable as a function
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Updated to pass strict lowercase "viewed" state
  const handleTrackView = async (template) => {
    if (!sessionTrackerId) return;
    try {
      await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template._id,
          templateTitle: template.title || "Untitled Template",
          templatePrice: template.price || 0,
          authorName: template.authorName || "Unassigned Staff",
          sessionTrackerId: sessionTrackerId,
          status: "viewed" 
        })
      });
    } catch (err) {
      console.error("View tracking capture failed:", err);
    }
  };

  // Handler to log when a customer adds an item to their cart directly from the listing
  const handleAddToCartAndTrack = async (template) => {
    addToCart(template);

    if (!sessionTrackerId) return;
    try {
      await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template._id,
          templateTitle: template.title || "Untitled Template",
          templatePrice: template.price || 0,
          authorName: template.authorName || "Unassigned Staff",
          sessionTrackerId: sessionTrackerId,
          status: "added to cart" 
        })
      });
    } catch (err) {
      console.error("Cart addition tracking capture failed:", err);
    }
  };

  useEffect(() => {
    const urlCategory = searchParams.get("category");
    if (urlCategory) {
      const matchedCategory = categories.find(
        (cat) => cat.toLowerCase() === urlCategory.toLowerCase()
      );
      if (matchedCategory) {
        setSelectedCategory(matchedCategory);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [searchParams]);

  const countByCategory = (category) => {
    if (!allTemplates) return 0;
    return allTemplates.filter((t) => category === "All Templates" ? true : t.category === category).length;
  };

  const filteredTemplates = (allTemplates || [])
    .filter((t) => (selectedCategory === "All Templates" ? true : t.category === selectedCategory))
    .filter((t) => t.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((t) => {
      if (selectedPrice === "Under 50$") return t.price < 50;
      if (selectedPrice === "$50 – $60") return t.price >= 50 && t.price <= 60;
      if (selectedPrice === "$60+") return t.price > 60;
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "Price: lower to higher") return a.price - b.price;
      if (sortOrder === "Price: higher to lower") return b.price - a.price;
      return 0;
    });

  return (
    <div className="templates-page">
      <section className="templates-hero">
        <h1>Power BI Template Library</h1>
        <p>Browse our professional Power BI dashboard templates.</p>
      </section>

      <div className="main-content">
        <div className="filters-bar">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="price-buttons">
            {priceFilters.map((p, i) => (
              <button key={i} className={selectedPrice === p ? "active" : ""} onClick={() => setSelectedPrice(p)}>
                {p}
              </button>
            ))}
          </div>
          <select className="sort-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            {sortOptions.map((s, i) => <option key={i} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="templates-grid-container">
          <aside className="category-sidebar">
            <h3>Category</h3>
            <ul>
              {categories.map((cat, i) => (
                <li key={i} className={cat === selectedCategory ? "active" : ""} onClick={() => setSelectedCategory(cat)}>
                  {cat} <span className="category-count">{countByCategory(cat)}</span>
                </li>
              ))}
            </ul>
          </aside>

          <div className="templates-grid">
            {loading ? (
              <p>Loading database templates...</p>
            ) : filteredTemplates.length > 0 ? (
              filteredTemplates.map((t) => (
                <div key={t._id} className="template-card">
                  {t.tag && <div className={`status status-${t.tag.toLowerCase()}`}>{t.tag}</div>}
                  
                  {/* Local path parsing layer with broken fallback image configuration underlay */}
                      {/* 🚀 FIXED: Added an early exit to prevent infinite 404 loops */}
                      <img 
                        src={t.thumbnailImage || t.thumbnailUrl || ""} 
                        alt={t.title || "Power BI Preview"} 
                        onError={(e) => {
                          // If the placeholder hasn't been tried yet, use it. Otherwise, stop to avoid a loop.
                          if (!e.target.src.includes('placeholder.png')) {
                            e.target.onerror = null; // Unbind the handler completely
                            e.target.src = "https://placehold.co/600x400?text=No+Image"; 
                          }
                        }}
                      />
                  
                  <h3>{t.title}</h3>
                  <p>{t.subtitle}</p>
                  <div className="card-footer" style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "stretch" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="price">${t.price}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                      <Link href={`/details/${t._id}`} onClick={() => handleTrackView(t)} style={{ flex: 1 }}>
                        <button className="btn" style={{ width: "100%", padding: "10px 5px", fontSize: "13px" }}>Details</button>
                      </Link>
                      <button 
                        className="btn" 
                        onClick={() => handleAddToCartAndTrack(t)} 
                        style={{ flex: 1, backgroundColor: "#16a34a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px 5px", fontSize: "13px", border: "none" }}
                      >
                        <FaShoppingCart /> +Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-results">No Templates Available.</p>
            )}
          </div>
        </div>

        <div className="marquee">
          <div className="track">
            {marqueeItems.map((item, i) => (
              <span key={i} className="text">{item}</span>
            ))}
            {marqueeItems.map((item, i) => (
              <span key={`dup-${i}`} className="text">{item}</span>
            ))}
          </div>
        </div>
      </div>

      <section className="consultancy-section-mid">
        <div className="consultancy-grid-mid">
          <div className="consultancy-card-mid">
            <div className="card-header-mid">
              <span className="icon-mid">🛠️</span>
              <h3 className="card-title-mid">Custom Dashboards</h3>
            </div>
            <p className="card-text-mid">
              Have a unique business challenge? We design and build end-to-end 
              Power BI solutions, from complex DAX modeling to custom UI/UX 
              that reflects your brand's identity.
            </p>
            <Link href="/contactus" className="btnt-mid">
              Start Your Project
            </Link>
          </div>

          <div className="consultancy-card-mid premium-card-mid">
            <div className="card-header-mid">
              <span className="icon-mid">🚀</span>
              <h3 className="card-title-mid">Know more about Future to BI</h3>
            </div>
            <p className="card-text-mid">
              Take your data strategy to the next level with <strong>Future to BI</strong>. 
              We offer high-level consultancy, corporate training, and 
              strategic roadmap development for growing teams.
            </p>
            <a href="https://futuretobi.com/" target="_blank" rel="noopener noreferrer" className="btn-mid">
              Explore Solutions
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={<div>Loading Page Infrastructure...</div>}>
      <TemplatesContent />
    </Suspense>
  );
}