"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { WORLD_REGIONS } from "../signup/countries";

const stripePromise = loadStripe("pk_live_51Sy7Nf1FxRpVn2WX5fUqZzz6EKApIFzKNMFR9E9wrBVRMr1p0p1BS7Ehrg3qc7LaHcZgdGrQUscJPU0HLcrtRsrJ00Pca1h1wg");

const EyeOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "18px", height: "18px" }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "18px", height: "18px" }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 1-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "14px", height: "14px", color: "#64748b" }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const inputStyle = { width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", marginTop: "6px" };
const labelStyle = { fontSize: "14px", fontWeight: "600", color: "#334155" };

const CountryFlagImage = ({ shortCode }) => {
  if (!shortCode) return <span style={{ fontSize: "16px" }}>🏳️</span>;
  const lowerCode = shortCode.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/w40/${lowerCode}.png`}
      srcSet={`https://flagcdn.com/w80/${lowerCode}.png 2x`}
      width="20"
      height="14"
      alt=""
      style={{ objectFit: "cover", borderRadius: "2px", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
    />
  );
};

function CheckoutFormDetails({ cartItems, cartTotal }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { data: session } = useSession();
  const { clearCart } = useCart();
  
  const [processing, setProcessing] = useState(false);
  const [accountConflict, setAccountConflict] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [formData, setFormData] = useState({ userName: "", email: "", password: "", confirmPassword: "", organizationName: "" });
  const [rawPhoneNumber, setRawPhoneNumber] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const countryRef = useRef(null);

  useEffect(() => {
    if (session?.user?.email) {
      setFormData((prev) => ({
        ...prev,
        email: session.user.email || "",
        userName: session.user.name || "Logged-in Workspace User",
        organizationName: session.user.organizationName || ""
      }));
    }
  }, [session]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (countryRef.current && !countryRef.current.contains(event.target)) {
        setIsCountryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeRegion = WORLD_REGIONS[selectedIdx] || { name: "Jordan", code: "+962", id: "jo", short: "JO" };
  const shortRegionCode = activeRegion.short || activeRegion.id || "JO";

  const passwordRules = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[@$!%*#?&]/.test(formData.password),
  };
  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const filteredCountries = WORLD_REGIONS.map((item, idx) => ({ ...item, globalIndex: idx })).filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
    c.code.includes(countrySearch)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setValidationError("Stripe library is still initializing. Please wait a moment.");
      return;
    }

    setValidationError("");
    setAccountConflict(false);

    if (!session) {
      if (!isPasswordValid) {
        setValidationError("Please complete all the secure password criteria options.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setValidationError("Mismatch observed between password check entries.");
        return;
      }
    }

    setProcessing(true);
    
    const secureEmail = session ? String(session.user.email) : String(formData.email);
    const secureName = session ? String(session.user.name) : String(formData.userName);
    const combinedPhone = session ? "Logged Profile Profile" : `${activeRegion.code}${rawPhoneNumber}`;
    const clearCountry = session ? "Jordan" : activeRegion.name;
    const localSessionId = localStorage.getItem("sessionTrackerId") || "session_fallback_id";
    const targetTemplateId = typeof cartItems[0]._id === 'object' && cartItems[0]._id?.$oid ? cartItems[0]._id.$oid : String(cartItems[0]._id);

    const trackedItemsPayload = cartItems.map(item => {
      const cleanId = typeof item._id === 'object' && item._id?.$oid ? item._id.$oid : String(item._id);
      return { _id: cleanId, templateId: cleanId, title: item.title, price: item.price };
    });

    const returnUrl = `${window.location.origin}/success?customerEmail=${encodeURIComponent(secureEmail)}&templateId=${targetTemplateId}&convertSession=${localSessionId}`;

    // 1. Submit Elements validation first
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setValidationError(submitError.message);
      setProcessing(false);
      return;
    }

    // 2. Confirm payment using Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: {
          billing_details: {
            name: secureName,
            email: secureEmail
          }
        }
      },
    });

    if (error) {
      setValidationError(error.message || "An error occurred with your card processing transaction layer.");
      setProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      try {
        try {
          await fetch("/api/tracking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionTrackerId: localSessionId, status: "sold", items: trackedItemsPayload })
          });
        } catch (tErr) { console.error(tErr); }

        const orderResponse = await fetch("/api/checkout/process-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isLoggedIn: !!session,
            userName: secureName,
            email: secureEmail,
            password: formData.password,
            phoneNumber: combinedPhone,
            country: clearCountry,
            organizationName: formData.organizationName,
            cartItems: trackedItemsPayload,
            paymentIntentId: paymentIntent.id
          })
        });

        const orderResult = await orderResponse.json();

        if (!orderResponse.ok) {
          if (orderResult.error === "CONFLICT_ACCOUNT_EXISTS") {
            setAccountConflict(true);
            setProcessing(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
          setValidationError(orderResult.message || "An error occurred while compiling your subscription.");
          setProcessing(false);
          return;
        }

        if (!session) {
          await signIn("credentials", {
            redirect: false,
            email: secureEmail.toLowerCase(),
            password: formData.password,
          });
        }

        clearCart();
        localStorage.removeItem("checkout_backup_cart");
        router.push(returnUrl);

      } catch (pipelineError) {
        console.error("Post processing order pipeline error:", pipelineError);
        clearCart();
        router.push(returnUrl);
      }
    } else {
      window.location.href = returnUrl;
    }
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "40px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ marginBottom: "25px" }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", padding: 0, color: "#1e3a8a", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
          ← Continue Shopping & Add More Templates
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "40px" }}>
        <div>
          {accountConflict && (
            <div style={{ backgroundColor: "#fef2f2", border: "2px solid #ef4444", borderRadius: "8px", padding: "16px 20px", marginBottom: "25px", fontSize: "15px", color: "#991b1b", fontWeight: "600" }}>
              ⚠️ Email Already Registered! Please{" "}
              <button type="button" onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`)} style={{ background: "none", border: "none", color: "#b91c1c", textDecoration: "underline", fontWeight: "700", cursor: "pointer", padding: 0 }}>
                click here to login
              </button> before continuing.
            </div>
          )}

          {validationError && (
            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #ef4444", borderRadius: "8px", padding: "12px 16px", marginBottom: "25px", fontSize: "14px", color: "#b91c1c", fontWeight: "500" }}>
              ❌ {validationError}
            </div>
          )}

          {session && (
            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "14px 20px", marginBottom: "25px", fontSize: "14px", color: "#166534", fontWeight: "500" }}>
              ✅ Verified Workspace Session: Logged in as <strong>{session.user?.email}</strong>
            </div>
          )}

          <div style={{ backgroundColor: "#ffffff", padding: "35px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {!session && (
                <>
                  <h2 style={{ color: "#1e3a8a", margin: "0 0 5px 0", fontSize: "24px", fontWeight: "700" }}>Account Registration</h2>
                  <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 30px 0" }}>Create your profile to instantly receive the purchased template document access assets.</p>
                  
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input required type="text" style={inputStyle} placeholder="Your Full Name" value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value})} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input required type="email" style={inputStyle} placeholder="Your Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>

                  <div>
                    <label style={labelStyle}>Create Security Password</label>
                    <div style={{ position: "relative" }}>
                      <input required type={showPassword ? "text" : "password"} style={{ ...inputStyle, paddingRight: "45px" }} placeholder="••••••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                        {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Confirm Password</label>
                    <input required type="password" style={inputStyle} placeholder="Confirm security check password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "15px", position: "relative" }} ref={countryRef}>
                    <div>
                      <label style={labelStyle}>Phone Number</label>
                      <div style={{ display: "flex", marginTop: "6px", border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "visible", alignItems: "center", boxSizing: "border-box" }}>
                        
                        <div 
                          onClick={() => setIsCountryOpen(!isCountryOpen)}
                          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 12px", height: "45px", background: "#f8fafc", borderRight: "1px solid #cbd5e1", cursor: "pointer", userSelect: "none", borderTopLeftRadius: "7px", borderBottomLeftRadius: "7px" }}
                        >
                          <CountryFlagImage shortCode={shortRegionCode} />
                          <span style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>{activeRegion.code}</span>
                          <ChevronDownIcon />
                        </div>

                        <input 
                          required 
                          type="tel" 
                          style={{ flex: 1, border: "none", padding: "12px", fontSize: "14px", outline: "none", background: "transparent", width: "100%" }} 
                          placeholder="79 XXX XXXX" 
                          value={rawPhoneNumber} 
                          onChange={e => setRawPhoneNumber(e.target.value.replace(/\D/g, ""))} 
                        />
                      </div>

                      {isCountryOpen && (
                        <div style={{ position: "absolute", top: "72px", left: 0, width: "320px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", zIndex: 999, padding: "8px", boxSizing: "border-box" }}>
                          <input 
                            type="text" 
                            placeholder="Search country name or code..." 
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "13px", outline: "none", boxSizing: "border-box", marginBottom: "6px" }}
                          />
                          <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                            {filteredCountries.length > 0 ? (
                              filteredCountries.map((country) => {
                                const currentShort = country.short || country.id || "JO";
                                return (
                                  <div 
                                    key={country.globalIndex}
                                    onClick={() => {
                                      setSelectedIdx(country.globalIndex);
                                      setIsCountryOpen(false);
                                      setCountrySearch("");
                                    }}
                                    style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 10px", cursor: "pointer", borderRadius: "6px", fontSize: "13px", color: "#334155", textAlign: "left" }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                  >
                                    <CountryFlagImage shortCode={currentShort} />
                                    <span style={{ fontWeight: "600", width: "45px" }}>{country.code}</span>
                                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{country.name}</span>
                                  </div>
                                );
                              })
                            ) : (
                              <div style={{ padding: "10px", fontSize: "12px", color: "#64748b", textAlign: "center" }}>No matches found</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={labelStyle}>Country</label>
                      <input readOnly style={{ ...inputStyle, background: "#f8fafc", color: "#475569", fontWeight: "500" }} value={activeRegion.name} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Organization Name (Optional)</label>
                    <input type="text" style={inputStyle} placeholder="Future To BI" value={formData.organizationName} onChange={e => setFormData({...formData, organizationName: e.target.value})} />
                  </div>
                </>
              )}

              <h3 style={{ color: "#1e3a8a", margin: "20px 0 5px 0", fontSize: "19px", borderTop: session ? "none" : "1px solid #e2e8f0", paddingTop: session ? "0" : "25px", fontWeight: "700" }}>Payment Details</h3>
              
              {/* Payment Element Container Box */}
              <div style={{ padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#fff" }}>
                <PaymentElement options={{ layout: "tabs" }} />
              </div>

              <button type="submit" disabled={processing || !stripe} style={{ marginTop: "30px", width: "100%", backgroundColor: "#16a34a", color: "#fff", padding: "15px", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "16px", cursor: "pointer" }}>
                {processing ? "Authorizing Secure Payment..." : `Confirm Payment $${cartTotal}`}
              </button>
            </form>
          </div>
        </div>

        <div style={{ backgroundColor: "#f8fafc", padding: "30px", borderRadius: "16px", border: "1px solid #e2e8f0", height: "fit-content" }}>
          <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontSize: "18px", fontWeight: "700" }}>Order Review ({cartItems.length})</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {cartItems.map((item, index) => (
              <div key={index} style={{ display: "flex", gap: "15px", alignItems: "center", borderBottom: index !== cartItems.length - 1 ? "1px dashed #e2e8f0" : "none", paddingBottom: index !== cartItems.length - 1 ? "15px" : "0" }}>
                
                <div style={{ width: "75px", height: "50px", borderRadius: "6px", backgroundColor: "#e2e8f0", overflow: "hidden", flexShrink: 0, border: "1px solid #cbd5e1" }}>
                  <img 
                    src={item.thumbnailImage || item.thumbnailUrl || "https://placehold.co/600x400?text=Power+BI"} 
                    alt={item.title || "Template Thumbnail"} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/600x400?text=Power+BI";
                    }}
                  />
                </div>

                <div style={{ flex: 1, display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "600", color: "#1e3a8a" }}>
                  <span style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
                  <span style={{ color: "#0f172a" }}>${item.price}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #e2e8f0", marginTop: "20px", paddingTop: "20px", display: "flex", justifyContent: "space-between", fontWeight: "700", fontSize: "18px" }}>
            <span>Total:</span>
            <span style={{ color: "#16a34a" }}>${cartTotal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading Secure Checkout Gateway Elements...</div>}>
      <CheckoutStreamLoader />
    </Suspense>
  );
}

function CheckoutStreamLoader() {
  const { cartItems, getCartTotal } = useCart();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initIntent() {
      if (cartItems.length === 0) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: cartItems })
        });
        const data = await res.json();
        if (data.clientSecret) setClientSecret(data.clientSecret);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    initIntent();
  }, [cartItems]);

  if (loading) return <div style={{ textAlign: "center", padding: "100px" }}>Building terminal channels...</div>;
  if (cartItems.length === 0) return <div style={{ textAlign: "center", padding: "100px" }}>Your shopping cart is empty.</div>;
  if (!clientSecret) return <div style={{ textAlign: "center", padding: "100px", color: "#ef4444" }}>Could not connect to Stripe gateway layout.</div>;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutFormDetails cartItems={cartItems} cartTotal={getCartTotal()} />
    </Elements>
  );
}