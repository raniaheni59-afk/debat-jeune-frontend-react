import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Swafy.module.css";
import {
  FiArrowLeft,
  FiPlay,
  FiUsers,
  FiHeadphones,
  FiAward,
  FiZap,
} from "react-icons/fi";

function Brand() {
  return (
    <div className={styles.brand}>
      <div className={styles.brandDot} />
      <span>SWAFY</span>
    </div>
  );
}

function VideoModal({ open, onClose, videoUrl }) {
  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>
          ✕
        </button>

        <div className={styles.modalBody}>
          <iframe
            className={styles.iframe}
            src={videoUrl}
            title="SWAFY video"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

export default function Swafy() {
  const [openVideo, setOpenVideo] = useState(false);

  const team = useMemo(
    () => [
      { name: "Andrey Khusid", role: "Design", img: "https://i.pravatar.cc/160?img=12", color: "#9b5de5" },
      { name: "Steven Rodion", role: "Product", img: "https://i.pravatar.cc/160?img=32", color: "#00bbf9" },
      { name: "AJ Josephson", role: "Dev", img: "https://i.pravatar.cc/160?img=41", color: "#f15bb5" },
      { name: "Amina Bouyakoub", role: "Community", img: "https://i.pravatar.cc/160?img=5", color: "#fee440" },
      { name: "Ivan Damani", role: "Backend", img: "https://i.pravatar.cc/160?img=18", color: "#00f5d4" },
      { name: "James Doe", role: "Mentor", img: "https://i.pravatar.cc/160?img=60", color: "#fb8500" },
      { name: "Yahya Mustapha", role: "Support", img: "https://i.pravatar.cc/160?img=27", color: "#8338ec" },
      { name: "John Doe", role: "Trainer", img: "https://i.pravatar.cc/160?img=52", color: "#3a86ff" },
    ],
    []
  );

  const gallery = useMemo(
    () => [
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=70",
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=70",
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=70",
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=70",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=70",
    ],
    []
  );

  const why = useMemo(
    () => [
      { icon: <FiUsers />, title: "User-Friendly", desc: "Easy onboarding & parcours clairs." },
      { icon: <FiHeadphones />, title: "24/7 Customer Support", desc: "Support سريع وقت تحتاج." },
      { icon: <FiAward />, title: "Free Recommendations", desc: "Guidance حسب المستوى." },
      { icon: <FiZap />, title: "Fast Training Processing", desc: "Modules خفاف و فعّالين." },
    ],
    []
  );

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <header className={styles.top}>
        <div className={styles.container}>
          <div className={styles.topRow}>
            <Link to="/" className={styles.back}>
              <FiArrowLeft /> Accueil
            </Link>

            {/* على هالصفحة، SWAFY ترجعك للـ Accueil */}
            <Link to="/" className={styles.brandLink}>
              <Brand />
            </Link>

            <div className={styles.actions}>
              <Link className={styles.btnGhost} to="/register">Register</Link>
              <Link className={styles.btnLight} to="/login">Sign in</Link>
            </div>
          </div>

          <div className={styles.hero}>
            <h1>SWAFY</h1>
            <p>Science With and For Youth — plateforme simple pour apprendre et progresser.</p>
            <button className={styles.heroBtn} onClick={() => setOpenVideo(true)}>
              Découvrir <span className={styles.dot} />
            </button>
          </div>
        </div>

        <div className={styles.wave} />
      </header>

      {/* Video / preview */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.videoCard}>
            <div className={styles.videoPreview} onClick={() => setOpenVideo(true)}>
              <div className={styles.play}>
                <FiPlay />
              </div>
              <div className={styles.videoOverlay} />
              <div className={styles.videoMock}>
                <div className={styles.mockTop} />
                <div className={styles.mockBody}>
                  <div className={styles.mockRow} />
                  <div className={styles.mockRow} />
                  <div className={styles.mockRowSmall} />
                  <div className={styles.mockChart} />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.stats}>
            <div className={styles.statItem}>
              <div className={styles.statNum}>+200</div>
              <div className={styles.statLabel}>users</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNum}>+70</div>
              <div className={styles.statLabel}>sessions</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNum}>+24</div>
              <div className={styles.statLabel}>formations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Text + app mock */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.twoCols}>
            <div>
              <h2>text</h2>
              <p className={styles.muted}>
                هنا تنجم تحط description أقوى: شنوّا SWAFY، علاش معمولة، وشنوما
                الفوائد للشباب (تعليم، تدريب، community).
              </p>

              <div className={styles.storeRow}>
                <button className={styles.storeBtn} onClick={() => {}}>App Store</button>
                <button className={styles.storeBtn} onClick={() => {}}>Google Play</button>
              </div>
            </div>

            <div className={styles.mockPhones}>
              <div className={styles.phone} />
              <div className={`${styles.phone} ${styles.phone2}`} />
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.centerTitle}>notre equipe swafy :</h2>

          <div className={styles.teamGrid}>
            {team.map((m) => (
              <div
                key={m.name}
                className={styles.member}
                style={{ background: `linear-gradient(135deg, ${m.color} 0%, rgba(255,255,255,.12) 100%)` }}
              >
                <img className={styles.avatar} src={m.img} alt={m.name} />
                <div className={styles.memberName}>{m.name}</div>
                <div className={styles.memberRole}>{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Galerie */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.centerTitle}>Galerie</h2>

          <div className={styles.galleryWrap}>
            <div className={styles.gallery}>
              {gallery.map((src, i) => (
                <div className={styles.galleryItem} key={src}>
                  <img src={src} alt={`gallery-${i}`} />
                </div>
              ))}
            </div>

            <div className={styles.dots}>
              {gallery.map((_, i) => (
                <span key={i} className={styles.dotItem} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.centerTitle}>Why choose us?</h2>

          <div className={styles.whyGrid}>
            {why.map((w) => (
              <div className={styles.whyCard} key={w.title}>
                <div className={styles.whyIcon}>{w.icon}</div>
                <div className={styles.whyTitle}>{w.title}</div>
                <div className={styles.whyDesc}>{w.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerRow}>
            <Brand />
            <div className={styles.footerLinks}>
              <Link to="/">Accueil</Link>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </div>
          </div>

          <div className={styles.footerBottom}>
            © {new Date().getFullYear()} SWAFY — Built with React
          </div>
        </div>
      </footer>

      <VideoModal
        open={openVideo}
        onClose={() => setOpenVideo(false)}
        /* حطّ لينك الفيديو متاعك هنا (YouTube embed) */
        videoUrl="https://www.youtube.com/embed/dQw4w9WgXcQ"
      />
    </div>
  );
}