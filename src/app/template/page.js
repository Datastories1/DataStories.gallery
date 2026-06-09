"use client";

import { useState, useEffect } from "react";
import { FaEye, FaSearch } from "react-icons/fa";
import { LuListFilter } from "react-icons/lu";
import Link from "next/link";
import { useSearchParams } from "next/navigation"; // Added Next.js search parameters hook
import "./TemplatesPage.css";

const categories = ["All Templates", "Sales", "Finance", "Banking", "HR", "Marketing", "Operations", "Executive"];
const priceFilters = ["All Prices", "Under 50$", "$50 – $60", "$60+"];
const sortOptions = ["Newest first", "Most Popular", "Price: lower to higher", "Price: higher to lower"];

export default function TemplatesPage() {
  const searchParams = useSearchParams(); // Access the current URL search parameters

  const [allTemplates, setAllTemplates] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All Templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("All Prices");
  const [sortOrder, setSortOrder] = useState("Most Popular");

  // 📡 DATABASE FETCHING EFFECT
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
        loading && setLoading(false);
      }
    }
    fetchData();
  }, []);

  // 🎯 URL PARAMETER SYNC EFFECT: Watches for incoming footer query parameters
  useEffect(() => {
    const urlCategory = searchParams.get("category");
    
    if (urlCategory) {
      // Find case-insensitive match within your categories configuration array
      const matchedCategory = categories.find(
        (cat) => cat.toLowerCase() === urlCategory.toLowerCase()
      );
      
      if (matchedCategory) {
        setSelectedCategory(matchedCategory);
        
        // 🚀 SCROLL BACK TO UP: Smoothly carries viewport focus back to the template collection area
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [searchParams]);

  const countByCategory = (category) => {
    if (!Array.isArray(allTemplates)) return 0;
    if (category === "All Templates") return allTemplates.length;
    return allTemplates.filter((t) => t.category === category).length;
  };

  // FILTER & SORT LOGIC
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
                  <img src={t.thumbnailImage} alt={t.title} />
                  <h3>{t.title}</h3>
                  <p>{t.subtitle}</p>
                  <div className="card-footer">
                    <span className="price">${t.price}</span>
                    <Link href={`/details/${t._id}`}>
                      <button className="btn">View Details</button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-results">No Templates Available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}