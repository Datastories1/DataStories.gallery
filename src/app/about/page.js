"use client";

import AnimatedSection from "@/components/AnimatedSection";
import "./about.css";
import Link from "next/link";

const missionCards = [
  { 
    title: "Data-First", 
    desc: "Every design decision is driven by what makes data clearer and more actionable.",
    icon: "📊" 
  },
  { 
    title: "Business-Focused", 
    desc: "Templates built around real business questions, not just pretty charts.",
    icon: "🎯"
  },
  { 
    title: "Instant Value", 
    desc: "Connect your data and have a board-ready dashboard in under an hour.",
    icon: "⚡"
  },
  { 
    title: "Community-Driven", 
    desc: "Built with feedback from 500+ data professionals across industries.",
    icon: "👥"
  },
];

const marqueeItems = [
  "Unique Designs","◈","DAX Included","◈","Instant Delivery","◈","Ready in Minutes","◈",
  "Unique Designs","◈","DAX Included","◈","Instant Delivery","◈","Ready in Minutes","◈"
];

export default function AboutPage() {
  return (
    <div className="about-page">

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <h1 className="Hero">Data Stories Worth Telling</h1>
            <p className="sub-heading">
              Professional, ready-to-use Power BI dashboard templates. 
              Browse our Insightful and Fantastic template library...
            </p>
            <div className="button-group">
              {/* Style the Link directly as a button for better click response */}
              <Link href="/template" className="btn">
                Explore Templates
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <img src="/dashboardImage.png" alt="Dashboard Preview" className="responsive-img" />
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee">
        <div className="track">
          {[...marqueeItems, ...marqueeItems].map((t, i) => (
            <span key={i} className={t === "◈" ? "icon" : "text"}>
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="container">
        {/* SECTION 1: MISSION */}
        <AnimatedSection>
          <section className="mission-section">
            <div className="mission-content">
              <span className="badge">Our Mission</span>
              <h2 className="section-title">Making Professional Data Visualization Accessible</h2>
              <p className="text-muted">
                We believe every business deserves access to professional-grade data visualization — 
                regardless of budget or in-house design resources.
              </p>
            </div>

            <div className="mission-grid">
              {missionCards.map((card, i) => (
                <div key={i} className="mission-card">
                  <div className="card-icon">{card.icon}</div>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </AnimatedSection>

        {/* SECTION 2: VISION */}
        <AnimatedSection>
          <section className="mission-section reverse">
            <div className="mission-image">
              <img src="/image3.png" alt="Our Vision" className="responsive-img rounded" />
            </div>
            <div className="mission-content">
              <span className="badge">Our Vision</span>
              <h2 className="section-title">Empowering Every Analyst</h2>
              <p className="text-muted">
                Beyond just templates, we aim to set the gold standard for how data is consumed.
              </p>
            </div>
          </section>
        </AnimatedSection>
      </div>

      <AnimatedSection>
  <section className="consultancy-section-mid">
    <div className="consultancy-grid-mid">
      
      {/* BOX 1: CUSTOM WORK */}
      <div className="consultancy-card-mid">
        <div className="card-header-mid">
          <span className="icon-mid">🛠️</span>
          <h3 className="card-title-mid">Custom Dashboards</h3>
        </div>
        <p className="card-text-mid">
          Have a unique business challenge? We design and build end-to-end 
          Power BI solutions, from complex DAX modeling to custom UI/UX 
          that reflects your brand's identity.
        </p>
        <Link href="/contactus" className="btnt-mid">
          Start Your Project
        </Link>
      </div>

      {/* BOX 2: FUTURE TO BI */}
      <div className="consultancy-card-mid premium-mid">
        <div className="card-header-mid">
          <span className="icon-mid">🚀</span>
          <h3 className="card-title-mid">Enterprise Consulting</h3>
        </div>
        <p className="card-text-mid">
          Take your data strategy to the next level with **Future to BI**. 
          We offer high-level consultancy, corporate training, and 
          strategic roadmap development for growing teams.
        </p>
        <a href="https://futuretobi.com/" target="_blank" rel="noopener noreferrer" className="btnt-mid">
          Explore Solutions
        </a>
      </div>

    </div>
  </section>
</AnimatedSection>

 {/* CTA SECTION */}
      <section className="cta">
        <h2 className="cta-title">Ready to build your data story?</h2>
        <Link href="/template" className="btn">
          Browse Templates
        </Link>
      </section>
 
    </div>
  );

}