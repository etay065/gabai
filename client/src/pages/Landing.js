import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Landing.module.css';

export default function Landing() {
  const { gabai } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (gabai) navigate('/gabai');
  }, [gabai, navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.logoWrap}>
          <div className={styles.logoMark}>
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.logoSvg}>
              <circle cx="32" cy="32" r="30" stroke="url(#lg1)" strokeWidth="2.5"/>
              <path d="M32 10 L38 22 L51 22 L41 30 L45 43 L32 35 L19 43 L23 30 L13 22 L26 22 Z" fill="url(#lg2)" opacity="0.9"/>
              <defs>
                <linearGradient id="lg1" x1="2" y1="2" x2="62" y2="62" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#E8B52A"/>
                  <stop offset="100%" stopColor="#F5D87A"/>
                </linearGradient>
                <linearGradient id="lg2" x1="13" y1="10" x2="51" y2="43" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#F5D87A"/>
                  <stop offset="100%" stopColor="#E8B52A"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className={styles.logoTextWrap}>
            <div className={styles.logoText}>Gab<span className={styles.logoAI}>-AI</span></div>
            <div className={styles.logoTagline}>מערכת ניהול בית כנסת</div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.cards}>
          <div className={styles.card} onClick={() => navigate('/member')} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate('/member')}>
            <div className={styles.cardIconWrap}>
              <span className={styles.cardIcon}>🙏</span>
            </div>
            <div className={styles.cardTitle}>כניסת מתפלל</div>
            <div className={styles.cardDesc}>הגשת בקשות לתפילה</div>
          </div>
          <div className={styles.card} onClick={() => navigate('/gabai/login')} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate('/gabai/login')}>
            <div className={styles.cardIconWrap}>
              <span className={styles.cardIcon}>📋</span>
            </div>
            <div className={styles.cardTitle}>כניסת גבאי</div>
            <div className={styles.cardDesc}>ניהול לוח ואישור בקשות</div>
          </div>
        </div>
      </div>
      <div className={styles.footer}>Gab-AI · ניהול חכם לבית הכנסת</div>
    </div>
  );
}
