import { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowLeft, FiPlay, FiUsers, FiHeadphones,
  FiAward, FiZap, FiX, FiChevronLeft, FiChevronRight,
  FiArrowRight,
} from "react-icons/fi";


/* ═══════════════════════════════════════════════
   GLOBAL CSS — injected once
═══════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:        #7260A7;
  --bg-deep:   #5a4d8a;
  --bg-light:  #8e7ec0;
  --glass:     rgba(255,255,255,0.10);
  --glass-b:   rgba(255,255,255,0.18);
  --glass-str: rgba(255,255,255,0.22);
  --border:    rgba(255,255,255,0.18);
  --text:      #ffffff;
  --text-soft: rgba(255,255,255,0.72);
  --text-mute: rgba(255,255,255,0.48);
  --accent:    #c8b8ff;
  --gold:      #FFD166;
  --teal:      #7FFFEE;
  --pink:      #FF8EC8;
  --r-sm:  12px;
  --r-md:  20px;
  --r-lg:  32px;
  --r-xl:  48px;
  --shadow: 0 24px 80px rgba(50,30,100,0.45);
}

html { scroll-behavior: smooth; }
body {
  font-family: 'DM Sans', sans-serif;
  background: var(--bg);
  color: var(--text);
  overflow-x: clip;
  min-height: 100vh;
}
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: var(--bg-deep); }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.35); border-radius: 2px; }

/* ── NOISE ── */
.sw-noise {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  background-size: 160px; opacity: 0.55;
}

/* ── ORBS ── */
.sw-orb {
  position: fixed; border-radius: 50%;
  filter: blur(90px); pointer-events: none; will-change: transform; z-index: 0;
}
.sw-orb-1 {
  width: 700px; height: 700px;
  background: radial-gradient(circle, rgba(200,184,255,0.28) 0%, transparent 65%);
  top: -260px; right: -180px;
  animation: sw-drift1 14s ease-in-out infinite alternate;
}
.sw-orb-2 {
  width: 550px; height: 550px;
  background: radial-gradient(circle, rgba(127,255,238,0.14) 0%, transparent 65%);
  bottom: 10%; left: -180px;
  animation: sw-drift2 18s ease-in-out infinite alternate;
}
.sw-orb-3 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(255,142,200,0.15) 0%, transparent 65%);
  top: 45%; left: 45%;
  animation: sw-drift3 11s ease-in-out infinite alternate;
}
.sw-orb-4 {
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(255,209,102,0.12) 0%, transparent 65%);
  bottom: 30%; right: 10%;
  animation: sw-drift1 9s 3s ease-in-out infinite alternate;
}

@keyframes sw-drift1 { from{transform:translate(0,0) scale(1)} to{transform:translate(50px,40px) scale(1.1)} }
@keyframes sw-drift2 { from{transform:translate(0,0) scale(1)} to{transform:translate(-40px,50px) scale(1.08)} }
@keyframes sw-drift3 { from{transform:translate(0,0) scale(1)} to{transform:translate(30px,-40px) scale(1.12)} }

/* ── GLASS UTILITY ── */
.sw-glass {
  background: var(--glass);
  border: 1px solid var(--border);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
}
.sw-glass-str {
  background: var(--glass-str);
  border: 1px solid rgba(255,255,255,0.25);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
}

/* ── PAGE WRAP ── */
.sw-page { position: relative; z-index: 1; overflow-x: clip; }
.sw-container { max-width: 1180px; margin: 0 auto; padding: 0 24px; }

/* ── NAV ── */
.sw-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding: 0 24px; transition: all 0.4s;
}
.sw-nav.scrolled {
  background: rgba(90,77,138,0.85);
  backdrop-filter: blur(24px);
  border-bottom: 1px solid var(--border);
}
.sw-nav-inner {
  max-width: 1180px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  height: 72px;
}
.sw-brand {
  display: flex; align-items: center; gap: 10px;
  font-family: 'Clash Display', sans-serif; font-weight: 700;
  font-size: 1.4rem; color: #fff; text-decoration: none; letter-spacing: -0.01em;
}
.sw-brand-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--teal));
  box-shadow: 0 0 14px rgba(200,184,255,0.8);
}
.sw-back {
  display: flex; align-items: center; gap: 8px;
  color: var(--text-soft); font-size: 0.88rem; font-weight: 500;
  text-decoration: none; transition: color 0.2s;
  padding: 8px 0;
}
.sw-back:hover { color: #fff; }
.sw-nav-actions { display: flex; gap: 12px; }
.sw-btn-ghost {
  padding: 9px 20px; border-radius: 50px;
  border: 1px solid var(--border); color: #fff;
  font-size: 0.875rem; font-weight: 500;
  text-decoration: none; background: var(--glass);
  backdrop-filter: blur(8px); transition: all 0.2s;
}
.sw-btn-ghost:hover { background: var(--glass-str); }
.sw-btn-pill {
  padding: 10px 22px; border-radius: 50px;
  background: rgba(255,255,255,0.95); color: var(--bg-deep);
  font-size: 0.875rem; font-weight: 700;
  text-decoration: none; border: none; cursor: pointer;
  transition: all 0.25s; box-shadow: 0 6px 24px rgba(0,0,0,0.2);
}
.sw-btn-pill:hover { transform: translateY(-1px); box-shadow: 0 10px 32px rgba(0,0,0,0.3); }

/* ── HERO ── */
.sw-hero {
  position: relative; min-height: 100vh;
  display: flex; align-items: center;
  padding: 140px 24px 100px;
}
.sw-hero-inner {
  max-width: 1180px; margin: 0 auto; width: 100%;
  display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;
}

/* hero text */
.sw-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 16px; border-radius: 50px;
  background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.22);
  font-size: 0.75rem; font-weight: 600; color: var(--accent);
  letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 28px;
  animation: sw-up 0.8s ease both;
}
.sw-pulse { width: 7px; height: 7px; border-radius: 50%; background: #7FFFEE; animation: sw-pulse 2s infinite; }
@keyframes sw-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.5)} }

