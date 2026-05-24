import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowLeft, FiPlay, FiUsers, FiHeadphones,
  FiAward, FiZap, FiX, FiChevronLeft, FiChevronRight, FiArrowRight, FiExternalLink,
} from "react-icons/fi";

/* ════════════════════════════════════════════════
   CSS — page Swafy (fond violet glassmorphism)
════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#7260A7;--bd:#5a4d8a;--bl:#8e7ec0;
  --gl:rgba(255,255,255,.10);--glb:rgba(255,255,255,.18);--gls:rgba(255,255,255,.22);
  --bdr:rgba(255,255,255,.18);
  --txt:#fff;--ts:rgba(255,255,255,.72);--tm:rgba(255,255,255,.46);
  --acc:#c8b8ff;--tl:#7FFFEE;--pk:#FF8EC8;--gd:#FFD166;
  --r1:12px;--r2:20px;--r3:32px;--r4:48px;
  --shd:0 24px 80px rgba(50,30,100,.45);
}
html{scroll-behavior:smooth}
body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);color:var(--txt);overflow-x:hidden;min-height:100vh}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,.32);border-radius:2px}

@keyframes d1{from{transform:translate(0,0) scale(1)}to{transform:translate(50px,40px) scale(1.1)}}
@keyframes d2{from{transform:translate(0,0) scale(1)}to{transform:translate(-40px,50px) scale(1.08)}}
@keyframes d3{from{transform:translate(0,0) scale(1)}to{transform:translate(30px,-40px) scale(1.12)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-13px)}}
@keyframes up{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
@keyframes rt{from{opacity:0;transform:translateX(36px)}to{opacity:1;transform:translateX(0)}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.5)}}
@keyframes shimmer{from{background-position:0% 50%}to{background-position:100% 50%}}
@keyframes grow{from{width:0%}}
@keyframes scan{0%{transform:scaleX(0) translateX(-100%);opacity:0}50%{transform:scaleX(1) translateX(0);opacity:1}100%{transform:scaleX(0) translateX(100%);opacity:0}}
@keyframes fin{from{opacity:0}to{opacity:1}}
@keyframes min{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes breathe{0%,100%{box-shadow:0 0 0 14px rgba(255,255,255,.1),0 0 0 28px rgba(255,255,255,.05)}50%{box-shadow:0 0 0 22px rgba(255,255,255,.13),0 0 0 44px rgba(255,255,255,.07)}}

.gl{background:var(--gl);border:1px solid var(--bdr);backdrop-filter:blur(20px) saturate(160%)}
.gls{background:var(--gls);border:1px solid rgba(255,255,255,.24);backdrop-filter:blur(26px) saturate(180%)}

.noise{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.5;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");
  background-size:160px}
.orb{position:fixed;border-radius:50%;filter:blur(88px);pointer-events:none;z-index:0}
.o1{width:680px;height:680px;background:radial-gradient(circle,rgba(200,184,255,.26) 0%,transparent 65%);top:-250px;right:-170px;animation:d1 14s ease-in-out infinite alternate}
.o2{width:530px;height:530px;background:radial-gradient(circle,rgba(127,255,238,.13) 0%,transparent 65%);bottom:8%;left:-170px;animation:d2 18s ease-in-out infinite alternate}
.o3{width:380px;height:380px;background:radial-gradient(circle,rgba(255,142,200,.14) 0%,transparent 65%);top:42%;left:43%;animation:d3 11s ease-in-out infinite alternate}
.o4{width:290px;height:290px;background:radial-gradient(circle,rgba(255,209,102,.11) 0%,transparent 65%);bottom:28%;right:8%;animation:d1 9s 3s ease-in-out infinite alternate}

.pg{position:relative;z-index:1}
.con{max-width:1180px;margin:0 auto;padding:0 24px}

/* NAV */
.nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:0 24px;transition:all .4s}
.nav.sc{background:rgba(90,77,138,.88);backdrop-filter:blur(24px);border-bottom:1px solid var(--bdr)}
.nav-in{max-width:1180px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:70px}
.brand{display:flex;align-items:center;gap:9px;font-family:'Syne',sans-serif;font-weight:800;font-size:1.32rem;color:#fff;text-decoration:none;letter-spacing:-.015em}
.bdot{width:9px;height:9px;border-radius:50%;background:linear-gradient(135deg,var(--acc),var(--tl));box-shadow:0 0 13px rgba(200,184,255,.8)}
.back{display:flex;align-items:center;gap:7px;color:var(--ts);font-size:.86rem;font-weight:500;text-decoration:none;transition:color .2s;padding:7px 0}
.back:hover{color:#fff}
.nav-act{display:flex;gap:11px}
.bgh{padding:8px 18px;border-radius:50px;border:1px solid var(--bdr);color:#fff;font-size:.83rem;font-weight:500;text-decoration:none;background:var(--gl);backdrop-filter:blur(8px);transition:all .2s}
.bgh:hover{background:var(--glb)}
.bpl{padding:9px 20px;border-radius:50px;background:rgba(255,255,255,.95);color:var(--bd);font-size:.83rem;font-weight:700;text-decoration:none;border:none;cursor:pointer;transition:all .25s;box-shadow:0 5px 22px rgba(0,0,0,.2)}
.bpl:hover{transform:translateY(-1px);box-shadow:0 9px 30px rgba(0,0,0,.3)}

/* HERO */
.hero{position:relative;min-height:100vh;display:flex;align-items:center;padding:130px 24px 90px;overflow:hidden}
.hi{max-width:1180px;margin:0 auto;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.htag{display:inline-flex;align-items:center;gap:7px;padding:5px 14px;border-radius:50px;background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.2);font-size:.73rem;font-weight:600;color:var(--acc);letter-spacing:.1em;text-transform:uppercase;margin-bottom:26px;animation:up .8s ease both}
.lp{width:7px;height:7px;border-radius:50%;background:var(--tl);animation:pulse 2s infinite}
.hero h1{font-family:'Syne',sans-serif;font-size:clamp(2.9rem,5vw,4.8rem);font-weight:800;line-height:1.06;letter-spacing:-.034em;margin-bottom:22px;animation:up .8s .08s ease both}
.shim{background:linear-gradient(135deg,#fff 0%,var(--acc) 40%,var(--tl) 70%,var(--pk) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;background-size:200% 200%;animation:shimmer 4s ease-in-out infinite alternate}
.hdesc{color:var(--ts);font-size:1.05rem;line-height:1.78;max-width:470px;margin-bottom:38px;animation:up .8s .16s ease both}
.hact{display:flex;gap:13px;flex-wrap:wrap;animation:up .8s .24s ease both}
.bpr{display:inline-flex;align-items:center;gap:9px;padding:14px 30px;border-radius:50px;background:rgba(255,255,255,.95);color:var(--bd);font-size:.95rem;font-weight:700;text-decoration:none;border:none;cursor:pointer;box-shadow:0 9px 32px rgba(0,0,0,.24);transition:all .3s;position:relative;overflow:hidden}
.bpr:hover{transform:translateY(-2px);box-shadow:0 15px 44px rgba(0,0,0,.34)}
.bsc{display:inline-flex;align-items:center;gap:9px;padding:14px 30px;border-radius:50px;border:1px solid rgba(255,255,255,.32);color:#fff;font-size:.95rem;font-weight:500;text-decoration:none;background:var(--gl);backdrop-filter:blur(8px);transition:all .25s}
.bsc:hover{background:var(--glb)}
.hstats{display:flex;gap:28px;margin-top:42px;animation:up .8s .32s ease both}
.hs{display:flex;flex-direction:column;gap:3px}
.hsn{font-family:'Syne',sans-serif;font-size:1.8rem;font-weight:800;color:#fff;letter-spacing:-.02em}
.hsl{font-size:.76rem;color:var(--tm)}
.hsd{width:1px;background:rgba(255,255,255,.18)}

/* HERO CARD */
.hv{animation:rt .9s .22s ease both;position:relative}
.hc{border-radius:var(--r3);padding:30px;position:relative;box-shadow:0 30px 95px rgba(50,30,100,.55),inset 0 1px 0 rgba(255,255,255,.2);animation:float 7s ease-in-out infinite}
.hct{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px}
.hlb{display:flex;align-items:center;gap:6px;padding:5px 13px;border-radius:50px;background:rgba(127,255,238,.14);border:1px solid rgba(127,255,238,.28);font-size:.7rem;font-weight:700;color:#7FFFEE;letter-spacing:.06em;text-transform:uppercase}
.hcd{display:flex;gap:5px}
.hcdd{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.22)}
.hctit{font-family:'Syne',sans-serif;font-size:1.48rem;font-weight:700;margin-bottom:6px;letter-spacing:-.02em}
.hcsu{font-size:.84rem;color:var(--ts);margin-bottom:22px}
.hcpl{display:flex;justify-content:space-between;font-size:.75rem;color:var(--ts);margin-bottom:7px}
.hcpb{height:5px;background:rgba(255,255,255,.11);border-radius:3px;overflow:hidden;margin-bottom:22px}
.hcpf{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--acc),var(--tl));animation:grow 2.4s .8s ease both}
.hmg{display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px;margin-bottom:22px}
.hmt{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.13);border-radius:var(--r1);padding:13px 8px;text-align:center;cursor:pointer;transition:all .25s}
.hmt:hover{background:rgba(255,255,255,.17);border-color:rgba(255,255,255,.33);transform:translateY(-2px)}
.hmi{font-size:1.15rem;margin-bottom:5px}
.hml{font-size:.7rem;font-weight:600;color:var(--ts)}
.hcf{display:flex;justify-content:space-between;align-items:center}
.avs{display:flex}
.av{width:30px;height:30px;border-radius:50%;border:2px solid rgba(114,96,167,.88);margin-left:-8px;display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:700;color:var(--bd);background:linear-gradient(135deg,var(--acc),var(--tl))}
.av:first-child{margin-left:0}
.hcb{display:flex;align-items:center;gap:5px;padding:8px 18px;border-radius:50px;background:rgba(255,255,255,.94);color:var(--bd);font-size:.78rem;font-weight:700;border:none;cursor:pointer;text-decoration:none;transition:all .2s}
.hcb:hover{transform:translateY(-1px);box-shadow:0 7px 22px rgba(0,0,0,.24)}
.fb{position:absolute;display:flex;align-items:center;gap:9px;border-radius:15px;padding:11px 14px;box-shadow:0 14px 44px rgba(50,30,100,.42);font-size:.8rem;font-weight:500}
.fb1{top:-16px;left:-22px;animation:float 8s 1s ease-in-out infinite}
.fb2{bottom:-16px;right:-22px;animation:float 9s 2s ease-in-out infinite}
.fbi{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:1rem}
.fbn{font-family:'Syne',sans-serif;font-size:1.05rem;font-weight:800}
.fbt{font-size:.68rem;color:var(--ts)}

/* SECTIONS */
.sec{padding:92px 24px;position:relative}
.seca{padding:92px 24px;position:relative;background:rgba(0,0,0,.11)}
.ey{display:inline-flex;align-items:center;gap:7px;font-size:.71rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--acc);margin-bottom:14px}
.eyl{width:20px;height:1px;background:var(--acc)}
.stit{font-family:'Syne',sans-serif;font-size:clamp(1.9rem,3.2vw,2.8rem);font-weight:800;letter-spacing:-.025em;line-height:1.14;margin-bottom:14px}
.sdesc{font-size:1rem;color:var(--ts);max-width:510px;line-height:1.72}

/* VIDÉO */
.vw{margin-top:52px}
.vc{border-radius:var(--r4);overflow:hidden;position:relative;cursor:pointer;box-shadow:var(--shd);aspect-ratio:16/7;background:linear-gradient(135deg,rgba(255,255,255,.07),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.16);transition:transform .3s}
.vc:hover{transform:scale(1.008)}
.vbg{position:absolute;inset:0;background:linear-gradient(135deg,rgba(200,184,255,.28) 0%,rgba(127,255,238,.13) 40%,rgba(255,142,200,.18) 100%)}
.vls{position:absolute;inset:0;overflow:hidden}
.vl{position:absolute;height:1px;left:0;right:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent);animation:scan 4s ease-in-out infinite}
.vl:nth-child(1){top:24%}
.vl:nth-child(2){top:54%;animation-delay:1.5s}
.vl:nth-child(3){top:80%;animation-delay:3s}
.vmu{position:absolute;inset:0;padding:30px;display:flex;flex-direction:column;justify-content:flex-end}
.vmb{height:7px;background:rgba(255,255,255,.13);border-radius:4px;margin-bottom:9px}
.vpb{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.vpc{width:78px;height:78px;border-radius:50%;background:rgba(255,255,255,.94);display:flex;align-items:center;justify-content:center;font-size:1.35rem;color:var(--bd);transition:all .3s;cursor:pointer;animation:breathe 3s ease-in-out infinite}
.vc:hover .vpc{transform:scale(1.09);background:#fff}
.srow{display:flex;margin-top:38px;border-radius:var(--r3);overflow:hidden;border:1px solid rgba(255,255,255,.13)}
.sb{flex:1;padding:30px 22px;text-align:center;background:var(--gl);backdrop-filter:blur(14px);border-right:1px solid rgba(255,255,255,.09);transition:background .25s}
.sb:last-child{border-right:none}
.sb:hover{background:var(--gls)}
.sbn{font-family:'Syne',sans-serif;font-size:2.5rem;font-weight:800;letter-spacing:-.03em;margin-bottom:5px;background:linear-gradient(135deg,#fff 0%,var(--acc) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.sbl{font-size:.84rem;color:var(--ts);font-weight:500}

/* ABOUT */
.ag{display:grid;grid-template-columns:1fr 1fr;gap:76px;align-items:center}
.ad{font-size:1.03rem;color:var(--ts);line-height:1.82;margin-bottom:34px}
.sr2{display:flex;gap:13px}
.sbt{display:flex;align-items:center;gap:9px;padding:13px 22px;border-radius:var(--r1);background:var(--gl);border:1px solid var(--bdr);color:#fff;text-decoration:none;font-weight:600;font-size:.88rem;cursor:pointer;transition:all .25s;backdrop-filter:blur(8px)}
.sbt:hover{background:var(--glb);transform:translateY(-2px)}
.phs{position:relative;height:390px}
.ph{position:absolute;width:198px;border-radius:27px;overflow:hidden;border:1px solid rgba(255,255,255,.18);box-shadow:0 28px 75px rgba(50,30,100,.52)}
.pha{top:0;left:28px;animation:float 7s ease-in-out infinite;z-index:2}
.phb{top:68px;left:158px;animation:float 9s 1.5s ease-in-out infinite;opacity:.82;z-index:1}
.phh{height:13px;background:rgba(255,255,255,.05)}
.phn{width:42px;height:5px;border-radius:3px;background:rgba(255,255,255,.09);margin:4px auto}
.phbd{padding:13px;background:rgba(90,77,138,.58)}
.phb2{height:62px;border-radius:13px;margin-bottom:11px;background:linear-gradient(135deg,rgba(200,184,255,.38),rgba(127,255,238,.22));border:1px solid rgba(255,255,255,.13)}
.phr{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-bottom:9px}
.pht{height:36px;background:rgba(255,255,255,.07);border-radius:8px}
.phl{height:8px;background:rgba(255,255,255,.09);border-radius:4px;margin-top:6px}

/* PARTENAIRES STRIP */
.pstrip{padding:30px 24px;background:rgba(0,0,0,.14);border-top:1px solid rgba(255,255,255,.09);border-bottom:1px solid rgba(255,255,255,.09)}
.psin{max-width:1180px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:28px;flex-wrap:wrap}
.plbl{font-size:.68rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--tm);margin-right:6px}
.pit{display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);border-radius:9px;padding:9px 15px;font-size:.8rem;font-weight:700;color:rgba(255,255,255,.82)}
.pdiv{width:1px;height:26px;background:rgba(255,255,255,.11)}

/* ÉQUIPE */
.tg{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:52px}
.tm{border-radius:var(--r2);padding:26px 18px;text-align:center;border:1px solid rgba(255,255,255,.16);transition:all .3s;cursor:pointer;position:relative;overflow:hidden}
.tm::before{content:'';position:absolute;inset:0;opacity:0;background:rgba(255,255,255,.05);transition:opacity .3s}
.tm:hover::before{opacity:1}
.tm:hover{transform:translateY(-5px);box-shadow:0 22px 56px rgba(50,30,100,.42)}
.tmi{width:68px;height:68px;border-radius:50%;margin:0 auto 14px;border:3px solid rgba(255,255,255,.38);display:block;object-fit:cover;box-shadow:0 7px 22px rgba(0,0,0,.28)}
.tmn{font-family:'Syne',sans-serif;font-size:.97rem;font-weight:700;margin-bottom:6px}
.tmr{display:inline-block;padding:4px 11px;border-radius:50px;background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.16);font-size:.7rem;font-weight:600;color:var(--ts)}

/* GALERIE */
.gltr{display:flex;gap:18px;overflow:hidden;margin-top:52px}
.gls2{flex:0 0 calc(33.333% - 13px);border-radius:var(--r2);overflow:hidden;aspect-ratio:16/10;position:relative;border:1px solid rgba(255,255,255,.13);box-shadow:0 14px 44px rgba(50,30,100,.38);transition:transform .4s}
.gls2:hover{transform:scale(1.024)}
.gls2 img{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(.88) brightness(.86);transition:filter .4s}
.gls2:hover img{filter:saturate(1.08) brightness(.92)}
.gov{position:absolute;inset:0;background:linear-gradient(to top,rgba(90,77,138,.48) 0%,transparent 58%)}
.gctrl{display:flex;justify-content:center;align-items:center;gap:14px;margin-top:26px}
.gbtn{width:42px;height:42px;border-radius:50%;background:var(--gl);border:1px solid var(--bdr);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.97rem;transition:all .2s;backdrop-filter:blur(8px)}
.gbtn:hover{background:var(--gls)}
.gdots{display:flex;gap:7px}
.gdot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.22);cursor:pointer;transition:all .25s}
.gdot.act{background:#fff;width:20px;border-radius:3px}

/* POURQUOI */
.wg{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:52px}
.wc{border-radius:var(--r2);padding:34px 30px;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.13);transition:all .3s}
.wc:hover{transform:translateY(-4px);box-shadow:0 22px 56px rgba(50,30,100,.38)}
.wi{width:52px;height:52px;border-radius:15px;display:flex;align-items:center;justify-content:center;font-size:1.25rem;margin-bottom:20px;background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.18);transition:all .3s}
.wc:hover .wi{background:rgba(255,255,255,.2);transform:rotate(-5deg) scale(1.05)}
.wt{font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:700;margin-bottom:9px}
.wd{font-size:.88rem;color:var(--ts);line-height:1.65}

/* FORMATIONS BLOCK (dans Swafy) */
.fl{display:flex;flex-direction:column;gap:10px;margin-top:22px}
.fi{display:flex;align-items:center;gap:10px;padding:12px 15px;border-radius:var(--r1);background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);text-decoration:none;color:#fff;transition:all .22s}
.fi:hover{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.28);transform:translateX(4px)}
.fii{width:32px;height:32px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.9rem;background:rgba(255,255,255,.12)}
.fit{font-weight:700;font-size:.86rem}
.fid{font-size:.74rem;color:var(--ts);margin-top:1px}
.fiarr{margin-left:auto;color:var(--acc);font-size:.82rem;flex-shrink:0}

