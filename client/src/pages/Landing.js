import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import styles from './Landing.module.css';

export default function Landing() {
  const { gabai } = useAuth();
  const navigate = useNavigate();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data),
  });

  useEffect(() => {
    if (gabai) navigate('/gabai');
  }, [gabai, navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.logoWrap}>
          <span className={styles.logoEmoji}>🕍</span>
          <div className={styles.logoText}>Gab<span className={styles.logoAI}>-AI</span></div>
        </div>

        <h1 className={styles.title}>{settings?.shulName || 'Gab-AI'}</h1>
        {settings?.city && <p className={styles.city}>{settings.city}</p>}
        {settings?.parasha && (
          <span className={styles.parasha}>פרשת {settings.parasha}</span>
        )}

        <div className={styles.divider} />

        <div className={styles.cards}>
          <div className={styles.card} onClick={() => navigate('/gabai/login')} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate('/gabai/login')} aria-label="כניסת גבאי">
            <span className={styles.cardIcon}>📋</span>
            <div className={styles.cardTitle}>כניסת גבאי</div>
            <div className={styles.cardDesc}>ניהול לוח ואישור בקשות</div>
          </div>
          <div className={styles.card} onClick={() => navigate('/member')} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate('/member')} aria-label="כניסת מתפלל">
            <span className={styles.cardIcon}>🙏</span>
            <div className={styles.cardTitle}>כניסת מתפלל</div>
            <div className={styles.cardDesc}>הגשת בקשות לשבת</div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>Gab-AI · ניהול חכם לבית הכנסת</div>
    </div>
  );
}
