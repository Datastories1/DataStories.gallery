"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SessionProvider, useSession, signOut } from "next-auth/react"; 
import { CartProvider, useCart } from "@/context/CartContext"; // 🛒 Added Cart state tracking
import CartSidebar from "@/components/CartSidebar"; // 🛒 Added sidebar drawers
import { FaShoppingCart } from "react-icons/fa"; // Imported interactive shopping cart icon
import "./RootLayout.css";

function LayoutContent({ children }) {
  const pathname = usePathname();
  const { data: session, status } = useSession(); 
  const { cartItems, setIsCartOpen } = useCart(); // 🛒 Consume cart attributes dynamically

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const showNavbar = pathname !== '/login' && pathname !== '/signup' && pathname !== '/forgot-password' && pathname !== '/reset-password';

  return (
    <>
      {showNavbar && (
        <nav className="navbar">
          <div className="logo">
            <Image
              src="/logo.png"
              alt="DataStories Logo"
              width={40}
              height={40}
              className="logo-img"
            />
            Future to BI | datastories.gallery
          </div>

          <div className="auth-links" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {/* 🛒 FLOATING SIDEBAR TOGGLE TRIGGER */}
            <button 
              onClick={() => setIsCartOpen(true)}
              style={{
                position: "relative",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#1e3a8a",
                fontSize: "22px",
                display: "flex",
                alignItems: "center",
                padding: "8px"
              }}
              title="Open Shopping Cart"
            >
              <FaShoppingCart />
              {cartItems.length > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  backgroundColor: "#16a34a",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: "700",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.15)"
                }}>
                  {cartItems.length}
                </span>
              )}
            </button>

            {status === "loading" ? (
              <span style={{ color: "#64748b", fontSize: "14px" }}>Verifying auth...</span>
            ) : session ? (
              <button 
                onClick={() => signOut({ callbackUrl: "/" })} 
                className="btn"
                style={{ background: "#ef4444", color: "white", border: "none", cursor: "pointer" }}
              >
                Logout
              </button>
            ) : (
              <>
                <Link href="/login" className="btn">Login</Link>
                <Link href="/signup" className="btn">Sign Up</Link>
              </>
            )}
          </div> 
        </nav>
      )}

      <main className="main-content">
        {children}
      </main>

      {showNavbar && (
        <footer className="site-footer">
          <div className="footer-container">
            <div className="footer-col brand-col">
              <div className="logo-wrapper">
                <img src="/logo.png" alt="Future To BI Logo" className="brand-logo-img" />
                <div className="brand-text">
                  <span className="brand-name">DataStories</span>
                  <span className="brand-tagline">GALLERY</span>
                </div>
              </div>
              <p className="brand-description">
                Premium Power BI dashboard templates by <strong>Future To BI</strong>. 
                Transform your data into compelling stories.
              </p>
              <div className="social-links">
                <a href="mailto:Motasem@FutureToBI.com" className="social-icon">
                  <img src="https://cdn-icons-png.flaticon.com/512/732/732200.png" alt="Mail" />
                </a>
                <a href="https://www.linkedin.com/company/future-to-bi/" className="social-icon">
                  <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" />
                </a>
                <a href="https://www.instagram.com/futuretobi1/" className="social-icon">
                  <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" />
                </a>
              </div>
            </div>

            <div className="footer-col">
              <h3 className="col-title">Templates</h3>
              <ul className="footer-links">
                <li><Link href="/?category=Sales">Sales Analytics</Link></li>
                <li><Link href="/?category=HR">HR Analytics</Link></li>
                <li><Link href="/?category=Marketing">Marketing Analytics</Link></li>
                <li><Link href="/?category=Finance">Finance Dashboard</Link></li>
                <li><Link href="/?category=Banking">Banking Dashboard</Link></li>
                <li><Link href="/?category=Operations">Operations Dashboard</Link></li>
                <li><Link href="/?category=Executive">Executive Dashboard</Link></li>
              </ul>
            </div>

            <div className="footer-col legal-col">
              <h3 className="col-title">Legal</h3>
              <ul className="footer-links">
                <li><button onClick={() => setShowPrivacyModal(true)} style={{ background: "none", border: "none", padding: 0, font: "inherit", color: "inherit", cursor: "pointer", textAlign: "left" }}>Privacy Policy</button></li>
                <li><button onClick={() => setShowTermsModal(true)} style={{ background: "none", border: "none", padding: 0, font: "inherit", color: "inherit", cursor: "pointer", textAlign: "left" }}>Terms & Conditions</button></li>
              </ul>
              <div className="delivery-notice">
                <p><strong>Instant delivery.</strong> Templates are delivered automatically via email after purchase.</p>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="bottom-inner">
              <p className="copyright-text">
                © 2026 Future To BI. All rights reserved. DataStories Gallery is a product of Future To BI.
              </p>
              <div className="bottom-meta">
                <button onClick={() => setShowPrivacyModal(true)} style={{ background: "none", border: "none", font: "inherit", color: "inherit", cursor: "pointer", marginRight: "10px" }}>Privacy</button>
                <button onClick={() => setShowTermsModal(true)} style={{ background: "none", border: "none", font: "inherit", color: "inherit", cursor: "pointer", marginRight: "15px" }}>Terms</button>
                <span className="stripe-tag">Powered by <strong>Stripe</strong></span>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* ==================== Privacy Policy Modal ==================== */}
      {showPrivacyModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999 }}>
          <div style={{ backgroundColor: "#ffffff", padding: "40px 30px", borderRadius: "16px", width: "90%", maxWidth: "550px", position: "relative", fontFamily: "sans-serif", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <button onClick={() => setShowPrivacyModal(false)} style={{ position: "absolute", top: "15px", right: "20px", background: "none", border: "none", fontSize: "24px", color: "#94a3b8", cursor: "pointer" }}>&times;</button>
            <h3 style={{ color: "#1e3a8a", fontSize: "22px", margin: "0 0 15px 0" }}>Privacy Policy</h3>
            <div style={{ color: "#334155", fontSize: "14px", lineHeight: "1.6", maxHeight: "300px", overflowY: "auto", paddingRight: "10px", textAlign: "left" }}>
              <p>Your privacy is highly important to us. At Future To BI, it is our policy to respect your privacy regarding any details we collect across our application gallery storefront.</p>
              <p style={{ marginTop: "12px" }}>We only ask for profile identifiers (Name, Email, Phone Number) when processing template distribution requirements or running safe account creation routines.</p>
            </div>
            <button onClick={() => setShowPrivacyModal(false)} style={{ marginTop: "25px", width: "100%", backgroundColor: "#1e3a8a", color: "#ffffff", padding: "12px", borderRadius: "8px", fontWeight: "600", border: "none", cursor: "pointer" }}>Close Privacy Statement</button>
          </div>
        </div>
      )}

      {/* ==================== Terms & Conditions Modal ==================== */}
      {showTermsModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999 }}>
          <div style={{ backgroundColor: "#ffffff", padding: "40px 30px", borderRadius: "16px", width: "90%", maxWidth: "550px", position: "relative", fontFamily: "sans-serif", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <button onClick={() => setShowTermsModal(false)} style={{ position: "absolute", top: "15px", right: "20px", background: "none", border: "none", fontSize: "24px", color: "#94a3b8", cursor: "pointer" }}>&times;</button>
            <h3 style={{ color: "#1e3a8a", fontSize: "22px", margin: "0 0 15px 0" }}>Terms & Conditions</h3>
            <div style={{ color: "#334155", fontSize: "14px", lineHeight: "1.6", maxHeight: "300px", overflowY: "auto", paddingRight: "10px", textAlign: "left" }}>
              <p>By accessing DataStories Gallery, you agree to comply with our platform terms, active licensing structures, and download conditions.</p>
            </div>
            <button onClick={() => setShowTermsModal(false)} style={{ marginTop: "25px", width: "100%", backgroundColor: "#1e3a8a", color: "#ffffff", padding: "12px", borderRadius: "8px", fontWeight: "600", border: "none", cursor: "pointer" }}>Accept & Close Terms</button>
          </div>
        </div>
      )}
    </>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="dm-sans syne">
        <SessionProvider>
          <CartProvider>
            <LayoutContent>{children}</LayoutContent>
            {/* 🛒 Global overlay component rendering across views layout */}
            <CartSidebar />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}