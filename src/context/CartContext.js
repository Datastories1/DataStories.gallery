"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const CartContext = createContext();

const getCleanId = (idField) => {
  if (!idField) return "";
  if (typeof idField === "object" && idField?.$oid) {
    return String(idField.$oid);
  }
  return String(idField);
};

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sessionTrackerId, setSessionTrackerId] = useState("");
  const { data: session, status } = useSession();

  // 🔄 Generates a brand-new tracking ID window and purges existing disk lines completely
  const forceNewSessionToken = () => {
    const freshId = "sess_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem("sessionTrackerId", freshId);
    setSessionTrackerId(freshId);
    
    // Hard reset both memory state and disk arrays synchronously
    setCartItems([]);
    localStorage.removeItem("data_stories_cart");
    return freshId;
  };

  // 🛡️ Monitor Authentication Switch Lifecycles
  useEffect(() => {
    if (status === "loading") return;

    const savedUserEmail = localStorage.getItem("trackedUserEmail");
    const currentUserEmail = session?.user?.email || "anonymous";

    if (savedUserEmail !== currentUserEmail) {
      localStorage.setItem("trackedUserEmail", currentUserEmail);
      forceNewSessionToken();
    } else {
      let existingId = localStorage.getItem("sessionTrackerId");
      if (!existingId) {
        existingId = "sess_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        localStorage.setItem("sessionTrackerId", existingId);
      }
      setSessionTrackerId(existingId);
    }
  }, [session, status]);

  // Load existing cart data securely from localStorage on initialization
  useEffect(() => {
    const cachedCart = localStorage.getItem("data_stories_cart");
    if (cachedCart) {
      try {
        setCartItems(JSON.parse(cachedCart));
      } catch (err) {
        console.error("Failed to parse cached cart payload context:", err);
      }
    }
  }, []);

  const saveCartToCache = (updatedItems) => {
    setCartItems(updatedItems);
    localStorage.setItem("data_stories_cart", JSON.stringify(updatedItems));
  };

  const addToCart = (template) => {
    const templateCleanId = getCleanId(template?._id);
    const alreadyInCart = cartItems.some(item => getCleanId(item?._id) === templateCleanId);

    if (alreadyInCart) {
      setIsCartOpen(true);
      return;
    }

    const updated = [...cartItems, template];
    saveCartToCache(updated);
    setIsCartOpen(true);
  };

  const removeFromCart = (templateId) => {
    const incomingCleanId = getCleanId(templateId);
    const updated = cartItems.filter(item => getCleanId(item?._id) !== incomingCleanId);
    saveCartToCache(updated);
  };

  // 🎯 Synchronous clean handler to prevent background thread persistence overlap
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("data_stories_cart");
  };

  const getCartTotal = () => {
    const total = cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
    return total.toFixed(2);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      removeFromCart,
      clearCart,
      getCartTotal,
      sessionTrackerId,
      forceNewSessionToken
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart context hooks must be called exclusively within a valid <CartProvider> wrapper.");
  }
  return context;
}