.sw-hero h1 {
  font-family: 'Clash Display', sans-serif;
  font-size: clamp(3rem, 5.5vw, 5rem);
  font-weight: 700; line-height: 1.06; letter-spacing: -0.035em;
  margin-bottom: 24px; animation: sw-up 0.8s 0.08s ease both;
}
.sw-shimmer {
  background: linear-gradient(135deg, #fff 0%, var(--accent) 40%, var(--teal) 70%, var(--pink) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text; background-size: 200% 200%;
  animation: sw-shimmer 4s ease-in-out infinite alternate;
}
@keyframes sw-shimmer { from{background-position:0% 50%} to{background-position:100% 50%} }

.sw-hero-desc {
  color: var(--text-soft); font-size: 1.08rem; line-height: 1.75;
  max-width: 480px; margin-bottom: 40px;
  animation: sw-up 0.8s 0.16s ease both;
}
.sw-hero-actions { display: flex; gap: 14px; flex-wrap: wrap; animation: sw-up 0.8s 0.24s ease both; }
.sw-cta-primary {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 15px 32px; border-radius: 50px;
  background: rgba(255,255,255,0.95); color: var(--bg-deep);
  font-size: 1rem; font-weight: 700; text-decoration: none;
  border: none; cursor: pointer;
  box-shadow: 0 10px 36px rgba(0,0,0,0.25); transition: all 0.3s;
  position: relative; overflow: hidden;
}
.sw-cta-primary::before {
  content:''; position:absolute; inset:0;
  background: linear-gradient(135deg, rgba(200,184,255,0.2), transparent);
  transform: translateX(-100%); transition: transform 0.4s;
}
.sw-cta-primary:hover::before { transform: translateX(0); }
.sw-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(0,0,0,0.35); }
.sw-cta-secondary {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 15px 32px; border-radius: 50px;
  border: 1px solid rgba(255,255,255,0.35); color: #fff;
  font-size: 1rem; font-weight: 500; text-decoration: none;
  background: var(--glass); backdrop-filter: blur(8px); transition: all 0.25s;
}
.sw-cta-secondary:hover { background: var(--glass-b); }

/* hero stats */
.sw-hero-stats {
  display: flex; gap: 32px; margin-top: 48px;
  animation: sw-up 0.8s 0.32s ease both;
}
.sw-stat { display: flex; flex-direction: column; gap: 4px; }
.sw-stat-n {
  font-family: 'Clash Display', sans-serif; font-size: 1.9rem;
  font-weight: 700; color: #fff; letter-spacing: -0.02em;
}
.sw-stat-l { font-size: 0.78rem; color: var(--text-mute); font-weight: 400; }
.sw-stat-sep { width: 1px; background: rgba(255,255,255,0.2); }

/* hero visual — glass card */
.sw-hero-visual { animation: sw-right 0.9s 0.2s ease both; }
@keyframes sw-right { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
@keyframes sw-up    { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }

.sw-hero-card {
  border-radius: var(--r-lg); padding: 32px; position: relative;
  box-shadow: 0 32px 100px rgba(50,30,100,0.55), inset 0 1px 0 rgba(255,255,255,0.2);
  animation: sw-float 7s ease-in-out infinite;
}
@keyframes sw-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }

.sw-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
.sw-live-badge {
  display: flex; align-items: center; gap: 7px; padding: 6px 14px; border-radius: 50px;
  background: rgba(127,255,238,0.15); border: 1px solid rgba(127,255,238,0.3);
  font-size: 0.72rem; font-weight: 700; color: #7FFFEE; letter-spacing: 0.06em; text-transform: uppercase;
}
.sw-card-dots { display: flex; gap: 5px; }
.sw-card-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.25); }

.sw-card-title {
  font-family: 'Clash Display', sans-serif; font-size: 1.55rem;
  font-weight: 700; margin-bottom: 6px; letter-spacing: -0.02em;
}
.sw-card-sub { font-size: 0.875rem; color: var(--text-soft); margin-bottom: 24px; }

.sw-card-progress-label {
  display: flex; justify-content: space-between;
  font-size: 0.77rem; color: var(--text-soft); margin-bottom: 8px;
}
.sw-card-bar { height: 6px; background: rgba(255,255,255,0.12); border-radius: 3px; overflow: hidden; margin-bottom: 24px; }
.sw-card-bar-fill {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, var(--accent), var(--teal));
  animation: sw-bar-grow 2.5s 0.8s ease both;
}
@keyframes sw-bar-grow { from{width:0%} }

