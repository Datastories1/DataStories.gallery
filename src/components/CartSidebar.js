"use client";

import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

export default function CartSidebar() {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, getCartTotal } = useCart();
  const router = useRouter();

  if (!isCartOpen) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 9999, display: "flex", justifyContent: "flex-end" }}>
      {/* Background Dim Backdrop Layer */}
      <div 
        onClick={() => setIsCartOpen(false)}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", transition: "all 0.3s" }} 
      />

      {/* Floating Right Sidebar Drawer */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: "420px",
        height: "100%",
        backgroundColor: "#ffffff",
        boxShadow: "-10px 0 25px -5px rgba(0, 0, 0, 0.1), -4px 0 10px -5px rgba(0, 0, 0, 0.05)",
        display: "flex",
        flexDirection: "column",
        padding: "30px",
        boxSizing: "border-box",
        fontFamily: "sans-serif"
      }}>
        {/* Header Drawer Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", borderBottom: "1px solid #e2e8f0", paddingBottom: "15px" }}>
          <div>
            <h3 style={{ margin: 0, color: "#1e3a8a", fontSize: "20px", fontWeight: "700" }}>Your Cart</h3>
            <span style={{ fontSize: "13px", color: "#64748b" }}>{cartItems.length} {cartItems.length === 1 ? "item" : "items"} selected</span>
          </div>
          <button 
            onClick={() => setIsCartOpen(false)}
            style={{ background: "none", border: "none", fontSize: "24px", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
          >
            ✕
          </button>
        </div>

        {/* Dynamic Item Queue List Grid Container */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", margin: "0 -10px", padding: "0 10px" }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
              <div style={{ fontSize: "40px", marginBottom: "15px" }}>🛒</div>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: "500" }}>Your Power BI Templates cart is empty</p>
              <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#94a3b8" }}>Explore our dashboards to add metric tools.</p>
            </div>
          ) : (
            cartItems.map((item) => {
              const cleanKey = typeof item._id === 'object' && item._id?.$oid ? item._id.$oid : String(item._id);
              
              return (
                <div key={cleanKey} style={{ display: "flex", gap: "12px", background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", alignItems: "center" }}>
                  {item.details?.galleryImages1 && (
                    <img src={item.details.galleryImages1} alt="preview" style={{ width: "70px", height: "50px", objectFit: "cover", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</h4>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#16a34a" }}>${item.price}</span>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item._id)}
                    style={{ background: "none", border: "none", color: "#ef4444", fontSize: "13px", cursor: "pointer", fontWeight: "500", padding: "4px" }}
                  >
                    Remove
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sticky Drawer Pricing Totals Footer Action Panel */}
        {cartItems.length > 0 && (
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px", marginTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "15px", fontWeight: "600", color: "#475569" }}>Subtotal Amount:</span>
              <span style={{ fontSize: "22px", fontWeight: "700", color: "#16a34a" }}>${getCartTotal()}</span>
            </div>
            
            <button 
              onClick={() => {
                setIsCartOpen(false);
                router.push("/checkout"); 
              }}
              style={{ width: "100%", backgroundColor: "#16a34a", color: "#ffffff", padding: "15px", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "16px", cursor: "pointer" }}
            >
              Proceed to Checkout Securely
            </button>
          </div>
        )}
      </div>
    </div>
  );
}