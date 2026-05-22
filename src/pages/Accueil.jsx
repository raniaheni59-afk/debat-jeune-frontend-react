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
  --violet: #7260A7;
  --indigo: #5B4D8E;
  --pink: #C084B8;
  --cyan: #4A9FB5;
  --amber: #E8A05D;
  --bg: #FFFFFF;
  --surface: #F8F9FB;
  --glass: rgba(114, 96, 167, 0.05);
  --glass-b: rgba(114, 96, 167, 0.12);
  --text: #1A1A2E;
  --muted: #5A5A6E;
  --border: rgba(114, 96, 167, 0.15);
  --r-sm: 12px;
  --r-md: 20px;
  --r-lg: 32px;
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
::-webkit-scrollbar-track { background: #F0F0F5; }
::-webkit-scrollbar-thumb { background: var(--violet); border-radius: 2px; }

/* ── NOISE OVERLAY ── */
.noise {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E");
  background-size: 180px;
  opacity: 0.3;
}

/* ── GLOW ORBS ── */
.orb {
  position: absolute; border-radius: 50%; filter: blur(120px);
  pointer-events: none; will-change: transform; opacity: 0.4;
}
.orb-1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(114,96,167,0.15) 0%, transparent 70%);
  top: -200px; right: -100px; animation: drift 12s ease-in-out infinite alternate;
}
.orb-2 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(74,159,181,0.12) 0%, transparent 70%);
  bottom: 0; left: -150px; animation: drift 15s ease-in-out infinite alternate-reverse;
}
.orb-3 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(192,132,184,0.1) 0%, transparent 70%);
  top: 40%; left: 40%; animation: drift 10s ease-in-out infinite alternate;
}

@keyframes drift {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(40px, 30px) scale(1.08); }
}

/* ── NAV ── */
.nav-wrap {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding: 0 24px;
  transition: all 0.4s ease;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(20px);
}
.nav-wrap.scrolled {
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 2px 20px rgba(114,96,167,0.08);
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
  background: linear-gradient(135deg, var(--violet), var(--indigo));
  box-shadow: 0 0 12px rgba(114,96,167,0.5);
}
.nav-links {
  display: flex; gap: 36px; align-items: center;
}
.nav-links a {
  color: var(--muted); font-size: 0.88rem; font-weight: 500;
  text-decoration: none; letter-spacing: 0.02em; text-transform: uppercase;
  transition: color 0.2s;
}
.nav-links a:hover { color: var(--violet); }
.nav-actions { display: flex; gap: 12px; align-items: center; }
.btn-ghost {
  padding: 9px 20px; border-radius: 50px; border: 1px solid var(--border);
  color: var(--text); font-size: 0.875rem; font-weight: 500;
  text-decoration: none; transition: all 0.2s; cursor: pointer;
  background: transparent;
}
.btn-ghost:hover { border-color: var(--violet); color: var(--violet); background: rgba(114,96,167,0.05); }
.btn-primary-sm {
  padding: 10px 22px; border-radius: 50px;
  background: linear-gradient(135deg, var(--violet), var(--indigo));
  color: #fff; font-size: 0.875rem; font-weight: 600;
  text-decoration: none; border: none; cursor: pointer;
  box-shadow: 0 4px 16px rgba(114,96,167,0.25);
  transition: all 0.25s;
}
.btn-primary-sm:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(114,96,167,0.35); }
.nav-mobile-toggle {
  display: none; background: none; border: none; color: var(--text);
  font-size: 1.4rem; cursor: pointer; padding: 6px;
}


/* ── PARTNERS BAR (top) ── */
.partners-bar {
  background: #fff;
  border-bottom: 1px solid var(--border);
  padding: 10px 24px;
  z-index: 101; position: relative;
}
.partners-bar-inner {
  max-width: 1180px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 12px;
}
.partners-bar-left {
  font-size: 0.72rem; color: var(--muted); font-style: italic;
  font-weight: 500;
}
.partners-logos {
  display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
}
.partners-logos img {
  height: 36px; object-fit: contain; opacity: 0.85;
  transition: opacity 0.2s;
}
.partners-logos img:hover { opacity: 1; }
.partner-divider { width: 1px; height: 28px; background: var(--border); }