.sw-mini-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 24px; }
.sw-mini-tile {
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14);
  border-radius: var(--r-sm); padding: 14px 8px; text-align: center;
  cursor: pointer; transition: all 0.25s;
}
.sw-mini-tile:hover {
  background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.35);
  transform: translateY(-2px);
}
.sw-mini-tile-icon { font-size: 1.2rem; margin-bottom: 6px; }
.sw-mini-tile-label { font-size: 0.72rem; font-weight: 600; color: var(--text-soft); }

.sw-card-footer { display: flex; justify-content: space-between; align-items: center; }
.sw-avatars { display: flex; }
.sw-av {
  width: 32px; height: 32px; border-radius: 50%;
  border: 2px solid rgba(114,96,167,0.9); margin-left: -9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.65rem; font-weight: 700; color: var(--bg-deep);
  background: linear-gradient(135deg, var(--accent), var(--teal));
}
.sw-av:first-child { margin-left: 0; }
.sw-card-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 20px; border-radius: 50px;
  background: rgba(255,255,255,0.95); color: var(--bg-deep);
  font-size: 0.8rem; font-weight: 700; border: none;
  cursor: pointer; text-decoration: none; transition: all 0.2s;
}
.sw-card-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }

/* floating mini badges */
.sw-float-badge {
  position: absolute;
  display: flex; align-items: center; gap: 10px;
  border-radius: 16px; padding: 12px 16px;
  box-shadow: 0 16px 48px rgba(50,30,100,0.4);
  font-size: 0.82rem; font-weight: 500;
}
.sw-badge-1 { top: -18px; left: -24px; animation: sw-float 8s 1s ease-in-out infinite; }
.sw-badge-2 { bottom: -18px; right: -24px; animation: sw-float 9s 2s ease-in-out infinite; }
.sw-badge-icon {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
}
.sw-badge-num { font-family:'Clash Display',sans-serif; font-size:1.1rem; font-weight:700; }
.sw-badge-txt { font-size: 0.7rem; color: var(--text-soft); }

/* ── SECTION BASE ── */
.sw-section { padding: 100px 24px; position: relative; }
.sw-section-alt {
  padding: 100px 24px; position: relative;
  background: rgba(0,0,0,0.12);
}
.sw-section-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 0.73rem; font-weight: 600; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--accent); margin-bottom: 16px;
}
.sw-eyebrow-line { width: 22px; height: 1px; background: var(--accent); }
.sw-section-title {
  font-family: 'Clash Display', sans-serif;
  font-size: clamp(2rem, 3.5vw, 3rem);
  font-weight: 700; letter-spacing: -0.025em; line-height: 1.15; margin-bottom: 16px;
}
.sw-section-desc { font-size: 1rem; color: var(--text-soft); max-width: 520px; line-height: 1.75; }