/* MODAL */
.mov{position:fixed;inset:0;z-index:500;background:rgba(50,30,100,.88);backdrop-filter:blur(15px);display:flex;align-items:center;justify-content:center;padding:22px;animation:fin .25s ease}
.mod{width:100%;max-width:880px;border-radius:var(--r3);overflow:hidden;position:relative;box-shadow:0 38px 110px rgba(0,0,0,.58);animation:min .3s ease}
.moc{position:absolute;top:14px;right:14px;z-index:10;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.18);color:#fff;font-size:.95rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
.moc:hover{background:rgba(0,0,0,.8)}
.mod iframe{width:100%;aspect-ratio:16/9;display:block;border:none}

/* FOOTER */
.foot{background:rgba(0,0,0,.22);padding:52px 24px 26px;border-top:1px solid rgba(255,255,255,.09)}
.ftop{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:36px;margin-bottom:44px}
.fbt{font-size:.86rem;color:var(--ts);line-height:1.7;max-width:330px;margin-top:12px}
.fct{font-family:'Syne',sans-serif;font-size:.76rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--tm);margin-bottom:16px}
.fcol a{display:block;color:var(--ts);text-decoration:none;font-size:.88rem;margin-bottom:10px;transition:color .2s}
.fcol a:hover{color:#fff}
.fbot{border-top:1px solid rgba(255,255,255,.07);padding-top:22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:9px}
.fbc{font-size:.79rem;color:var(--tm)}

/* RESPONSIVE */
@media(max-width:900px){
  .hi{grid-template-columns:1fr}
  .hv{display:none}
  .tg{grid-template-columns:repeat(2,1fr)}
  .ag{grid-template-columns:1fr}
  .phs{display:none}
  .wg{grid-template-columns:1fr}
  .gls2{flex:0 0 calc(50% - 9px)}
  .srow{flex-direction:column}
  .sb{border-right:none;border-bottom:1px solid rgba(255,255,255,.09)}
}
@media(max-width:600px){
  .hero h1{font-size:2.55rem}
  .tg{grid-template-columns:1fr 1fr}
  .gls2{flex:0 0 84%}
  .hstats{gap:16px}
}
`;

function StyleInject(){
  useEffect(()=>{
    const id="sw-sty";
    if(!document.getElementById(id)){
      const el=document.createElement("style");
      el.id=id;el.textContent=CSS;
      document.head.appendChild(el);
    }
    return()=>{const el=document.getElementById(id);el&&el.remove()};
  },[]);
  return null;
}

function Brand(){
  return(<div className="brand"><div className="bdot"/>SWAFY</div>);
}

function VideoModal({open,onClose,url}){
  if(!open)return null;
  return(
    <div className="mov" onClick={onClose}>
      <div className="mod" onClick={e=>e.stopPropagation()}>
        <button className="moc" onClick={onClose}><FiX/></button>
        <iframe src={url} title="Vidéo SWAFY" allow="autoplay; encrypted-media" allowFullScreen/>
      </div>
    </div>
  );
}

function HeroCard(){
  return(
    <div className="hv" style={{position:"relative"}}>
      <div className="fb fb1 gls">
        <div className="fbi" style={{background:"rgba(127,255,238,.13)"}}>🔬</div>
        <div><div className="fbn">235</div><div className="fbt">Bourses MOBIDOC</div></div>
      </div>
      <div className="hc gls">
        <div className="hct">
          <div className="hlb"><div className="lp"/>EU4Youth</div>
          <div className="hcd"><div className="hcdd"/><div className="hcdd"/><div className="hcdd"/></div>
        </div>
        <div className="hctit">Formation & Innovation</div>
        <div className="hcsu">Science · Entrepreneuriat · Tunisie</div>
        <div className="hcpl"><span>Déploiement national</span><span style={{color:"var(--acc)",fontWeight:600}}>73%</span></div>
        <div className="hcpb"><div className="hcpf" style={{width:"73%"}}/></div>
        <div className="hmg">
          {[["🧠","IA & Tech"],["🎮","Gaming Lab"],["🚀","Startup"]].map(([ic,lb])=>(
            <div key={lb} className="hmt"><div className="hmi">{ic}</div><div className="hml">{lb}</div></div>
          ))}
        </div>
        <div className="hcf">
          <div className="avs">
            {["DS","BB","CA","MK"].map((l,i)=><div key={i} className="av">{l}</div>)}
          </div>
          <Link className="hcb" to="/register">Rejoindre <FiArrowRight/></Link>
        </div>
      </div>
      <div className="fb fb2 gls">
        <div className="fbi" style={{background:"rgba(255,209,102,.13)"}}>🏆</div>
        <div><div className="fbn">70+</div><div className="fbt">Clubs scientifiques</div></div>
      </div>
    </div>
  );
}

function Navbar(){
  const [sc,setSc]=useState(false);
  useEffect(()=>{
    const h=()=>setSc(window.scrollY>20);
    window.addEventListener("scroll",h);
    return()=>window.removeEventListener("scroll",h);
  },[]);
  return(
    <header className={`nav ${sc?"sc":""}`}>
      <div className="nav-in">
        <Link to="/" className="back"><FiArrowLeft/>Retour à l'accueil</Link>
        <Link to="/" style={{textDecoration:"none"}}><Brand/></Link>
        <div className="nav-act">
          <Link className="bgh" to="/register">S'inscrire</Link>
          <Link className="bpl" to="/login">Connexion</Link>
        </div>
      </div>
    </header>
  );
}

function Hero({onPlay}){
  return(
    <section className="hero">
      <div className="con">
        <div className="hi">
          <div>
            <div className="htag"><div className="lp"/>ANPR · EU4Youth · 9,5 M€</div>
            <h1>Science<br/>With &amp; For <span className="shim">Youth</span></h1>
            <p className="hdesc">
              SWAFY accompagne la jeunesse tunisienne vers l'innovation et l'entrepreneuriat
              scientifique — bourses de recherche, clubs scientifiques, Gaming Labs et dialogue
              national Jeunesse-Science dans les 24 gouvernorats.
            </p>
            <div className="hact">
              <button className="bpr" onClick={onPlay}>Voir la vidéo <FiPlay/></button>
              <Link className="bsc" to="/register">Rejoindre SWAFY <FiArrowRight/></Link>
            </div>
            <div className="hstats">
              <div className="hs"><span className="hsn">9,5M€</span><span className="hsl">Budget UE</span></div>
              <div className="hsd"/>
              <div className="hs"><span className="hsn">235</span><span className="hsl">Bourses MOBIDOC</span></div>
              <div className="hsd"/>
              <div className="hs"><span className="hsn">13 000</span><span className="hsl">Jeunes visés</span></div>
            </div>
          </div>
          <HeroCard/>
        </div>
      </div>
    </section>
  );
}

function VideoSection({onPlay}){
  return(
    <section className="sec">
      <div className="con">
        <div className="ey"><div className="eyl"/>Aperçu du projet</div>
        <h2 className="stit">Découvrez SWAFY en action</h2>
        <p className="sdesc">
          Lancé le 2 juin 2023 à l'hôtel Mövenpick Lac Tunis, en présence du Ministre
          Moncef Boukthir et de l'Ambassadeur de l'UE Marcus Cornaro.
        </p>
        <div className="vw">
          <div className="vc" onClick={onPlay}>
            <div className="vbg"/>
            <div className="vls"><div className="vl"/><div className="vl"/><div className="vl"/></div>
            <div className="vmu">
              <div className="vmb" style={{width:"84%"}}/><div className="vmb" style={{width:"68%"}}/><div className="vmb" style={{width:"50%"}}/>
            </div>
            <div className="vpb"><div className="vpc"><FiPlay/></div></div>
          </div>
        </div>
        <div className="srow">
          {[{n:"70+",l:"Clubs scientifiques créés"},{n:"190+",l:"Projets de recherche financés"},{n:"24",l:"Gouvernorats couverts"}].map(({n,l})=>(
            <div className="sb" key={l}><div className="sbn">{n}</div><div className="sbl">{l}</div></div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FORMATIONS SWAFY RÉELLES ─────────────────── */
const FORMATIONS=[
  {ic:"📋",t:"Management de projet (PMP)",d:"Formation certifiante · 22 j/j · Présentiel + En ligne · 2024/2025",href:"https://www.anpr.tn/wp-content/uploads/2024/01/TDR-Expert-Management-de-projet_final_18012024.pdf"},
  {ic:"🔬",t:"MOBIDOC Doctorant · Session 2024",d:"Bourse UE · Recherche appliquée en milieu socio-économique",href:"https://www.anpr.tn/projet-swafy-appel-a-propositions-mobidoc-doctorant-session-2024/"},
  {ic:"💼",t:"MOBIDOC Post-doc · Université / Management",d:"Gestion de projet · Recherche appliquée",href:"http://www.anpr.tn/projet-swafy-appel-a-candidature-mobidoc-post-doc-universite-management/"},
  {ic:"🗣️",t:"Techniques de communication",d:"Formation clubs scientifiques · Présentiel",href:"https://www.anpr.tn"},
  {ic:"🏛️",t:"Leadership & Engagement citoyen",d:"Formation certifiante · Gouvernance · Participation",href:"https://www.anpr.tn"},
  {ic:"🎬",t:"Techniques audiovisuelles",d:"Production vidéo · Reportage scientifique · Diffusion",href:"https://www.anpr.tn"},
  {ic:"🎮",t:"Création de Gaming Labs",d:"Appel associations · Délai : 31 mai 2026",href:"http://www.anpr.tn/projet-swafy-appel-a-propositions-a-lattention-des-associations-pour-la-creation-renforcement-de-gaming-labs/"},
  {ic:"🔧",t:"Création de Fablabs · 8 gouvernorats",d:"Ben Arous · Manouba · Kef · Siliana · Tozeur · Kébili · Kasserine · Monastir",href:"http://www.anpr.tn/appel-a-propositions-a-lattention-des-associations-en-vue-du-renforcement-ou-la-creation-de-fablabs-dans-les-gouvernorats-de-ben-arous-la-manouba-le-kef-siliana-tozeur-kebili-kasserine/"},
  {ic:"📊",t:"Expert processus de débat Jeunesse-Science",d:"Conception du débat · Feuille de route 2035 · Congrès national",href:"https://www.anpr.tn/projet-swafy-termes-de-reference-en-vue-de-la-selection-dun-expert/"},
  {ic:"🌐",t:"Plateforme de réseautage associatif",d:"Développement & administration · Appel en cours 2026",href:"http://www.anpr.tn/projet-swafy-appel-a-candidatures-recrutement-de-deux-charge-e-s-de-projets/"},
];

function AboutSection(){
  return(
    <section className="seca">
      <div className="con">
        <div className="ag">
          <div className="phs">
            {[null,"b"].map(v=>(
              <div key={v||"a"} className={`ph gl ${v?"phb":"pha"}`}>
                <div className="phh"><div className="phn"/></div>
                <div className="phbd">
                  <div className="phb2"/>
                  <div className="phr"><div className="pht"/><div className="pht"/><div className="pht"/></div>
                  <div className="phl"/><div className="phl"/><div className="phl" style={{width:"60%"}}/>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div className="ey"><div className="eyl"/>À propos de SWAFY</div>
            <h2 className="stit">
              Une plateforme pensée pour<br/>
              <span className="shim">la jeunesse tunisienne</span>
            </h2>
            <p className="ad">
              SWAFY — Science With and For Youth — est un projet financé par l'Union européenne
              (9,5 M€ · 48 mois), inscrit sous le programme EU4Youth et géré par l'ANPR. Il vise
              à améliorer la valeur ajoutée de la recherche dans le développement économique tunisien,
              et à soutenir l'entrepreneuriat et l'employabilité des jeunes à travers les bourses
              MOBIDOC, les clubs scientifiques, les Gaming Labs et le dialogue national Jeunesse-Science.
            </p>
            {/* Formations disponibles */}
            <div style={{marginBottom:16,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:".78rem",textTransform:"uppercase",letterSpacing:".1em",color:"var(--acc)"}}>
              Formations & Appels officiels
            </div>
            <div className="fl">
              {FORMATIONS.slice(0,5).map(({ic,t,d,href})=>(
                <a key={t} className="fi" href={href} target="_blank" rel="noreferrer">
                  <div className="fii">{ic}</div>
                  <div><div className="fit">{t}</div><div className="fid">{d}</div></div>
                  <FiArrowRight className="fiarr"/>
                </a>
              ))}
            </div>
            <a href="https://www.anpr.tn" target="_blank" rel="noreferrer"
               style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:12,color:"var(--acc)",fontSize:".82rem",fontWeight:700,textDecoration:"none"}}>
              Voir toutes les formations sur anpr.tn <FiExternalLink/>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── TOUTES LES FORMATIONS ─────────────────────── */
function FormationsSection(){
  return(
    <section className="sec">
      <div className="con">
        <div className="ey"><div className="eyl"/>Formations disponibles</div>
        <h2 className="stit">Toutes les formations & appels SWAFY</h2>
        <p className="sdesc">Formations officielles disponibles, gérées par l'ANPR. Cliquez pour accéder aux détails et postuler.</p>
        <div className="fl" style={{marginTop:36}}>
          {FORMATIONS.map(({ic,t,d,href})=>(
            <a key={t} className="fi" href={href} target="_blank" rel="noreferrer">
              <div className="fii">{ic}</div>
              <div><div className="fit">{t}</div><div className="fid">{d}</div></div>
              <FiArrowRight className="fiarr"/>
            </a>
          ))}
        </div>
        <div style={{marginTop:18,padding:"14px 18px",borderRadius:14,background:"rgba(200,184,255,.08)",border:"1px solid rgba(200,184,255,.18)",fontSize:".78rem",color:"var(--ts)"}}>
          📌 Pour tous les appels à candidatures : <a href="https://www.anpr.tn" target="_blank" rel="noreferrer" style={{color:"var(--acc)",fontWeight:700,textDecoration:"none"}}>anpr.tn</a>
          {" · "}
          <a href="https://www.facebook.com/swafyproject/" target="_blank" rel="noreferrer" style={{color:"var(--acc)",fontWeight:700,textDecoration:"none"}}>facebook.com/swafyproject</a>
          {" · "}
          <a href="mailto:swafy@anpr.tn" style={{color:"var(--acc)",fontWeight:700,textDecoration:"none"}}>swafy@anpr.tn</a>
        </div>
      </div>
    </section>
  );
}

/* ── ÉQUIPE RÉELLE ─────────────────────────────── */
function TeamSection({team}){
  return(
    <section className="seca">
      <div className="con">
        <div style={{textAlign:"center"}}>
          <div className="ey" style={{justifyContent:"center"}}><div className="eyl"/>L'équipe SWAFY — ANPR</div>
          <h2 className="stit">Responsables & Partenaires clés</h2>
          <p className="sdesc" style={{margin:"0 auto 56px"}}>
            Portée par l'ANPR, coordonnée avec les ministères partenaires et la Délégation de l'UE en Tunisie.
          </p>
        </div>
        <div className="tg">
          {team.map(m=>(
            <div key={m.name} className="tm"
                 style={{background:`linear-gradient(135deg,${m.color}28 0%,rgba(255,255,255,.04) 100%)`,borderColor:`${m.color}38`}}>
              {/* Avatar initiales — pas de photo personnelle */}
              <div style={{width:68,height:68,borderRadius:"50%",margin:"0 auto 14px",
                background:`linear-gradient(135deg,${m.color},${m.color}88)`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"1.35rem",color:"#fff",
                border:`3px solid ${m.color}55`,boxShadow:`0 6px 20px ${m.color}44`}}>
                {m.initials}
              </div>
              <div className="tmn">{m.name}</div>
              <div className="tmr" style={{marginBottom:m.linkedin?10:0}}>{m.role}</div>
              {m.linkedin&&(
                <a href={m.linkedin} target="_blank" rel="noreferrer"
                   style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:6,
                     padding:"4px 12px",borderRadius:50,background:"rgba(255,255,255,.12)",
                     border:"1px solid rgba(255,255,255,.2)",color:"rgba(255,255,255,.82)",
                     fontSize:".7rem",fontWeight:600,textDecoration:"none",transition:"all .2s"}}
                   onMouseOver={e=>{e.currentTarget.style.background="rgba(255,255,255,.22)"}}
                   onMouseOut={e=>{e.currentTarget.style.background="rgba(255,255,255,.12)"}}>
                  🔗 LinkedIn
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── GALERIE ───────────────────────────────────── */
function GallerySection({gallery}){
  const [idx,setIdx]=useState(0);
  const max=Math.max(0,gallery.length-3);
  return(
    <section className="sec">
      <div className="con">
        <div className="ey"><div className="eyl"/>Galerie officielle</div>
        <h2 className="stit">Nos moments forts</h2>
        <p className="sdesc">
          Foire de la Créativité · RobotBattle 1.0 · Clubs scientifiques · Séances de débat Jeunesse-Science.
          {" "}<a href="https://www.facebook.com/swafyproject/" target="_blank" rel="noreferrer"
               style={{color:"var(--acc)",fontWeight:700,textDecoration:"none"}}>Voir plus sur Facebook →</a>
        </p>
        <div className="gltr">
          {gallery.map((item,i)=>(
            <div key={item.src} className="gls2"
                 style={{transform:`translateX(calc(-${idx*(100+18)}% - ${idx*18}px))`,transition:"transform .5s cubic-bezier(.4,0,.2,1)"}}>
              <img src={item.src} alt={item.caption}/>
              <div className="gov"/>
              <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"14px 16px",
                background:"linear-gradient(to top,rgba(50,30,100,.85),transparent)",
                fontSize:".76rem",fontWeight:500,color:"rgba(255,255,255,.9)",lineHeight:1.4}}>
                {item.caption}
              </div>
            </div>
          ))}
        </div>
        <div className="gctrl">
          <button className="gbtn" onClick={()=>setIdx(i=>Math.max(0,i-1))}><FiChevronLeft/></button>
          <div className="gdots">
            {gallery.map((_,i)=><div key={i} className={`gdot ${i===idx?"act":""}`} onClick={()=>setIdx(i)}/>)}
          </div>
          <button className="gbtn" onClick={()=>setIdx(i=>Math.min(max,i+1))}><FiChevronRight/></button>
        </div>
      </div>
    </section>
  );
}

/* ── POURQUOI SWAFY ────────────────────────────── */
function WhySection({why}){
  return(
    <section className="seca">
      <div className="con">
        <div style={{textAlign:"center"}}>
          <div className="ey" style={{justifyContent:"center"}}><div className="eyl"/>Pourquoi SWAFY</div>
          <h2 className="stit">Pourquoi nous rejoindre ?</h2>
          <p className="sdesc" style={{margin:"0 auto"}}>
            SWAFY offre une expérience unique, conçue pour les jeunes tunisiens ambitieux dans toutes les régions du pays.
          </p>
        </div>
        <div className="wg">
          {why.map(({icon,title,desc},i)=>(
            <div key={title} className="wc gl"
                 style={{background:`linear-gradient(135deg,rgba(255,255,255,${.06+i*.02}),rgba(255,255,255,.04))`}}>
              <div className="wi">{icon}</div>
              <div className="wt">{title}</div>
              <div className="wd">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── BANDE PARTENAIRES ─────────────────────────── */
function PartnersStrip(){
  return(
    <div className="pstrip">
      <div className="psin">
        <span className="plbl">Partenaires officiels</span>
        <div className="pit">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Flag_of_Europe.svg/24px-Flag_of_Europe.svg.png" alt="UE" style={{height:17}}/>
          Union Européenne
        </div>
        <div className="pdiv"/>
        <div className="pit">🏛️ ANPR</div>
        <div className="pdiv"/>
        <div className="pit">🎓 Min. Enseignement Supérieur</div>
        <div className="pdiv"/>
        <div className="pit">📱 Fondation Orange Tunisie</div>
        <div className="pdiv"/>
        <div className="pit">🌍 EU4Youth</div>
      </div>
    </div>
  );
}

/* ── PAGE PRINCIPALE ───────────────────────────── */
export default function Swafy(){
  const [openVideo,setOpenVideo]=useState(false);

  /* Équipe réelle SWAFY identifiée publiquement */
  /* Équipe SWAFY — noms réels identifiés publiquement · pas de photos personnelles */
  const team=useMemo(()=>[
    {name:"Dhouha Sbaoulji",         role:"Cheffe de projet · ANPR · PMP®",          initials:"DS",color:"#c8b8ff",linkedin:"https://www.linkedin.com/in/dhouha-sbaoulji-5a42aa28/"},
    {name:"Chedli Abdelli",          role:"Directeur Général · ANPR",                 initials:"CA",color:"#7FFFEE",linkedin:"https://www.linkedin.com/company/agence-nationale-de-promotion-de-la-recherche-scientifique"},
    {name:"Bouchra Belhaj Abdallah", role:"Dr. · Experte scientifique · Équipe SWAFY",initials:"BB",color:"#FF8EC8",linkedin:"https://www.linkedin.com/in/bouchra-belhaj-abdallah-b5b382b8"},
    {name:"Noussayba Bellali",       role:"Manager des subventions · SWAFY",          initials:"NB",color:"#FFD166",linkedin:"https://www.linkedin.com/in/noussayba-bellali-714ba5133/"},
    {name:"Moncef Boukthir",         role:"Min. Enseignement Supérieur · Partenaire", initials:"MB",color:"#4A9FB5",linkedin:null},
    {name:"Marcus Cornaro",          role:"Ambassadeur de l'UE en Tunisie",           initials:"MC",color:"#00f5d4",linkedin:null},
    {name:"Maya Jerbi",              role:"Présidente · Fondation Orange Tunisie",    initials:"MJ",color:"#3a86ff",linkedin:null},
    {name:"Wissal Askri",            role:"Chef de projet PMP® · Équipe SWAFY",       initials:"WA",color:"#fb8500",linkedin:null},
  ],[]);

  /* Galerie — photos d'événements scientifiques jeunesse Tunisie (libre de droits) */
  const gallery=useMemo(()=>[
    {src:"https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=1200&q=75",caption:"Foire de la Créativité SWAFY — Cité de la Culture, Tunis · Avril 2026"},
    {src:"https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=75",caption:"RobotBattle 1.0 — 1ère compétition de robotique en Tunisie · Juillet 2024"},
    {src:"https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=75",caption:"Séances de débat Jeunesse & Science — 19 gouvernorats couverts"},
    {src:"https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=75",caption:"Clubs scientifiques dans les établissements scolaires publics"},
    {src:"https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=75",caption:"Séminaire de lancement SWAFY — Hôtel Mövenpick Lac, Tunis · 2 juin 2023"},
    {src:"https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=75",caption:"Gaming Labs & Fablabs — Ateliers de co-création jeunesse"},
  ],[]);

  const why=useMemo(()=>[
    {icon:<FiUsers/>,title:"Accès équitable partout",desc:"Présence dans les 24 gouvernorats avec priorité aux zones marginalisées — chaque jeune tunisien a sa chance."},
    {icon:<FiHeadphones/>,title:"Accompagnement continu",desc:"Soutien permanent de l'ANPR et des 18 associations partenaires pour les doctorants, jeunes chercheurs et clubs scientifiques."},
    {icon:<FiAward/>,title:"Bourses & Certifications",desc:"235 bourses MOBIDOC, badges de compétences et passerelles directes vers le monde professionnel tunisien."},
    {icon:<FiZap/>,title:"Formations innovantes",desc:"Gaming Labs, Fablabs, compétitions de robotique, ateliers de co-création — apprends vite et construis ta carrière."},
  ],[]);

  return(
    <>
      <StyleInject/>
      <div className="noise"/>
      <div className="orb o1"/><div className="orb o2"/>
      <div className="orb o3"/><div className="orb o4"/>
      <div className="pg">
        <Navbar/>
        <Hero onPlay={()=>setOpenVideo(true)}/>
        <VideoSection onPlay={()=>setOpenVideo(true)}/>
        <AboutSection/>
        <FormationsSection/>
        <PartnersStrip/>
        <TeamSection team={team}/>
        <GallerySection gallery={gallery}/>
        <WhySection why={why}/>
        <footer className="foot">
          <div className="con">
            <div className="ftop">
              <div>
                <Brand/>
                <p className="fbt">
                  Science With and For Youth — Financé par l'UE (9,5 M€ · 48 mois), géré par l'ANPR.<br/>
                  Angle Rue Danton & Rue Chaaben Bhouri N°11, Lafayette — BP 177, 1002 Tunis Belvédère.<br/>
                  ✉ swafy@anpr.tn
                </p>
              </div>
              <div className="fcol">
                <div className="fct">Navigation</div>
                <Link to="/">Accueil</Link>
                <Link to="/login">Connexion</Link>
                <Link to="/register">S'inscrire</Link>
                <a href="https://www.anpr.tn" target="_blank" rel="noreferrer">ANPR.tn</a>
              </div>
              <div className="fcol">
                <div className="fct">Réseaux & Contact</div>
                <a href="https://www.facebook.com/swafyproject/" target="_blank" rel="noreferrer">📘 Facebook SWAFY</a>
                <a href="https://www.youtube.com/watch?v=eK-aLZ0nj8U" target="_blank" rel="noreferrer">▶️ YouTube — Lancement SWAFY</a>
                <a href="https://www.linkedin.com/in/dhouha-sbaoulji-5a42aa28/" target="_blank" rel="noreferrer">🔗 LinkedIn — Dhouha Sbaoulji</a>
                <a href="https://www.linkedin.com/in/bouchra-belhaj-abdallah-b5b382b8" target="_blank" rel="noreferrer">🔗 LinkedIn — Bouchra B. Abdallah</a>
                <a href="https://eu4youth.tn/explorer/swafy/" target="_blank" rel="noreferrer">🌍 eu4youth.tn/swafy</a>
                <a href="mailto:swafy@anpr.tn">✉ swafy@anpr.tn</a>
              </div>
            </div>
            <div className="fbot">
              <span className="fbc">© {new Date().getFullYear()} SWAFY · Tunis, Tunisie</span>
              <span className="fbc">Built with React · Science With and For Youth</span>
            </div>
          </div>
        </footer>
      </div>
      <VideoModal open={openVideo} onClose={()=>setOpenVideo(false)} url="https://www.youtube.com/embed/eK-aLZ0nj8U"/>
    </>
  );
}