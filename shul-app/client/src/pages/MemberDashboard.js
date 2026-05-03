import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import HebrewCalendar from '../components/HebrewCalendar';
import { Card, Badge, Button, Select, Textarea, Loader, EmptyState } from '../components/UI';
import styles from './MemberDashboard.module.css';

const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
const HOLIDAYS = {
  '2024-10-02':'ראש השנה','2024-10-03':'ראש השנה','2024-10-11':'יום כיפור',
  '2024-10-16':'סוכות','2024-10-24':'שמיני עצרת','2024-10-25':'שמחת תורה',
  '2025-03-14':'פורים','2025-04-14':'פסח','2025-04-15':'פסח',
  '2025-06-02':'שבועות','2025-06-03':'שבועות',
  '2025-09-22':'ראש השנה','2025-09-23':'ראש השנה','2025-10-01':'יום כיפור',
  '2025-10-06':'סוכות','2025-10-14':'שמיני עצרת','2025-10-15':'שמחת תורה',
  '2026-03-03':'פורים','2026-04-02':'פסח','2026-04-03':'פסח',
  '2026-05-19':'שבועות','2026-05-20':'שבועות',
};
const PARASHA = {
  '2025-05-03':'אחרי מות-קדושים','2025-05-10':'אמור','2025-05-17':'בהר-בחוקותי',
  '2025-05-24':'במדבר','2025-06-07':'נשא','2025-06-14':'בהעלותך',
  '2025-06-21':'שלח','2025-06-28':'קרח','2025-07-05':'חוקת','2025-07-12':'בלק',
  '2025-07-19':'פינחס','2025-07-26':'מטות-מסעי','2025-08-02':'דברים',
  '2025-08-09':'ואתחנן','2025-08-16':'עקב','2025-08-23':'ראה',
  '2025-08-30':'שופטים','2025-09-06':'כי תצא','2025-09-13':'כי תבוא',
  '2025-09-20':'נצבים-וילך',
  '2025-10-18':'בראשית','2025-10-25':'נח','2025-11-01':'לך לך',
  '2025-11-08':'וירא','2025-11-15':'חיי שרה','2025-11-22':'תולדות',
  '2025-11-29':'ויצא','2025-12-06':'וישלח','2025-12-13':'וישב',
  '2025-12-20':'מקץ','2025-12-27':'ויגש','2026-01-03':'ויחי',
  '2026-01-10':'שמות','2026-01-17':'וארא','2026-01-24':'בא',
  '2026-01-31':'בשלח','2026-02-07':'יתרו','2026-02-14':'משפטים',
  '2026-02-21':'תרומה','2026-02-28':'תצוה','2026-03-07':'כי תשא',
  '2026-03-14':'ויקהל','2026-03-21':'פקודי','2026-03-28':'ויקרא',
  '2026-04-04':'צו','2026-04-25':'שמיני','2026-05-02':'תזריע-מצורע',
  '2026-05-09':'אחרי מות-קדושים','2026-05-16':'אמור','2026-05-23':'בהר-בחוקותי',
  '2026-05-30':'במדבר','2026-06-13':'נשא','2026-06-20':'בהעלותך',
  '2026-06-27':'שלח','2026-07-04':'קרח','2026-07-11':'חוקת-בלק',
  '2026-07-18':'פינחס','2026-07-25':'מטות-מסעי','2026-08-01':'דברים',
};