/* ── VIDEO SECTION ── */
.sw-video-wrap { margin-top: 56px; position: relative; }
.sw-video-card {
  border-radius: var(--r-xl); overflow: hidden; position: relative;
  cursor: pointer; box-shadow: var(--shadow);
  aspect-ratio: 16/7;
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
  border: 1px solid rgba(255,255,255,0.18);
  transition: transform 0.3s;
}
.sw-video-card:hover { transform: scale(1.01); }
.sw-video-bg {
  position: absolute; inset: 0;
  background: linear-gradient(135deg,
    rgba(200,184,255,0.3) 0%,
    rgba(127,255,238,0.15) 40%,
    rgba(255,142,200,0.2) 100%);
}
/* animated shimmer lines */
.sw-video-lines { position: absolute; inset: 0; overflow: hidden; }
.sw-video-line {
  position: absolute; height: 1px; left: 0; right: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  animation: sw-line-scan 4s ease-in-out infinite;
}
.sw-video-line:nth-child(1) { top: 25%; animation-delay: 0s; }
.sw-video-line:nth-child(2) { top: 55%; animation-delay: 1.5s; }
.sw-video-line:nth-child(3) { top: 80%; animation-delay: 3s; }
@keyframes sw-line-scan {
  0% { transform: scaleX(0) translateX(-100%); opacity: 0; }
  50% { transform: scaleX(1) translateX(0); opacity: 1; }
  100% { transform: scaleX(0) translateX(100%); opacity: 0; }
}
.sw-play-btn {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
}
.sw-play-circle {
  width: 80px; height: 80px; border-radius: 50%;
  background: rgba(255,255,255,0.95);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem; color: var(--bg-deep);
  box-shadow: 0 0 0 20px rgba(255,255,255,0.12), 0 0 0 40px rgba(255,255,255,0.06);
  transition: all 0.3s; cursor: pointer;
  animation: sw-breathe 3s ease-in-out infinite;
}
@keyframes sw-breathe {
  0%,100% { box-shadow: 0 0 0 16px rgba(255,255,255,0.12), 0 0 0 32px rgba(255,255,255,0.06); }
  50%      { box-shadow: 0 0 0 24px rgba(255,255,255,0.15), 0 0 0 48px rgba(255,255,255,0.08); }
}
.sw-video-card:hover .sw-play-circle { transform: scale(1.08); background: #fff; }

/* mock UI inside video */
.sw-mock-ui { position: absolute; inset: 0; padding: 32px; display: flex; flex-direction: column; justify-content: flex-end; }
.sw-mock-bar { height: 8px; background: rgba(255,255,255,0.15); border-radius: 4px; margin-bottom: 10px; }
.sw-mock-bar.w70 { width: 70%; }
.sw-mock-bar.w50 { width: 50%; }
.sw-mock-bar.w85 { width: 85%; }

/* stats row */
.sw-stats-row {
  display: flex; gap: 0; margin-top: 40px;
  border-radius: var(--r-lg); overflow: hidden;
  border: 1px solid rgba(255,255,255,0.15);
}
.sw-stat-block {
  flex: 1; padding: 32px 24px; text-align: center;
  background: var(--glass); backdrop-filter: blur(16px);
  border-right: 1px solid rgba(255,255,255,0.1);
  transition: background 0.25s;
}
.sw-stat-block:last-child { border-right: none; }
.sw-stat-block:hover { background: var(--glass-str); }
.sw-stat-big {
  font-family: 'Clash Display', sans-serif; font-size: 2.6rem;
  font-weight: 700; letter-spacing: -0.03em; margin-bottom: 6px;
  background: linear-gradient(135deg, #fff 0%, var(--accent) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.sw-stat-name { font-size: 0.85rem; color: var(--text-soft); font-weight: 500; }

/* ── ABOUT SECTION ── */
.sw-about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; margin-top: 0; }
.sw-about-text .sw-section-title { margin-bottom: 20px; }
.sw-about-desc { font-size: 1.05rem; color: var(--text-soft); line-height: 1.8; margin-bottom: 36px; }
.sw-store-row { display: flex; gap: 14px; }
.sw-store-btn {
  display: flex; align-items: center; gap: 10px; padding: 14px 24px; border-radius: var(--r-sm);
  background: var(--glass); border: 1px solid var(--border); color: #fff;
  text-decoration: none; font-weight: 600; font-size: 0.9rem; cursor: pointer;
  transition: all 0.25s; backdrop-filter: blur(8px);
}
.sw-store-btn:hover { background: var(--glass-str); transform: translateY(-2px); }

/* phone mocks */
.sw-phones { position: relative; height: 400px; }
.sw-phone {
  position: absolute; width: 200px; border-radius: 28px; overflow: hidden;
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: 0 30px 80px rgba(50,30,100,0.55);
}
.sw-phone-a { top: 0; left: 30px; animation: sw-float 7s ease-in-out infinite; z-index: 2; }
.sw-phone-b { top: 70px; left: 160px; animation: sw-float 9s 1.5s ease-in-out infinite; opacity: 0.82; z-index: 1; }
.sw-phone-hdr { height: 14px; background: rgba(255,255,255,0.06); }
.sw-phone-notch { width: 44px; height: 6px; border-radius: 3px; background: rgba(255,255,255,0.1); margin: 4px auto; }
.sw-phone-body { padding: 14px; background: rgba(90,77,138,0.6); }
.sw-phone-hero-bar {
  height: 64px; border-radius: 14px; margin-bottom: 12px;
  background: linear-gradient(135deg, rgba(200,184,255,0.4), rgba(127,255,238,0.25));
  border: 1px solid rgba(255,255,255,0.15);
}
.sw-phone-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 10px; }
.sw-phone-tile { height: 38px; background: rgba(255,255,255,0.08); border-radius: 8px; }
.sw-phone-list { display: flex; flex-direction: column; gap: 6px; }
.sw-phone-li { height: 9px; background: rgba(255,255,255,0.1); border-radius: 4px; }
.sw-phone-li:last-child { width: 60%; }

/* ── TEAM ── */
.sw-team-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 56px;
}
.sw-member {
  border-radius: var(--r-md); padding: 28px 20px; text-align: center;
  border: 1px solid rgba(255,255,255,0.18); transition: all 0.3s; cursor: pointer;
  position: relative; overflow: hidden;
}
.sw-member::before {
  content:''; position:absolute; inset:0; opacity:0;
  background: rgba(255,255,255,0.06); transition: opacity 0.3s;
}
.sw-member:hover::before { opacity: 1; }
.sw-member:hover { transform: translateY(-6px); box-shadow: 0 24px 60px rgba(50,30,100,0.45); }
.sw-member-img {
  width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 16px;
  border: 3px solid rgba(255,255,255,0.4); display: block;
  object-fit: cover;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}
.sw-member-name { font-family:'Clash Display',sans-serif; font-size:1rem; font-weight:600; margin-bottom:6px; }
.sw-member-role {
  display: inline-block; padding: 4px 12px; border-radius: 50px;
  background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18);
  font-size: 0.72rem; font-weight: 600; color: var(--text-soft);
}

