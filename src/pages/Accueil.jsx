import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  FiArrowRight,
  FiClock,
  FiCpu,
  FiShield,
  FiMessageCircle,
  FiZap,
  FiMenu,
  FiX,
  FiChevronRight,
  FiStar,
  FiUsers,
  FiAward,
  FiTrendingUp,
} from "react-icons/fi";

/* ─── STYLES ─────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --violet:    #7C3AED;
    --indigo:    #4F46E5;
    --pink:      #EC4899;
    --cyan:      #06B6D4;
    --amber:     #F59E0B;
    --bg:        #FFFFFF;           
    --surface:   #F9FAFB;           
    --glass:     rgba(255, 255, 255, 0.7); 
    --glass-b:   rgba(0, 0, 0, 0.05);
    --text:      #111827;          
    --muted:     #6B7280;          
    --border:    rgba(0, 0, 0, 0.08); 
    --r-sm:      12px;
    --r-md:      20px;
    --r-lg:      32px;
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'Inter', sans-serif;
    background: var(--bg);
    color: var(--text);
    overflow-x: hidden;
  }

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--violet); border-radius: 2px; }

  /* ── NOISE OVERLAY ── */
  .noise {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
    background-size: 180px;
    opacity: 0.4;
  }

  /* ── GLOW ORBS ── */
  .orb {
    position: absolute; border-radius: 50%; filter: blur(100px);
    pointer-events: none; will-change: transform;
  }
  .orb-1 {
    width: 600px; height: 600px;
    background: radial-gradient(circle, #7260A7 0%, transparent 70%);
    top: -200px; right: -100px; animation: drift 12s ease-in-out infinite alternate;
  }
  .orb-2 {
    width: 500px; height: 500px;
    background: radial-gradient(circle, #7260A7 0%, transparent 70%);
    bottom: 0; left: -150px; animation: drift 15s ease-in-out infinite alternate-reverse;
  }
  .orb-3 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, #7260A7 0%, transparent 70%);
    top: 40%; left: 40%; animation: drift 10s ease-in-out infinite alternate;
  }

  @keyframes drift {
    from { transform: translate(0, 0) scale(1); }
    to   { transform: translate(40px, 30px) scale(1.08); }
  }

  /* ── NAV ── */
  .nav-wrap {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    padding: 0 24px;
    transition: all 0.4s ease;
  }
  .nav-wrap.scrolled {
    background: #7260A7;
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }
  .nav-inner {
    max-width: 1180px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    height: 72px;
  }
  .brand {
    display: flex; align-items: center; gap: 10px;
    font-family: 'Syne', sans-serif; font-weight: 800;
    font-size: 1.4rem; letter-spacing: -0.02em; color: var(--text);
    text-decoration: none;
  }
  .brand-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: linear-gradient(135deg, var(--violet), var(--cyan));
    box-shadow: 0 0 12px var(--violet);
  }
  .nav-links {
    display: flex; gap: 36px; align-items: center;
  }
  .nav-links a {
    color: var(--muted); font-size: 0.88rem; font-weight: 500;
    text-decoration: none; letter-spacing: 0.02em; text-transform: uppercase;
    transition: color 0.2s;
  }
  .nav-links a:hover { color: var(--text); }
  .nav-actions { display: flex; gap: 12px; align-items: center; }
  .btn-ghost {
    padding: 9px 20px; border-radius: 50px; border: 1px solid var(--border);
    color: var(--text); font-size: 0.875rem; font-weight: 500;
    text-decoration: none; transition: all 0.2s; cursor: pointer;
    background: transparent;
  }
  .btn-ghost:hover { border-color: var(--violet); color: var(--violet); }
  .btn-primary-sm {
    padding: 10px 22px; border-radius: 50px;
    background: linear-gradient(135deg, var(--violet), var(--indigo));
    color: #fff; font-size: 0.875rem; font-weight: 600;
    text-decoration: none; border: none; cursor: pointer;
    box-shadow: 0 4px 20px rgba(124,58,237,0.4);
    transition: all 0.25s;
  }
  .btn-primary-sm:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(124,58,237,0.55); }
  .nav-mobile-toggle {
    display: none; background: none; border: none; color: var(--text);
    font-size: 1.4rem; cursor: pointer; padding: 6px;
  }

  /* ── HERO ── */
  .hero {
    position: relative; min-height: 100vh;
    display: flex; align-items: center;
    padding: 120px 24px 80px;
    overflow: hidden;
  }
  .hero-container {
    max-width: 1180px; margin: 0 auto; width: 100%;
    display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;
  }
  .hero-tag {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 6px 16px; border-radius: 50px;
    border: 1px solid rgba(124,58,237,0.4);
    background: #7260A7;
    font-size: 0.78rem; font-weight: 600; color: #A78BFA;
    letter-spacing: 0.08em; text-transform: uppercase;
    margin-bottom: 28px;
    animation: fadeUp 0.8s ease both;
  }
  .live-pulse {
    width: 7px; height: 7px; border-radius: 50%; background: #10B981;
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.4); }
  }
  .hero h1 {
    font-family: 'Syne', sans-serif; font-size: clamp(2.8rem, 5vw, 4.5rem);
    font-weight: 800; line-height: 1.08; letter-spacing: -0.03em;
    margin-bottom: 24px;
    animation: fadeUp 0.8s 0.1s ease both;
  }
  .hero h1 .gradient-text {
    background: linear-gradient(135deg, #A78BFA 0%, #06B6D4 50%, #EC4899 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .hero-desc {
    color: var(--muted); font-size: 1.08rem; line-height: 1.75;
    max-width: 480px; margin-bottom: 40px;
    animation: fadeUp 0.8s 0.2s ease both;
  }
  .hero-actions {
    display: flex; gap: 16px; flex-wrap: wrap;
    animation: fadeUp 0.8s 0.3s ease both;
  }
  .btn-primary-lg {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 15px 32px; border-radius: 50px;
    background: linear-gradient(135deg, var(--violet), var(--indigo));
    color: #fff; font-size: 1rem; font-weight: 600;
    text-decoration: none; border: none; cursor: pointer;
    box-shadow: 0 8px 30px rgba(124,58,237,0.45);
    transition: all 0.3s; position: relative; overflow: hidden;
  }
  .btn-primary-lg::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, #7260A7, transparent);
    transform: translateX(-100%); transition: transform 0.4s;
  }
  .btn-primary-lg:hover::before { transform: translateX(0); }
  .btn-primary-lg:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(124,58,237,0.6); }
  .btn-outline-lg {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 15px 32px; border-radius: 50px;
    border: 1px solid var(--border);
    color: var(--text); font-size: 1rem; font-weight: 500;
    text-decoration: none; transition: all 0.25s;
    background: var(--glass);
    backdrop-filter: blur(8px);
  }
  .btn-outline-lg:hover { border-color: rgba(167,139,250,0.5); background: #7260A7; }

  /* ── HERO STATS ── */
  .hero-stats {
    display: flex; gap: 32px; margin-top: 48px;
    animation: fadeUp 0.8s 0.4s ease both;
  }
  .stat { display: flex; flex-direction: column; gap: 4px; }
  .stat-num {
    font-family: 'Syne', sans-serif; font-size: 1.8rem;
    font-weight: 800; color: var(--text);
  }
  .stat-label { font-size: 0.8rem; color: var(--muted); font-weight: 400; }
  .stat-divider { width: 1px; background: var(--border); }

  /* ── HERO VISUAL ── */
  .hero-visual {
    position: relative; display: flex; justify-content: center; align-items: center;
    animation: fadeRight 0.9s 0.3s ease both;
  }
  @keyframes fadeRight {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .glass-card-hero {
    background: #7260A7;
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    backdrop-filter: blur(20px);
    padding: 32px; width: 100%; max-width: 440px;
    box-shadow: 0 24px 80px #7260A7, inset 0 1px 0 #7260A7;
    animation: float 6s ease-in-out infinite;
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
  }
  .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .card-badge {
    padding: 5px 12px; border-radius: 50px;
    background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3);
    font-size: 0.75rem; font-weight: 600; color: #34D399; display: flex; align-items: center; gap: 6px;
  }
  .card-menu { color: var(--muted); font-size: 1.1rem; cursor: pointer; }
  .card-title {
    font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 700;
    margin-bottom: 8px; line-height: 1.3;
  }
  .card-sub { font-size: 0.875rem; color: var(--muted); margin-bottom: 24px; }
  .card-progress { margin-bottom: 24px; }
  .progress-label { display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--muted); margin-bottom: 8px; }
  .progress-bar { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
  .progress-fill {
    height: 100%; border-radius: 3px;
    background: linear-gradient(90deg, var(--violet), var(--cyan));
    animation: grow 2s 1s ease both;
  }
  @keyframes grow { from { width: 0%; } }

  .mini-modules { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .mini-mod {
    background: var(--glass); border: 1px solid var(--border); border-radius: var(--r-sm);
    padding: 14px 10px; text-align: center; font-size: 0.78rem; font-weight: 500;
    color: var(--muted); transition: all 0.2s; cursor: pointer;
  }
  .mini-mod:hover { background: #7260A7; border-color: rgba(124,58,237,0.4); color: var(--text); }
  .mini-mod-icon { font-size: 1.2rem; margin-bottom: 6px; }

  .card-footer { display: flex; justify-content: space-between; align-items: center; }
  .avatars { display: flex; }
  .avatar {
    width: 30px; height: 30px; border-radius: 50%;
    border: 2px solid var(--bg); margin-left: -8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.65rem; font-weight: 700;
    background: linear-gradient(135deg, var(--violet), var(--indigo));
    color: #fff;
  }
  .avatar:first-child { margin-left: 0; }
  .card-cta {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 18px; border-radius: 50px;
    background: linear-gradient(135deg, var(--violet), var(--indigo));
    color: #fff; font-size: 0.8rem; font-weight: 600;
    border: none; cursor: pointer; text-decoration: none;
    transition: all 0.2s;
  }
  .card-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,58,237,0.5); }

  /* floating badges */
  .float-badge {
    position: absolute; display: flex; align-items: center; gap: 10px;
    background: #7260A7; border: 1px solid var(--border);
    border-radius: var(--r-sm); padding: 12px 16px;
    backdrop-filter: blur(16px);
    box-shadow: 0 12px 40px #7260A7;
    font-size: 0.82rem; font-weight: 500;
  }
  .float-badge-1 { top: -20px; left: -30px; animation: float 7s 1s ease-in-out infinite; }
  .float-badge-2 { bottom: -20px; right: -30px; animation: float 8s 2s ease-in-out infinite; }
  .float-icon {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem;
  }
  .float-icon-ai { background: linear-gradient(135deg, #7260A7, #7260A7; }
  .float-icon-award { background: linear-gradient(135deg, rgba(245,158,11,0.3), rgba(236,72,153,0.3)); }
  .float-num { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 800; }
  .float-text { font-size: 0.72rem; color: var(--muted); }

  /* ── SECTION COMMON ── */
  .section { padding: 100px 24px; position: relative; }
  .section-alt { padding: 100px 24px; background: var(--surface); position: relative; }
  .container { max-width: 1180px; margin: 0 auto; }
  .section-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 0.75rem; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: #A78BFA; margin-bottom: 16px;
  }
  .section-eyebrow-line { width: 24px; height: 1px; background: #A78BFA; }
  .section-title {
    font-family: 'Syne', sans-serif; font-size: clamp(2rem, 3.5vw, 3rem);
    font-weight: 800; letter-spacing: -0.025em; line-height: 1.15;
    margin-bottom: 16px;
  }
  .section-desc { font-size: 1rem; color: var(--muted); max-width: 520px; line-height: 1.7; }

  /* ── LIVE SECTION ── */
  .live-section { padding: 48px 24px; }
  .live-card {
    background: linear-gradient(135deg, #7260A7, #7260A7;
    border: 1px solid rgba(124,58,237,0.3);
    border-radius: var(--r-lg); padding: 32px 40px;
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
    gap: 20px; backdrop-filter: blur(10px);
    position: relative; overflow: hidden;
  }
  .live-card::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, transparent 60%, #7260A7);
    pointer-events: none;
  }
  .live-left { display: flex; align-items: center; gap: 16px; }
  .live-indicator { display: flex; align-items: center; gap: 8px; }
  .live-dot-wrap {
    width: 40px; height: 40px; border-radius: 50%;
    background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3);
    display: flex; align-items: center; justify-content: center;
  }
  .live-dot { width: 12px; height: 12px; border-radius: 50%; background: #10B981; animation: pulse 2s infinite; }
  .live-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #34D399; font-weight: 600; }
  .live-title { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 700; }
  .live-subtitle { font-size: 0.875rem; color: var(--muted); margin-top: 4px; }
  .live-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .live-pill {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 50px;
    background: var(--glass); border: 1px solid var(--border);
    font-size: 0.83rem; color: var(--text);
  }
  .live-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 24px; border-radius: 50px;
    background: linear-gradient(135deg, var(--violet), var(--indigo));
    color: #fff; font-weight: 600; font-size: 0.875rem;
    border: none; cursor: pointer;
    box-shadow: 0 6px 24px rgba(124,58,237,0.4); transition: all 0.25s;
  }
  .live-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(124,58,237,0.55); }

  /* ── THEMES ── */
  .themes-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 56px; }
  .theme-card {
    background: var(--glass); border: 1px solid var(--border);
    border-radius: var(--r-md); padding: 28px 24px;
    transition: all 0.3s; cursor: pointer; position: relative; overflow: hidden;
    group: theme;
  }
  .theme-card::before {
    content: ''; position: absolute; inset: 0; opacity: 0;
    background: linear-gradient(135deg, #7260A7, #7260A7);
    transition: opacity 0.3s;
  }
  .theme-card:hover::before { opacity: 1; }
  .theme-card:hover { border-color: rgba(124,58,237,0.4); transform: translateY(-4px); box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
  .theme-icon-wrap {
    width: 52px; height: 52px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.3rem; margin-bottom: 20px;
    background: linear-gradient(135deg, #7260A7, #7260A7);
    border: 1px solid #7260A7;
    transition: all 0.3s;
  }
  .theme-card:hover .theme-icon-wrap {
    background: linear-gradient(135deg, var(--violet), var(--indigo));
    border-color: transparent; box-shadow: 0 8px 24px rgba(124,58,237,0.4);
  }
  .theme-name { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 700; margin-bottom: 6px; }
  .theme-desc { font-size: 0.84rem; color: var(--muted); }
  .theme-arrow { position: absolute; top: 24px; right: 24px; color: var(--muted); font-size: 1rem; transition: all 0.2s; }
  .theme-card:hover .theme-arrow { color: var(--violet); transform: translate(2px, -2px); }

  /* ── OBJECTIF ── */
  .objectif-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
  .objectif-visual { position: relative; }
  .phone-stack { position: relative; height: 420px; }
  .phone-card {
    position: absolute; width: 220px;
    background: #7260A7; border: 1px solid var(--border);
    border-radius: 24px; overflow: hidden;
    box-shadow: 0 30px 80px #7260A7;
  }
  .phone-a { top: 0; left: 20px; animation: float 7s ease-in-out infinite; z-index: 2; }
  .phone-b { top: 60px; left: 160px; animation: float 9s 1.5s ease-in-out infinite; opacity: 0.8; z-index: 1; }
  .phone-header { height: 12px; background: rgba(255,255,255,0.04); position: relative; }
  .phone-notch { width: 50px; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; margin: 3px auto; }
  .phone-body { padding: 16px; }
  .phone-screen-card {
    background: linear-gradient(135deg, #7260A7, #7260A7);
    border-radius: 12px; padding: 16px; margin-bottom: 12px;
  }
  .ps-new { font-size: 0.6rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 20px; display: inline-block; margin-bottom: 8px; font-weight: 600; }
  .ps-title { font-size: 0.75rem; font-weight: 700; margin-bottom: 4px; }
  .ps-sub { font-size: 0.62rem; color: rgba(255,255,255,0.7); }
  .ps-btn { margin-top: 12px; background: rgba(255,255,255,0.9); color: #1a1a2e; font-size: 0.65rem; font-weight: 700; padding: 6px 14px; border-radius: 20px; display: inline-block; }
  .phone-tiles { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 10px; }
  .phone-tile { height: 36px; background: var(--glass); border: 1px solid var(--border); border-radius: 8px; }
  .phone-list-item { height: 10px; background: var(--glass); border-radius: 5px; margin-bottom: 6px; }
  .phone-list-item:last-child { width: 60%; }

  .objectif-content .section-title { margin-bottom: 20px; }
  .objectif-text { font-size: 1.05rem; color: var(--muted); line-height: 1.8; margin-bottom: 32px; }
  .store-row { display: flex; gap: 14px; }
  .store-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 22px; border-radius: var(--r-sm);
    background: var(--glass); border: 1px solid var(--border);
    color: var(--text); text-decoration: none; font-weight: 600;
    font-size: 0.875rem; transition: all 0.25s;
  }
  .store-btn:hover { background: #7260A7; border-color: rgba(124,58,237,0.4); transform: translateY(-2px); }

  /* ── STEPS ── */
  .steps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
  .steps-content .section-title { margin-bottom: 40px; }
  .step-item { display: flex; gap: 20px; margin-bottom: 32px; }
  .step-num-wrap {
    flex-shrink: 0; width: 44px; height: 44px; border-radius: 50%;
    background: linear-gradient(135deg, var(--violet), var(--indigo));
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1rem; color: #fff;
    box-shadow: 0 6px 20px rgba(124,58,237,0.4);
    position: relative; flex-shrink: 0;
  }
  .step-connector {
    position: absolute; top: 44px; left: 50%; transform: translateX(-50%);
    width: 2px; height: 32px; background: linear-gradient(to bottom, rgba(124,58,237,0.5), transparent);
  }
  .step-body { padding-top: 10px; }
  .step-title { font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 700; margin-bottom: 6px; }
  .step-desc { font-size: 0.88rem; color: var(--muted); line-height: 1.6; }

  .steps-visual {
    background: var(--glass); border: 1px solid var(--border);
    border-radius: var(--r-lg); padding: 32px; overflow: hidden;
    position: relative; min-height: 360px;
  }
  .steps-visual::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at 50% 0%, #7260A7 0%, transparent 60%);
  }
  .preview-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .preview-dots { display: flex; gap: 6px; }
  .preview-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--border); }
  .preview-dot:first-child { background: #EF4444; }
  .preview-dot:nth-child(2) { background: #F59E0B; }
  .preview-dot:nth-child(3) { background: #10B981; }
  .preview-label { font-size: 0.75rem; color: var(--muted); font-weight: 500; letter-spacing: 0.05em; }
  .preview-hero-bar { height: 10px; background: linear-gradient(90deg, rgba(124,58,237,0.5), rgba(6,182,212,0.3)); border-radius: 5px; margin-bottom: 12px; }
  .preview-bar { height: 7px; background: var(--glass); border-radius: 3.5px; margin-bottom: 8px; }
  .preview-bar.w80 { width: 80%; }
  .preview-bar.w60 { width: 60%; }
  .preview-bar.w90 { width: 90%; }
  .preview-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
  .preview-mini-card {
    background: var(--glass); border: 1px solid var(--border);
    border-radius: var(--r-sm); padding: 16px;
    aspect-ratio: 1.4;
    display: flex; flex-direction: column; justify-content: flex-end;
    position: relative; overflow: hidden;
  }
  .preview-mini-card:first-child {
    background: linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2));
    border-color: rgba(124,58,237,0.3);
  }
  .preview-mini-card:nth-child(2) {
    background: linear-gradient(135deg, rgba(6,182,212,0.2),#7260A7);
    border-color: rgba(6,182,212,0.3);
  }
  .pmc-label { font-size: 0.68rem; color: var(--muted); margin-bottom: 4px; }
  .pmc-value { font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 800; }

  /* ── FOOTER ── */
  .footer { background: #050508; padding: 64px 24px 32px; }
  .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 60px; margin-bottom: 56px; }
  .footer-brand-text { font-size: 0.9rem; color: var(--muted); line-height: 1.7; margin-top: 16px; max-width: 280px; }
  .footer-col-title { font-family: 'Syne', sans-serif; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 20px; }
  .footer-col a { display: block; color: var(--muted); text-decoration: none; font-size: 0.9rem; margin-bottom: 12px; transition: color 0.2s; }
  .footer-col a:hover { color: var(--text); }
  .footer-bottom { border-top: 1px solid var(--border); padding-top: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
  .footer-bottom-left { font-size: 0.83rem; color: var(--muted); }
  .footer-bottom-right { font-size: 0.78rem; color: rgba(167,139,250,0.6); }

  /* ── MOBILE MENU ── */
  .mobile-menu {
    position: fixed; inset: 0; z-index: 200; background: #7260A7;
    backdrop-filter: blur(20px);
    display: flex; flex-direction: column; padding: 100px 32px 40px;
    transform: translateX(100%); transition: transform 0.35s ease;
  }
  .mobile-menu.open { transform: translateX(0); }
  .mobile-close { position: absolute; top: 24px; right: 24px; background: none; border: none; color: var(--text); font-size: 1.5rem; cursor: pointer; }
  .mobile-links { display: flex; flex-direction: column; gap: 8px; margin-bottom: 40px; }
  .mobile-links a { color: var(--text); font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 700; text-decoration: none; padding: 12px 0; border-bottom: 1px solid var(--border); transition: color 0.2s; }
  .mobile-links a:hover { color: #A78BFA; }
  .mobile-actions { display: flex; flex-direction: column; gap: 12px; }

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .nav-links, .nav-actions { display: none; }
    .nav-mobile-toggle { display: flex; }
    .hero-container { grid-template-columns: 1fr; gap: 48px; }
    .hero-visual { display: none; }
    .themes-grid { grid-template-columns: 1fr 1fr; }
    .objectif-grid, .steps-grid { grid-template-columns: 1fr; }
    .objectif-visual { display: none; }
    .footer-grid { grid-template-columns: 1fr 1fr; gap: 40px; }
    .footer-grid > div:first-child { grid-column: 1 / -1; }
    .live-card { flex-direction: column; align-items: flex-start; }
  }
  @media (max-width: 600px) {
    .themes-grid { grid-template-columns: 1fr; }
    .hero h1 { font-size: 2.4rem; }
    .hero-stats { gap: 20px; }
    .stat-divider { display: none; }
  }
`;

/* ─── COMPONENTS ─────────────────────────────────────────── */
function StyleInjector() {
  useEffect(() => {
    const id = "swafy-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = css;
      document.head.appendChild(el);
    }
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, []);
  return null;
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-dot" />
      <span>SWAFY</span>
    </div>
  );
}

function HeroCard() {
  return (
    <div className="hero-visual">
      {/* Floating badges */}
      <div className="float-badge float-badge-1">
        <div className="float-icon float-icon-ai">🤖</div>
        <div>
          <div className="float-num">+1200</div>
          <div className="float-text">Jeunes formés</div>
        </div>
      </div>

      <div className="glass-card-hero">
        <div className="card-header">
          <div className="card-badge">
            <div className="live-pulse" /> En Direct
          </div>
          <div className="card-menu">⋯</div>
        </div>
        <div className="card-title">Formation & Innovation</div>
        <div className="card-sub">Parcours IA · Sécurité · Support · Tech</div>

        <div className="card-progress">
          <div className="progress-label">
            <span>Progression globale</span>
            <span style={{ color: "#A78BFA", fontWeight: 600 }}>68%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: "68%" }} />
          </div>
        </div>

        <div className="mini-modules">
          <div className="mini-mod"><div className="mini-mod-icon">🧠</div>IA</div>
          <div className="mini-mod"><div className="mini-mod-icon">🔐</div>Sécurité</div>
          <div className="mini-mod"><div className="mini-mod-icon">⚡</div>Innovation</div>
        </div>

        <div className="card-footer">
          <div className="avatars">
            {["AH", "SM", "KR", "IB"].map((l, i) => (
              <div key={i} className="avatar">{l}</div>
            ))}
          </div>
          <Link className="card-cta" to="/register">
            Rejoindre <FiChevronRight />
          </Link>
        </div>
      </div>

      <div className="float-badge float-badge-2">
        <div className="float-icon float-icon-award">🏆</div>
        <div>
          <div className="float-num">98%</div>
          <div className="float-text">Satisfaction</div>
        </div>
      </div>
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <header className={`nav-wrap ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-inner">
          <Link to="/swafy" style={{ textDecoration: "none" }}>
            <Brand />
          </Link>

          <nav className="nav-links">
            {["accueil", "direct", "thematique", "objectif", "contact"].map((item) => (
              <a key={item} href={`#${item}`}>{item}</a>
            ))}
          </nav>

          <div className="nav-actions">
            <Link className="btn-ghost" to="/register">Register</Link>
            <Link className="btn-primary-sm" to="/login">Sign in</Link>
          </div>

          <button className="nav-mobile-toggle" onClick={() => setMenuOpen(true)}>
            <FiMenu />
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <button className="mobile-close" onClick={() => setMenuOpen(false)}><FiX /></button>
        <nav className="mobile-links">
          {["accueil", "direct", "thematique", "objectif", "contact"].map((item) => (
            <a key={item} href={`#${item}`} onClick={() => setMenuOpen(false)}>{item}</a>
          ))}
        </nav>
        <div className="mobile-actions">
          <Link className="btn-outline-lg" to="/register" onClick={() => setMenuOpen(false)}>Register</Link>
          <Link className="btn-primary-lg" to="/login" onClick={() => setMenuOpen(false)}>Sign in</Link>
        </div>
      </div>
    </>
  );
}

function Hero() {
  return (
    <section className="hero" id="accueil">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="container">
        <div className="hero-container">
          <div className="hero-text">
            <div className="hero-tag">
              <div className="live-pulse" />
              Agence de Tunis · Débat IA Jeunes
            </div>

            <h1>
              Science With<br />
              and For{" "}
              <span className="gradient-text">Youth</span>
            </h1>

            <p className="hero-desc">
              منصة SWAFY تقود شباب تونس نحو الاقتصاد الرقمي — تعلّم،
              تطبيق، وتحدّيات في الذكاء الاصطناعي والأمن الرقمي.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="btn-primary-lg">
                Créer un compte <FiArrowRight />
              </Link>
              <Link to="/login" className="btn-outline-lg">
                J'ai déjà un compte
              </Link>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <span className="stat-num">1.2K+</span>
                <span className="stat-label">Jeunes inscrits</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-num">24/7</span>
                <span className="stat-label">Support actif</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-num">98%</span>
                <span className="stat-label">Satisfaction</span>
              </div>
            </div>
          </div>

          <HeroCard />
        </div>
      </div>
    </section>
  );
}

function LiveCard() {
  return (
    <section id="direct" className="live-section">
      <div className="container">
        <div className="live-card">
          <div className="live-left">
            <div className="live-dot-wrap">
              <div className="live-dot" />
            </div>
            <div>
              <div className="live-label">● En Direct</div>
              <div className="live-title">Session : Maintenance & Support IA</div>
              <div className="live-subtitle">Statut en temps réel · Assistance instantanée</div>
            </div>
          </div>

          <div className="live-right">
            <div className="live-pill"><FiCpu /> Intelligence Artificielle</div>
            <div className="live-pill"><FiShield /> Cybersécurité</div>
            <button className="live-btn">
              Rejoindre <FiArrowRight />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const themes = [
  { icon: <FiMessageCircle />, name: "Support", desc: "User-friendly · Assistance rapide" },
  { icon: <FiZap />,           name: "Innovation", desc: "Fast · Prototyping · Créativité" },
  { icon: <FiClock />,         name: "24/7 Access", desc: "Disponible à tout moment" },
  { icon: <FiShield />,        name: "Sécurité", desc: "Formation gratuite · Cyberdéfense" },
];

function Thematique() {
  return (
    <section id="thematique" className="section">
      <div className="container">
        <div className="section-eyebrow">
          <div className="section-eyebrow-line" /> Les thématiques
        </div>
        <h2 className="section-title">
          Parcours pensés<br />pour les jeunes
        </h2>
        <p className="section-desc">
          Des modules simples et structurés : support, IA, sécurité et innovation —
          adaptés au rythme des jeunes tunisiens.
        </p>

        <div className="themes-grid">
          {themes.map(({ icon, name, desc }) => (
            <div className="theme-card" key={name}>
              <div className="theme-icon-wrap">{icon}</div>
              <div className="theme-name">{name}</div>
              <div className="theme-desc">{desc}</div>
              <div className="theme-arrow"><FiArrowRight /></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PhoneMock({ variant }) {
  return (
    <div className={`phone-card ${variant === "b" ? "phone-b" : "phone-a"}`}>
      <div className="phone-header"><div className="phone-notch" /></div>
      <div className="phone-body">
        <div className="phone-screen-card">
          <div className="ps-new">New</div>
          <div className="ps-title">Nouvelles Formations & Communauté</div>
          <div className="ps-sub">Apprends · Construis · Partage</div>
          <div className="ps-btn">Démarrer →</div>
        </div>
        <div className="phone-tiles">
          <div className="phone-tile" />
          <div className="phone-tile" />
          <div className="phone-tile" />
        </div>
        <div>
          <div className="phone-list-item" />
          <div className="phone-list-item" />
          <div className="phone-list-item" />
        </div>
      </div>
    </div>
  );
}

function Objectif() {
  return (
    <section id="objectif" className="section-alt">
      <div className="container">
        <div className="objectif-grid">
          <div className="objectif-visual">
            <div className="phone-stack">
              <PhoneMock variant="a" />
              <PhoneMock variant="b" />
            </div>
          </div>

          <div className="objectif-content">
            <div className="section-eyebrow">
              <div className="section-eyebrow-line" /> Notre objectif
            </div>
            <h2 className="section-title">
              Accompagner<br />la jeunesse<br />
              <span style={{ backgroundImage: "linear-gradient(135deg, #A78BFA, #06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                tunisienne
              </span>
            </h2>
            <p className="objectif-text">
              نعاونو الشباب باش يكتسب مهارات رقمية، يشارك في challenges،
              ويمشي في مسار واضح: تعلم → تطبيق → تقييم. SWAFY هي
              وجهتكم للنجاح الرقمي في تونس.
            </p>
            <div className="store-row">
              <a className="store-btn" href="#!"><span>🍎</span> App Store</a>
              <a className="store-btn" href="#!"><span>🤖</span> Google Play</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Steps() {
  const steps = [
    { num: "1", title: "Choisis une thématique", desc: "IA, support, sécurité, innovation… explore les parcours disponibles." },
    { num: "2", title: "Apprends & pratique", desc: "Mini modules interactifs, tâches concrètes et feedback instantané." },
    { num: "3", title: "Décroche ton certificat", desc: "Suivi de progression + système de badges + certification officielle." },
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="steps-grid">
          <div className="steps-content">
            <div className="section-eyebrow">
              <div className="section-eyebrow-line" /> Comment ça marche
            </div>
            <h2 className="section-title">
              Commence en<br />3 étapes simples
            </h2>

            {steps.map(({ num, title, desc }, i) => (
              <div className="step-item" key={num}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div className="step-num-wrap">{num}</div>
                  {i < steps.length - 1 && <div className="step-connector" />}
                </div>
                <div className="step-body">
                  <div className="step-title">{title}</div>
                  <div className="step-desc">{desc}</div>
                </div>
              </div>
            ))}

            <Link className="btn-primary-lg" to="/register" style={{ marginTop: 8 }}>
              Commencer la formation <FiArrowRight />
            </Link>
          </div>

          <div className="steps-visual">
            <div className="preview-top">
              <div className="preview-dots">
                <div className="preview-dot" />
                <div className="preview-dot" />
                <div className="preview-dot" />
              </div>
              <div className="preview-label">SWAFY Platform</div>
            </div>
            <div className="preview-hero-bar" />
            <div className="preview-bar w80" />
            <div className="preview-bar w60" />
            <div className="preview-bar w90" />
            <div className="preview-cards">
              <div className="preview-mini-card">
                <div className="pmc-label">Modules complétés</div>
                <div className="pmc-value">24</div>
              </div>
              <div className="preview-mini-card">
                <div className="pmc-label">Score moyen</div>
                <div className="pmc-value">91%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="contact" className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Brand />
            <p className="footer-brand-text">
              SWAFY — Agence de Tunis. Science with and for youth.
              Plateforme de débat sur l'intelligence artificielle pour les jeunes.
            </p>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">À propos</div>
            <a href="#objectif">Objectif</a>
            <a href="#thematique">Thématique</a>
            <a href="#direct">En Direct</a>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Services</div>
            <a href="#!">Support</a>
            <a href="#!">Formation</a>
            <a href="#!">Communauté</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-bottom-left">© {new Date().getFullYear()} SWAFY · Tunis, Tunisie</span>
          <span className="footer-bottom-right">Built with React · Designed for Youth</span>
        </div>
      </div>
    </footer>
  );
}

/* ─── PAGE ────────────────────────────────────────────────── */
export default function Accueil() {
  return (
    <>
      <StyleInjector />
      <div className="noise" />
      <Navbar />
      <main>
        <Hero />
        <LiveCard />
        <Thematique />
        <Objectif />
        <Steps />
      </main>
      <Footer />
    </>
  );
}