function toKey(d) { return d.toISOString().split('T')[0]; }
function formatDate(d) {
  return d.toLocaleDateString('he-IL', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

export default function MemberDashboard() {
  const { memberName, memberSynagogue } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [showCal, setShowCal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState({ type: 'תפילה', sub: 'שחרית', reason: '' });

  const synagogue = memberSynagogue || JSON.parse(sessionStorage.getItem('member_synagogue') || 'null');
  const name = memberName || sessionStorage.getItem('member_name') || '';

  const today = new Date(); today.setHours(0,0,0,0);
  const maxDate = new Date(today); maxDate.setFullYear(maxDate.getFullYear() + 1);

  const { data: myRequests, isLoading } = useQuery({
    queryKey: ['myRequests', name, synagogue?._id],
    queryFn: () => api.get('/requests', { params: { memberName: name, synagogueId: synagogue?._id } }).then(r => r.data),
    enabled: !!name && !!synagogue?._id,
  });

  const submitMutation = useMutation({
    mutationFn: data => api.post('/requests', data),
    onSuccess: () => {
      qc.invalidateQueries(['myRequests']);
      setShowCal(false);
      setSelectedDate(null);
      setForm({ type: 'תפילה', sub: 'שחרית', reason: '' });
      toast.success('הבקשה נשלחה לגבאי ✓');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'שגיאה בשליחה'),
  });

  if (!name || !synagogue) { navigate('/member'); return null; }

  const handleSelectDate = (date) => {
    setSelectedDate(date);
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!selectedDate) { toast.error('יש לבחור תאריך'); return; }
    const key = toKey(selectedDate);
    const parasha = PARASHA[key] || '';
    const holiday = HOLIDAYS[key] || '';
    submitMutation.mutate({
      ...form,
      memberName: name,
      synagogueId: synagogue._id,
      day: selectedDate.getDay(),
      shabbatLabel: parasha || holiday || '',
      requestDate: key,
    });
  };

  const statusLabel = s => ({ pending:'ממתין לאישור', approved:'אושר ✓', declined:'נדחה' })[s] || s;

  const selKey = selectedDate ? toKey(selectedDate) : null;
  const selParasha = selKey ? PARASHA[selKey] : null;
  const selHoliday = selKey ? HOLIDAYS[selKey] : null;
  const isSaturday = selectedDate?.getDay() === 6;

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

        <button className={styles.newBtn} onClick={() => setShowCal(true)}>
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
                <div className={styles.reqDay}>
                  {r.shabbatLabel ? `${DAYS[r.day]} · ${r.shabbatLabel}` : DAYS[r.day]}
                </div>
                <div className={styles.reqTime}>
                  {r.requestDate
                    ? new Date(r.requestDate).toLocaleDateString('he-IL', { dateStyle:'medium' })
                    : new Date(r.createdAt).toLocaleDateString('he-IL', { dateStyle:'medium' })}
                </div>
              </div>
              <Badge variant={r.status}>{statusLabel(r.status)}</Badge>
            </div>
            <Badge variant={r.type === 'תפילה' ? 'tefila' : 'torah'}>{r.type} — {r.sub}</Badge>
            {r.reason && <p className={styles.reason}>{r.reason}</p>}
          </Card>
        ))}
      </main>

      {/* CALENDAR MODAL */}
      {showCal && (
        <div className={styles.modalBg} onClick={() => setShowCal(false)}>
          <div className={styles.modalSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHandle} />
            <h3 className={styles.modalTitle}>בקשה חדשה</h3>
            <p className={styles.modalSub}>{synagogue.name} — בחר תאריך</p>

            <HebrewCalendar
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              minDate={today}
              maxDate={maxDate}
            />

            {selectedDate && (
              <div className={styles.selectedInfo}>
                <div className={styles.selectedDate}>📅 {formatDate(selectedDate)}</div>
                {selParasha && <div className={styles.selectedExtra}>פרשת {selParasha}</div>}
                {selHoliday && <div className={styles.selectedExtra}>🎉 {selHoliday}</div>}
              </div>
            )}

            {selectedDate && (
              <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom:'1rem' }}>
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
                    {(isSaturday
                      ? ['שחרית','מוסף','מנחה','מעריב']
                      : ['שחרית','מנחה','מעריב']
                    ).map(p => <option key={p}>{p}</option>)}
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
              </form>
            )}

            <Button variant="secondary" onClick={() => setShowCal(false)} style={{ marginTop: 10 }}>
              ביטול
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