/* ── FOOTER LOGOS ── */
.footer-partners {
  border-top: 1px solid rgba(114,96,167,0.12);
  padding-top: 32px; margin-top: 32px;
}
.footer-partners-title {
  font-size: 0.72rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--muted); margin-bottom: 20px; text-align: center;
}
.footer-logos-row {
  display: flex; align-items: center; justify-content: center;
  gap: 28px; flex-wrap: wrap;
}
.footer-logos-row img {
  height: 40px; object-fit: contain; opacity: 0.65;
  filter: grayscale(20%); transition: all 0.2s;
}
.footer-logos-row img:hover { opacity: 1; filter: grayscale(0%); }
.footer-eu-funded {
  display: flex; align-items: center; gap: 10px;
  background: rgba(0,82,204,0.06); border: 1px solid rgba(0,82,204,0.15);
  border-radius: 10px; padding: 10px 16px;
  font-size: 0.78rem; color: #0052cc; font-weight: 600;
}

/* ── SWAFY LOGO in navbar ── */
.brand-logo { height: 32px; object-fit: contain; }

/* ── HERO ── */
.hero {
  position: relative; min-height: 100vh;
  display: flex; align-items: center;
  padding: 120px 24px 80px;
  overflow: hidden;
  background: linear-gradient(180deg, #FFFFFF 0%, #F8F9FB 100%);
}
.hero-container {
  max-width: 1180px; margin: 0 auto; width: 100%;
  display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;
}
.hero-tag {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 16px; border-radius: 50px;
  border: 1px solid rgba(114,96,167,0.25);
  background: rgba(114,96,167,0.08);
  font-size: 0.78rem; font-weight: 600; color: var(--violet);
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
  margin-bottom: 24px; color: var(--text);
  animation: fadeUp 0.8s 0.1s ease both;
}
.hero h1 .gradient-text {
  background: linear-gradient(135deg, #7260A7 0%, #4A9FB5 50%, #C084B8 100%);
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
  box-shadow: 0 6px 24px rgba(114,96,167,0.3);
  transition: all 0.3s; position: relative; overflow: hidden;
}
.btn-primary-lg::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
  transform: translateX(-100%); transition: transform 0.4s;
}
.btn-primary-lg:hover::before { transform: translateX(0); }
.btn-primary-lg:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(114,96,167,0.4); }
.btn-outline-lg {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 15px 32px; border-radius: 50px;
  border: 1.5px solid var(--border);
  color: var(--text); font-size: 1rem; font-weight: 500;
  text-decoration: none; transition: all 0.25s;
  background: #FFFFFF;
}
.btn-outline-lg:hover { 
  border-color: var(--violet); 
  background: rgba(114,96,167,0.05);
  transform: translateY(-1px);
}

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
  to { opacity: 1; transform: translateX(0); }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.glass-card-hero {
  background: rgba(255,255,255,0.95);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  backdrop-filter: blur(20px);
  padding: 32px; width: 100%; max-width: 440px;
  box-shadow: 0 20px 60px rgba(114,96,167,0.15), inset 0 1px 0 rgba(255,255,255,0.8);
  animation: float 6s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
}
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.card-badge {
  padding: 5px 12px; border-radius: 50px;
  background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25);
  font-size: 0.75rem; font-weight: 600; color: #059669; display: flex; align-items: center; gap: 6px;
}
.card-menu { color: var(--muted); font-size: 1.1rem; cursor: pointer; }
.card-title {
  font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 700;
  margin-bottom: 8px; line-height: 1.3; color: var(--text);
}
.card-sub { font-size: 0.875rem; color: var(--muted); margin-bottom: 24px; }
.card-progress { margin-bottom: 24px; }
.progress-label { display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--muted); margin-bottom: 8px; }
.progress-bar { height: 6px; background: rgba(114,96,167,0.1); border-radius: 3px; overflow: hidden; }
.progress-fill {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, var(--violet), var(--cyan));
  animation: grow 2s 1s ease both;
}
@keyframes grow { from { width: 0%; } }

