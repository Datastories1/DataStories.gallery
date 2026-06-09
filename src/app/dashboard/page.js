"use client";

import "./Dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Admin Dashboard</h1>

      <div className="dashboard-card">
        <h2 className="dashboard-subtitle">Upload New Template</h2>

        <form className="dashboard-form">
          <input type="text" placeholder="Template Name" className="dashboard-input" />
          <input type="text" placeholder="Description" className="dashboard-input" />
          <input type="text" placeholder="Stripe Payment Link" className="dashboard-input" />
          <input type="file" className="dashboard-file" />

          <button type="submit" className="dashboard-btn">Upload Template</button>
        </form>
      </div>
    </div>
  );
}