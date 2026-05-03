import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Card, Badge, Button, Select, Textarea, Loader, EmptyState } from '../components/UI';
import styles from './MemberDashboard.module.css';

const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

export default function MemberDashboard() {
  const { memberName, memberSynagogue } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ day: 6, type: 'תפילה', sub: 'שחרית', reason: '' });

  // fallback from sessionStorage directly
  const synagogue = memberSynagogue || JSON.parse(sessionStorage.getItem('member_synagogue') || 'null');
  const name = memberName || sessionStorage.getItem('member_name') || '';

  const { data: myRequests, isLoading } = useQuery({
    queryKey: ['myRequests', name, synagogue?._id],
    queryFn: () => api.get('/requests', {
      params: { memberName: name, synagogueId: synagogue?._id }
    }).then(r => r.data),
    enabled: !!name && !!synagogue?._id,
  });

  const submitMutation = useMutation({
    mutationFn: data => api.post('/requests', data),
    onSuccess: () => {
      qc.invalidateQueries(['myRequests']);
      setShowForm(false);
      toast.success('הבקשה נשלחה לגבאי ✓');
      setForm({ day: 6, type: 'תפילה', sub: 'שחרית', reason: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'שגיאה בשליחה'),
  });

  if (!name || !synagogue) { navigate('/member'); return null; }

  const handleSubmit = e => {
    e.preventDefault();
    console.log('submitting with synagogue:', synagogue);
    submitMutation.mutate({
      ...form,
      memberName: name,
      synagogueId: synagogue._id,
      shabbatLabel: synagogue.parasha || '',
    });
  };

  const statusLabel = s => ({ pending: 'ממתין לאישור', approved: 'אושר ✓', declined: 'נדחה' })[s] || s;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.avatar}>{name.charAt(0)}</div>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>Gab-AI</div>
          <div className={styles.headerSub}>שלום, {name} · {synagogue.name}</div>
        </div>
        <button className={styles.backBtn} onClick={() => navigate('/')}>יציאה</button>
      </header>

      <main className={styles.body}>
        <div className={styles.synBanner}>
          <span className={styles.synBannerIcon}>🕍</span>
          <div>
            <div className={styles.synBannerName}>{synagogue.name}</div>
            <div className={styles.synBannerCity}>{synagogue.city}</div>
          </div>
          <button className={styles.changeSynBtn} onClick={() => navigate('/member')}>החלף</button>
        </div>

        <button className={styles.newBtn} onClick={() => setShowForm(true)}>
          + בקשה חדשה לשבת
        </button>

        <div className={styles.sectionLabel}>הבקשות שלי</div>

        {isLoading && <Loader />}
        {!isLoading && myRequests?.length === 0 && (
          <EmptyState text="טרם הגשת בקשות — לחץ על 'בקשה חדשה' כדי להתחיל" />
        )}

        {myRequests?.map(r => (
          <Card key={r._id}>
            <div className={styles.reqRow}>
              <div>
                <div className={styles.reqDay}>{DAYS[r.day]}</div>
                <div className={styles.reqTime}>
                  {new Date(r.createdAt).toLocaleDateString('he-IL', { dateStyle: 'medium' })}
                </div>
              </div>
              <Badge variant={r.status}>{statusLabel(r.status)}</Badge>
            </div>
            <Badge variant={r.type === 'תפילה' ? 'tefila' : 'torah'}>
              {r.type} — {r.sub}
            </Badge>
            {r.reason && <p className={styles.reason}>{r.reason}</p>}
          </Card>
        ))}
      </main>

      {showForm && (
        <div className={styles.modalBg} onClick={() => setShowForm(false)}>
          <div className={styles.modalSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHandle} />
            <h3 className={styles.modalTitle}>בקשה חדשה</h3>
            <p className={styles.modalSub}>{synagogue.name}</p>

            <form onSubmit={handleSubmit}>
              <Select label="יום" value={form.day}
                onChange={e => setForm(f => ({ ...f, day: Number(e.target.value) }))}>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </Select>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--clr-text2)', marginBottom:6 }}>
                  סוג בקשה
                </label>
                <div className={styles.typeGrid}>
                  {['תפילה','קריאת תורה'].map(t => (
                    <button key={t} type="button"
                      className={`${styles.typeOpt} ${form.type === t ? styles.typeOptSel : ''}`}
                      onClick={() => setForm(f => ({ ...f, type: t, sub: t === 'תפילה' ? 'שחרית' : 'כהן (ראשון)' }))}>
                      <span className={styles.typeOptIcon}>{t === 'תפילה' ? '🕯️' : '📖'}</span>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {form.type === 'תפילה' ? (
                <Select label="איזו תפילה?" value={form.sub}
                  onChange={e => setForm(f => ({ ...f, sub: e.target.value }))}>
                  {['שחרית','מוסף','מנחה','מעריב'].map(p => <option key={p}>{p}</option>)}
                </Select>
              ) : (
                <Select label="עלייה לתורה" value={form.sub}
                  onChange={e => setForm(f => ({ ...f, sub: e.target.value }))}>
                  {['כהן (ראשון)','לוי (שני)','שלישי','רביעי','חמישי','שישי','שביעי','מפטיר'].map(a => <option key={a}>{a}</option>)}
                </Select>
              )}

              <Textarea label="סיבה (אופציונלי)" value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="יאהרצייט, בר מצווה, שמחה..." rows={2} />

              <Button type="submit" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? 'שולח...' : 'שלח בקשה ✓'}
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)} style={{ marginTop: 10 }}>
                ביטול
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
