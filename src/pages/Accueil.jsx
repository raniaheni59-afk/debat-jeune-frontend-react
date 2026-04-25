import { Link } from "react-router-dom";
import styles from "./Accueil.module.css";
import {
  FiArrowRight,
  FiClock,
  FiCpu,
  FiShield,
  FiMessageCircle,
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

function HeroIllustration() {
  // SVG بسيط (بديل للـ illustration) باش ما تتقلقش بالـ assets
  return (
    <svg
      className={styles.heroSvg}
      viewBox="0 0 520 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="35" y="70" width="280" height="190" rx="18" fill="#ffffff" opacity="0.92"/>
      <rect x="60" y="95" width="230" height="18" rx="9" fill="#E8E1FF"/>
      <rect x="60" y="126" width="180" height="14" rx="7" fill="#EFEAFF"/>
      <rect x="60" y="148" width="210" height="14" rx="7" fill="#EFEAFF"/>
      <rect x="60" y="170" width="150" height="14" rx="7" fill="#EFEAFF"/>
      <circle cx="390" cy="130" r="60" fill="#FFD166" opacity="0.95"/>
      <path d="M340 238c24-34 64-54 108-54 18 0 35 3 50 9" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" opacity="0.9"/>
      <circle cx="420" cy="70" r="12" fill="#ffffff" opacity="0.9"/>
      <circle cx="450" cy="90" r="8" fill="#ffffff" opacity="0.8"/>
      <circle cx="370" cy="95" r="10" fill="#ffffff" opacity="0.85"/>
    </svg>
  );
}

function PhoneMock({ variant = "a" }) {
  return (
    <div className={`${styles.phone} ${variant === "b" ? styles.phoneB : ""}`}>
      <div className={styles.phoneTop} />
      <div className={styles.phoneScreen}>
        <div className={styles.phoneCard}>
          <div className={styles.badge}>New</div>
          <div className={styles.phoneTitle}>New Products & Community</div>
          <div className={styles.phoneSub}>Learn • Build • Share</div>
          <div className={styles.phoneBtn}>Start</div>
        </div>

        <div className={styles.phoneRow}>
          <div className={styles.miniTile} />
          <div className={styles.miniTile} />
          <div className={styles.miniTile} />
        </div>

        <div className={styles.phoneList}>
          <div className={styles.listItem} />
          <div className={styles.listItem} />
          <div className={styles.listItem} />
        </div>
      </div>
      <div className={styles.phoneBottom} />
    </div>
  );
}

function Navbar() {
  return (
    <header className={styles.navWrap}>
      <div className={styles.container}>
        <nav className={styles.nav}>
          <Brand />

          <div className={styles.navLinks}>
            <a href="#accueil">accueil</a>
            <a href="#direct">direct</a>
            <a href="#thematique">thematique</a>
            <a href="#objectif">objectif</a>
            <a href="#contact">contact</a>
          </div>

          <div className={styles.navActions}>
            <Link className={styles.btnGhost} to="/register">
              Register
            </Link>
            <Link className={styles.btnLight} to="/login">
              Sign in
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

function LiveCard() {
  return (
    <section id="direct" className={styles.liveSection}>
      <div className={styles.container}>
        <div className={styles.liveCard}>
          <div className={styles.liveHead}>
            <span className={styles.liveDot} />
            <span className={styles.liveTitle}>En Direct : maintenance</span>
          </div>

          <div className={styles.liveRow}>
            <div className={styles.livePill}>
              <FiCpu />
              <span>En Direct : intelligence artificielle</span>
            </div>

            <button className={styles.liveBtn}>
              Dépannage <FiArrowRight />
            </button>
          </div>

          <p className={styles.liveHint}>
            Statut en temps réel + assistance rapide (demo UI).
          </p>
        </div>
      </div>
    </section>
  );
}

function ThemeCard({ icon, title, desc }) {
  return (
    <div className={styles.themeCard}>
      <div className={styles.themeIcon}>{icon}</div>
      <div>
        <div className={styles.themeTitle}>{title}</div>
        <div className={styles.themeDesc}>{desc}</div>
      </div>
    </div>
  );
}

function Thematique() {
  return (
    <section id="thematique" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2>Les thématique</h2>
          <p>Parcours simples و مرتّبين للشباب: support, IA, sécurité، و innovation.</p>
        </div>

        <div className={styles.grid}>
          <ThemeCard
            icon={<FiMessageCircle />}
            title="User-Friendly"
            desc="Support"
          />
          <ThemeCard icon={<FiZap />} title="Fast" desc="Innovation / Prototyping" />
          <ThemeCard icon={<FiClock />} title="24/7" desc="Support" />
          <ThemeCard icon={<FiShield />} title="Free" desc="Formation / Sécurité" />
        </div>
      </div>
    </section>
  );
}

function Objectif() {
  return (
    <section id="objectif" className={styles.sectionAlt}>
      <div className={styles.container}>
        <div className={styles.objectif}>
          <div className={styles.objectifLeft}>
            <div className={styles.phoneStack}>
              <PhoneMock variant="a" />
              <PhoneMock variant="b" />
            </div>
          </div>

          <div className={styles.objectifRight}>
            <h2>objectif</h2>
            <p className={styles.objectifText}>
              نعاونو الشباب باش يكتسب مهارات رقمية، يشارك في challenges، ويمشي في
              مسار واضح: تعلم → تطبيق → تقييم.
            </p>

            <div className={styles.storeRow}>
              <a className={styles.storeBtn} href="#!" onClick={(e) => e.preventDefault()}>
                App Store
              </a>
              <a className={styles.storeBtn} href="#!" onClick={(e) => e.preventDefault()}>
                Google Play
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Steps() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.steps}>
          <div className={styles.stepsLeft}>
            <div className={styles.miniPreview}>
              <div className={styles.miniTop} />
              <div className={styles.miniBody} />
            </div>
          </div>

          <div className={styles.stepsRight}>
            <h3>Start learning in 3 steps</h3>
            <div className={styles.stepItem}>
              <div className={styles.stepNum}>1</div>
              <div>
                <div className={styles.stepTitle}>Pick a theme</div>
                <div className={styles.stepDesc}>AI, support, sécurité, innovation…</div>
              </div>
            </div>
            <div className={styles.stepItem}>
              <div className={styles.stepNum}>2</div>
              <div>
                <div className={styles.stepTitle}>Learn & practice</div>
                <div className={styles.stepDesc}>Mini modules + tasks + feedback.</div>
              </div>
            </div>
            <div className={styles.stepItem}>
              <div className={styles.stepNum}>3</div>
              <div>
                <div className={styles.stepTitle}>Unlock certificate</div>
                <div className={styles.stepDesc}>Progress tracking + badge system.</div>
              </div>
            </div>

            <Link className={styles.cta} to="/register">
              Start Training
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="contact" className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div>
            <Brand />
            <p className={styles.footerText}>
              Science with and for youth — plateforme demo (UI) قبل login.
            </p>
          </div>
          <div>
            <div className={styles.footerTitle}>About</div>
            <a href="#objectif">Objectif</a>
            <a href="#thematique">Thématique</a>
            <a href="#direct">En Direct</a>
          </div>
          <div>
            <div className={styles.footerTitle}>Services</div>
            <a href="#!">Support</a>
            <a href="#!">Training</a>
            <a href="#!">Community</a>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} SWAFY</span>
          <span className={styles.footerSmall}>Built with React</span>
        </div>
      </div>
    </footer>
  );
}

export default function Accueil() {
  return (
    <div className={styles.page} id="accueil">
      <Navbar />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              <div className={styles.heroText}>
                <h1>
                  Science With and <br /> For Youth
                </h1>
                <p>
                  منصة توجّه الشباب: تعلم، تطبيق، واندماج في تحديات رقمية.
                  واجهة accueil قبل الدخول.
                </p>

                <div className={styles.heroActions}>
                  <Link to="/register" className={styles.btnPrimary}>
                    Create account <FiArrowRight />
                  </Link>
                  <Link to="/login" className={styles.btnSecondary}>
                    I already have an account
                  </Link>
                </div>
              </div>

              <div className={styles.heroArt}>
                <HeroIllustration />
              </div>
            </div>
          </div>

          <div className={styles.wave} />
        </section>

        <LiveCard />
        <Thematique />
        <Objectif />
        <Steps />
      </main>

      <Footer />
    </div>
  );
}