import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../i18n/LanguageContext';
import styles from './Landing.module.css';

export default function Landing() {
  const { gabai } = useAuth();
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
            <img src="/logo-transparent.png" alt="Gab-AI" className={styles.logoSvg} />
          </div>
          <div className={styles.logoTextWrap}>
            <div className={styles.logoTagline}>מערכת ניהול בית כנסת</div>
          </div>
        </div>

        <div className={styles.divider} />

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
      <div className={styles.footer}>{t('landing.footer')}</div>
    </div>
  );
}
