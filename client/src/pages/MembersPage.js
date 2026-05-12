import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import styles from './MembersPage.module.css';

const TRIBES = ['ישראל', 'כהן', 'לוי'];
const TRIBE_COLORS = { 'כהן': '#4A90D9', 'לוי': '#7B68EE', 'ישראל': '#2E8B47' };

const emptyForm = { username: '', firstName: '', lastName: '', parentName: '', tribe: 'ישראל', notes: '' };

export default function MembersPage() {
  const { gabai } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const synagogue = gabai?.synagogue;

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [balanceModal, setBalanceModal] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', synagogue?._id],
    queryFn: () => api.get('/members', { params: { synagogueId: synagogue?._id } }).then(r => r.data),
    enabled: !!synagogue?._id,
  });

  const createMutation = useMutation({
    mutationFn: data => api.post('/members', data),
    onSuccess: () => { qc.invalidateQueries(['members']); setShowForm(false); setForm(emptyForm); toast.success('מתפלל נוסף ✓'); },
    onError: err => toast.error(err.response?.data?.message || 'שגיאה'),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => api.put('/members/' + id, data),
    onSuccess: () => { qc.invalidateQueries(['members']); setEditMember(null); toast.success('עודכן ✓'); },
    onError: err => toast.error(err.response?.data?.message || 'שגיאה'),
  });

  const deleteMutation = useMutation({
    mutationFn: id => api.delete('/members/' + id),
    onSuccess: () => { qc.invalidateQueries(['members']); toast.success('נמחק'); },
    onError: () => toast.error('שגיאה במחיקה'),
  });

  const balanceMutation = useMutation({
    mutationFn: ({ id, amount, action }) => api.patch('/members/' + id + '/balance', { amount, action }),
    onSuccess: () => { qc.invalidateQueries(['members']); setBalanceModal(null); setBalanceAmount(''); toast.success('יתרה עודכנה ✓'); },
    onError: () => toast.error('שגיאה'),
  });

  const filtered = members.filter(m =>
    m.firstName.includes(search) || m.lastName.includes(search) || m.username.includes(search)
  );

  const totalDebt = members.reduce((sum, m) => sum + (m.balance > 0 ? m.balance : 0), 0);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← חזרה</button>
        <div className={styles.topBarTitle}>רשימת מתפללים</div>
        <button className={styles.addBtn} onClick={() => { setForm(emptyForm); setShowForm(true); }}>+ הוסף</button>
      </div>

      <div className={styles.body}>
        <div className={styles.stats}>
          <div className={styles.stat}><div className={styles.statNum}>{members.length}</div><div className={styles.statLbl}>מתפללים</div></div>
          <div className={styles.stat}><div className={styles.statNum}>{members.filter(m => m.tribe === 'כהן').length}</div><div className={styles.statLbl}>כהנים</div></div>
          <div className={styles.stat}><div className={styles.statNum}>{members.filter(m => m.tribe === 'לוי').length}</div><div className={styles.statLbl}>לויים</div></div>
          <div className={`${styles.stat} ${totalDebt > 0 ? styles.statDebt : ''}`}>
            <div className={styles.statNum}>₪{totalDebt}</div><div className={styles.statLbl}>חובות פתוחים</div>
          </div>
        </div>

        <input className={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש לפי שם או שם משתמש..." />

        {isLoading && <div className={styles.empty}>טוען...</div>}
        {!isLoading && filtered.length === 0 && <div className={styles.empty}>אין מתפללים{search ? ' התואמים לחיפוש' : ' — לחץ + הוסף'}</div>}

        {filtered.map(m => (
          <div key={m._id} className={styles.card}>
            <div className={styles.cardMain}>
              <div className={styles.cardAvatar} style={{ background: TRIBE_COLORS[m.tribe] + '22', color: TRIBE_COLORS[m.tribe] }}>
                {m.firstName.charAt(0)}
              </div>
              <div className={styles.cardInfo}>
                <div className={styles.cardName}>{m.firstName} {m.lastName}</div>
                <div className={styles.cardSub}>
                  <span className={styles.username}>@{m.username}</span>
                  {m.parentName && <span> · {m.parentName}</span>}
                </div>
                <span className={styles.tribeBadge} style={{ background: TRIBE_COLORS[m.tribe] + '22', color: TRIBE_COLORS[m.tribe] }}>{m.tribe}</span>
              </div>
              <div className={styles.cardRight}>
                {m.balance !== 0 && (
                  <div className={`${styles.balance} ${m.balance > 0 ? styles.balanceDebt : styles.balanceCredit}`}>
                    {m.balance > 0 ? 'חוב' : 'זכות'} ₪{Math.abs(m.balance)}
                  </div>
                )}
                <div className={styles.cardActions}>
                  <button className={styles.actionBtn} onClick={() => setBalanceModal(m)} title="יתרה">₪</button>
                  <button className={styles.actionBtn} onClick={() => { setEditMember(m); setForm({ username: m.username, firstName: m.firstName, lastName: m.lastName, parentName: m.parentName || '', tribe: m.tribe, notes: m.notes || '' }); }} title="עריכה">✏️</button>
                  <button className={styles.actionBtn} onClick={() => { if (window.confirm('למחוק?')) deleteMutation.mutate(m._id); }} title="מחיקה">🗑️</button>
                </div>
              </div>
            </div>
            {m.notes && <div className={styles.notes}>{m.notes}</div>}
          </div>
        ))}
      </div>

      {/* ADD/EDIT MODAL */}
      {(showForm || editMember) && (
        <div className={styles.modalBg} onClick={() => { setShowForm(false); setEditMember(null); }}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHandle} />
            <h3 className={styles.modalTitle}>{editMember ? 'עריכת מתפלל' : 'הוספת מתפלל'}</h3>

            <div className={styles.formRow}>
              <div className={styles.field}><label>שם פרטי *</label><input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="ישראל" /></div>
              <div className={styles.field}><label>שם משפחה *</label><input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="ישראלי" /></div>
            </div>
            <div className={styles.field}><label>שם משתמש *</label><input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="israel123" dir="ltr" /></div>
            <div className={styles.field}><label>שם האב/האם</label><input value={form.parentName} onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))} placeholder="בן/בת..." /></div>

            <div className={styles.field}>
              <label>שבט</label>
              <div className={styles.tribeGrid}>
                {TRIBES.map(t => (
                  <button key={t} type="button"
                    className={`${styles.tribePill} ${form.tribe === t ? styles.tribePillSel : ''}`}
                    style={form.tribe === t ? { background: TRIBE_COLORS[t] + '22', borderColor: TRIBE_COLORS[t], color: TRIBE_COLORS[t] } : {}}
                    onClick={() => setForm(f => ({ ...f, tribe: t }))}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}><label>הערות</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="פרטים נוספים..." /></div>

            <button className={styles.submitBtn}
              disabled={!form.firstName || !form.lastName || !form.username}
              onClick={() => {
                if (editMember) editMutation.mutate({ id: editMember._id, data: form });
                else createMutation.mutate(form);
              }}>
              {editMember ? 'שמור שינויים' : 'הוסף מתפלל'}
            </button>
            <button className={styles.cancelBtn} onClick={() => { setShowForm(false); setEditMember(null); }}>ביטול</button>
          </div>
        </div>
      )}

      {/* BALANCE MODAL */}
      {balanceModal && (
        <div className={styles.modalBg} onClick={() => setBalanceModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHandle} />
            <h3 className={styles.modalTitle}>יתרה — {balanceModal.firstName} {balanceModal.lastName}</h3>

            <div className={styles.balanceCurrent}>
              <div className={styles.balanceLabel}>יתרה נוכחית</div>
              <div className={`${styles.balanceValue} ${balanceModal.balance > 0 ? styles.balanceDebt : balanceModal.balance < 0 ? styles.balanceCredit : ''}`}>
                {balanceModal.balance === 0 ? 'מאוזן' : balanceModal.balance > 0 ? `חוב ₪${balanceModal.balance}` : `זכות ₪${Math.abs(balanceModal.balance)}`}
              </div>
            </div>

            <div className={styles.balanceActions}>
              <button className={styles.balanceActionBtn} onClick={() => balanceMutation.mutate({ id: balanceModal._id, action: 'paid' })}>
                ✓ סמן כשולם (איפוס)
              </button>
            </div>

            <div className={styles.field} style={{ marginTop: '1rem' }}>
              <label>הוסף חיוב/זיכוי</label>
              <div className={styles.balanceInput}>
                <input type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} placeholder="סכום (+ חיוב, - זיכוי)" />
                <button onClick={() => { if (!balanceAmount) return; balanceMutation.mutate({ id: balanceModal._id, amount: Number(balanceAmount) }); }}>הוסף</button>
              </div>
            </div>
            <button className={styles.cancelBtn} onClick={() => setBalanceModal(null)}>סגור</button>
          </div>
        </div>
      )}
    </div>
  );
}
