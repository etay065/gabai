import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Card, Badge, Button, Select, Textarea, Input, Loader, EmptyState } from '../components/UI';
import styles from './MemberDashboard.module.css';

const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

export default function MemberDashboard() {
  const { memberName } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ day: 6, type: 'תפילה', sub: 'שחרית', reason: '' });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data),
  });

  const { data: myRequests, isLoading } = useQuery({
    queryKey: ['myRequests', memberName],
    queryFn: () => api.get('/requests', { params: { memberName } }).then(r => r.data),
    enabled: !!memberName,
  });

  const submitMutation = useMutation({
    mutationFn: data => api.post('/requests', data),
    onSuccess: () => {
      qc.invalidateQueries(['myRequests']);
      setShowForm(false);
      toast.success('הבקשה נשלחה לגבאי ✓');
      setForm({ day: 6, type: 'תפילה', sub: 'שחרית', reason: '' });
    },
    onError: () => toast.error('שגיאה בשליחה'),
  });

  if (!memberName) { navigate('/member'); return null; }

  const handleSubmit = e => {
    e.preventDefault();
    submitMutation.mutate({ ...form, memberName, shabbatLabel: settings?.parasha || '' });
  };

  const statusLabel = s => ({ pending: 'ממתין לאישור', approved: 'אושר ✓', declined: 'נדחה' })[s] || s;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.avatar}>{memberName.charAt(0)}</div>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>Gab-AI</div>
          <div className={styles.headerSub}>שלום, {memberName} · {settings?.shulName || 'בית הכנסת'}</div>
        </div>
        <button className={styles.backBtn} onClick={() => navigate('/')} aria-label="חזרה לדף הבית">
          יציאה
        </button>
      </header>

      <main className={styles.body}>
        <button className={styles.newBtn} onClick={() => setShowForm(true)}>
          <span>+</span> בקשה חדשה לשבת
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
        <div className={styles.modalBg} onClick={() => setShowForm(false)} role="dialog" aria-modal="true" aria-label="הגשת בקשה חדשה">
          <div className={styles.modalSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHandle} aria-hidden="true" />
            <h3 className={styles.modalTitle}>בקשה חדשה</h3>
            <p className={styles.modalSub}>
              {settings?.parasha ? `שבת פרשת ${settings.parasha}` : 'בחר יום ובקשה'}
            </p>

            <form onSubmit={handleSubmit}>
              <Select
                label="יום"
                value={form.day}
                onChange={e => setForm(f => ({ ...f, day: Number(e.target.value) }))}
              >
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </Select>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--clr-text2)', marginBottom: 6 }}>
                  סוג בקשה
                </label>
                <div className={styles.typeGrid}>
                  <button
                    type="button"
                    className={`${styles.typeOpt} ${form.type === 'תפילה' ? styles.typeOptSel : ''}`}
                    onClick={() => setForm(f => ({ ...f, type: 'תפילה', sub: 'שחרית' }))}
                  >
                    <span className={styles.typeOptIcon}>🕯️</span>
                    תפילה
                  </button>
                  <button
                    type="button"
                    className={`${styles.typeOpt} ${form.type === 'קריאת תורה' ? styles.typeOptSel : ''}`}
                    onClick={() => setForm(f => ({ ...f, type: 'קריאת תורה', sub: 'כהן (ראשון)' }))}
                  >
                    <span className={styles.typeOptIcon}>📖</span>
                    קריאת תורה
                  </button>
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

              <Textarea
                label="סיבה (אופציונלי)"
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="יאהרצייט, בר מצווה, שמחה..."
                rows={2}
              />

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