.mini-modules { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.mini-mod {
  background: rgba(114,96,167,0.05); border: 1px solid var(--border); border-radius: var(--r-sm);
  padding: 14px 10px; text-align: center; font-size: 0.78rem; font-weight: 500;
  color: var(--muted); transition: all 0.2s; cursor: pointer;
}
.mini-mod:hover { background: rgba(114,96,167,0.12); border-color: var(--violet); color: var(--text); }
.mini-mod-icon { font-size: 1.2rem; margin-bottom: 6px; }

.card-footer { display: flex; justify-content: space-between; align-items: center; }
.avatars { display: flex; }
.avatar {
  width: 30px; height: 30px; border-radius: 50%;
  border: 2px solid #fff; margin-left: -8px;
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
.card-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(114,96,167,0.35); }

/* floating badges */
.float-badge {
  position: absolute; display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,0.98); border: 1px solid var(--border);
  border-radius: var(--r-sm); padding: 12px 16px;
  backdrop-filter: blur(16px);
  box-shadow: 0 12px 32px rgba(114,96,167,0.2);
  font-size: 0.82rem; font-weight: 500;
}
.float-badge-1 { top: -20px; left: -30px; animation: float 7s 1s ease-in-out infinite; }
.float-badge-2 { bottom: -20px; right: -30px; animation: float 8s 2s ease-in-out infinite; }
.float-icon {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem;
}
.float-icon-ai { background: linear-gradient(135deg, rgba(114,96,167,0.15), rgba(91,77,142,0.1)); }
.float-icon-award { background: linear-gradient(135deg, rgba(232,160,93,0.15), rgba(192,132,184,0.1)); }
.float-num { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 800; color: var(--text); }
.float-text { font-size: 0.72rem; color: var(--muted); }

/* ── SECTION COMMON ── */
.section { padding: 100px 24px; position: relative; background: #FFFFFF; }
.section-alt { padding: 100px 24px; background: var(--surface); position: relative; }
.container { max-width: 1180px; margin: 0 auto; }
.section-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 0.75rem; font-weight: 600; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--violet); margin-bottom: 16px;
}
.section-eyebrow-line { width: 24px; height: 1px; background: var(--violet); }
.section-title {
  font-family: 'Syne', sans-serif; font-size: clamp(2rem, 3.5vw, 3rem);
  font-weight: 800; letter-spacing: -0.025em; line-height: 1.15;
  margin-bottom: 16px; color: var(--text);
}
.section-desc { font-size: 1rem; color: var(--muted); max-width: 520px; line-height: 1.7; }

/* ── LIVE SECTION ── */
.live-section { padding: 48px 24px; background: #FFFFFF; }
.live-card {
  background: linear-gradient(135deg, rgba(114,96,167,0.08), rgba(74,159,181,0.05));
  border: 1px solid rgba(114,96,167,0.2);
  border-radius: var(--r-lg); padding: 32px 40px;
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: 20px; backdrop-filter: blur(10px);
  position: relative; overflow: hidden;
}
.live-card::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, transparent 60%, rgba(74,159,181,0.05));
  pointer-events: none;
}
.live-left { display: flex; align-items: center; gap: 16px; }
.live-indicator { display: flex; align-items: center; gap: 8px; }
.live-dot-wrap {
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25);
  display: flex; align-items: center; justify-content: center;
}
.live-dot { width: 12px; height: 12px; border-radius: 50%; background: #10B981; animation: pulse 2s infinite; }
.live-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #059669; font-weight: 600; }
.live-title { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 700; color: var(--text); }
.live-subtitle { font-size: 0.875rem; color: var(--muted); margin-top: 4px; }
.live-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.live-pill {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-radius: 50px;
  background: rgba(255,255,255,0.8); border: 1px solid var(--border);
  font-size: 0.83rem; color: var(--text);
}
.live-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 24px; border-radius: 50px;
  background: linear-gradient(135deg, var(--violet), var(--indigo));
  color: #fff; font-weight: 600; font-size: 0.875rem;
  border: none; cursor: pointer;
  box-shadow: 0 6px 20px rgba(114,96,167,0.25); transition: all 0.25s;
}
.live-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(114,96,167,0.35); }

