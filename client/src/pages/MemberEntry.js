import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Button, Loader } from '../components/UI';
import api from '../api/client';
import styles from './MemberEntry.module.css';

export default function MemberEntry() {
  const { setMemberName, chooseMemberSynagogue } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [selectedSyn, setSelectedSyn] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: synagogues = [], isLoading } = useQuery({
    queryKey: ['synagogues'],
    queryFn: () => api.get('/synagogues').then(r => r.data),
  });

  const filtered = synagogues.filter(s =>
    s.name.includes(search) || s.city.includes(search)
  );

  const handle = async e => {
    e.preventDefault();
    if (!username.trim()) { setError('יש להזין שם משתמש'); return; }
    if (!selectedSyn) { setError('יש לבחור בית כנסת'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await api.get('/members/login', {
        params: { username: username.trim(), synagogueId: selectedSyn._id }
      });
      const member = res.data;
      setMemberName(member.firstName + ' ' + member.lastName);
      chooseMemberSynagogue(selectedSyn);
      sessionStorage.setItem('member_id', member._id);
      navigate('/member/dashboard');
    } catch (err) {
      setError('שם משתמש לא נמצא בבית כנסת זה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.sheet}>
        <div className={styles.backRow}>
          <span className={styles.backLink} onClick={() => navigate('/')}>← חזרה לדף הבית</span>
        </div>
        <div className={styles.iconWrap}>🙏</div>
        <h2 className={styles.title}>כניסת מתפלל</h2>
        <p className={styles.sub}>הזן שם משתמש ובחר בית כנסת</p>

        <form onSubmit={handle}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>שם משתמש</label>
            <input
              className={styles.fieldInput}
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              placeholder="israel123"
              dir="ltr"
              autoFocus
            />
          </div>

          <div className={styles.synSection}>
            <label className={styles.synLabel}>בחר בית כנסת</label>
            <input
              className={styles.searchInput}
              placeholder="חפש לפי שם או עיר..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className={styles.synList}>
              {isLoading && <Loader />}
              {search.trim() && !isLoading && filtered.length === 0 && (
                <div className={styles.synEmpty}>לא נמצאו בתי כנסת</div>
              )}
              {search.trim() && filtered.map(s => (
                <div
                  key={s._id}
                  className={`${styles.synItem} ${selectedSyn?._id === s._id ? styles.synItemSel : ''}`}
                  onClick={() => { setSelectedSyn(s); setError(''); }}
                >
                  <div className={styles.synName}>{s.name}</div>
                  <div className={styles.synCity}>{s.city}</div>
                  {selectedSyn?._id === s._id && <span className={styles.synCheck}>✓</span>}
                </div>
              ))}
            </div>
          </div>

          {error && <div className={styles.errorMsg}>{error}</div>}

          <Button type="submit" disabled={loading}>
            {loading ? 'מאמת...' : 'כניסה →'}
          </Button>
        </form>

        <Button variant="secondary" onClick={() => navigate('/')} style={{ marginTop: 10 }}>
          ביטול
        </Button>
      </div>
    </div>
  );
}
