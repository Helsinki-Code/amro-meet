'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { generateRoomId } from '@/lib/client-utils';
import styles from '../styles/Home.module.css';

export default function Page() {
  const router = useRouter();

  const startMeeting = () => {
    router.push(`/rooms/${generateRoomId()}`);
  };

  return (
    <>
      <main className={styles.main} data-lk-theme="default">
        <div className={styles.heroContainer}>
          <div className={styles.logoContainer}>
            <Image
              src="/images/logo.png"
              alt="AmroMeet Logo"
              width={400}
              height={200}
              priority
              className={styles.logoImage}
            />
          </div>
          <div className={styles.heroImage}>
            <Image
              src="/images/intro.png"
              alt="AmroMeet - Professional Video Conferencing"
              width={800}
              height={450}
              priority
              className={styles.openGraphImage}
            />
          </div>
          <div className={styles.header}>
            <div className={styles.brandContainer}>
              <Image
                src="/images/amro-meet-logo.png"
                alt="AmroMeet"
                width={300}
                height={100}
                priority
                className={styles.brandLogo}
              />
            </div>
            <p className={styles.tagline}>
              Professional video conferencing made simple
            </p>
          </div>
          <div className={styles.buttonContainer}>
            <button 
              className={styles.startButton}
              onClick={startMeeting}
              aria-label="Start a new meeting"
            >
              <span className={styles.buttonText}>Start Meeting</span>
              <svg 
                className={styles.buttonIcon}
                width="20" 
                height="20" 
                viewBox="0 0 20 20" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M6 4L14 10L6 16V4Z" 
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