/* ── GALLERY ── */
.sw-gallery-track {
  display: flex; gap: 20px; overflow: hidden;
  margin-top: 56px; position: relative;
}
.sw-gallery-slide {
  flex: 0 0 calc(33.333% - 14px); border-radius: var(--r-md); overflow: hidden;
  aspect-ratio: 16/10; position: relative;
  border: 1px solid rgba(255,255,255,0.15);
  box-shadow: 0 16px 48px rgba(50,30,100,0.4);
  transition: transform 0.4s ease;
}
.sw-gallery-slide:hover { transform: scale(1.025); }
.sw-gallery-slide img {
  width: 100%; height: 100%; object-fit: cover;
  display: block; filter: saturate(0.9) brightness(0.88);
  transition: filter 0.4s;
}
.sw-gallery-slide:hover img { filter: saturate(1.1) brightness(0.95); }
.sw-gallery-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(90,77,138,0.5) 0%, transparent 60%);
}
.sw-gallery-controls {
  display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 28px;
}
.sw-gallery-btn {
  width: 44px; height: 44px; border-radius: 50%;
  background: var(--glass); border: 1px solid var(--border);
  color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 1rem; transition: all 0.2s; backdrop-filter: blur(8px);
}
.sw-gallery-btn:hover { background: var(--glass-str); }
.sw-gallery-dots { display: flex; gap: 8px; }
.sw-gdot {
  width: 7px; height: 7px; border-radius: 50%;
  background: rgba(255,255,255,0.25); cursor: pointer; transition: all 0.25s;
}
.sw-gdot.active { background: #fff; width: 22px; border-radius: 3.5px; }

/* ── WHY SECTION ── */
.sw-why-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 56px; }
.sw-why-card {
  border-radius: var(--r-md); padding: 36px 32px; position: relative; overflow: hidden;
  border: 1px solid rgba(255,255,255,0.15); transition: all 0.3s; cursor: default;
}
.sw-why-card:hover { transform: translateY(-4px); box-shadow: 0 24px 60px rgba(50,30,100,0.4); }
.sw-why-card::after {
  content:''; position:absolute; bottom:0; right:0;
  width: 120px; height: 120px; border-radius: 50%;
  background: rgba(255,255,255,0.04); transform: translate(40px, 40px);
}
.sw-why-icon-wrap {
  width: 56px; height: 56px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center; font-size: 1.3rem;
  margin-bottom: 22px; background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2); transition: all 0.3s;
}
.sw-why-card:hover .sw-why-icon-wrap {
  background: rgba(255,255,255,0.22); transform: rotate(-5deg) scale(1.05);
}
.sw-why-title { font-family:'Clash Display',sans-serif; font-size:1.15rem; font-weight:600; margin-bottom:10px; }
.sw-why-desc { font-size: 0.9rem; color: var(--text-soft); line-height: 1.65; }

