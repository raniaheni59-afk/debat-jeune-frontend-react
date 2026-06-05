import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FiArrowRight, FiZap, FiMenu, FiX, FiUsers, FiAward,
  FiTrendingUp, FiGlobe, FiBookOpen,
} from "react-icons/fi";

/* ════════════════════════════════════════════
   CSS COMPLET — injecté une fois
════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --v:#7260A7;--v2:#5B4D8E;--c:#4A9FB5;--pk:#C084B8;--g:#10B981;
  --txt:#1A1A2E;--mut:#5A5A6E;--bdr:rgba(114,96,167,.14);
  --sur:#F7F5FF;--wh:#fff;
  --r1:12px;--r2:20px;--r3:32px;
}
html{scroll-behavior:smooth}
body{font-family:'Plus Jakarta Sans',sans-serif;background:#fff;color:var(--txt);overflow-x:hidden}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:var(--v);border-radius:2px}

/* ANIMATIONS */
@keyframes drift{from{transform:translate(0,0) scale(1)}to{transform:translate(40px,30px) scale(1.1)}}
@keyframes up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes rt{from{opacity:0;transform:translateX(36px)}to{opacity:1;transform:translateX(0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.5)}}
@keyframes grow{from{width:0%}}
@keyframes panel{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

/* NOISE + ORBS */
.noise{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.25;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.03'/%3E%3C/svg%3E");
  background-size:180px}
.orb{position:absolute;border-radius:50%;filter:blur(110px);pointer-events:none;opacity:.35}
.o1{width:600px;height:600px;background:radial-gradient(circle,rgba(114,96,167,.18) 0%,transparent 70%);top:-180px;right:-80px;animation:drift 13s ease-in-out infinite alternate}
.o2{width:480px;height:480px;background:radial-gradient(circle,rgba(74,159,181,.12) 0%,transparent 70%);bottom:-60px;left:-120px;animation:drift 17s ease-in-out infinite alternate-reverse}

/* BARRE PARTENAIRES */
.pbar{background:#fff;border-bottom:1px solid var(--bdr);padding:7px 24px;z-index:99;position:relative}
.pbar-in{max-width:1180px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
.pbar-lbl{font-size:.68rem;color:var(--mut);font-style:italic}
.pbar-logos{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.pbar-logos img{height:28px;object-fit:contain;opacity:.82;transition:opacity .2s}
.pbar-logos img:hover{opacity:1}
.pdiv{width:1px;height:22px;background:var(--bdr)}
.pbar-eu{font-family:'Syne',sans-serif;font-weight:800;font-size:.8rem;color:#0052cc;letter-spacing:-.01em}
.pbar-anpr{font-family:'Syne',sans-serif;font-weight:800;font-size:.82rem;color:var(--v)}

/* NAV */
.nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:0 24px;transition:all .4s;background:rgba(255,255,255,.82);backdrop-filter:blur(18px)}
.nav.sc{background:rgba(255,255,255,.97);border-bottom:1px solid var(--bdr);box-shadow:0 2px 18px rgba(114,96,167,.07)}
.nav-in{max-width:1180px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:70px}
.brand{display:flex;align-items:center;gap:9px;font-family:'Syne',sans-serif;font-weight:800;font-size:1.35rem;letter-spacing:-.025em;color:var(--txt);text-decoration:none}
.bdot{width:9px;height:9px;border-radius:50%;background:linear-gradient(135deg,var(--v),var(--v2));box-shadow:0 0 10px rgba(114,96,167,.5)}
.nav-links{display:flex;gap:32px}
.nav-links a{color:var(--mut);font-size:.86rem;font-weight:500;text-decoration:none;text-transform:uppercase;letter-spacing:.04em;transition:color .2s}
.nav-links a:hover{color:var(--v)}
.nav-act{display:flex;gap:10px;align-items:center}
.btn-g{padding:8px 18px;border-radius:50px;border:1px solid var(--bdr);color:var(--txt);font-size:.84rem;font-weight:500;text-decoration:none;transition:all .2s;background:transparent}
.btn-g:hover{border-color:var(--v);color:var(--v);background:rgba(114,96,167,.05)}
.btn-p{padding:9px 20px;border-radius:50px;background:linear-gradient(135deg,var(--v),var(--v2));color:#fff;font-size:.84rem;font-weight:600;text-decoration:none;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(114,96,167,.28);transition:all .25s}
.btn-p:hover{transform:translateY(-1px);box-shadow:0 6px 22px rgba(114,96,167,.38)}
.nav-tog{display:none;background:none;border:none;color:var(--txt);font-size:1.35rem;cursor:pointer;padding:5px}

/* MOBILE MENU */
.mob{position:fixed;inset:0;z-index:200;background:rgba(255,255,255,.98);backdrop-filter:blur(18px);padding:28px;transform:translateX(100%);transition:transform .3s;display:flex;flex-direction:column}
.mob.open{transform:translateX(0)}
.mob-close{align-self:flex-end;background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--txt);padding:6px}
.mob-links{display:flex;flex-direction:column;gap:24px;margin:40px 0}
.mob-links a{font-family:'Syne',sans-serif;font-size:1.7rem;font-weight:700;color:var(--txt);text-decoration:none}
.mob-links a:hover{color:var(--v)}
.mob-act{display:flex;flex-direction:column;gap:10px}

/* HERO */
.hero{position:relative;min-height:100vh;display:flex;align-items:center;padding:110px 24px 80px;overflow:hidden;background:linear-gradient(180deg,#fff 0%,var(--sur) 100%)}
.hero-in{max-width:1180px;margin:0 auto;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
.htag{display:inline-flex;align-items:center;gap:7px;padding:5px 14px;border-radius:50px;border:1px solid rgba(114,96,167,.22);background:rgba(114,96,167,.07);font-size:.75rem;font-weight:600;color:var(--v);letter-spacing:.08em;text-transform:uppercase;margin-bottom:24px;animation:up .8s ease both}
.lpulse{width:7px;height:7px;border-radius:50%;background:var(--g);animation:pulse 2s infinite}
.hero h1{font-family:'Syne',sans-serif;font-size:clamp(2.7rem,4.8vw,4.4rem);font-weight:800;line-height:1.08;letter-spacing:-.03em;margin-bottom:22px;color:var(--txt);animation:up .8s .08s ease both}
.grad{background:linear-gradient(135deg,var(--v) 0%,var(--c) 50%,var(--pk) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hdesc{color:var(--mut);font-size:1.05rem;line-height:1.78;max-width:470px;margin-bottom:36px;animation:up .8s .16s ease both}
.hact{display:flex;gap:14px;flex-wrap:wrap;animation:up .8s .24s ease both}
.btn-lg{display:inline-flex;align-items:center;gap:9px;padding:14px 30px;border-radius:50px;background:linear-gradient(135deg,var(--v),var(--v2));color:#fff;font-size:.97rem;font-weight:600;text-decoration:none;border:none;cursor:pointer;box-shadow:0 6px 22px rgba(114,96,167,.3);transition:all .3s;position:relative;overflow:hidden}
.btn-lg:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(114,96,167,.42)}
.btn-ol{display:inline-flex;align-items:center;gap:9px;padding:14px 30px;border-radius:50px;border:1.5px solid var(--bdr);color:var(--txt);font-size:.97rem;font-weight:500;text-decoration:none;background:#fff;transition:all .25s}
.btn-ol:hover{border-color:var(--v);background:rgba(114,96,167,.04);transform:translateY(-1px)}
.hstats{display:flex;gap:28px;margin-top:44px;animation:up .8s .32s ease both}
.hs{display:flex;flex-direction:column;gap:3px}
.hs-n{font-family:'Syne',sans-serif;font-size:1.75rem;font-weight:800;color:var(--txt)}
.hs-l{font-size:.78rem;color:var(--mut)}
.hsdiv{width:1px;background:var(--bdr)}

/* HERO CARD */
.hv{position:relative;display:flex;justify-content:center;align-items:center;animation:rt .9s .28s ease both}
.hcard{background:rgba(255,255,255,.97);border:1px solid var(--bdr);border-radius:var(--r3);backdrop-filter:blur(18px);padding:30px;width:100%;max-width:430px;box-shadow:0 18px 55px rgba(114,96,167,.14),inset 0 1px 0 rgba(255,255,255,.8);animation:float 6.5s ease-in-out infinite}
.ch{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px}
.cbadge{padding:5px 12px;border-radius:50px;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.22);font-size:.73rem;font-weight:600;color:#059669;display:flex;align-items:center;gap:6px}
.ct{font-family:'Syne',sans-serif;font-size:1.45rem;font-weight:700;margin-bottom:7px;line-height:1.3;color:var(--txt)}
.cs{font-size:.85rem;color:var(--mut);margin-bottom:22px}
.cpl{display:flex;justify-content:space-between;font-size:.76rem;color:var(--mut);margin-bottom:7px}
.cpb{height:6px;background:rgba(114,96,167,.1);border-radius:3px;overflow:hidden;margin-bottom:22px}
.cpf{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--v),var(--c));animation:grow 2.2s 1s ease both}
.cmg{display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px;margin-bottom:18px}
.cm{background:rgba(114,96,167,.05);border:1px solid var(--bdr);border-radius:var(--r1);padding:13px 8px;text-align:center;font-size:.76rem;font-weight:500;color:var(--mut);transition:all .2s;cursor:pointer}
.cm:hover{background:rgba(114,96,167,.11);border-color:var(--v);color:var(--txt)}
.cmi{font-size:1.15rem;margin-bottom:5px}
.cf{display:flex;justify-content:space-between;align-items:center}
.avs{display:flex}
.av{width:29px;height:29px;border-radius:50%;border:2px solid #fff;margin-left:-8px;display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:700;background:linear-gradient(135deg,var(--v),var(--v2));color:#fff}
.av:first-child{margin-left:0}
.ccta{display:inline-flex;align-items:center;gap:6px;padding:8px 17px;border-radius:50px;background:linear-gradient(135deg,var(--v),var(--v2));color:#fff;font-size:.78rem;font-weight:600;border:none;cursor:pointer;text-decoration:none;transition:all .2s}
.ccta:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(114,96,167,.35)}
.fb{position:absolute;display:flex;align-items:center;gap:9px;background:rgba(255,255,255,.98);border:1px solid var(--bdr);border-radius:var(--r1);padding:11px 15px;backdrop-filter:blur(14px);box-shadow:0 10px 28px rgba(114,96,167,.18);font-size:.8rem;font-weight:500}
.fb1{top:-18px;left:-26px;animation:float 7.5s 1s ease-in-out infinite}
.fb2{bottom:-18px;right:-26px;animation:float 8.5s 2s ease-in-out infinite}
.fbi{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:1rem}
.fbn{font-family:'Syne',sans-serif;font-size:1.05rem;font-weight:800;color:var(--txt)}
.fbt{font-size:.69rem;color:var(--mut)}

/* LIVE SECTION */
.live-sec{padding:44px 24px;background:#fff}
.lc{background:linear-gradient(135deg,rgba(114,96,167,.07),rgba(74,159,181,.04));border:1px solid rgba(114,96,167,.18);border-radius:var(--r3);padding:30px 36px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:18px;position:relative;overflow:hidden}
.ll{display:flex;align-items:center;gap:15px}
.ldw{width:38px;height:38px;border-radius:50%;background:rgba(16,185,129,.11);border:1px solid rgba(16,185,129,.24);display:flex;align-items:center;justify-content:center}
.ld{width:11px;height:11px;border-radius:50%;background:var(--g);animation:pulse 2s infinite}
.llbl{font-size:.73rem;text-transform:uppercase;letter-spacing:.1em;color:#059669;font-weight:600}
.lt{font-family:'Syne',sans-serif;font-size:1.25rem;font-weight:700;color:var(--txt)}
.lsub{font-size:.84rem;color:var(--mut);margin-top:3px}
.lr{display:flex;align-items:center;gap:11px;flex-wrap:wrap}
.lpill{display:flex;align-items:center;gap:7px;padding:7px 14px;border-radius:50px;background:rgba(255,255,255,.85);border:1px solid var(--bdr);font-size:.82rem;color:var(--txt)}
.lbtn{display:inline-flex;align-items:center;gap:7px;padding:11px 22px;border-radius:50px;background:linear-gradient(135deg,var(--v),var(--v2));color:#fff;font-weight:600;font-size:.84rem;border:none;cursor:pointer;box-shadow:0 5px 18px rgba(114,96,167,.24);transition:all .25s;text-decoration:none}
.lbtn:hover{transform:translateY(-2px);box-shadow:0 9px 26px rgba(114,96,167,.35)}

/* SECTION */
.sec{padding:90px 24px;background:#fff;position:relative}
.sec-alt{padding:90px 24px;background:var(--sur);position:relative}
.con{max-width:1180px;margin:0 auto}
.ey{display:inline-flex;align-items:center;gap:7px;font-size:.73rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--v);margin-bottom:14px}
.eyl{width:20px;height:1px;background:var(--v)}
.stit{font-family:'Syne',sans-serif;font-size:clamp(1.9rem,3.2vw,2.8rem);font-weight:800;letter-spacing:-.025em;line-height:1.15;margin-bottom:14px;color:var(--txt)}
.sdesc{font-size:1rem;color:var(--mut);max-width:510px;line-height:1.72}

/* 5 THÉMATIQUES */
.tgrid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-top:50px}
.tc{background:#fff;border:1px solid var(--bdr);border-radius:var(--r2);padding:20px 16px;transition:all .3s;cursor:pointer;position:relative;overflow:hidden;box-shadow:0 2px 7px rgba(114,96,167,.05)}
.tc::before{content:'';position:absolute;inset:0;opacity:0;background:linear-gradient(135deg,rgba(114,96,167,.07),rgba(74,159,181,.03));transition:opacity .3s}
.tc:hover::before,.tc.act::before{opacity:1}
.tc:hover,.tc.act{border-color:var(--v);transform:translateY(-4px);box-shadow:0 14px 36px rgba(114,96,167,.14)}
.tic{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:1.15rem;margin-bottom:14px;background:linear-gradient(135deg,rgba(114,96,167,.11),rgba(91,77,142,.07));border:1px solid rgba(114,96,167,.14);transition:all .3s;color:var(--v)}
.tc:hover .tic,.tc.act .tic{background:linear-gradient(135deg,var(--v),var(--v2));border-color:transparent;box-shadow:0 7px 20px rgba(114,96,167,.3);color:#fff}
.tn{font-family:'Syne',sans-serif;font-size:.92rem;font-weight:700;margin-bottom:5px;color:var(--txt)}
.td{font-size:.76rem;color:var(--mut);line-height:1.5}
.tarr{position:absolute;top:16px;right:16px;color:var(--mut);font-size:.88rem;transition:all .2s}
.tc:hover .tarr,.tc.act .tarr{color:var(--v);transform:translate(2px,-2px)}

/* PANEL DÉTAIL */
.dp{margin-top:22px;border-radius:var(--r2);border:1px solid var(--bdr);background:linear-gradient(135deg,rgba(114,96,167,.03),rgba(74,159,181,.015));padding:30px 34px;display:grid;grid-template-columns:1fr 1fr;gap:30px;animation:panel .32s cubic-bezier(.4,0,.2,1) both}
.dptag{display:inline-flex;align-items:center;gap:6px;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;border:1px solid;padding:4px 13px;border-radius:50px;margin-bottom:14px}
.dptit{font-family:'Syne',sans-serif;font-size:1.5rem;font-weight:800;color:var(--txt);margin-bottom:11px;line-height:1.2}
.dpb{font-size:.93rem;color:var(--mut);line-height:1.75;margin-bottom:18px}
.dpk{display:flex;gap:18px;flex-wrap:wrap;margin-bottom:20px}
.kpi{display:flex;flex-direction:column;gap:2px}
.kn{font-family:'Syne',sans-serif;font-size:1.45rem;font-weight:800}
.kl{font-size:.73rem;color:var(--mut)}

/* FORMATIONS (boutons avec liens) */
.fmts{display:flex;flex-direction:column;gap:10px}
.fmt{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:var(--r1);background:#fff;border:1px solid var(--bdr);box-shadow:0 2px 7px rgba(114,96,167,.04);text-decoration:none;color:var(--txt);transition:all .22s}
.fmt:hover{border-color:var(--v);background:rgba(114,96,167,.04);transform:translateX(4px)}
.fmtic{width:30px;height:30px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.88rem}
.fmtt{font-weight:700;font-size:.86rem;color:var(--txt)}
.fmtd{font-size:.74rem;color:var(--mut);margin-top:1px}
.fmtarr{margin-left:auto;color:var(--v);font-size:.82rem;flex-shrink:0}

/* POINTS détail gauche */
.dpts{display:flex;flex-direction:column;gap:12px}
.dpt{display:flex;align-items:flex-start;gap:11px;padding:13px 15px;border-radius:var(--r1);background:#fff;border:1px solid var(--bdr);box-shadow:0 2px 7px rgba(114,96,167,.04)}
.dptic{width:30px;height:30px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.88rem}
.dptt{font-weight:700;font-size:.86rem;color:var(--txt)}
.dptd{font-size:.75rem;color:var(--mut);margin-top:2px}

/* OBJECTIF */
.og{display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center}
.psk{position:relative;height:410px}
.pc{position:absolute;width:215px;background:rgba(255,255,255,.98);border:1px solid var(--bdr);border-radius:27px;overflow:hidden;box-shadow:0 22px 55px rgba(114,96,167,.18)}
.pa{top:0;left:0;z-index:2;animation:float 7s ease-in-out infinite}
.pb{top:58px;left:126px;z-index:1;opacity:.83;animation:float 9.5s 1.5s ease-in-out infinite}
.ph{padding:9px;background:rgba(114,96,167,.04)}
.pn{width:40px;height:4px;border-radius:2px;background:rgba(114,96,167,.18);margin:0 auto}
.pbd{padding:13px}
.psc{background:linear-gradient(135deg,rgba(114,96,167,.07),rgba(74,159,181,.04));border:1px solid var(--bdr);border-radius:17px;padding:13px}
.psbg{display:inline-block;font-size:9px;font-weight:700;padding:3px 7px;border-radius:20px;background:rgba(16,185,129,.14);color:#059669;margin-bottom:7px}
.pst{font-family:'Syne',sans-serif;font-weight:700;font-size:.78rem;color:var(--txt);margin-bottom:3px}
.pss{font-size:.68rem;color:var(--mut);margin-bottom:9px}
.psb{width:fit-content;padding:5px 9px;border-radius:9px;background:var(--v);color:#fff;font-weight:700;font-size:.66rem}
.ptiles{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-top:10px}
.ptile{height:32px;border-radius:9px;background:rgba(114,96,167,.07);border:1px solid var(--bdr)}
.pli{height:7px;border-radius:4px;background:rgba(114,96,167,.09);margin-top:7px}
.odesc{font-size:1rem;color:var(--mut);line-height:1.8;margin-bottom:30px}
.sr{display:flex;gap:11px;flex-wrap:wrap}
.sb{display:flex;align-items:center;gap:9px;padding:11px 20px;border-radius:var(--r1);background:#1A1A2E;color:#fff;text-decoration:none;font-weight:700;font-size:.88rem;transition:all .25s}
.sb:hover{transform:translateY(-2px);box-shadow:0 9px 25px rgba(26,26,46,.24)}

/* ÉTAPES */
.stgr{display:grid;grid-template-columns:1fr 1fr;gap:58px;align-items:center}
.sti{display:flex;align-items:flex-start;gap:15px;margin-bottom:22px}
.stn{width:34px;height:34px;border-radius:10px;flex-shrink:0;background:linear-gradient(135deg,rgba(114,96,167,.11),rgba(91,77,142,.07));border:1px solid rgba(114,96,167,.18);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:.88rem;color:var(--v)}
.sttit{font-weight:700;color:var(--txt);margin-bottom:4px}
.std{font-size:.85rem;color:var(--mut);line-height:1.6}
.prev{background:linear-gradient(135deg,rgba(114,96,167,.05),rgba(74,159,181,.03));border:1px solid var(--bdr);border-radius:var(--r3);padding:26px;box-shadow:0 10px 36px rgba(114,96,167,.07)}
.prevt{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.prevds{display:flex;gap:5px}
.prevd{width:7px;height:7px;border-radius:50%;background:rgba(114,96,167,.18)}
.prevl{font-size:.7rem;font-weight:600;color:var(--mut);letter-spacing:.06em}
.prevh{height:75px;border-radius:13px;background:linear-gradient(135deg,rgba(114,96,167,.11),rgba(74,159,181,.07));margin-bottom:13px}
.prevb{height:5px;border-radius:3px;background:rgba(114,96,167,.09);margin-bottom:9px}
.prevc{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
.pmc{background:#fff;border:1px solid var(--bdr);border-radius:var(--r1);padding:13px 15px}
.pmcl{font-size:.7rem;color:var(--mut);margin-bottom:3px}
.pmcv{font-family:'Syne',sans-serif;font-size:1.35rem;font-weight:800;color:var(--v)}

/* FOOTER */
.foot{background:linear-gradient(180deg,#1A1A2E 0%,#0D0D1E 100%);color:rgba(255,255,255,.85);padding:72px 24px 36px}
.fg{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:44px}
.fbn{font-family:'Syne',sans-serif;font-weight:800;font-size:1.25rem;color:#fff;margin-bottom:10px;display:flex;align-items:center;gap:9px}
.fbt{font-size:.85rem;color:rgba(255,255,255,.5);line-height:1.7;max-width:290px}
.fct{font-family:'Syne',sans-serif;font-weight:700;font-size:.82rem;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.38);margin-bottom:18px}
.foot a{display:block;color:rgba(255,255,255,.68);text-decoration:none;margin-bottom:11px;font-size:.88rem;transition:color .2s}
.foot a:hover{color:#fff}
.fbot{margin-top:44px;padding-top:22px;border-top:1px solid rgba(255,255,255,.09);display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
.fbc{font-size:.8rem;color:rgba(255,255,255,.38)}
.fpart{border-top:1px solid rgba(114,96,167,.12);padding-top:28px;margin-top:28px}
.fpartt{font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--mut);margin-bottom:18px;text-align:center}
.fpartr{display:flex;align-items:center;justify-content:center;gap:22px;flex-wrap:wrap}
.feu{display:flex;align-items:center;gap:9px;background:rgba(0,82,204,.06);border:1px solid rgba(0,82,204,.14);border-radius:9px;padding:9px 15px;font-size:.76rem;color:#0052cc;font-weight:600}

/* RESPONSIVE */
@media(max-width:980px){
  .hero-in{grid-template-columns:1fr}
  .hv{display:none}
  .tgrid{grid-template-columns:repeat(2,1fr)}
  .dp{grid-template-columns:1fr}
  .og{grid-template-columns:1fr}
  .stgr{grid-template-columns:1fr}
  .fg{grid-template-columns:1fr 1fr}
}
@media(max-width:640px){
  .nav-links{display:none}
  .nav-tog{display:block}
  .tgrid{grid-template-columns:1fr 1fr}
  .hstats{gap:14px}
  .fg{grid-template-columns:1fr}
}
`;

function StyleInjector(){
  useEffect(()=>{
    const el=document.createElement("style");
    el.textContent=CSS;
    document.head.appendChild(el);
    return()=>el.remove();
  },[]);
  return null;
}

function Brand(){
  return(
    <div className="brand">
      <div className="bdot"/>
      SWAFY
    </div>
  );
}

/* ── HERO CARD ─────────────────────────────────── */
function HeroCard(){
  return(
    <div className="hv">
      <div className="fb fb1">
        <div className="fbi" style={{background:"rgba(74,159,181,.12)"}}>🔬</div>
        <div>
          <div className="fbn">235</div>
          <div className="fbt">Bourses MOBIDOC</div>
        </div>
      </div>
      <div className="hcard">
        <div className="ch">
          <div className="cbadge"><div className="lpulse"/>EU4Youth · Actif</div>
          <div style={{color:"var(--mut)"}}>···</div>
        </div>
        <div className="ct">Parcours SWAFY</div>
        <div className="cs">Science · Entrepreneuriat · Tunisie</div>
        <div className="cpl"><span>Déploiement national</span><span style={{color:"var(--v)",fontWeight:700}}>73%</span></div>
        <div className="cpb"><div className="cpf" style={{width:"73%"}}/></div>
        <div className="cmg">
          {[["🧠","IA & Tech"],["🚀","Startup"],["🎮","Gaming Lab"]].map(([ic,lb])=>(
            <div key={lb} className="cm"><div className="cmi">{ic}</div>{lb}</div>
          ))}
        </div>
        <div className="cf">
          <div className="avs">
            {["DS","BB","CA","MK"].map(l=><div key={l} className="av">{l}</div>)}
          </div>
          <Link to="/register" className="ccta">Rejoindre <FiArrowRight/></Link>
        </div>
      </div>
      <div className="fb fb2">
        <div className="fbi" style={{background:"rgba(192,132,184,.12)"}}>🏆</div>
        <div>
          <div className="fbn">70+</div>
          <div className="fbt">Clubs scientifiques</div>
        </div>
      </div>
    </div>
  );
}

/* ── NAVBAR ────────────────────────────────────── */
function Navbar(){
  const [sc,setSc]=useState(false);
  const [op,setOp]=useState(false);
  useEffect(()=>{
    const h=()=>setSc(window.scrollY>20);
    window.addEventListener("scroll",h);
    return()=>window.removeEventListener("scroll",h);
  },[]);
  const links=[
    {href:"#accueil",label:"Accueil"},
    {href:"#direct",label:"En Direct"},
    {href:"#thematique",label:"Thématiques"},
    {href:"#objectif",label:"Objectif"},
    {href:"#contact",label:"Contact"},
  ];
  return(
    <>
      <header className={`nav ${sc?"sc":""}`}>
        <div className="nav-in">
          <Link to="/swafy" style={{textDecoration:"none"}}><Brand/></Link>
          <nav className="nav-links">
            {links.map(l=><a key={l.href} href={l.href}>{l.label}</a>)}
          </nav>
          <div className="nav-act">
            <Link className="btn-g" to="/register">S'inscrire</Link>
            <Link className="btn-p" to="/login">Connexion</Link>
          </div>
          <button className="nav-tog" onClick={()=>setOp(true)}><FiMenu/></button>
        </div>
      </header>
      <div className={`mob ${op?"open":""}`}>
        <button className="mob-close" onClick={()=>setOp(false)}><FiX/></button>
        <nav className="mob-links">
          {links.map(l=><a key={l.href} href={l.href} onClick={()=>setOp(false)}>{l.label}</a>)}
        </nav>
        <div className="mob-act">
          <Link className="btn-ol" to="/register" onClick={()=>setOp(false)}>S'inscrire</Link>
          <Link className="btn-lg" to="/login" onClick={()=>setOp(false)}>Connexion</Link>
        </div>
      </div>
    </>
  );
}

/* ── HERO ──────────────────────────────────────── */
function Hero(){
  return(
    <section className="hero" id="accueil">
      <div className="orb o1"/><div className="orb o2"/>
      <div className="noise"/>
      <div style={{maxWidth:1180,margin:"0 auto",width:"100%"}}>
        <div className="hero-in">
          <div>
            <div className="htag"><div className="lpulse"/>ANPR · Programme EU4Youth</div>
            <h1>Science With<br/>and For <span className="grad">Youth</span></h1>
            <p className="hdesc">
              SWAFY accompagne la jeunesse tunisienne vers l'innovation et l'entrepreneuriat
              scientifique — financé par l'Union européenne à hauteur de 9,5 M€, géré par
              l'ANPR sur 48 mois dans les 24 gouvernorats de Tunisie.
            </p>
            <div className="hact">
              <Link to="/register" className="btn-lg">Rejoindre la plateforme <FiArrowRight/></Link>
              <Link to="/login" className="btn-ol">J'ai déjà un compte</Link>
            </div>
            <div className="hstats">
              <div className="hs"><span className="hs-n">9,5M€</span><span className="hs-l">Budget UE</span></div>
              <div className="hsdiv"/>
              <div className="hs"><span className="hs-n">235</span><span className="hs-l">Bourses MOBIDOC</span></div>
              <div className="hsdiv"/>
              <div className="hs"><span className="hs-n">24</span><span className="hs-l">Gouvernorats</span></div>
            </div>
          </div>
          <HeroCard/>
        </div>
      </div>
    </section>
  );
}

/* ── LIVE ──────────────────────────────────────── */
function LiveCard(){
  return(
    <section id="direct" className="live-sec">
      <div className="con">
        <div className="lc">
          <div className="ll">
            <div className="ldw"><div className="ld"/></div>
            <div>
              <div className="llbl">● Appel ouvert — Mai 2026</div>
              <div className="lt">Gaming Labs & Fablabs SWAFY</div>
              <div className="lsub">Nouvel appel à propositions · 24 gouvernorats · Date limite : 31 mai 2026</div>
            </div>
          </div>
          <div className="lr">
            <div className="lpill"><FiZap/>Gaming Lab</div>
            <div className="lpill"><FiUsers/>13 000 jeunes visés</div>
            <a
              href="http://www.anpr.tn/projet-swafy-appel-a-propositions-a-lattention-des-associations-pour-la-creation-renforcement-de-gaming-labs/"
              target="_blank" rel="noreferrer" className="lbtn"
            >Voir l'appel <FiArrowRight/></a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════
   5 THÉMATIQUES RÉELLES — avec formations & liens
════════════════════════════════════════════════ */
const THEMES=[
  {
    icon:<FiTrendingUp/>,
    name:"Recherche Partenariale",
    color:"#7260A7",
    tag:"Composante MOBIDOC",
    desc:"Stimuler l'employabilité des jeunes chercheurs à travers une recherche appliquée répondant aux besoins réels de l'économie tunisienne.",
    kpis:[{n:"235",l:"Bourses MOBIDOC"},{n:"190+",l:"Projets financés"}],
    points:[
      {ic:"🎓",t:"Bourses MOBIDOC Doctorant",d:"80% financé par l'ANPR, 20% par l'organisme bénéficiaire — pour des travaux de recherche appliquée en milieu socio-économique."},
      {ic:"🏢",t:"Recherche orientée marché",d:"Travaux dirigés vers les besoins concrets du secteur productif et sociétal tunisien."},
      {ic:"🚀",t:"Incubation de startups scientifiques",d:"Accompagnement des doctorants dans la création et l'incubation de startups innovantes (IncubCher ANPR)."},
    ],
    formations:[
      {ic:"📋",t:"Management de projet (PMP)",d:"Formation certifiante · 22 j/j · Présentiel + En ligne",href:"https://www.anpr.tn/wp-content/uploads/2024/01/TDR-Expert-Management-de-projet_final_18012024.pdf"},
      {ic:"🔬",t:"MOBIDOC Doctorant · Session 2024",d:"Appel à propositions · Bourse UE · Recherche appliquée",href:"https://www.anpr.tn/projet-swafy-appel-a-propositions-mobidoc-doctorant-session-2024/"},
      {ic:"💼",t:"MOBIDOC Post-doc Université",d:"Gestion · Management · Recherche appliquée",href:"http://www.anpr.tn/projet-swafy-appel-a-candidature-mobidoc-post-doc-universite-management/"},
    ],
  },
  {
    icon:<FiZap/>,
    name:"Entrepreneuriat & Créativité",
    color:"#E8A05D",
    tag:"Jeunesse Créative",
    desc:"Renforcer l'esprit d'entrepreneuriat, d'innovation et de créativité chez les jeunes tunisiens, dans une perspective de genre et d'inclusion.",
    kpis:[{n:"100+",l:"Nouveaux clubs"},{n:"24",l:"Gouvernorats couverts"}],
    points:[
      {ic:"💡",t:"Foire de la Créativité SWAFY",d:"1ère édition · 24-25 mars 2026 · Cité de la Culture, Tunis — expositions de prototypes et projets scientifiques."},
      {ic:"🎮",t:"Gaming Labs",d:"Création et renforcement de Gaming Labs dans des associations — appel ouvert jusqu'au 31 mai 2026."},
      {ic:"⚙️",t:"Fablabs régionaux",d:"Ben Arous, La Manouba, Le Kef, Siliana, Tozeur, Kébili, Kasserine et Monastir — appel ouvert en mai 2026."},
    ],
    formations:[
      {ic:"🎮",t:"Création / renforcement de Gaming Labs",d:"Appel associations · Délai : 31 mai 2026",href:"http://www.anpr.tn/projet-swafy-appel-a-propositions-a-lattention-des-associations-pour-la-creation-renforcement-de-gaming-labs/"},
      {ic:"🔧",t:"Création de Fablabs · 8 gouvernorats",d:"Ben Arous · La Manouba · Kef · Siliana · Tozeur · Kébili · Kasserine · Monastir",href:"http://www.anpr.tn/appel-a-propositions-a-lattention-des-associations-en-vue-du-renforcement-ou-la-creation-de-fablabs-dans-les-gouvernorats-de-ben-arous-la-manouba-le-kef-siliana-tozeur-kebili-kasserine/"},
      {ic:"🌟",t:"Foire de la Créativité SWAFY",d:"Participation · Cité de la Culture, Tunis · 2026",href:"https://www.anpr.tn/projet-swafy-foire-de-la-creativite-swafy-appel-a-participation/"},
    ],
  },
  {
    icon:<FiUsers/>,
    name:"Dialogue Jeunesse-Science",
    color:"#4A9FB5",
    tag:"Débat National",
    desc:"Dynamiser le rôle des jeunes dans la définition des politiques publiques en Science, Technologie et Innovation à travers 260 séances de débat nationales.",
    kpis:[{n:"260",l:"Séances de débat"},{n:"13 000",l:"Jeunes participants"}],
    points:[
      {ic:"🗣️",t:"Congrès national Jeunesse & Science",d:"Élaboration d'une feuille de route jeunesse-science à l'horizon 2035, en appui à la stratégie nationale de la jeunesse."},
      {ic:"🗺️",t:"Couverture nationale équitable",d:"Séances dans les 24 gouvernorats, avec priorité aux zones marginalisées."},
      {ic:"📋",t:"Contribution aux politiques STI",d:"Implication directe des jeunes dans la définition des politiques publiques en Science, Technologie et Innovation."},
    ],
    formations:[
      {ic:"🗣️",t:"Techniques de communication",d:"Formation jeunes · Clubs scientifiques · En présentiel",href:"https://www.anpr.tn"},
      {ic:"🏛️",t:"Leadership & Engagement citoyen",d:"Formation certifiante · Gouvernance · Participation publique",href:"https://www.anpr.tn"},
      {ic:"🎬",t:"Techniques audiovisuelles",d:"Production vidéo · Reportage scientifique · Diffusion",href:"https://www.anpr.tn"},
      {ic:"📊",t:"Expert processus de débat",d:"Sélection d'expert · Conception du débat · Feuille de route 2035",href:"https://www.anpr.tn/projet-swafy-termes-de-reference-en-vue-de-la-selection-dun-expert/"},
    ],
  },
  {
    icon:<FiAward/>,
    name:"Clubs Scientifiques",
    color:"#C084B8",
    tag:"Réseau Associatif",
    desc:"Création et restructuration de clubs scientifiques dans des établissements éducatifs publics, maisons de jeunes et espaces de créativité en Tunisie.",
    kpis:[{n:"70+",l:"Clubs créés"},{n:"19",l:"Gouvernorats actifs"}],
    points:[
      {ic:"🏫",t:"Implantation dans le public",d:"Lycées, universités, maisons de jeunes — opérationnel depuis février 2024 dans 19 gouvernorats."},
      {ic:"🤝",t:"18 associations partenaires",d:"Budgets de 140 000 à 440 000 DT · 19 conventions de financement EU."},
      {ic:"🤖",t:"RobotBattle & Compétitions",d:"1ère compétition de robotique en Tunisie : COBRA (1er) · POWER BOMB (2ème) · DRAGON (3ème)."},
    ],
    formations:[
      {ic:"🤝",t:"Expert accompagnateur d'associations",d:"Sélection d'experts · Accompagnement projet · 2024",href:"https://www.anpr.tn/wp-content/uploads/2024/06/SWAFY-TDR-Expert-daccompagnement-associationsVF.pdf"},
      {ic:"🌐",t:"Plateforme de réseautage associatif",d:"Développement & administration · Appel en cours",href:"http://www.anpr.tn/projet-swafy-appel-a-candidatures-recrutement-de-deux-charge-e-s-de-projets/"},
      {ic:"📸",t:"Concours Photo & Art Visuel Scientifiques",d:"Jeunes 6-30 ans · Tout le territoire tunisien · 2026",href:"https://www.anpr.tn"},
    ],
  },
  {
    icon:<FiGlobe/>,
    name:"Culture Scientifique",
    color:"#10B981",
    tag:"Dissémination",
    desc:"Améliorer l'attractivité de la science et renforcer la culture scientifique chez les jeunes tunisiens, via un accès équitable sur tout le territoire.",
    kpis:[{n:"48",l:"Mois de programme"},{n:"9,5M€",l:"Budget européen"}],
    points:[
      {ic:"🌍",t:"Accès équitable & inclusif",d:"Discrimination positive pour les zones défavorisées et les jeunes ayant moins d'opportunités d'accès à la créativité scientifique."},
      {ic:"🏛️",t:"Partenaires institutionnels",d:"Ministères (Éducation, Emploi, Jeunesse, Culture) + Fondation Orange Tunisie + Délégation UE."},
      {ic:"📡",t:"Live streaming & Diffusion",d:"Séminaires et événements SWAFY diffusés en direct sur les pages Facebook ANPR et SWAFY."},
    ],
    formations:[
      {ic:"🎯",t:"Expert thématique & analyse de données",d:"Sélection d'experts · Évaluation subventions · Appui mise en œuvre",href:"https://www.anpr.tn/projet-swafy-termes-de-reference-pour-selection-dune-equipe-dexperts-thematiques-et-dun-expert-en-analyse-des-donnees-en-vue-de-lappui-a-la-mise-en-oeuvre-d"},
      {ic:"💼",t:"Chargé(e)s de projets SWAFY",d:"Recrutement · 2 postes · Délai : 1er juin 2026",href:"http://www.anpr.tn/projet-swafy-appel-a-candidatures-recrutement-de-deux-charge-e-s-de-projets/"},
      {ic:"🔎",t:"Manager de subventions",d:"Gestion financière · Suivi · Reporting EU",href:"https://www.anpr.tn/wp-content/uploads/2024/04/SWAFY-Appel-à-candidaturesManagerdeSubvention_Final-1.pdf"},
    ],
  },
];

function Thematique(){
  const [act,setAct]=useState(null);
  const d=act!==null?THEMES[act]:null;
  return(
    <section id="thematique" className="sec">
      <div className="con">
        <div className="ey"><div className="eyl"/>Les 5 thématiques</div>
        <h2 className="stit">Parcours pensés<br/>pour les jeunes</h2>
        <p className="sdesc">Cliquez sur une thématique pour voir ses formations, liens officiels et résultats concrets sur le terrain.</p>
        <div className="tgrid">
          {THEMES.map(({icon,name,desc},i)=>(
            <div key={name} className={`tc ${act===i?"act":""}`} onClick={()=>setAct(act===i?null:i)}>
              <div className="tic">{icon}</div>
              <div className="tn">{name}</div>
              <div className="td">{desc}</div>
              <div className="tarr">{act===i?<FiX/>:<FiArrowRight/>}</div>
            </div>
          ))}
        </div>
        {d&&(
          <div className="dp" key={act}>
            {/* GAUCHE — description + points clés */}
            <div>
              <div className="dptag" style={{color:d.color,borderColor:d.color+"44",background:d.color+"13"}}>● {d.tag}</div>
              <div className="dptit">{d.name}</div>
              <div className="dpb">{d.desc}</div>
              <div className="dpk">
                {d.kpis.map(({n,l})=>(
                  <div key={l} className="kpi">
                    <span className="kn" style={{color:d.color}}>{n}</span>
                    <span className="kl">{l}</span>
                  </div>
                ))}
              </div>
              <div className="dpts">
                {d.points.map(({ic,t,d:dd})=>(
                  <div key={t} className="dpt">
                    <div className="dptic" style={{color:d.color,background:d.color+"18"}}>{ic}</div>
                    <div>
                      <div className="dptt">{t}</div>
                      <div className="dptd">{dd}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* DROITE — formations avec liens officiels */}
            <div>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:".82rem",textTransform:"uppercase",letterSpacing:".1em",color:d.color,marginBottom:14}}>
                Formations & Appels officiels
              </div>
              <div className="fmts">
                {d.formations.map(({ic,t,d:dd,href})=>(
                  <a key={t} className="fmt" href={href} target="_blank" rel="noreferrer">
                    <div className="fmtic" style={{color:d.color,background:d.color+"18"}}>{ic}</div>
                    <div>
                      <div className="fmtt">{t}</div>
                      <div className="fmtd">{dd}</div>
                    </div>
                    <FiArrowRight className="fmtarr"/>
                  </a>
                ))}
              </div>
              <div style={{marginTop:16,padding:"12px 14px",borderRadius:12,background:"rgba(114,96,167,.04)",border:"1px solid rgba(114,96,167,.1)",fontSize:".76rem",color:"var(--mut)"}}>
                📌 Tous les appels officiels sur{" "}
                <a href="https://www.anpr.tn" target="_blank" rel="noreferrer" style={{color:d.color,fontWeight:700,textDecoration:"none"}}>anpr.tn</a>
                {" "}et{" "}
                <a href="https://www.facebook.com/swafyproject/" target="_blank" rel="noreferrer" style={{color:d.color,fontWeight:700,textDecoration:"none"}}>facebook.com/swafyproject</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── OBJECTIF ──────────────────────────────────── */
function PhoneMock({v}){
  return(
    <div className={`pc ${v==="b"?"pb":"pa"}`}>
      <div className="ph"><div className="pn"/></div>
      <div className="pbd">
        <div className="psc">
          <div className="psbg">EU4Youth</div>
          <div className="pst">Formations & Clubs Scientifiques</div>
          <div className="pss">Science · Innovation · Créativité</div>
          <div className="psb">Démarrer →</div>
        </div>
        <div className="ptiles"><div className="ptile"/><div className="ptile"/><div className="ptile"/></div>
        <div><div className="pli"/><div className="pli"/><div className="pli" style={{width:"60%"}}/></div>
      </div>
    </div>
  );
}

function Objectif(){
  return(
    <section id="objectif" className="sec-alt">
      <div className="con">
        <div className="og">
          <div className="psk"><PhoneMock/><PhoneMock v="b"/></div>
          <div>
            <div className="ey"><div className="eyl"/>Notre objectif</div>
            <h2 className="stit">
              Accompagner<br/>la jeunesse<br/>
              <span style={{backgroundImage:"linear-gradient(135deg,#7260A7,#4A9FB5)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
                tunisienne
              </span>
            </h2>
            <p className="odesc">
              SWAFY est un projet financé par l'Union européenne (9,5 M€ · 48 mois), inscrit sous
              le programme EU4Youth et géré par l'ANPR. Il vise à améliorer la valeur ajoutée de la
              recherche et de l'innovation dans le développement économique tunisien, et à soutenir
              l'entrepreneuriat et l'employabilité des jeunes à travers le renforcement de l'esprit
              de créativité et d'invention ainsi que le soutien aux doctorants et post-doctorants.
            </p>
            <div className="sr">
              <a className="sb" href="#!"><span>🍎</span> App Store</a>
              <a className="sb" href="#!"><span>🤖</span> Google Play</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── ÉTAPES ────────────────────────────────────── */
function Steps(){
  const steps=[
    {n:"1",t:"Choisissez une thématique",d:"Recherche, entrepreneuriat, clubs scientifiques, dialogue jeunesse ou culture scientifique."},
    {n:"2",t:"Apprenez et pratiquez",d:"Modules interactifs, ateliers, Gaming Labs, compétitions de robotique et challenges."},
    {n:"3",t:"Obtenez votre certification",d:"Progression suivie, badges officiels et accès aux bourses MOBIDOC."},
  ];
  return(
    <section className="sec">
      <div className="con">
        <div className="stgr">
          <div>
            <div className="ey"><div className="eyl"/>Comment ça marche</div>
            <h2 className="stit">Commencez en<br/>3 étapes simples</h2>
            {steps.map(({n,t,d})=>(
              <div key={n} className="sti">
                <div className="stn">{n}</div>
                <div><div className="sttit">{t}</div><div className="std">{d}</div></div>
              </div>
            ))}
            <Link className="btn-lg" to="/register" style={{marginTop:10}}>
              Commencer la formation <FiArrowRight/>
            </Link>
          </div>
          <div className="prev">
            <div className="prevt">
              <div className="prevds"><div className="prevd"/><div className="prevd"/><div className="prevd"/></div>
              <div className="prevl">Plateforme SWAFY</div>
            </div>
            <div className="prevh"/>
            <div className="prevb" style={{width:"80%"}}/><div className="prevb" style={{width:"60%"}}/><div className="prevb" style={{width:"90%"}}/>
            <div className="prevc">
              <div className="pmc"><div className="pmcl">Modules complétés</div><div className="pmcv">24</div></div>
              <div className="pmc"><div className="pmcl">Score moyen</div><div className="pmcv">91%</div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── BARRE PARTENAIRES ─────────────────────────── */
function PartnersBar(){
  return(
    <div className="pbar">
      <div className="pbar-in">
        <span className="pbar-lbl">Partenaires officiels</span>
        <div className="pbar-logos">
          <img src="/logo_150-04__1_.png" alt="SWAFY"/>
          <div className="pdiv"/>
          <img src="https://upload.wikimedia.org/wikipedia/fr/thumb/9/9a/ANPR_logo.png/120px-ANPR_logo.png" alt="ANPR" onError={e=>{e.target.style.display="none"}}/>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Flag_of_Europe.svg/80px-Flag_of_Europe.svg.png" alt="UE" style={{height:26}}/>
          <div className="pdiv"/>
          <span className="pbar-eu">EU4Youth</span>
        </div>
      </div>
    </div>
  );
}

/* ── FOOTER ────────────────────────────────────── */
function Footer(){
  return(
    <footer id="contact" className="foot">
      <div className="con">
        <div className="fg">
          <div>
            <div className="fbn"><div className="bdot" style={{width:9,height:9,borderRadius:"50%",background:"linear-gradient(135deg,#7260A7,#5B4D8E)"}}/>SWAFY</div>
            <p className="fbt">
              Science With and For Youth — Financé par l'UE (9,5 M€ · 48 mois), géré par l'ANPR.<br/>
              Angle Rue Danton & Rue Chaaben Bhouri N°11, Lafayette — BP 177, 1002 Tunis Belvédère.<br/>
              ✉ swafy@anpr.tn
            </p>
          </div>
          <div>
            <div className="fct">À propos</div>
            <a href="#objectif">Objectif du projet</a>
            <a href="#thematique">Les 5 thématiques</a>
            <a href="#direct">Actualités & Appels</a>
            <a href="https://www.anpr.tn" target="_blank" rel="noreferrer">ANPR.tn</a>
          </div>
          <div>
            <div className="fct">Liens officiels</div>
            <a href="https://www.facebook.com/swafyproject/" target="_blank" rel="noreferrer">📘 Facebook SWAFY</a>
            <a href="https://www.youtube.com/watch?v=eK-aLZ0nj8U" target="_blank" rel="noreferrer">▶️ YouTube — Lancement SWAFY</a>
            <a href="https://www.linkedin.com/in/dhouha-sbaoulji-5a42aa28/" target="_blank" rel="noreferrer">🔗 LinkedIn — Dhouha Sbaoulji</a>
            <a href="https://www.anpr.tn" target="_blank" rel="noreferrer">anpr.tn</a>
            <a href="https://eu4youth.tn/explorer/swafy/" target="_blank" rel="noreferrer">eu4youth.tn/swafy</a>
            <a href="mailto:swafy@anpr.tn">✉ swafy@anpr.tn</a>
          </div>
        </div>
        <div className="fpart">
          <div className="fpartt">Partenaires & Financeurs</div>
          <div className="fpartr">
            <div className="feu">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Flag_of_Europe.svg/40px-Flag_of_Europe.svg.png" alt="UE" style={{height:22}}/>
              Projet financé par l'Union européenne
            </div>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"1rem",color:"rgba(255,255,255,.58)"}}>ANPR</span>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:".88rem",color:"rgba(255,255,255,.58)"}}>EU4Youth</span>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:".82rem",color:"rgba(255,255,255,.45)"}}>Min. Enseignement Supérieur</span>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:".82rem",color:"rgba(255,255,255,.45)"}}>Orange Tunisie</span>
          </div>
        </div>
        <div className="fbot">
          <span className="fbc">© {new Date().getFullYear()} SWAFY · Tunis, Tunisie</span>
          <span className="fbc">Built with React · Science With and For Youth</span>
        </div>
      </div>
    </footer>
  );
}

/* ── PAGE ──────────────────────────────────────── */
export default function Accueil(){
  return(
    <>
      <StyleInjector/>
      <PartnersBar/>
      <Navbar/>
      <main>
        <Hero/>
        <LiveCard/>
        <Thematique/>
        <Objectif/>
        <Steps/>
      </main>
      <Footer/>
    </>
  );
}