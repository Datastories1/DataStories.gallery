"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import '../login/login.css'; 

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestLink = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setSuccessMessage("A secure reset link has been dispatched! Please inspect your email inbox.");
      }
    } catch (err) {
      setError("Unable to connect with server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="full-page-wrapper">
      <div className="main-split-container">
        <section className="left-half"><div className="image-container"><img src="/Login.png" alt="Branding" className="large-brand-image" /></div></section>
        <div className="vertical-divider"></div>
        <section className="right-half">
          <div className="login-form-wrapper">
            <h2 className="form-title">Account Recovery</h2>
            
            {error && <p style={{ color: '#f8514b', backgroundColor: '#fff1f2', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px', border: '1px solid #ffe4e6' }}>{error}</p>}
            {successMessage && <p style={{ color: '#2ea44f', backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px', border: '1px solid #dcfce7' }}>{successMessage}</p>}

            {!successMessage ? (
              <form className="login-form" onSubmit={handleRequestLink}>
                <p style={{ textAlign: 'left', color: '#65676b', fontSize: '14px', marginBottom: '15px', lineHeight: '1.4' }}>
                  Enter your email address and we will send you a secure link to reset your account.
                </p>
                <input type="email" placeholder="Email Address" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <button type="submit" className="blue-login-btn" disabled={loading}>{loading ? "Checking Account..." : "Send Reset Link"}</button>
              </form>
            ) : (
              <p style={{ color: '#65676b', fontSize: '14px', margin: '15px 0', lineHeight: '1.5' }}>For security, check your mail message box and click the link inside to modify your password profile.</p>
            )}
            
            <div className="horizontal-line"></div>
            <Link href="/login" className="link-btn-style" style={{ textAlign: 'center', textDecoration: 'none' }}>Back to Login</Link>
          </div>
        </section>
      </div>
    </div>
  );
}