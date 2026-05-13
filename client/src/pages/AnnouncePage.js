import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import styles from './AnnouncePage.module.css';

const DEFAULT_TEMPLATE = [
  { id: 1, label: 'כותרת', value: 'שבת פרשת {parasha}', emoji: '📋', type: 'title' },
  { id: 2, label: 'כניסת שבת', value: '', emoji: '🌇', type: 'field' },
  { id: 3, label: 'מנחה ערב שבת', value: '', emoji: '📖', type: 'field' },
  { id: 4, label: 'שחרית שבת', value: '', emoji: '🌞', type: 'field' },
  { id: 5, label: 'הערה / אירוע מיוחד', value: '', emoji: '💪', type: 'note' },
  { id: 6, label: 'מנחה גדולה', value: '', emoji: '🕐', type: 'field' },
  { id: 7, label: 'מנחה קטנה', value: '', emoji: '🕕', type: 'field' },
  { id: 8, label: 'שיעור אחר מנחה', value: '', emoji: '📃', type: 'note' },
  { id: 9, label: 'צאת השבת', value: '', emoji: '✨', type: 'field' },
  { id: 10, label: 'מניינים נוספים', value: '', emoji: '🕍', type: 'note' },
  { id: 11, label: 'כוני אבטחה', value: '', emoji: '🛡️', type: 'note' },
  { id: 12, label: 'חתימה', value: 'שבת שלום ובשורות טובות 🌹\nהגבאים', emoji: '', type: 'footer' },
];

function getParasha() {
  // Simple lookup for current week
  const today = new Date();
  const toKey = d => d.toISOString().split('T')[0];
  const PARASHA = {
    '2025-05-17':'בהר-בחוקותי','2025-05-24':'במדבר','2025-05-31':'נשא',
    '2025-06-07':'נשא','2025-06-14':'בהעלותך','2025-06-21':'שלח',
    '2025-06-28':'קרח','2025-07-05':'חוקת','2025-07-12':'בלק',
    '2025-07-19':'פינחס','2025-07-26':'מטות-מסעי','2025-08-02':'דברים',
    '2026-05-09':'אחרי מות-קדושים','2026-05-16':'אמור','2026-05-23':'בהר-בחוקותי',
    '2026-05-30':'במדבר','2026-06-06':'נשא','2026-06-13':'בהעלותך',
  };
  // Find next Saturday
  const sat = new Date(today);
  sat.setDate(today.getDate() + (6 - today.getDay() + 7) % 7);
  return PARASHA[toKey(sat)] || '';
}

