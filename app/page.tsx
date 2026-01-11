// app/page.tsx
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { generateRoomId } from '@/lib/client-utils';
import styles from '../styles/Home.module.css';
import { useState, useEffect } from 'react';

export default function Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const startMeeting = () => {
    setIsLoading(true);
    router.push(`/rooms/${generateRoomId()}`);
  };

  if (!mounted) return null;

  return (
    <main className={styles.main} data-lk-theme="default">
      {/* Animated background */}
      <div className={styles.backgroundGradient} />
      <div className={styles.backgroundGrid} />
      <div className={styles.backgroundOrbs}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
      </div>

      <div className={styles.container}>
        {/* Navigation */}
        <nav className={styles.nav}>
          <div className={styles.navLogo}>
            <Image
              src="/images/logo.png"
              alt="AmroMeet"
              width={140}
              height={40}
              priority
              className={styles.navLogoImage}
            />
          </div>
          <div className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#security" className={styles.navLink}>Security</a>
            <a href="#about" className={styles.navLink}>About</a>
          </div>
        </nav>

        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              <span>Enterprise-Grade Video Conferencing</span>
            </div>
            
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleLine}>Connect.</span>
              <span className={styles.heroTitleLine}>Collaborate.</span>
              <span className={styles.heroTitleLineGradient}>Communicate.</span>
            </h1>
            
            <p className={styles.heroDescription}>
              Crystal-clear video meetings with enterprise security. 
              No downloads, no complexity—just seamless communication.
            </p>

            <div className={styles.heroActions}>
              <button 
                className={styles.primaryButton}
                onClick={startMeeting}
                disabled={isLoading}
                aria-label="Start a new meeting"
              >
                {isLoading ? (
                  <span className={styles.buttonLoader} />
                ) : (
                  <>
                    <svg className={styles.buttonIconLeft} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <span>Start Meeting</span>
                    <svg className={styles.buttonArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
              
              <button className={styles.secondaryButton}>
                <svg className={styles.buttonIconLeft} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                <span>Join with Code</span>
              </button>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>99.9%</span>
                <span className={styles.statLabel}>Uptime</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statValue}>256-bit</span>
                <span className={styles.statLabel}>Encryption</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statValue}>4K</span>
                <span className={styles.statLabel}>Video Quality</span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className={styles.heroVisual}>
            <div className={styles.heroImageWrapper}>
              <div className={styles.heroImageGlow} />
              <Image
                src="/images/intro.png"
                alt="AmroMeet - Professional Video Conferencing"
                width={800}
                height={500}
                priority
                className={styles.heroImage}
              />
              {/* Floating elements */}
              <div className={styles.floatingCard1}>
                <div className={styles.floatingCardIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span>HD Quality Active</span>
              </div>
              <div className={styles.floatingCard2}>
                <div className={styles.floatingCardAvatar}>
                  <span>+12</span>
                </div>
                <span>Participants</span>
              </div>
              <div className={styles.floatingCard3}>
                <div className={styles.recordingDot} />
                <span>Recording</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className={styles.features}>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3>End-to-End Encryption</h3>
              <p>Military-grade security for all your conversations</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3>Ultra-Low Latency</h3>
              <p>Real-time communication without delays</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3>Unlimited Participants</h3>
              <p>Scale your meetings without restrictions</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
              <h3>4K Video Quality</h3>
              <p>Crystal-clear visuals for professional meetings</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <p>© 2024 AmroMeet. All rights reserved.</p>
            <div className={styles.footerLinks}>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}