/* ── THEMES ── */
.themes-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 56px; }
.theme-card {
  background: #FFFFFF; border: 1px solid var(--border);
  border-radius: var(--r-md); padding: 28px 24px;
  transition: all 0.3s; cursor: pointer; position: relative; overflow: hidden;
  box-shadow: 0 2px 8px rgba(114,96,167,0.06);
}
.theme-card::before {
  content: ''; position: absolute; inset: 0; opacity: 0;
  background: linear-gradient(135deg, rgba(114,96,167,0.08), rgba(74,159,181,0.04));
  transition: opacity 0.3s;
}
.theme-card:hover::before { opacity: 1; }
.theme-card:hover { border-color: var(--violet); transform: translateY(-4px); box-shadow: 0 16px 40px rgba(114,96,167,0.15); }
.theme-icon-wrap {
  width: 52px; height: 52px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.3rem; margin-bottom: 20px;
  background: linear-gradient(135deg, rgba(114,96,167,0.12), rgba(91,77,142,0.08));
  border: 1px solid rgba(114,96,167,0.15);
  transition: all 0.3s; color: var(--violet);
}
.theme-card:hover .theme-icon-wrap {
  background: linear-gradient(135deg, var(--violet), var(--indigo));
  border-color: transparent; box-shadow: 0 8px 24px rgba(114,96,167,0.3);
  color: #fff;
}
.theme-name { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 700; margin-bottom: 6px; color: var(--text); }
.theme-desc { font-size: 0.84rem; color: var(--muted); }
.theme-arrow { position: absolute; top: 24px; right: 24px; color: var(--muted); font-size: 1rem; transition: all 0.2s; }
.theme-card:hover .theme-arrow { color: var(--violet); transform: translate(2px, -2px); }

/* ── OBJECTIF ── */
.objectif-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
.objectif-visual { position: relative; }
.phone-stack { position: relative; height: 420px; }
.phone-card {
  position: absolute; width: 220px;
  background: rgba(255,255,255,0.98); border: 1px solid var(--border);
  border-radius: 24px; overflow: hidden;
  box-shadow: 0 24px 60px rgba(114,96,167,0.2);
}
.phone-a { top: 0; left: 20px; animation: float 7s ease-in-out infinite; z-index: 2; }
.phone-b { top: 60px; left: 160px; animation: float 9s 1.5s ease-in-out infinite; opacity: 0.9; z-index: 1; }
.phone-header { height: 12px; background: rgba(114,96,167,0.05); position: relative; }
.phone-notch { width: 50px; height: 6px; background: rgba(114,96,167,0.12); border-radius: 3px; margin: 3px auto; }
.phone-body { padding: 16px; }
.phone-screen-card {
  background: linear-gradient(135deg, rgba(114,96,167,0.15), rgba(74,159,181,0.1));
  border-radius: 12px; padding: 16px; margin-bottom: 12px;
}
.ps-new { font-size: 0.6rem; background: rgba(114,96,167,0.2); color: var(--violet); padding: 2px 8px; border-radius: 20px; display: inline-block; margin-bottom: 8px; font-weight: 600; }
.ps-title { font-size: 0.75rem; font-weight: 700; margin-bottom: 4px; color: var(--text); }
.ps-sub { font-size: 0.62rem; color: var(--muted); }
.ps-btn { margin-top: 12px; background: var(--violet); color: #fff; font-size: 0.65rem; font-weight: 700; padding: 6px 14px; border-radius: 20px; display: inline-block; }
.phone-tiles { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 10px; }
.phone-tile { height: 36px; background: rgba(114,96,167,0.08); border: 1px solid var(--border); border-radius: 8px; }
.phone-list-item { height: 10px; background: rgba(114,96,167,0.08); border-radius: 5px; margin-bottom: 6px; }
.phone-list-item:last-child { width: 60%; }

.objectif-content .section-title { margin-bottom: 20px; }
.objectif-text { font-size: 1.05rem; color: var(--muted); line-height: 1.8; margin-bottom: 32px; }
.store-row { display: flex; gap: 14px; }
.store-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 22px; border-radius: var(--r-sm);
  background: #FFFFFF; border: 1px solid var(--border);
  color: var(--text); text-decoration: none; font-weight: 600;
  font-size: 0.875rem; transition: all 0.25s;
  box-shadow: 0 2px 8px rgba(114,96,167,0.06);
}
.store-btn:hover { background: rgba(114,96,167,0.08); border-color: var(--violet); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(114,96,167,0.15); }

