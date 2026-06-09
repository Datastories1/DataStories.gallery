"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from "next-auth/react";
import "./Signup.css";

export default function Signup() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || '/template';

  // Form Field Component States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔒 VALIDATION UTILITIES
  const validateEmail = (emailStr) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const validatePasswordStrength = (passStr) => {
    // Requires min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return strongPasswordRegex.test(passStr);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 1. Check for valid email format
    if (!validateEmail(email)) {
      setError("Please enter a valid, structured email address (e.g., name@example.com).");
      return;
    }

    // 2. Enforce robust password rules
    if (!validatePasswordStrength(password)) {
      setError(
        "Password is too weak! It must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character (@$!%*#?&)."
      );
      return;
    }

    // 3. Confirm password matching
    if (password !== rePassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong during account creation.");
        setLoading(false);
        return;
      }

      // AUTO-LOGIN TRIGGER
      const loginResult = await signIn("credentials", {
        redirect: false,
        email,
        password
      });

      if (loginResult?.error) {
        setError("Account created, but automatic login failed. Please go to the login page manually.");
      } else {
        router.refresh();
        router.push(callbackUrl);
      }
    } catch (err) {
      setError("Network connection failure. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-card" onSubmit={handleSignupSubmit}>
        <h2 className="signup-title">Create Account</h2>

        {error && (
          <p style={{ 
            color: "#e11d48", 
            backgroundColor: "#fff1f2", 
            padding: "10px", 
            borderRadius: "6px", 
            fontSize: "13px", 
            marginBottom: "15px", 
            textAlign: "center",
            border: "1px solid #ffe4e6",
            lineHeight: "1.4"
          }}>
            {error}
          </p>
        )}

        <input
          type="text"
          placeholder="Full Name"
          className="signup-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          className="signup-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="signup-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

         <input
          type="password"
          placeholder="Re-enter Password"
          className="signup-input"
          value={rePassword}
          onChange={(e) => setRePassword(e.target.value)}
          required
        />

         <input
          type="tel"
          placeholder="Phone Number"
          className="signup-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <button 
          type="submit" 
          className="signup-button" 
          disabled={loading}
        >
          {loading ? "Registering..." : "Sign Up"}
        </button>

        <p className="signup-footer">
          Already have an account? <a href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Login</a>
        </p>
      </form>
    </div>
  );
}