export default function AnnouncePage() {
  const { gabai } = useAuth();
  const navigate = useNavigate();
  const synagogue = gabai?.synagogue;

  const STORAGE_KEY = 'gabai_announce_template_' + synagogue?._id;
  const VALUES_KEY = 'gabai_announce_values_' + synagogue?._id;

  const [mode, setMode] = useState('fill'); // 'fill' | 'template' | 'preview'
  const [template, setTemplate] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULT_TEMPLATE; }
    catch { return DEFAULT_TEMPLATE; }
  });
  const [values, setValues] = useState(() => {
    try { return JSON.parse(localStorage.getItem(VALUES_KEY)) || {}; }
    catch { return {}; }
  });
  const [parasha, setParasha] = useState(getParasha());

  // Load template from server
  const { data: serverTemplate } = useQuery({
    queryKey: ['announceTemplate', synagogue?._id],
    queryFn: () => api.get('/settings/announce-template').then(r => r.data),
    enabled: !!synagogue?._id,
  });

  useEffect(() => {
    if (serverTemplate?.template) setTemplate(serverTemplate.template);
  }, [serverTemplate]);

  const saveTemplateMutation = useMutation({
    mutationFn: (tmpl) => api.put('/settings/announce-template', { template: tmpl }),
    onSuccess: () => toast.success('התבנית נשמרה בשרת ✓'),
    onError: () => toast.error('שגיאה בשמירה'),
  });

  // Save template
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(template));
  }, [template]);

  // Save values
  useEffect(() => {
    localStorage.setItem(VALUES_KEY, JSON.stringify(values));
  }, [values]);

  const buildMessage = () => {
    let lines = [];
    for (const field of template) {
      if (!field.active && field.active === false) continue;
      const val = values[field.id] !== undefined ? values[field.id] : field.value;
      if (!val && field.type !== 'footer') continue;

      if (field.type === 'title') {
        const title = val.replace('{parasha}', parasha);
        lines.push(field.emoji ? field.emoji + ' ' + title : title);
      } else if (field.type === 'footer') {
        lines.push('');
        lines.push(val);
      } else if (field.type === 'note') {
        lines.push(field.emoji ? field.emoji + ' ' + val : val);
      } else {
        lines.push((field.emoji ? field.emoji + ' ' : '') + field.label + ': ' + val);
      }
    }
    return lines.join('\n');
  };

  const handleShare = async () => {
    const text = buildMessage();
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (e) {
        if (e.name !== 'AbortError') {
          navigator.clipboard.writeText(text);
          toast.success('הועתק ללוח');
        }
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success('הועתק ללוח');
    }
  };

  const addField = () => {
    const newId = Math.max(...template.map(f => f.id)) + 1;
    setTemplate(t => [...t, { id: newId, label: 'שדה חדש', value: '', emoji: '📌', type: 'field' }]);
  };

  const removeField = (id) => {
    setTemplate(t => t.filter(f => f.id !== id));
  };

  const updateTemplate = (id, key, val) => {
    setTemplate(t => t.map(f => f.id === id ? { ...f, [key]: val } : f));
  };

  const resetValues = () => {
    setValues({});
    toast.success('הערכים אופסו');
  };

  const message = buildMessage();

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← חזרה</button>
        <div className={styles.topBarTitle}>לוח זמנים שבועי</div>
        <button className={styles.shareBtn} onClick={handleShare}>שתף ⬆️</button>
      </div>

      <div className={styles.tabs}>
        {[['fill','מילוי'],['template','תבנית'],['preview','תצוגה מקדימה']].map(([k,l]) => (
          <button key={k} className={`${styles.tab} ${mode===k?styles.tabActive:''}`} onClick={() => setMode(k)}>{l}</button>
        ))}
      </div>

      <div className={styles.body}>

        {/* ── FILL MODE ── */}
        {mode === 'fill' && (
          <>
            <div className={styles.parashaRow}>
              <label className={styles.fieldLabel}>פרשת השבוע</label>
              <input className={styles.input} value={parasha} onChange={e => setParasha(e.target.value)} placeholder="שם הפרשה..." />
            </div>

            {template.map(field => (
              <div key={field.id} className={styles.fillField}>
                <label className={styles.fillLabel}>
                  {field.emoji} {field.label}
                  {field.type === 'title' && <span className={styles.badge}>כותרת</span>}
                  {field.type === 'footer' && <span className={styles.badge}>חתימה</span>}
                </label>
                {field.type === 'note' || field.type === 'footer' ? (
                  <textarea
                    className={styles.textarea}
                    rows={2}
                    value={values[field.id] !== undefined ? values[field.id] : field.value}
                    onChange={e => setValues(v => ({ ...v, [field.id]: e.target.value }))}
                    placeholder={field.value || 'הזן ערך...'}
                  />
                ) : (
                  <input
                    className={styles.input}
                    value={values[field.id] !== undefined ? values[field.id] : field.value}
                    onChange={e => setValues(v => ({ ...v, [field.id]: e.target.value }))}
                    placeholder={field.value || 'הזן ערך...'}
                  />
                )}
              </div>
            ))}

            <button className={styles.resetBtn} onClick={resetValues}>🔄 אפס ערכים</button>
          </>
        )}

        {/* ── TEMPLATE MODE ── */}
        {mode === 'template' && (
          <>
            <p className={styles.templateNote}>ערוך את שמות השדות, הערכים הקבועים והאימוג'ים</p>
            {template.map((field, idx) => (
              <div key={field.id} className={styles.templateField}>
                <div className={styles.templateFieldTop}>
                  <input className={`${styles.input} ${styles.emojiInput}`} value={field.emoji} onChange={e => updateTemplate(field.id, 'emoji', e.target.value)} placeholder="😊" maxLength={4} />
                  <input className={`${styles.input} ${styles.labelInput}`} value={field.label} onChange={e => updateTemplate(field.id, 'label', e.target.value)} placeholder="שם השדה" />
                  <select className={styles.typeSelect} value={field.type} onChange={e => updateTemplate(field.id, 'type', e.target.value)}>
                    <option value="title">כותרת</option>
                    <option value="field">שדה</option>
                    <option value="note">הערה</option>
                    <option value="footer">חתימה</option>
                  </select>
                  <button className={styles.removeBtn} onClick={() => removeField(field.id)}>✕</button>
                </div>
                <input className={styles.input} value={field.value} onChange={e => updateTemplate(field.id, 'value', e.target.value)} placeholder="ערך ברירת מחדל (אופציונלי)" />
              </div>
            ))}
            <button className={styles.addFieldBtn} onClick={addField}>+ הוסף שדה</button>
            <button className={styles.saveServerBtn} onClick={() => saveTemplateMutation.mutate(template)}>☁️ שמור תבנית בענן</button>
            <button className={styles.resetBtn} onClick={() => { setTemplate(DEFAULT_TEMPLATE); toast.success('התבנית אופסה'); }}>🔄 איפוס תבנית</button>
          </>
        )}

        {/* ── PREVIEW MODE ── */}
        {mode === 'preview' && (
          <>
            <div className={styles.preview}>
              <pre className={styles.previewText}>{message || 'אין תוכן — מלא את השדות בלשונית "מילוי"'}</pre>
            </div>
            <button className={styles.shareBtn2} onClick={handleShare}>
              ⬆️ שתף הודעה
            </button>
            <button className={styles.copyBtn} onClick={() => { navigator.clipboard.writeText(message); toast.success('הועתק ✓'); }}>
              📋 העתק טקסט
            </button>
          </>
        )}

      </div>
    </div>
  );
}
