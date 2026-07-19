"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { WORLD_REGIONS } from "./countries"; // Ensure this matches your path to the countries list file

// 👁️ Professional SVG Vector Icons for the Input Fields
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

export default function SignupPage() {
  const router = useRouter();
  
  const [processing, setProcessing] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [accountConflict, setAccountConflict] = useState(false);

  // Form Fields Setup
  const [formData, setFormData] = useState({
    fullName: "",
    emailAddress: "",
    password: "",
    confirmPassword: "",
    organizationNameOptional: ""
  });

  const [rawPhoneNumber, setRawPhoneNumber] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0); // Default points to Jordan
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  // Input Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const countryRef = useRef(null);

  // Close dropdown when clicking anywhere else
  useEffect(() => {
    function handleClickOutside(event) {
      if (countryRef.current && !countryRef.current.contains(event.target)) {
        setIsCountryOpen(false);
        setCountrySearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeRegion = WORLD_REGIONS[selectedIdx] || { name: "Jordan", code: "+962", id: "jo", short: "JOR" };

  const filteredCountryRegions = WORLD_REGIONS.filter(r => 
    r.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    r.short.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Password Security Strength Checks
  const passwordRules = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[@$!%*#?&]/.test(formData.password),
  };
  const isPasswordValid = Object.values(passwordRules).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");
    setAccountConflict(false);

    if (!isPasswordValid) {
      setValidationError("Please satisfy all password complexity rules before registering.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setValidationError("Passwords do not match. Please verify both entries.");
      return;
    }
    if (rawPhoneNumber.length < 8) {
      setValidationError("The phone number entered is too short (Must be 8-10 digits).");
      return;
    }

    setProcessing(true);
    const combinedPhone = `${activeRegion.code}${rawPhoneNumber}`;

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          emailAddress: formData.emailAddress,
          password: formData.password,
          phoneNumber: combinedPhone,
          country: activeRegion.name,
          organizationNameOptional: formData.organizationNameOptional
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422) {
          setAccountConflict(true);
        } else {
          setValidationError(data.message || "An unexpected error occurred.");
        }
        setProcessing(false);
        return;
      }

      // Automatically sign the user in following a successful registration
      const loginResult = await signIn("credentials", {
        redirect: false,
        email: formData.emailAddress.toLowerCase(),
        password: formData.password,
      });

      if (loginResult?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard"); // Redirect to your account homepage
      }
    } catch (err) {
      console.error("Signup process crash:", err);
      setValidationError("Failed to complete signup registration. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: "520px", margin: "60px auto", padding: "20px", fontFamily: "sans-serif" }}>
      
      {accountConflict && (
        <div style={{ backgroundColor: "#fef2f2", border: "2px solid #ef4444", borderRadius: "8px", padding: "16px 20px", marginBottom: "25px", fontSize: "15px", color: "#991b1b", fontWeight: "600" }}>
          ⚠️ Account Already Exists! The email <strong>{formData.emailAddress}</strong> is already on file. Please{" "}
          <button 
            type="button"
            onClick={() => router.push(`/login`)}
            style={{ background: "none", border: "none", color: "#b91c1c", textDecoration: "underline", fontWeight: "700", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
          >
            click here to login
          </button>.
        </div>
      )}

      {validationError && (
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #ef4444", borderRadius: "8px", padding: "12px 16px", marginBottom: "25px", fontSize: "14px", color: "#b91c1c", fontWeight: "500" }}>
          ❌ {validationError}
        </div>
      )}

      <div style={{ backgroundColor: "#ffffff", padding: "40px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <h2 style={{ color: "#1e3a8a", margin: "0 0 6px 0", fontSize: "26px", fontWeight: "700" }}>Create Your Account</h2>
        <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 32px 0" }}>Get started with Datastories.gallery</p>

        <form onSubmit={handleSignupSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          
          <div>
            <label style={labelStyle}>Full Name</label>
            <input required type="text" style={inputStyle} placeholder="Shahbano Atif" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
          </div>

          <div>
            <label style={labelStyle}>Email Address</label>
            <input required type="email" style={inputStyle} placeholder="Sh.Atif@FutureToBI.com" value={formData.emailAddress} onChange={e => setFormData({...formData, emailAddress: e.target.value})} />
          </div>

          {/* Create Password Row with Professional Vector Eye Toggles */}
          <div>
            <label style={labelStyle}>Create Security Password</label>
            <div style={{ position: "relative" }}>
              <input 
                required 
                type={showPassword ? "text" : "password"} 
                style={{ ...inputStyle, paddingRight: "45px" }} 
                placeholder="••••••••••••" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#94a3b8" }}
              >
                {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
              </button>
            </div>

            {/* Sliding animation panel for security rule evaluation checks */}
            <div style={{
              maxHeight: isPasswordFocused || formData.password.length > 0 ? "240px" : "0px",
              overflow: "hidden",
              transition: "all 0.35s ease-in-out",
              marginTop: "8px",
              fontSize: "13px",
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              border: isPasswordFocused || formData.password.length > 0 ? "1px solid #e2e8f0" : "none",
              padding: isPasswordFocused || formData.password.length > 0 ? "12px 14px" : "0px"
            }}>
              <p style={{ margin: "0 0 8px 0", fontWeight: "600", color: "#475569" }}>Password Requirements:</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                <li style={{ color: passwordRules.length ? "#16a34a" : "#94a3b8", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{passwordRules.length ? "✓" : "○"}</span> At least 8 characters
                </li>
                <li style={{ color: passwordRules.uppercase ? "#16a34a" : "#94a3b8", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{passwordRules.uppercase ? "✓" : "○"}</span> An uppercase letter (A-Z)
                </li>
                <li style={{ color: passwordRules.lowercase ? "#16a34a" : "#94a3b8", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{passwordRules.lowercase ? "✓" : "○"}</span> A lowercase letter (a-z)
                </li>
                <li style={{ color: passwordRules.number ? "#16a34a" : "#94a3b8", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{passwordRules.number ? "✓" : "○"}</span> At least one digit (0-9)
                </li>
                <li style={{ color: passwordRules.special ? "#16a34a" : "#94a3b8", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{passwordRules.special ? "✓" : "○"}</span> Special symbol character (@$!%*#?&)
                </li>
              </ul>
            </div>
          </div>

          {/* Confirm Password Row */}
          <div>
            <label style={labelStyle}>Confirm Password</label>
            <div style={{ position: "relative" }}>
              <input 
                required 
                type={showConfirmPassword ? "text" : "password"} 
                style={{ ...inputStyle, paddingRight: "45px" }} 
                placeholder="Re-enter Password" 
                value={formData.confirmPassword} 
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#94a3b8" }}
              >
                {showConfirmPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
              </button>
            </div>
            {formData.confirmPassword.length > 0 && (
              <div style={{ fontSize: "12px", marginTop: "5px", fontWeight: "600", color: passwordsMatch ? "#16a34a" : "#ef4444" }}>
                {passwordsMatch ? "✓ Passwords align perfectly" : "✗ Passwords do not match"}
              </div>
            )}
          </div>

          {/* Flag-integrated Phone Input and Searchable Dropdown Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "14px" }}>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <div style={{ display: "flex", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "#f1f5f9", padding: "0 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", color: "#334155" }}>
                  <img src={`https://flagcdn.com/w40/${activeRegion.id}.png`} alt="flag" style={{ width: "20px", height: "auto", borderRadius: "2px" }} />
                  <strong>{activeRegion.code}</strong>
                </div>
                <input 
                  required 
                  type="tel" 
                  style={inputStyle} 
                  placeholder="7 XXXX XXXX" 
                  value={rawPhoneNumber} 
                  maxLength={10} 
                  onChange={e => setRawPhoneNumber(e.target.value.replace(/\D/g, ""))} 
                />
              </div>
            </div>

            {/* Country Picker Section */}
            <div style={{ position: "relative" }} ref={countryRef}>
              <label style={labelStyle}>Country or Region</label>
              <div 
                onClick={() => setIsCountryOpen(!isCountryOpen)}
                style={{ ...inputStyle, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <img src={`https://flagcdn.com/w40/${activeRegion.id}.png`} alt="flag" style={{ width: "20px", height: "auto" }} />
                  <span>{activeRegion.name}</span>
                </div>
                <span style={{ fontSize: "10px", color: "#64748b" }}>▼</span>
              </div>

              {isCountryOpen && (
                <div style={{ position: "absolute", top: "100%", left: 0, width: "100%", background: "#fff", border: "1px solid #cbd5e1", borderRadius: "8px", marginTop: "4px", zIndex: 50, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "none", borderBottom: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box", fontSize: "13px", borderRadius: "8px 8px 0 0" }}
                  />
                  <div style={{ maxHeight: "160px", overflowY: "auto" }}>
                    {filteredCountryRegions.map((r) => {
                      const realIndex = WORLD_REGIONS.findIndex(item => item.id === r.id);
                      return (
                        <div 
                          key={r.id} 
                          onClick={() => {
                            setSelectedIdx(realIndex);
                            setIsCountryOpen(false);
                            setCountrySearch("");
                          }}
                          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", cursor: "pointer", fontSize: "13px", backgroundColor: selectedIdx === realIndex ? "#f1f5f9" : "transparent" }}
                        >
                          <img src={`https://flagcdn.com/w40/${r.id}.png`} alt={r.name} style={{ width: "18px", height: "auto" }} />
                          <span>{r.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Organization Name <span style={{ fontWeight: "normal", color: "#94a3b8" }}>(Optional)</span></label>
            <input type="text" style={inputStyle} placeholder="Future To BI Solutions" value={formData.organizationNameOptional} onChange={e => setFormData({...formData, organizationNameOptional: e.target.value})} />
          </div>

          <button type="submit" disabled={processing} style={{ marginTop: "12px", width: "100%", backgroundColor: "#16a34a", color: "#fff", padding: "14px", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "16px", cursor: "pointer", transition: "background-color 0.2s" }}>
            {processing ? "Registering Workspace..." : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "14px", color: "#64748b", marginTop: "24px", marginBottom: "0" }}>
          Already have an account?{" "}
          <button onClick={() => router.push("/login")} style={{ background: "none", border: "none", padding: 0, color: "#1e3a8a", fontWeight: "600", textDecoration: "underline", cursor: "pointer", fontFamily: "inherit" }}>
            Sign in
          </button>
        </p>

      </div>
    </div>
  );
}

// Global Styling Templates
const labelStyle = { display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" };
const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "14px", color: "#334155", backgroundColor: "#fdfdfd", outline: "none" };