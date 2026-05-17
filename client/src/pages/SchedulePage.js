import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import styles from './SchedulePage.module.css';

const TYPES = ['תפילה','קריאת תורה','דרשן','תרגום'];
const TYPE_ICONS = { 'תפילה':'🕯️','קריאת תורה':'📖','דרשן':'🎤','תרגום':'📜' };
const SUBS = {
  'תפילה': ['שחרית','מוסף','מנחה','קבלת שבת','מעריב'],
  'קריאת תורה': ['כהן ראשון','לוי שני','שלישי','רביעי','חמישי','שישי','שביעי','מפטיר'],
  'דרשן': ['דרשה','שיעור תורה','הספד','דברי תורה קצרים'],
  'תרגום': ['תרגום ראשון','תרגום שני','תרגום שלישי','תרגום רביעי','תרגום חמישי','תרגום שישי','תרגום שביעי','תרגום מפטיר'],
};

const emptySlot = () => ({ id: Date.now().toString(), type: 'תפילה', sub: 'שחרית', time: '', label: '' });

function SlotEditor({ slots, onChange, title }) {
  const addSlot = () => onChange([...slots, emptySlot()]);
  const removeSlot = (id) => onChange(slots.filter(s => s.id !== id));
  const updateSlot = (id, key, val) => onChange(slots.map(s => s.id === id ? { ...s, [key]: val, ...(key === 'type' ? { sub: SUBS[val][0] } : {}) } : s));

  return (
    <div className={styles.slotSection}>
      <div className={styles.slotHeader}>
        <h3 className={styles.slotTitle}>{title}</h3>
        <button className={styles.addSlotBtn} onClick={addSlot}>+ הוסף</button>
      </div>
      {slots.length === 0 && <div className={styles.empty}>אין תפקידים מוגדרים — לחץ + הוסף</div>}
      {slots.map(slot => (
        <div key={slot.id} className={styles.slot}>
          <div className={styles.slotRow}>
            <input className={styles.timeInput} type="time" value={slot.time} onChange={e => updateSlot(slot.id, 'time', e.target.value)} placeholder="שעה" />
            <select className={styles.typeSelect} value={slot.type} onChange={e => updateSlot(slot.id, 'type', e.target.value)}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <select className={styles.subSelect} value={slot.sub} onChange={e => updateSlot(slot.id, 'sub', e.target.value)}>
              {(SUBS[slot.type] || []).map(s => <option key={s}>{s}</option>)}
            </select>
            <button className={styles.removeBtn} onClick={() => removeSlot(slot.id)}>✕</button>
          </div>
          <input className={styles.labelInput} value={slot.label} onChange={e => updateSlot(slot.id, 'label', e.target.value)} placeholder="הערה (אופציונלי) — למשל: שחרית ימי חול" />
        </div>
      ))}
    </div>
  );
}

export default function SchedulePage() {
  const { gabai } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const synagogue = gabai?.synagogue;
  const [tab, setTab] = useState('shabbat');

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['schedule', synagogue?._id],
    queryFn: () => api.get('/schedule', { params: { synagogueId: synagogue?._id } }).then(r => r.data),
    enabled: !!synagogue?._id,
  });

  const [shabbat, setShabbat] = useState(null);
  const [weekday, setWeekday] = useState(null);

  React.useEffect(() => {
    if (schedule) {
      setShabbat(schedule.shabbat || []);
      setWeekday(schedule.weekday || []);
    }
  }, [schedule]);

  const saveMutation = useMutation({
    mutationFn: () => api.put('/schedule', { shabbat, weekday }),
    onSuccess: () => { qc.invalidateQueries(['schedule']); toast.success('לוח הזמנים נשמר ✓'); },
    onError: () => toast.error('שגיאה בשמירה'),
  });

  if (isLoading || shabbat === null) return <div className={styles.loading}>טוען...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← חזרה</button>
        <div className={styles.topBarTitle}>לוח זמנים</div>
        <button className={styles.saveBtn} onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'שומר...' : 'שמור ✓'}
        </button>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab==='shabbat'?styles.tabActive:''}`} onClick={() => setTab('shabbat')}>שבת</button>
        <button className={`${styles.tab} ${tab==='weekday'?styles.tabActive:''}`} onClick={() => setTab('weekday')}>ימי חול</button>
      </div>

      <div className={styles.body}>
        <p className={styles.hint}>הגדר את התפקידים הקבועים לכל תפילה. המתפלל יראה מה פנוי ומה תפוס בזמן הגשת בקשה.</p>
        {tab === 'shabbat' && <SlotEditor slots={shabbat} onChange={setShabbat} title="תפקידי שבת" />}
        {tab === 'weekday' && <SlotEditor slots={weekday} onChange={setWeekday} title="תפקידי ימי חול" />}
      </div>
    </div>
  );
}
