import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input, Button } from '../components/UI';
import styles from './AuthPage.module.css';

export default function GabaiLogin() {
  const { loginGabai } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await loginGabai(form.username, form.password);
      navigate('/gabai');
    } catch (err) {
      setError(err.response?.data?.message || 'שגיאת כניסה — בדוק שם משתמש וסיסמה');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.sheet}>
        <div className={styles.backRow}>
          <span className={styles.backLink} onClick={() => navigate('/')}>← חזרה לדף הבית</span>
        </div>
        <div className={styles.iconWrap}>📋</div>
        <h2 className={styles.title}>Gab-AI · כניסת גבאי</h2>
        <p className={styles.sub}>הסשיין יישמר ל-30 יום</p>
        <form onSubmit={handle}>
          <Input label="שם משתמש" value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            placeholder="gabai" autoComplete="username" autoFocus />
          <Input label="סיסמה" type="password" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="••••••" autoComplete="current-password" />
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'מתחבר...' : 'כניסה →'}
          </Button>
        </form>
        <div className={styles.divider}>או</div>
        <Button variant="secondary" onClick={() => navigate('/gabai/register')}>
          🕍 רישום בית כנסת חדש
        </Button>
        <Button variant="secondary" onClick={() => navigate('/')} style={{ marginTop: 8 }}>
          ביטול
        </Button>
      </div>
    </div>
  );
}
