"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; 
import { signIn } from 'next-auth/react'; 
import Link from 'next/link'; 
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Dynamic fallback: loops back to checkout selection if intercepted, or falls back to templates
  const callbackUrl = searchParams.get("callbackUrl") || '/template';
  
  // State for Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Login Logic
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false, 
        email,
        password,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
        router.push(callbackUrl);
      }
    } catch (err) {
      setError("An unexpected login error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="full-page-wrapper">
      <div className="main-split-container">
        
        {/* LEFT HALF - Visual Branding Panel */}
        <section className="left-half">
          <div className="image-container">
            <img src="/login.png" alt="Branding" className="large-brand-image" />
          </div>
        </section>

        {/* THE GREY VERTICAL LINE */}
        <div className="vertical-divider"></div>

        {/* RIGHT HALF - Form Actions */}
        <section className="right-half">
          <div className="login-form-wrapper">
            <h2 className="form-title">Log into PowerBI Shop</h2>
            
            <form className="login-form" onSubmit={handleLogin}>
              {/* Error Message Display */}
              {error && (
                <p style={{ color: '#f8514b', textAlign: 'left', marginBottom: '14px', fontSize: '14px', fontWeight: '500' }}>
                  {error}
                </p>
              )}
              
              <input 
                type="email" 
                placeholder="Email or mobile number" 
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input 
                type="password" 
                placeholder="Password" 
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button type="submit" className="blue-login-btn" disabled={loading}>
                {loading ? "Logging in..." : "Log in"}
              </button>

              {/* Secure navigation to your new 6-digit OTP workspace page */}
              <Link href="/forgot-password" className="forgot-pw-text">
                Forgot Password?
              </Link>
            </form>
            
            <div className="horizontal-line"></div>
            
            {/* Redirect to Signup */}
            <button 
              className="create-account-btn" 
              onClick={() => router.push(`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`)}
            >
              Create new account
            </button>
            
            <p className="powered-by">Powered by Future to BI</p>
          </div>
        </section>

      </div>
    </div>
  );
}