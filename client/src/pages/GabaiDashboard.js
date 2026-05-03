import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { DayPills, Badge, Card, Button, Input, Loader, EmptyState } from '../components/UI';
import styles from './GabaiDashboard.module.css';

const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

export default function GabaiDashboard() {
  const { gabai, logoutGabai } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const synagogue = gabai?.synagogue;

  const [tab, setTab] = useState('requests');
  const [reqDay, setReqDay] = useState(6);
  const [schedDay, setSchedDay] = useState(6);

  const { data: allRequests = [], isLoading: loadingReqs } = useQuery({
    queryKey: ['allRequests', synagogue?._id],
    queryFn: () => api.get('/requests', { params: { synagogueId: synagogue?._id } }).then(r => r.data),
    enabled: !!synagogue?._id,
    refetchInterval: 30_000,
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

  const pendingCounts = allRequests.reduce((acc, r) => {
    if (r.status === 'pending') acc[r.day] = (acc[r.day] || 0) + 1;
    return acc;
  }, {});

  const filteredReqs  = allRequests.filter(r => r.day === reqDay);
  const pending       = allRequests.filter(r => r.status === 'pending').length;
  const approved      = allRequests.filter(r => r.status === 'approved').length;
  const daySchedule   = scheduleAll.find(s => s.day === schedDay)?.prayers || [];
  const approvedForDay = allRequests.filter(r => r.day === schedDay && r.status === 'approved');
  const statusLabel   = s => ({ pending:'ממתין', approved:'אושר ✓', declined:'נדחה' })[s] || s;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.avatar}>{gabai?.username?.charAt(0)?.toUpperCase()}</div>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>Gab-AI · לוח הגבאי</div>
          <div className={styles.headerSub}>
            {synagogue?.name || ''}{synagogue?.parasha ? ` · פרשת ${synagogue.parasha}` : ''}
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={() => { logoutGabai(); navigate('/'); }}>יציאה</button>
      </header>

      <nav className={styles.tabs}>
        {[['requests','בקשות',pending],['schedule','לוח זמנים',0],['settings','הגדרות',0]].map(([key,label,cnt]) => (
          <button key={key}
            className={`${styles.tab} ${tab===key?styles.tabActive:''}`}
            onClick={() => setTab(key)}>
            {label}
            {cnt > 0 && <span className={styles.tabBadge}>{cnt}</span>}
          </button>
        ))}
      </nav>

      <main className={styles.body}>
        {tab === 'requests' && (
          <>
            <div className={styles.metrics}>
              <div className={`${styles.metric} ${styles.metricPending}`}>
                <div className={styles.metricNum}>{pending}</div><div className={styles.metricLbl}>ממתינות</div>
              </div>
              <div className={`${styles.metric} ${styles.metricApproved}`}>
                <div className={styles.metricNum}>{approved}</div><div className={styles.metricLbl}>אושרו</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricNum}>{allRequests.length}</div><div className={styles.metricLbl}>סה"כ</div>
              </div>
            </div>
            <DayPills days={DAYS} activeDay={reqDay} onSelect={setReqDay} pendingCounts={pendingCounts} />
            {loadingReqs && <Loader />}
            {!loadingReqs && filteredReqs.length === 0 && <EmptyState text="אין בקשות ליום זה" />}
            {filteredReqs.map(r => (
              <Card key={r._id}>
                <div className={styles.reqRow}>
                  <div>
                    <div className={styles.reqNameRow}>
                      {r.status === 'pending' && <span className={styles.dot} />}
                      <span className={styles.reqName}>{r.memberName}</span>
                    </div>
                    <div className={styles.reqTime}>
                      {new Date(r.createdAt).toLocaleString('he-IL', { dateStyle:'short', timeStyle:'short' })}
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

        {tab === 'schedule' && (
          <>
            <DayPills days={DAYS} activeDay={schedDay} onSelect={setSchedDay} />
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

        {tab === 'settings' && <GabaiSettings synagogue={synagogue} gabai={gabai} qc={qc} />}
      </main>
    </div>
  );
}

function GabaiSettings({ synagogue, gabai, qc }) {
  const { loginGabai } = useAuth();
  const [form, setForm] = useState({ name: synagogue?.name || '', city: synagogue?.city || '', parasha: synagogue?.parasha || '' });
  const [passForm, setPassForm] = useState({ newPassword: '', confirm: '' });

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
          <Input label="שם בית הכנסת" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="עיר / שכונה" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
          <Input label="פרשת השבוע" value={form.parasha} onChange={e => setForm(f => ({ ...f, parasha: e.target.value }))} />
          <Button type="submit">שמור</Button>
        </form>
      </Card>
      <div className={styles.settingsSection} style={{ marginTop:'1.25rem' }}>שינוי סיסמה</div>
      <Card>
        <form onSubmit={changePass}>
          <Input label="סיסמה חדשה" type="password" value={passForm.newPassword}
            onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="לפחות 4 תווים" />
          <Input label="אימות סיסמה" type="password" value={passForm.confirm}
            onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))} placeholder="••••••" />
          <Button type="submit">עדכן סיסמה</Button>
        </form>
      </Card>
    </div>
  );
}
