import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Input, Button, Loader } from '../components/UI';
import api from '../api/client';
import styles from './MemberEntry.module.css';

export default function MemberEntry() {
  const { setMemberName, chooseMemberSynagogue } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [selectedSyn, setSelectedSyn] = useState(null);
  const [nameError, setNameError] = useState('');
  const [synError, setSynError] = useState('');
  const [search, setSearch] = useState('');

  const { data: synagogues = [], isLoading } = useQuery({
    queryKey: ['synagogues'],
    queryFn: () => api.get('/synagogues').then(r => r.data),
  });

  const filtered = synagogues.filter(s =>
    s.name.includes(search) || s.city.includes(search)
  );

  const handle = e => {
    e.preventDefault();
    let ok = true;
    if (!name.trim()) { setNameError('יש להזין שם'); ok = false; }
    if (!selectedSyn)  { setSynError('יש לבחור בית כנסת'); ok = false; }
    if (!ok) return;
    setMemberName(name.trim());
    chooseMemberSynagogue(selectedSyn);
    navigate('/member/dashboard');
  };

  return (
    <div className={styles.page}>
      <div className={styles.sheet}>
        <div className={styles.backRow}>
          <span className={styles.backLink} onClick={() => navigate('/')}>← חזרה לדף הבית</span>
        </div>
        <div className={styles.iconWrap}>🙏</div>
        <h2 className={styles.title}>כניסת מתפלל</h2>
        <p className={styles.sub}>ללא צורך בסיסמה — רק שם ובית כנסת</p>
        <form onSubmit={handle}>
          <Input
            label="שם מלא"
            value={name}
            onChange={e => { setName(e.target.value); setNameError(''); }}
            placeholder="ישראל ישראלי"
            error={nameError}
            autoFocus
          />
          <div className={styles.synSection}>
            <label className={styles.synLabel}>בחר בית כנסת</label>
            <input
              className={styles.searchInput}
              placeholder="חפש לפי שם או עיר..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {synError && <span className={styles.synError}>{synError}</span>}
            <div className={styles.synList}>
              {isLoading && <Loader />}
              {!isLoading && filtered.length === 0 && (
                <div className={styles.synEmpty}>לא נמצאו בתי כנסת</div>
              )}
              {filtered.map(s => (
                <div
                  key={s._id}
                  className={`${styles.synItem} ${selectedSyn?._id === s._id ? styles.synItemSel : ''}`}
                  onClick={() => { setSelectedSyn(s); setSynError(''); }}
                >
                  <div className={styles.synName}>{s.name}</div>
                  <div className={styles.synCity}>{s.city}</div>
                  {selectedSyn?._id === s._id && <span className={styles.synCheck}>✓</span>}
                </div>
              ))}
            </div>
          </div>
          <Button type="submit">המשך →</Button>
        </form>
        <Button variant="secondary" onClick={() => navigate('/')} style={{ marginTop: 10 }}>
          ביטול
        </Button>
      </div>
    </div>
  );
}
