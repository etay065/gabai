import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import { Input, Button } from '../components/UI';
import styles from './AuthPage.module.css';

export default function GabaiRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ synagogueName: '', city: '', gabaiUsername: '', gabaiPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/synagogues/register', form);
      toast.success('בית הכנסת נרשם בהצלחה!');
      navigate('/gabai/login');
    } catch (err) {
      setError(err.response?.data?.message || 'שגיאה ברישום');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.sheet}>
        <div className={styles.backRow}>
          <span className={styles.backLink} onClick={() => navigate('/gabai/login')}>
            ← חזרה לכניסה
          </span>
        </div>
        <div className={styles.iconWrap}>🕍</div>
        <h2 className={styles.title}>רישום בית כנסת חדש</h2>
        <p className={styles.sub}>צור חשבון גבאי לבית הכנסת שלך</p>

        <form onSubmit={handle}>
          <Input label="שם בית הכנסת" value={form.synagogueName}
            onChange={e => setForm(f => ({ ...f, synagogueName: e.target.value }))}
            placeholder="בית הכנסת הגדול" />
          <Input label="עיר" value={form.city}
            onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            placeholder="תל אביב" />
          <Input label="שם משתמש לגבאי" value={form.gabaiUsername}
            onChange={e => setForm(f => ({ ...f, gabaiUsername: e.target.value }))}
            placeholder="gabai_tlv" />
          <Input label="סיסמה" type="password" value={form.gabaiPassword}
            onChange={e => setForm(f => ({ ...f, gabaiPassword: e.target.value }))}
            placeholder="לפחות 4 תווים" />
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'רושם...' : 'צור חשבון →'}
          </Button>
        </form>
        <Button variant="secondary" onClick={() => navigate('/gabai/login')} style={{ marginTop: 10 }}>
          ביטול
        </Button>
      </div>
    </div>
  );
}
