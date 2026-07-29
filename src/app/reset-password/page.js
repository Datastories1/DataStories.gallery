"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import '../login/login.css';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Real-time Validation States
  const [validations, setValidations] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
    match: false,
  });

  // Automatically recalculate rules when fields change
  useEffect(() => {
    setValidations({
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
      match: newPassword === confirmPassword && newPassword.length > 0,
    });
  }, [newPassword, confirmPassword]);

  // Check if all rules pass successfully
  const isPasswordSecure = 
    validations.minLength && 
    validations.hasUpper && 
    validations.hasLower && 
    validations.hasNumber && 
    validations.hasSpecial && 
    validations.match;

  useEffect(() => {
    if (!token) { setError("Missing security verification token. This link is invalid."); }
  }, [token]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMessage('');

    if (!isPasswordSecure) {
      setError("Please ensure your password meets all safety criteria below.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
      } else {
        setSuccessMessage("Password updated successfully! Redirecting to login portal...");
        setTimeout(() => router.push('/login'), 3000);
      }
    } catch (err) {
      setError("An operational communication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-wrapper">
      <h2 className="form-title">Update Password</h2>
      
      {error && <p style={{ color: '#f8514b', backgroundColor: '#fff1f2', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px' }}>{error}</p>}
      {successMessage && <p style={{ color: '#2ea44f', backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px' }}>{successMessage}</p>}

      {token && !successMessage && (
        <form className="login-form" onSubmit={handleUpdatePassword}>
          <input type="password" placeholder="New Password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={loading} />
          <input type="password" placeholder="Confirm Password" className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} />
          
          {/* Real-time Requirement Tracker UI */}
          <div style={checklistContainerStyle}>
            <p style={{ margin: '0 0 6px 0', fontWeight: '600', fontSize: '13px', color: '#4a4b4d' }}>
              Password Requirements:
            </p>
            <div style={checkItemStyle(validations.minLength)}>
              {validations.minLength ? "✔" : "✖"} Minimum 8 characters
            </div>
            <div style={checkItemStyle(validations.hasUpper)}>
              {validations.hasUpper ? "✔" : "✖"} One uppercase letter (A-Z)
            </div>
            <div style={checkItemStyle(validations.hasLower)}>
              {validations.hasLower ? "✔" : "✖"} One lowercase letter (a-z)
            </div>
            <div style={checkItemStyle(validations.hasNumber)}>
              {validations.hasNumber ? "✔" : "✖"} One numeric digit (0-9)
            </div>
            <div style={checkItemStyle(validations.hasSpecial)}>
              {validations.hasSpecial ? "✔" : "✖"} One special character (@, $, #, !, etc.)
            </div>
            <div style={checkItemStyle(validations.match)}>
              {validations.match ? "✔" : "✖"} Passwords match perfectly
            </div>
          </div>

          <button 
            type="submit" 
            className="blue-login-btn" 
            disabled={loading || !isPasswordSecure}
            style={{ opacity: isPasswordSecure ? 1 : 0.6, cursor: isPasswordSecure ? 'pointer' : 'not-allowed' }}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      )}
      <div className="horizontal-line"></div>
      <Link href="/login" className="link-btn-style" style={{ textAlign: 'center', textDecoration: 'none' }}>Back to Login</Link>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="full-page-wrapper">
      <div className="main-split-container">
        <section className="left-half"><div className="image-container"><img src="/Login.png" alt="Branding" className="large-brand-image" /></div></section>
        <div className="vertical-divider"></div>
        <section className="right-half">
          <Suspense fallback={<p>Loading security configuration data...</p>}><ResetPasswordForm /></Suspense>
        </section>
      </div>
    </div>
  );
}

// Inline Styles for requirements tracker
const checklistContainerStyle = { 
  textAlign: 'left', 
  backgroundColor: '#f8f9fa', 
  padding: '12px', 
  borderRadius: '6px', 
  marginBottom: '15px', 
  border: '1px solid #e1e4e6' 
};

const checkItemStyle = (isValid) => ({
  fontSize: '12px',
  color: isValid ? '#2ea44f' : '#f8514b',
  fontWeight: isValid ? '500' : '400',
  marginBottom: '3px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
});