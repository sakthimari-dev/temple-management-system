import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { FaUserAlt } from "react-icons/fa";
import './Navbar.css';

/* ─────────────────────────────────────────────────────────
   Temple Logo SVG  —  Om symbol inside concentric rings
───────────────────────────────────────────────────────── */
const TempleLogo = () => (
  <svg
    className="tn-logo-svg"
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <radialGradient id="tn-glow-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="#FBBF24" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#D97706" stopOpacity="0"    />
      </radialGradient>
    </defs>

    {/* Soft inner glow */}
    <circle cx="32" cy="32" r="31" fill="url(#tn-glow-grad)" />

    {/* Outer dashed ring */}
    <circle
      cx="32" cy="32" r="30"
      fill="none"
      stroke="#FBBF24"
      strokeWidth="1.3"
      strokeDasharray="3.5 2.2"
    />

    {/* Inner solid ring */}
    <circle
      cx="32" cy="32" r="22.5"
      fill="none"
      stroke="#D97706"
      strokeWidth="1"
      opacity="0.65"
    />

    {/* OM symbol */}
    <text
      x="32" y="41.5"
      textAnchor="middle"
      fill="#FBBF24"
      fontSize="27"
      fontFamily="serif"
    >
      ॐ
    </text>
  </svg>
);

/* ─────────────────────────────────────────────────────────
   Navigation link definitions
───────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { id: "home", label: "Home", to: "/" },
  { id: "dashboard", label: "Dashboard", to: "/dashboard" },
   { id: "expenses", label: "Expenses", to: "/expenses" },
 
];

/* ─────────────────────────────────────────────────────────
   Navbar Component
───────────────────────────────────────────────────────── */
const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* ── Scroll-depth detection ─── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Close menu on desktop resize ─── */
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ── Escape key support ─── */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  /* ── Lock body scroll when mobile menu is open ─── */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const closeMenu  = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  return (
    <>
      {/* ═══════════════ STICKY HEADER ═══════════════ */}
      <header
        className={`tn-header${scrolled ? ' tn-header--scrolled' : ''}`}
        role="banner"
      >
        {/* ── Top golden crown line ── */}
        <div className="tn-crown-line" aria-hidden="true" />

        {/* ── Main bar ── */}
        <div className="tn-bar">

          {/* Brand: Logo + Temple Name */}
          <a
            href="#home"
            className="tn-brand"
            onClick={closeMenu}
            aria-label="ஸ்ரீ அக்னீஸ்வரர் திருக்கோவில் — Go to homepage"
          >
            <div className="tn-logo-wrap">
              <TempleLogo />
            </div>

            <div className="tn-brand-text">
              
              <span className="tn-name tn-name--bottom" lang="ta">
                ஸ்ரீ சித்தி விநாயகர் திருக்கோயில்
              </span>
            </div>
          </a>

          {/* Desktop navigation */}
        <nav aria-label="Main navigation" className="tn-desktop-nav">
  <ul className="tn-desktop-links">
    {NAV_LINKS.map((link) => (
      <li key={link.id}>
        <Link to={link.to} className="tn-dlink">
          {link.label}
        </Link>
      </li>
    ))}
  </ul>

  <Link to="/login" className="tn-admin-btn">
    <FaUserAlt className="tn-admin-icon" />
    <span>ADMIN</span>
  </Link>
</nav>

          {/* Hamburger toggle (mobile only) */}
          <button
            className={`tn-hamburger${menuOpen ? ' tn-hamburger--open' : ''}`}
            onClick={toggleMenu}
            aria-expanded={menuOpen}
            aria-controls="tn-mobile-panel"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            <span className="tn-hb tn-hb--1" />
            <span className="tn-hb tn-hb--2" />
            <span className="tn-hb tn-hb--3" />
          </button>

        </div>

        {/* ── Bottom gold accent rule ── */}
        <div className="tn-gold-rule" aria-hidden="true" />

        {/* ═══ MOBILE PANEL (inside sticky header) ═══ */}
        <div
          id="tn-mobile-panel"
          className={`tn-mobile-panel${menuOpen ? ' tn-mobile-panel--open' : ''}`}
          aria-hidden={!menuOpen}
        >
          <nav aria-label="Mobile navigation">
     <ul className="tn-mobile-links" role="list">
  {NAV_LINKS.map((link, idx) => (
    <li
      key={link.id}
      className="tn-mitem"
      style={{ "--idx": idx }}
    >
      <a
        href={link.to}
        className="tn-mlink"
        onClick={closeMenu}
        tabIndex={menuOpen ? 0 : -1}
      >
        <span className="tn-mlink-pip" />
        {link.label}
      </a>
    </li>
  ))}

  {/* Admin */}
  <li className="tn-mitem">
    <a
      href="/login"
      className="tn-mlink"
      onClick={closeMenu}
      tabIndex={menuOpen ? 0 : -1}
    >
      <FaUserAlt />
      <span>Admin</span>
    </a>
  </li>
</ul>
          </nav>

          {/* Decorative Om ornament at bottom of mobile menu */}
          <div className="tn-mobile-ornament" aria-hidden="true">
            <span className="tn-orn-rule" />
            <span className="tn-orn-om">ॐ</span>
            <span className="tn-orn-rule tn-orn-rule--right" />
          </div>
        </div>

      </header>
      {/* ══════════════════════════════════════════════ */}

      {/* Dim overlay — closes menu on outside click */}
      <div
        className={`tn-overlay${menuOpen ? ' tn-overlay--visible' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />
    </>
  );
};

export default Navbar;