/* ── STEPS ── */
.steps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
.steps-content .section-title { margin-bottom: 40px; }
.step-item { display: flex; gap: 20px; margin-bottom: 32px; }
.step-num-wrap {
  flex-shrink: 0; width: 44px; height: 44px; border-radius: 50%;
  background: linear-gradient(135deg, var(--violet), var(--indigo));
  display: flex; align-items: center; justify-content: center;
  font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1rem; color: #fff;
  box-shadow: 0 6px 20px rgba(114,96,167,0.3);
  position: relative; flex-shrink: 0;
}
.step-connector {
  position: absolute; top: 44px; left: 50%; transform: translateX(-50%);
  width: 2px; height: 32px; background: linear-gradient(to bottom, rgba(114,96,167,0.4), transparent);
}
.step-body { padding-top: 10px; }
.step-title { font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 700; margin-bottom: 6px; color: var(--text); }
.step-desc { font-size: 0.88rem; color: var(--muted); line-height: 1.6; }

.steps-visual {
  background: #FFFFFF; border: 1px solid var(--border);
  border-radius: var(--r-lg); padding: 32px; overflow: hidden;
  position: relative; min-height: 360px;
  box-shadow: 0 8px 32px rgba(114,96,167,0.1);
}
.steps-visual::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 0%, rgba(114,96,167,0.08) 0%, transparent 60%);
}
.preview-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.preview-dots { display: flex; gap: 6px; }
.preview-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(114,96,167,0.15); }
.preview-dot:first-child { background: #EF4444; }
.preview-dot:nth-child(2) { background: #F59E0B; }
.preview-dot:nth-child(3) { background: #10B981; }
.preview-label { font-size: 0.75rem; color: var(--muted); font-weight: 500; letter-spacing: 0.05em; }
.preview-hero-bar { height: 10px; background: linear-gradient(90deg, rgba(114,96,167,0.4), rgba(74,159,181,0.2)); border-radius: 5px; margin-bottom: 12px; }
.preview-bar { height: 7px; background: rgba(114,96,167,0.08); border-radius: 3.5px; margin-bottom: 8px; }
.preview-bar.w80 { width: 80%; }
.preview-bar.w60 { width: 60%; }
.preview-bar.w90 { width: 90%; }
.preview-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
.preview-mini-card {
  background: rgba(114,96,167,0.05); border: 1px solid var(--border);
  border-radius: var(--r-sm); padding: 16px;
  aspect-ratio: 1.4;
  display: flex; flex-direction: column; justify-content: flex-end;
  position: relative; overflow: hidden;
}
.preview-mini-card:first-child {
  background: linear-gradient(135deg, rgba(114,96,167,0.15), rgba(91,77,142,0.1));
  border-color: rgba(114,96,167,0.2);
}
.preview-mini-card:nth-child(2) {
  background: linear-gradient(135deg, rgba(74,159,181,0.12), rgba(16,185,129,0.08));
  border-color: rgba(74,159,181,0.2);
}
.pmc-label { font-size: 0.68rem; color: var(--muted); margin-bottom: 4px; }
.pmc-value { font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 800; color: var(--text); }

/* ── FOOTER ── */
.footer { background: #F8F9FB; padding: 64px 24px 32px; border-top: 1px solid var(--border); }
.footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 60px; margin-bottom: 56px; }
.footer-brand-text { font-size: 0.9rem; color: var(--muted); line-height: 1.7; margin-top: 16px; max-width: 280px; }
.footer-col-title { font-family: 'Syne', sans-serif; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text); margin-bottom: 20px; }
.footer-col a { display: block; color: var(--muted); text-decoration: none; font-size: 0.9rem; margin-bottom: 12px; transition: color 0.2s; }
.footer-col a:hover { color: var(--violet); }
.footer-bottom { border-top: 1px solid var(--border); padding-top: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.footer-bottom-left { font-size: 0.83rem; color: var(--muted); }
.footer-bottom-right { font-size: 0.78rem; color: var(--violet); }

/* ── MOBILE MENU ── */
.mobile-menu {
  position: fixed; inset: 0; z-index: 200; background: rgba(255,255,255,0.98);
  backdrop-filter: blur(20px);
  display: flex; flex-direction: column; padding: 100px 32px 40px;
  transform: translateX(100%); transition: transform 0.35s ease;
}
.mobile-menu.open { transform: translateX(0); }
.mobile-close { position: absolute; top: 24px; right: 24px; background: none; border: none; color: var(--text); font-size: 1.5rem; cursor: pointer; }
.mobile-links { display: flex; flex-direction: column; gap: 8px; margin-bottom: 40px; }
.mobile-links a { color: var(--text); font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 700; text-decoration: none; padding: 12px 0; border-bottom: 1px solid var(--border); transition: color 0.2s; }
.mobile-links a:hover { color: var(--violet); }
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

/* ─── COMPONENTS (reste identique) ─────────────────────────────────────────── */
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
            <span style={{ color: "#7260A7", fontWeight: 600 }}>68%</span>
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
  { icon: <FiTrendingUp />, name: "Recherche partenariale", desc: "Stimuler l'employabilité des jeunes chercheurs à travers une recherche inclusive et structurée." },
  { icon: <FiZap />,         name: "Entrepreneuriat & Créativité", desc: "Renforcer l'esprit d'entrepreneuriat, d'innovation et de créativité chez les jeunes tunisiens." },
  { icon: <FiUsers />,       name: "Jeunesse Créative", desc: "Dynamiser le tissu associatif Jeunesse-Science dans tous les gouvernorats de Tunisie." },
  { icon: <FiAward />,       name: "Clubs Scientifiques", desc: "Création et restructuration de clubs scientifiques dans les établissements éducatifs publics." },
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
              <span style={{ backgroundImage: "linear-gradient(135deg, #7260A7, #4A9FB5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                tunisienne
              </span>
            </h2>
            <p className="objectif-text">
              SWAFY est un projet financé par l'Union européenne (9,5 M€ · 48 mois),
              géré par l'ANPR, visant à contribuer à l'amélioration de la valeur ajoutée
              de la recherche et l'innovation dans le développement économique tunisien,
              et à soutenir l'entrepreneuriat et l'employabilité des jeunes à travers
              le renforcement de l'esprit de créativité et d'invention.
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

        {/* Partner logos */}
        <div className="footer-partners">
          <div className="footer-partners-title">Partenaires & Financeurs</div>
          <div className="footer-logos-row">
            <div className="footer-eu-funded">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Flag_of_Europe.svg/40px-Flag_of_Europe.svg.png"
                   alt="EU" style={{height:24}} />
              Projet financé par l'Union européenne
            </div>
            <img src="/logo_150-04__1_.png" alt="SWAFY" />
            <span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:"1.1rem",color:"#0066cc"}}>
              ANPR
            </span>
            <span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:"0.9rem",color:"#0066cc"}}>
              EU4Youth
            </span>
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


function PartnersBar() {
  return (
    <div className="partners-bar">
      <div className="partners-bar-inner">
        <span className="partners-bar-left">logo<br/>Association</span>
        <div className="partners-logos">
          <img src="/logo_150-04__1_.png" alt="SWAFY" />
          <div className="partner-divider" />
          <img src="https://upload.wikimedia.org/wikipedia/fr/thumb/9/9a/ANPR_logo.png/120px-ANPR_logo.png"
               alt="ANPR" onError={e => { e.target.style.display='none' }} />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Flag_of_Europe.svg/80px-Flag_of_Europe.svg.png"
               alt="EU" style={{height:28}} />
          <span style={{fontSize:'0.65rem',color:'var(--muted)',maxWidth:80,lineHeight:1.2}}>
            Délégation de l'Union européenne en Tunisie
          </span>
          <div className="partner-divider" />
          <span style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'0.85rem',color:'#0066cc',letterSpacing:'-0.02em'}}>
            ≡EU<br/><span style={{fontSize:'0.72rem',fontWeight:600}}>4Youth</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── PAGE ────────────────────────────────────────────────── */
export default function Accueil() {
  return (
    <>
      <StyleInjector />
      <div className="noise" />
      <PartnersBar />
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
