"use client";

import React, { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { HiOutlineMail, HiOutlineClock, HiOutlineChatAlt2, HiOutlineSparkles } from 'react-icons/hi';
import { FiSend } from 'react-icons/fi';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './ContactUs.css';
import Link from "next/link";

export default function ContactPage() {
  const formRef = useRef();
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("JO"); // Default country code
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation for phone number based on your CSS error state logic
    if (phone && !isValidPhoneNumber(phone)) {
      return alert("Invalid Phone Number. Please check the country code and digits.");
    }

    setLoading(true);

    emailjs.sendForm(
      'service_h4ld4v2', 
      'template_vcvfg3z', 
      formRef.current, 
      'y9dAzHSQYIldcLgA-'
    )
    .then(() => {
      setShowToast(true);
      // Auto-hide the dark blue notification after 5 seconds
      setTimeout(() => setShowToast(false), 5000); 
      
      // Reset form fields
      formRef.current.reset();
      setPhone("");
    })
    .catch((err) => {
      alert("Failed to send message. Please try again or email us directly.");
      console.error("EmailJS Error:", err);
    })
    .finally(() => setLoading(false));
  };

  return (
    <div className="contact-page">
      {/* Dark Blue Toast Notification - Appears below Nav Bar */}
      {showToast && (
        <div className="success-toast">
          Success! Your message has been sent to Datastories.gallery by Future to BI. 
          We will get back to you within 24 hours.
        </div>
      )}

      <header className="contact-header">
        <span className="badge">Get in Touch</span>
        <h1>We're Here to Help</h1>
        <p>Questions about a template or custom dashboard? We respond within 24 hours.</p>
      </header>

      <div className="contact-content-stacked">
        {/* Info Cards Section */}
        <div className="info-cards-row">
          <div className="info-card">
            <div className="icon-wrapper email"><HiOutlineMail /></div>
            <h3>Email Us</h3>
            <p className="highlight">sh.atif@futuretobi.com</p>
            <p className="subtext">Official Support Email</p>
          </div>
          <div className="info-card">
            <div className="icon-wrapper time"><HiOutlineClock /></div>
            <h3>Response Time</h3>
            <p className="highlight">Within 24 hours</p>
            <p className="subtext">Sunday - Wednesday</p>
          </div>
          <div className="info-card">
            <div className="icon-wrapper support"><HiOutlineChatAlt2 /></div>
            <h3>Template Support</h3>
            <p className="highlight">Free Support</p>
            <p className="subtext">For all purchased items</p>
          </div>
          <div className="info-card custom-work">
            <div className="icon-wrapper custom"><HiOutlineSparkles /></div>
            <h3>Consultancy</h3>
            <p className="highlight">Future to BI</p>
            <p className="subtext">Custom BI Solutions</p>
          </div>
        </div>

        {/* Contact Form Section */}
        <form className="contact-form" ref={formRef} onSubmit={handleSubmit}>
          {/* Hidden input to pass Country code to EmailJS template: {{user_country}} */}
          <input type="hidden" name="user_country" value={country} />
          
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name <span>*</span></label>
              <input type="text" name="user_name" placeholder="John Smith" required />
            </div>
            
            <div className="form-group">
              <label>Email Address <span>*</span></label>
              <input type="email" name="user_email" placeholder="john@company.com" required />
            </div>
            
            <div className="form-group">
              <label>Phone Number <span>*</span></label>
              {/* Container class from your CSS to fix the border/background visibility */}
              <div className="phone-input-container">
                <PhoneInput
                  international
                  defaultCountry="JO"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={setPhone}
                  onCountryChange={setCountry}
                  name="user_phone"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Organization</label>
              <input type="text" name="user_org" placeholder="Your Company" />
            </div>
          </div>

          <div className="form-group">
            <label>Subject</label>
            <input type="text" name="subject" placeholder="Custom Dashboard Request" />
          </div>

          <div className="form-group">
            <label>Message <span>*</span></label>
            <textarea name="message" placeholder="How can we help?" rows="6" required />
          </div>

          <button type="submit" className="send-btn" disabled={loading}>
            {loading ? "Sending..." : "Send Message"} <FiSend />
          </button>
        </form>
      </div>
      {/* Consultancy Section */}
      <div className="consultancy-section">
        <section className="cta">
          <h2 className="cta-title">Ready to build your data story?</h2>
          <Link href="/" className="btn">
            Browse Templates
          </Link>
        </section>
      </div>
    </div>
  );
}