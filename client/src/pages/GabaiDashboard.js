import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import HebrewCalendar from '../components/HebrewCalendar';
import { Badge, Card, Button, Input, Loader, EmptyState } from '../components/UI';
import styles from './GabaiDashboard.module.css';

const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

function toKey(d) { return d.toISOString().split('T')[0]; }

export default function GabaiDashboard() {
  const { gabai, logoutGabai } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const synagogue = gabai?.synagogue;

  const [tab, setTab] = useState('requests');
  const [selectedDate, setSelectedDate] = useState(null);
  const [schedDay, setSchedDay] = useState(6);

  const today = new Date(); today.setHours(0,0,0,0);
  const maxDate = new Date(today); maxDate.setFullYear(maxDate.getFullYear() + 1);

  const { data: allRequests = [], isLoading: loadingReqs } = useQuery({
    queryKey: ['allRequests', synagogue?._id],
    queryFn: () => api.get('/requests', { params: { synagogueId: synagogue?._id } }).then(r => r.data),
    enabled: !!synagogue?._id,
    refetchInterval: 15_000,
  });

  const { data: scheduleAll = [] } = useQuery({
    queryKey: ['schedule', synagogue?._id],
    queryFn: () => api.get('/schedule', { params: { synagogueId: synagogue?._id } }).then(r => r.data),
    enabled: !!synagogue?._id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/requests/${id}/status`, { status }),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries(['allRequests']);
      toast.success(status === 'approved' ? 'הבקשה אושרה ✓' : 'הבקשה נדחתה');
    },
    onError: () => toast.error('שגיאה בעדכון'),
  });

  // ── בקשות ממתינות — כל הבקשות ללא תלות ביום ──
  const pendingAll = allRequests.filter(r => r.status === 'pending');
  const approved   = allRequests.filter(r => r.status === 'approved').length;

  // ── סינון לפי תאריך נבחר ──
  const filteredReqs = selectedDate
    ? allRequests.filter(r => r.requestDate === toKey(selectedDate))
    : pendingAll; // ברירת מחדל: כל הממתינות

  const daySchedule    = scheduleAll.find(s => s.day === schedDay)?.prayers || [];
  const approvedForDay = allRequests.filter(r => r.day === schedDay && r.status === 'approved');

  const statusLabel = s => ({ pending:'ממתין', approved:'אושר ✓', declined:'נדחה' })[s] || s;

  // סימון ימים עם בקשות בלוח
  const datesWithRequests = allRequests.reduce((acc, r) => {
    if (r.requestDate) {
      if (!acc[r.requestDate]) acc[r.requestDate] = { pending: 0, total: 0 };
      acc[r.requestDate].total++;
      if (r.status === 'pending') acc[r.requestDate].pending++;
    }
    return acc;
  }, {});

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.avatar}>{gabai?.username?.charAt(0)?.toUpperCase()}</div>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>Gab-AI · לוח הגבאי</div>
          <div className={styles.headerSub}>
            {synagogue?.name}{synagogue?.parasha ? ` · פרשת ${synagogue.parasha}` : ''}
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={() => { logoutGabai(); navigate('/'); }}>יציאה</button>
      </header>

      <nav className={styles.tabs}>
        {[
          ['requests', 'בקשות', pendingAll.length],
          ['schedule', 'לוח זמנים', 0],
          ['settings', 'הגדרות', 0],
        ].map(([key, label, cnt]) => (
          <button key={key}
            className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`}
            onClick={() => setTab(key)}>
            {label}
            {cnt > 0 && <span className={styles.tabBadge}>{cnt}</span>}
          </button>
        ))}
      </nav>

      <main className={styles.body}>

        {/* ── REQUESTS ── */}
        {tab === 'requests' && (
          <>
            <div className={styles.metrics}>
              <div className={`${styles.metric} ${styles.metricPending}`}>
                <div className={styles.metricNum}>{pendingAll.length}</div>
                <div className={styles.metricLbl}>ממתינות</div>
              </div>
              <div className={`${styles.metric} ${styles.metricApproved}`}>
                <div className={styles.metricNum}>{approved}</div>
                <div className={styles.metricLbl}>אושרו</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricNum}>{allRequests.length}</div>
                <div className={styles.metricLbl}>סה"כ</div>
              </div>
            </div>

            {/* לוח שנה לגבאי */}
            <div className={styles.calWrap}>
              <HebrewCalendar
                selectedDate={selectedDate}
                onSelectDate={(d) => setSelectedDate(prev => toKey(prev || {}) === toKey(d) ? null : d)}
                minDate={null}
                maxDate={maxDate}
                markedDates={datesWithRequests}
              />
            </div>

            {/* כותרת הרשימה */}
            <div className={styles.listHeader}>
              {selectedDate ? (
                <>
                  <span className={styles.listTitle}>
                    {selectedDate.toLocaleDateString('he-IL', { weekday:'long', day:'numeric', month:'long' })}
                  </span>
                  <button className={styles.clearDate} onClick={() => setSelectedDate(null)}>
                    הצג כל הממתינות ✕
                  </button>
                </>
              ) : (
                <span className={styles.listTitle}>כל הבקשות הממתינות</span>
              )}
            </div>

            {loadingReqs && <Loader />}
            {!loadingReqs && filteredReqs.length === 0 && (
              <EmptyState text={selectedDate ? 'אין בקשות לתאריך זה' : 'אין בקשות ממתינות'} />
            )}

            {filteredReqs.map(r => (
              <Card key={r._id}>
                <div className={styles.reqRow}>
                  <div>
                    <div className={styles.reqNameRow}>
                      {r.status === 'pending' && <span className={styles.dot} />}
                      <span className={styles.reqName}>{r.memberName}</span>
                    </div>
                    <div className={styles.reqTime}>
                      {r.requestDate
                        ? new Date(r.requestDate + 'T12:00:00').toLocaleDateString('he-IL', { weekday:'long', day:'numeric', month:'long' })
                        : DAYS[r.day]}
                      {r.shabbatLabel ? ` · ${r.shabbatLabel}` : ''}
                    </div>
                  </div>
                </div>
                <Badge variant={r.type === 'תפילה' ? 'tefila' : 'torah'}>{r.type} — {r.sub}</Badge>
                {r.reason && <p className={styles.reason}>{r.reason}</p>}
                <div className={styles.actions}>
                  {r.status === 'pending' ? (
                    <>
                      <Button variant="approve" onClick={() => statusMutation.mutate({ id: r._id, status: 'approved' })}>✓ אישור</Button>
                      <Button variant="decline" onClick={() => statusMutation.mutate({ id: r._id, status: 'declined' })}>✕ דחייה</Button>
                    </>
                  ) : (
                    <Badge variant={r.status}>{statusLabel(r.status)}</Badge>
                  )}
                </div>
              </Card>
            ))}
          </>
        )}

        {/* ── SCHEDULE ── */}
        {tab === 'schedule' && (
          <>
            <div className={styles.dayBarWrap}>
              {DAYS.map((d, i) => (
                <button key={i}
                  className={`${styles.dayPill} ${schedDay === i ? styles.dayPillActive : ''}`}
                  onClick={() => setSchedDay(i)}>
                  {d}
                </button>
              ))}
            </div>
            {daySchedule.length === 0 && <EmptyState text="אין לוח זמנים ליום זה" />}
            {daySchedule.map((p, i) => {
              const reqs = approvedForDay.filter(r => r.sub === p.name);
              return (
                <div key={i} className={`${styles.schedBlock} ${reqs.length ? styles.schedBlockHighlight : ''}`}>
                  <div className={styles.schedTime}>{p.time}</div>
                  <div className={styles.schedName}>{p.name}</div>
                  {p.details && <div className={styles.schedDetails}>{p.details}</div>}
                  {reqs.length > 0 && (
                    <div className={styles.schedTags}>
                      {reqs.map(r => <span key={r._id} className={styles.schedTag}>{r.memberName}</span>)}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && <GabaiSettings synagogue={synagogue} qc={qc} />}
      </main>
    </div>
  );
}

function GabaiSettings({ synagogue, qc }) {
  const [form, setForm] = useState({ name: synagogue?.name || '', city: synagogue?.city || '', parasha: synagogue?.parasha || '' });
  const [passForm, setPassForm] = useState({ newPassword: '', confirm: '' });

  React.useEffect(() => {
    if (synagogue) setForm({ name: synagogue.name, city: synagogue.city, parasha: synagogue.parasha });
  }, [synagogue]);

  const saveSettings = async e => {
    e.preventDefault();
    await api.put(`/synagogues/${synagogue._id}`, form);
    qc.invalidateQueries(['settings']);
    toast.success('ההגדרות נשמרו ✓');
  };

  const changePass = async e => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirm) { toast.error('הסיסמאות אינן תואמות'); return; }
    if (passForm.newPassword.length < 4) { toast.error('סיסמה קצרה מדי'); return; }
    await api.post('/auth/change-password', { newPassword: passForm.newPassword });
    toast.success('הסיסמה עודכנה ✓');
    setPassForm({ newPassword: '', confirm: '' });
  };

  return (
    <div>
      <div className={styles.settingsSection}>הגדרות בית הכנסת</div>
      <Card>
        <form onSubmit={saveSettings}>
          <div className={styles.fieldGroup}><label className={styles.fieldLabel}>שם בית הכנסת</label><input className={styles.fieldInput} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className={styles.fieldGroup}><label className={styles.fieldLabel}>עיר / שכונה</label><input className={styles.fieldInput} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
          <div className={styles.fieldGroup} style={{marginBottom:0}}><label className={styles.fieldLabel}>פרשת השבוע</label><input className={styles.fieldInput} value={form.parasha} onChange={e => setForm(f => ({ ...f, parasha: e.target.value }))} /></div>
          <Button type="submit" style={{marginTop:'1rem'}}>שמור</Button>
        </form>
      </Card>
      <div className={styles.settingsSection} style={{ marginTop:'1.25rem' }}>שינוי סיסמה</div>
      <Card>
        <form onSubmit={changePass}>
          <div className={styles.fieldGroup}><label className={styles.fieldLabel}>סיסמה חדשה</label><input className={styles.fieldInput} type="password" value={passForm.newPassword} onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="לפחות 4 תווים" /></div>
          <div className={styles.fieldGroup} style={{marginBottom:0}}><label className={styles.fieldLabel}>אימות סיסמה</label><input className={styles.fieldInput} type="password" value={passForm.confirm} onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))} placeholder="••••••" /></div>
          <Button type="submit" style={{marginTop:'1rem'}}>עדכן סיסמה</Button>
        </form>
      </Card>
    </div>
  );
}