/* ── MODAL ── */
.sw-modal-overlay {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(50,30,100,0.85); backdrop-filter: blur(16px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px; animation: sw-fade-in 0.25s ease;
}
@keyframes sw-fade-in { from{opacity:0} to{opacity:1} }
.sw-modal {
  width: 100%; max-width: 900px; border-radius: var(--r-lg);
  overflow: hidden; position: relative;
  box-shadow: 0 40px 120px rgba(0,0,0,0.6);
  animation: sw-modal-in 0.3s ease;
}
@keyframes sw-modal-in { from{transform:scale(0.92);opacity:0} to{transform:scale(1);opacity:1} }
.sw-modal-close {
  position: absolute; top: 16px; right: 16px; z-index: 10;
  width: 38px; height: 38px; border-radius: 50%;
  background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2);
  color: #fff; font-size: 1rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.sw-modal-close:hover { background: rgba(0,0,0,0.8); }
.sw-modal iframe { width: 100%; aspect-ratio: 16/9; display: block; border: none; }

/* ── FOOTER ── */
.sw-footer {
  background: rgba(0,0,0,0.25); padding: 56px 24px 28px;
  border-top: 1px solid rgba(255,255,255,0.1);
}
.sw-footer-top {
  display: flex; justify-content: space-between; align-items: flex-start;
  flex-wrap: wrap; gap: 40px; margin-bottom: 48px;
}
.sw-footer-brand-text { font-size: 0.88rem; color: var(--text-soft); line-height: 1.7; max-width: 280px; margin-top: 14px; }
.sw-footer-col-title { font-family:'Clash Display',sans-serif; font-size:0.78rem; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-mute); margin-bottom:18px; }
.sw-footer-col a { display:block; color:var(--text-soft); text-decoration:none; font-size:0.9rem; margin-bottom:10px; transition:color 0.2s; }
.sw-footer-col a:hover { color:#fff; }
.sw-footer-bottom {
  border-top: 1px solid rgba(255,255,255,0.08); padding-top: 24px;
  display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;
}
.sw-footer-copy { font-size: 0.82rem; color: var(--text-mute); }
.sw-footer-tag { font-size: 0.78rem; color: rgba(200,184,255,0.5); }

/* ── RESPONSIVE ── */
@media (max-width: 900px) {
  .sw-hero-inner { grid-template-columns: 1fr; }
  .sw-hero-visual { display: none; }
  .sw-team-grid { grid-template-columns: repeat(2,1fr); }
  .sw-about-grid { grid-template-columns: 1fr; }
  .sw-phones { display: none; }
  .sw-why-grid { grid-template-columns: 1fr; }
  .sw-gallery-slide { flex: 0 0 calc(50% - 10px); }
  .sw-stats-row { flex-direction: column; }
  .sw-stat-block { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.1); }
}
@media (max-width: 600px) {
  .sw-hero h1 { font-size: 2.6rem; }
  .sw-team-grid { grid-template-columns: 1fr 1fr; }
  .sw-gallery-slide { flex: 0 0 85%; }
  .sw-hero-stats { gap: 18px; }
}
`;

function StyleInject() {
  useEffect(() => {
    const id = "sw-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id; el.textContent = CSS;
      document.head.appendChild(el);
    }
    return () => { const el = document.getElementById(id); el && el.remove(); };
  }, []);
  return null;
}

function Brand() {
  return (
    <div className="sw-brand">
      <div className="sw-brand-dot" />
      <span>SWAFY</span>
    </div>
  );
}

function VideoModal({ open, onClose, videoUrl }) {
  if (!open) return null;
  return (
    <div className="sw-modal-overlay" onClick={onClose}>
      <div className="sw-modal" onClick={e => e.stopPropagation()}>
        <button className="sw-modal-close" onClick={onClose}><FiX /></button>
        <iframe src={videoUrl} title="SWAFY video" allow="autoplay; encrypted-media" allowFullScreen />
      </div>
    </div>
  );
}

function HeroCard() {
  return (
    <div className="sw-hero-visual" style={{ position: "relative" }}>

      {/* badge top-left */}
      <div className="sw-float-badge sw-badge-1 sw-glass-str" style={{ borderRadius: 16 }}>
        <div className="sw-badge-icon" style={{ background: "rgba(127,255,238,0.15)" }}>🤖</div>
        <div>
          <div className="sw-badge-num">+1200</div>
          <div className="sw-badge-txt">Jeunes formés</div>
        </div>
      </div>

      <div className="sw-hero-card sw-glass-str">
        <div className="sw-card-top">
          <div className="sw-live-badge"><div className="sw-pulse" /> En Direct</div>
          <div className="sw-card-dots">
            <div className="sw-card-dot" />
            <div className="sw-card-dot" />
            <div className="sw-card-dot" />
          </div>
        </div>
        <div className="sw-card-title">Formation & Innovation</div>
        <div className="sw-card-sub">IA · Sécurité · Support · Tunis</div>
        <div className="sw-card-progress-label">
          <span>Progression</span>
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>68%</span>
        </div>
        <div className="sw-card-bar"><div className="sw-card-bar-fill" style={{ width: "68%" }} /></div>
        <div className="sw-mini-grid">
          {[["🧠","IA"],["🔐","Sécurité"],["⚡","Innovation"]].map(([ic,lb]) => (
            <div className="sw-mini-tile" key={lb}>
              <div className="sw-mini-tile-icon">{ic}</div>
              <div className="sw-mini-tile-label">{lb}</div>
            </div>
          ))}
        </div>
        <div className="sw-card-footer">
          <div className="sw-avatars">
            {["AH","SM","KR","IB"].map((l,i) => <div key={i} className="sw-av">{l}</div>)}
          </div>
          <Link className="sw-card-btn" to="/register">Rejoindre <FiChevronRight /></Link>
        </div>
      </div>

      {/* badge bottom-right */}
      <div className="sw-float-badge sw-badge-2 sw-glass-str" style={{ borderRadius: 16 }}>
        <div className="sw-badge-icon" style={{ background: "rgba(255,209,102,0.15)" }}>🏆</div>
        <div>
          <div className="sw-badge-num">98%</div>
          <div className="sw-badge-txt">Satisfaction</div>
        </div>
      </div>
    </div>
  );
}

function Navbar({ onPlay }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <header className={`sw-nav ${scrolled ? "scrolled" : ""}`}>
      <div className="sw-nav-inner">
        <Link to="/" className="sw-back"><FiArrowLeft /> Accueil</Link>
        <Link to="/" style={{ textDecoration: "none" }}><Brand /></Link>
        <div className="sw-nav-actions">
          <Link className="sw-btn-ghost" to="/register">Register</Link>
          <Link className="sw-btn-pill" to="/login">Sign in</Link>
        </div>
      </div>
    </header>
  );
}

function Hero({ onPlay }) {
  return (
    <section className="sw-hero">
      <div className="sw-container">
        <div className="sw-hero-inner">
          <div>
            <div className="sw-eyebrow">
              <div className="sw-pulse" /> Agence de Tunis · Débat IA Jeunes
            </div>
            <h1>
              Science<br />With &amp; For{" "}
              <span className="sw-shimmer">Youth</span>
            </h1>
            <p className="sw-hero-desc">
              SWAFY هي منصة تونسية تقود الشباب نحو الاقتصاد الرقمي —
              تعلّم، تطبيق، وتحدّيات في الذكاء الاصطناعي والأمن الرقمي.
            </p>
            <div className="sw-hero-actions">
              <button className="sw-cta-primary" onClick={onPlay}>
                Découvrir <FiPlay />
              </button>
              <Link className="sw-cta-secondary" to="/register">
                Créer un compte <FiArrowRight />
              </Link>
            </div>
            <div className="sw-hero-stats">
              <div className="sw-stat">
                <span className="sw-stat-n">1.2K+</span>
                <span className="sw-stat-l">Jeunes inscrits</span>
              </div>
              <div className="sw-stat-sep" />
              <div className="sw-stat">
                <span className="sw-stat-n">70+</span>
                <span className="sw-stat-l">Sessions actives</span>
              </div>
              <div className="sw-stat-sep" />
              <div className="sw-stat">
                <span className="sw-stat-n">98%</span>
                <span className="sw-stat-l">Satisfaction</span>
              </div>
            </div>
          </div>
          <HeroCard />
        </div>
      </div>
    </section>
  );
}

function VideoSection({ onPlay }) {
  return (
    <section className="sw-section">
      <div className="sw-container">
        <div className="sw-section-eyebrow">
          <div className="sw-eyebrow-line" /> Aperçu de la plateforme
        </div>
        <h2 className="sw-section-title">Découvrez SWAFY en action</h2>

        <div className="sw-video-wrap">
          <div className="sw-video-card" onClick={onPlay}>
            <div className="sw-video-bg" />
            <div className="sw-video-lines">
              <div className="sw-video-line" />
              <div className="sw-video-line" />
              <div className="sw-video-line" />
            </div>
            <div className="sw-mock-ui">
              <div className="sw-mock-bar w85" />
              <div className="sw-mock-bar w70" />
              <div className="sw-mock-bar w50" />
            </div>
            <div className="sw-play-btn">
              <div className="sw-play-circle"><FiPlay /></div>
            </div>
          </div>
        </div>

        <div className="sw-stats-row">
          {[
            { n: "+200", l: "Utilisateurs actifs" },
            { n: "+70",  l: "Sessions réalisées" },
            { n: "+24",  l: "Formations disponibles" },
          ].map(({ n, l }) => (
            <div className="sw-stat-block" key={l}>
              <div className="sw-stat-big">{n}</div>
              <div className="sw-stat-name">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="sw-section-alt">
      <div className="sw-container">
        <div className="sw-about-grid">
          <div className="sw-phones">
            {[null, "b"].map((v) => (
              <div key={v || "a"} className={`sw-phone sw-glass ${v ? "sw-phone-b" : "sw-phone-a"}`}>
                <div className="sw-phone-hdr"><div className="sw-phone-notch" /></div>
                <div className="sw-phone-body">
                  <div className="sw-phone-hero-bar" />
                  <div className="sw-phone-row">
                    <div className="sw-phone-tile" />
                    <div className="sw-phone-tile" />
                    <div className="sw-phone-tile" />
                  </div>
                  <div className="sw-phone-list">
                    <div className="sw-phone-li" />
                    <div className="sw-phone-li" />
                    <div className="sw-phone-li" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="sw-about-text">
            <div className="sw-section-eyebrow">
              <div className="sw-eyebrow-line" /> À propos de SWAFY
            </div>
            <h2 className="sw-section-title">
              Une plateforme pensée<br />
              <span className="sw-shimmer">pour la jeunesse tunisienne</span>
            </h2>
            <p className="sw-about-desc">
              SWAFY هي منصة تونسية تعاون الشباب باش يكتسب مهارات رقمية،
              يشارك في challenges، ويمشي في مسار واضح: تعلم → تطبيق → تقييم.
              Science with and for youth — plateforme simple pour apprendre et progresser.
            </p>
            <div className="sw-store-row">
              <a className="sw-store-btn" href="#!"><span>🍎</span> App Store</a>
              <a className="sw-store-btn" href="#!"><span>🤖</span> Google Play</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TeamSection({ team }) {
  return (
    <section className="sw-section">
      <div className="sw-container">
        <div style={{ textAlign: "center" }}>
          <div className="sw-section-eyebrow" style={{ justifyContent: "center" }}>
            <div className="sw-eyebrow-line" /> Notre équipe
          </div>
          <h2 className="sw-section-title">Notre équipe SWAFY</h2>
        </div>
        <div className="sw-team-grid">
          {team.map((m) => (
            <div
              key={m.name} className="sw-member"
              style={{ background: `linear-gradient(135deg, ${m.color}33 0%, rgba(255,255,255,0.06) 100%)`,
                       borderColor: `${m.color}44` }}
            >
              <img className="sw-member-img" src={m.img} alt={m.name}
                   style={{ borderColor: `${m.color}80` }} />
              <div className="sw-member-name">{m.name}</div>
              <div className="sw-member-role">{m.role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GallerySection({ gallery }) {
  const [idx, setIdx] = useState(0);
  const maxIdx = gallery.length - 3;
  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(maxIdx < 0 ? 0 : maxIdx, i + 1));

  return (
    <section className="sw-section-alt">
      <div className="sw-container">
        <div className="sw-section-eyebrow">
          <div className="sw-eyebrow-line" /> Galerie
        </div>
        <h2 className="sw-section-title">Nos moments forts</h2>

        <div className="sw-gallery-track">
          {gallery.map((src, i) => (
            <div
              className="sw-gallery-slide" key={src}
              style={{ transform: `translateX(calc(-${idx * (100 + 20)}% - ${idx * 20}px))`,
                       transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)" }}
            >
              <img src={src} alt={`gallery-${i}`} />
              <div className="sw-gallery-overlay" />
            </div>
          ))}
        </div>

        <div className="sw-gallery-controls">
          <button className="sw-gallery-btn" onClick={prev}><FiChevronLeft /></button>
          <div className="sw-gallery-dots">
            {gallery.map((_, i) => (
              <div key={i} className={`sw-gdot ${i === idx ? "active" : ""}`} onClick={() => setIdx(i)} />
            ))}
          </div>
          <button className="sw-gallery-btn" onClick={next}><FiChevronRight /></button>
        </div>
      </div>
    </section>
  );
}

function WhySection({ why }) {
  return (
    <section className="sw-section">
      <div className="sw-container">
        <div style={{ textAlign: "center", marginBottom: 0 }}>
          <div className="sw-section-eyebrow" style={{ justifyContent: "center" }}>
            <div className="sw-eyebrow-line" /> Pourquoi SWAFY
          </div>
          <h2 className="sw-section-title">Pourquoi nous choisir ?</h2>
          <p className="sw-section-desc" style={{ margin: "0 auto" }}>
            SWAFY offre une expérience d'apprentissage unique, conçue pour les jeunes tunisiens ambitieux.
          </p>
        </div>
        <div className="sw-why-grid">
          {why.map(({ icon, title, desc }, i) => (
            <div className="sw-why-card sw-glass" key={title}
                 style={{ background: `linear-gradient(135deg, rgba(255,255,255,${0.06 + i*0.02}), rgba(255,255,255,0.04))` }}>
              <div className="sw-why-icon-wrap">{icon}</div>
              <div className="sw-why-title">{title}</div>
              <div className="sw-why-desc">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Swafy() {
  const [openVideo, setOpenVideo] = useState(false);

  const team = useMemo(() => [
    { name: "Andrey Khusid",    role: "Design",    img: "https://i.pravatar.cc/160?img=12", color: "#9b5de5" },
    { name: "Steven Rodion",    role: "Product",   img: "https://i.pravatar.cc/160?img=32", color: "#00bbf9" },
    { name: "AJ Josephson",     role: "Dev",       img: "https://i.pravatar.cc/160?img=41", color: "#f15bb5" },
    { name: "Amina Bouyakoub", role: "Community", img: "https://i.pravatar.cc/160?img=5",  color: "#fee440" },
    { name: "Ivan Damani",      role: "Backend",   img: "https://i.pravatar.cc/160?img=18", color: "#00f5d4" },
    { name: "James Doe",        role: "Mentor",    img: "https://i.pravatar.cc/160?img=60", color: "#fb8500" },
    { name: "Yahya Mustapha",  role: "Support",   img: "https://i.pravatar.cc/160?img=27", color: "#8338ec" },
    { name: "John Doe",         role: "Trainer",   img: "https://i.pravatar.cc/160?img=52", color: "#3a86ff" },
  ], []);

  const gallery = useMemo(() => [
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=70",
  ], []);

  const why = useMemo(() => [
    { icon: <FiUsers />,     title: "User-Friendly",          desc: "Easy onboarding & parcours clairs pour chaque niveau." },
    { icon: <FiHeadphones />,title: "24/7 Customer Support",  desc: "Support سريع وقت تحتاج — toujours disponible." },
    { icon: <FiAward />,     title: "Free Recommendations",   desc: "Guidance مخصص حسب المستوى والأهداف." },
    { icon: <FiZap />,       title: "Fast Training",          desc: "Modules خفاف و فعّالين — apprends vite, applique plus." },
  ], []);

  return (
    <>
      <StyleInject />
      <div className="sw-noise" />
      <div className="sw-orb sw-orb-1" />
      <div className="sw-orb sw-orb-2" />
      <div className="sw-orb sw-orb-3" />
      <div className="sw-orb sw-orb-4" />

      <div className="sw-page">
        <Navbar onPlay={() => setOpenVideo(true)} />
        <Hero onPlay={() => setOpenVideo(true)} />
        <VideoSection onPlay={() => setOpenVideo(true)} />
        <AboutSection />
        <TeamSection team={team} />
        <GallerySection gallery={gallery} />
        <WhySection why={why} />

        <footer className="sw-footer">
          <div className="sw-container">
            <div className="sw-footer-top">
              <div>
                <Brand />
                <p className="sw-footer-brand-text">
                  SWAFY — Agence de Tunis. Science with and for youth.
                  Plateforme de débat sur l'intelligence artificielle pour les jeunes tunisiens.
                </p>
              </div>
              <div className="sw-footer-col">
                <div className="sw-footer-col-title">Navigation</div>
                <Link to="/">Accueil</Link>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </div>
              <div className="sw-footer-col">
                <div className="sw-footer-col-title">Services</div>
                <a href="#!">Support</a>
                <a href="#!">Formation</a>
                <a href="#!">Communauté</a>
              </div>
            </div>
            <div className="sw-footer-bottom">
              <span className="sw-footer-copy">© {new Date().getFullYear()} SWAFY · Tunis, Tunisie</span>
              <span className="sw-footer-tag">Built with React · Science With and For Youth</span>
            </div>
          </div>
        </footer>
      </div>

      <VideoModal
        open={openVideo}
        onClose={() => setOpenVideo(false)}
        videoUrl="https://www.youtube.com/embed/dQw4w9WgXcQ"
      />
    </>
  );
}