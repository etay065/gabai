import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../i18n/LanguageContext';
import styles from './Landing.module.css';

export default function Landing() {
  const { gabai } = useAuth();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      setInstallPrompt(null);
    } else if (isIOS) {
      setShowIOSHint(true);
    }
  };
  const { t, lang, toggleLang } = useLang();
  const navigate = useNavigate();

  useEffect(() => {
    if (gabai) navigate('/gabai');
  }, [gabai, navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.logoWrap}>
          <div className={styles.logoMark}>
            <svg width="280" height="110" viewBox="0 0 260 80" xmlns="http://www.w3.org/2000/svg" style={{direction:"ltr"}}>
              <defs>
                <linearGradient id="gld" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F5D87A"/><stop offset="100%" stopColor="#E8B52A"/>
                </linearGradient>
              </defs>
              <text x="74" y="62" textAnchor="end" fontFamily="Heebo,sans-serif" fontSize="68" fontWeight="800" fill="#ffffff" letterSpacing="-2">GAB</text>
              <g transform="translate(130,32)">
                <polygon points="0,-18 15.5,9 -15.5,9" fill="none" stroke="url(#gld)" strokeWidth="2.6" strokeLinejoin="round"/>
                <polygon points="0,18 15.5,-9 -15.5,-9" fill="none" stroke="url(#gld)" strokeWidth="2.6" strokeLinejoin="round"/>
              </g>
              <text x="160" y="62" textAnchor="start" fontFamily="Heebo,sans-serif" fontSize="68" fontWeight="800" fill="url(#gld)" letterSpacing="-2">AI</text>
            </svg>
          </div>
          <div className={styles.logoTextWrap}>
            <div className={styles.logoTagline}>מערכת ניהול בית כנסת</div>
          </div>
        </div>

        <div className={styles.divider} />
        {!isStandalone && (
          <button className={styles.installBtn} onClick={handleInstall}>
            📲 הוסף כאפליקציה למכשיר
          </button>
        )}
        {showIOSHint && (
          <div className={styles.iosHint}>
            לחץ על <strong>⬆️</strong> ואז <strong>"Add to Home Screen"</strong>
            <button className={styles.iosHintClose} onClick={() => setShowIOSHint(false)}>✕</button>
          </div>
        )}

        <div className={styles.cards}>
          <div className={styles.card} onClick={() => navigate('/member')} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate('/member')}>
            <div className={styles.cardIconWrap}>
              <span className={styles.cardIcon}>🙏</span>
            </div>
            <div className={styles.cardTitle}>{t('landing.member')}</div>
            <div className={styles.cardDesc}>{t('landing.member.desc')}</div>
          </div>
          <div className={styles.card} onClick={() => navigate('/gabai/login')} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate('/gabai/login')}>
            <div className={styles.cardIconWrap}>
              <span className={styles.cardIcon}>📋</span>
            </div>
            <div className={styles.cardTitle}>{t('landing.gabai')}</div>
            <div className={styles.cardDesc}>{t('landing.gabai.desc')}</div>
          </div>
        </div>
      </div>
      <button onClick={toggleLang} className={styles.langBtn}>{lang === 'he' ? 'EN' : 'עב'}</button>
      <a href='/landing.html' className={styles.aboutLink}>עלינו</a>
      <div className={styles.footer}>{t('landing.footer')}</div>
    </div>
  );
}
