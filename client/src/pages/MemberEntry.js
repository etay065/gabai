import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input, Button } from '../components/UI';
import styles from './AuthPage.module.css';

export default function MemberEntry() {
  const { setMemberName } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handle = e => {
    e.preventDefault();
    if (!name.trim()) { setError('יש להזין שם'); return; }
    setMemberName(name.trim());
    navigate('/member/dashboard');
  };

  return (
    <div className={styles.page}>
      <div className={styles.sheet}>
        <div className={styles.backRow}>
          <span className={styles.backLink} onClick={() => navigate('/')} role="button" tabIndex={0}>
            ← חזרה לדף הבית
          </span>
        </div>

        <div className={styles.iconWrap}>🙏</div>
        <h2 className={styles.title}>Gab-AI · כניסת מתפלל</h2>
        <p className={styles.sub}>כדי שהגבאי ידע ממי הבקשה — אין צורך בסיסמה</p>

        <form onSubmit={handle}>
          <Input
            label="שם מלא"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            placeholder="ישראל ישראלי"
            error={error}
            autoFocus
            autoComplete="name"
          />
          <Button type="submit">המשך →</Button>
        </form>

        <Button variant="secondary" onClick={() => navigate('/')} style={{ marginTop: 10 }}>
          ביטול
        </Button>
      </div>
    </div>
  );
}
