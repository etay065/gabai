import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import styles from './AuctionPage.module.css';

function Countdown({ endTime }) {
  const calc = () => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return null;
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [endTime]);
  if (!t) return <span className={styles.countdownEnded}>הסתיים</span>;
  return (
    <div className={styles.countdown}>
      {t.d > 0 && (
        <div className={styles.countUnit}>
          <span className={styles.countNum}>{t.d}</span>
          <span className={styles.countLabel}>ימים</span>
        </div>
      )}
      <div className={styles.countUnit}>
        <span className={styles.countNum}>{String(t.h).padStart(2,'0')}</span>
        <span className={styles.countLabel}>שעות</span>
      </div>
      <div className={styles.countSep}>:</div>
      <div className={styles.countUnit}>
        <span className={styles.countNum}>{String(t.m).padStart(2,'0')}</span>
        <span className={styles.countLabel}>דקות</span>
      </div>
      <div className={styles.countSep}>:</div>
      <div className={styles.countUnit}>
        <span className={styles.countNum}>{String(t.s).padStart(2,'0')}</span>
        <span className={styles.countLabel}>שניות</span>
      </div>
    </div>
  );
}

function statusLabel(s) {
  return { pending: 'עומד להתחיל', active: 'פעיל', ended: 'הסתיים' }[s] || s;
}

// ── GABAI VIEW ────────────────────────────────────────────────────────────────
function GabaiAuctions({ synagogue }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', startPrice: '', startTime: '', endTime: '' });

  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ['auctions', synagogue?._id],
    queryFn: () => api.get('/auctions', { params: { synagogueId: synagogue?._id } }).then(r => r.data),
    enabled: !!synagogue?._id,
    refetchInterval: 10000,
  });

  const createMutation = useMutation({
    mutationFn: data => api.post('/auctions', data),
    onSuccess: () => { qc.invalidateQueries(['auctions']); setShowForm(false); toast.success('התמחרות נפתחה ✓'); setForm({ title: '', description: '', startPrice: '', startTime: '', endTime: '' }); },
    onError: err => toast.error(err.response?.data?.message || 'שגיאה'),
  });

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/auctions/${id}`),
    onSuccess: () => { qc.invalidateQueries(['auctions']); toast.success('נמחק'); },
  });

  const handleSubmit = e => {
    e.preventDefault();
    createMutation.mutate({ ...form, startPrice: Number(form.startPrice) || 0 });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← חזרה</button>
        <h2 className={styles.title}>התמחרויות</h2>
        <button className={styles.addBtn} onClick={() => setShowForm(true)}>+ התמחרות חדשה</button>
      </div>

      {isLoading && <div className={styles.empty}>טוען...</div>}
      {!isLoading && auctions.length === 0 && <div className={styles.empty}>אין התמחרויות פעילות</div>}

      {auctions.map(a => (
        <div key={a._id} className={`${styles.card} ${styles['card_' + a.status]}`}>
          <div className={styles.cardTop}>
            <div>
              <div className={styles.cardTitle}>{a.title}</div>
              {a.description && <div className={styles.cardDesc}>{a.description}</div>}
            </div>
            <span className={`${styles.statusBadge} ${styles['status_' + a.status]}`}>{statusLabel(a.status)}</span>
          </div>

          <div className={styles.priceRow}>
            <div className={styles.priceBox}>
              <div className={styles.priceLabel}>מחיר נוכחי</div>
              <div className={styles.priceValue}>₪{a.currentPrice.toLocaleString()}</div>
            </div>
            <div className={styles.priceBox}>
              <div className={styles.priceLabel}>{a.status === 'ended' ? 'זוכה' : 'זמן שנותר'}</div>
              <div className={styles.priceValue}>{a.status === 'ended' ? (a.winner || 'אין הצעות') : <Countdown endTime={a.endTime} />}</div>
            </div>
            <div className={styles.priceBox}>
              <div className={styles.priceLabel}>הצעות</div>
              <div className={styles.priceValue}>{a.bids.length}</div>
            </div>
          </div>

          {a.bids.length > 0 && (
            <div className={styles.bidsList}>
              <div className={styles.bidsTitle}>הצעות אחרונות</div>
              {[...a.bids].reverse().slice(0, 3).map((b, i) => (
                <div key={i} className={styles.bidRow}>
                  <span className={styles.bidName}>{b.memberName}</span>
                  <span className={styles.bidAmount}>₪{b.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.cardActions}>
            <div className={styles.timeRange}>
              {new Date(a.startTime).toLocaleDateString('he-IL')} — {new Date(a.endTime).toLocaleDateString('he-IL')}
            </div>
            <button className={styles.deleteBtn} onClick={() => deleteMutation.mutate(a._id)}>מחק</button>
          </div>
        </div>
      ))}

      {showForm && (
        <div className={styles.modalBg} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHandle} />
            <h3 className={styles.modalTitle}>התמחרות חדשה</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.field}><label>פריט / כותרת</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="עלייה לתורה, שליח ציבור..." required /></div>
              <div className={styles.field}><label>תיאור (אופציונלי)</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="פרטים נוספים..." /></div>
              <div className={styles.field}><label>מחיר מינימום (₪)</label><input type="number" min="0" value={form.startPrice} onChange={e => setForm(f => ({ ...f, startPrice: e.target.value }))} placeholder="0" /></div>
              <div className={styles.fieldRow}>
                <div className={styles.field}><label>זמן התחלה</label><input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required /></div>
                <div className={styles.field}><label>זמן סיום</label><input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required /></div>
              </div>
              <button className={styles.submitBtn} type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'פותח...' : 'פתח התמחרות'}
              </button>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>ביטול</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MEMBER VIEW ───────────────────────────────────────────────────────────────
function MemberAuctions({ synagogue, memberName }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [bidAmounts, setBidAmounts] = useState({});

  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ['auctions-member', synagogue?._id],
    queryFn: () => api.get('/auctions', { params: { synagogueId: synagogue?._id } }).then(r => r.data),
    enabled: !!synagogue?._id,
    refetchInterval: 10000,
  });

  const bidMutation = useMutation({
    mutationFn: ({ id, amount }) => api.post(`/auctions/${id}/bid`, { memberName, amount }),
    onSuccess: () => { qc.invalidateQueries(['auctions-member']); toast.success('הצעה הוגשה ✓'); },
    onError: err => toast.error(err.response?.data?.message || 'שגיאה'),
  });

  const active = auctions.filter(a => a.status === 'active');
  const ended  = auctions.filter(a => a.status === 'ended');
  const pending = auctions.filter(a => a.status === 'pending');

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← חזרה</button>
        <h2 className={styles.title}>התמחרויות</h2>
      </div>

      {isLoading && <div className={styles.empty}>טוען...</div>}
      {!isLoading && auctions.length === 0 && <div className={styles.empty}>אין התמחרויות כרגע</div>}

      {active.length > 0 && <div className={styles.sectionLabel}>פעילות עכשיו</div>}
      {active.map(a => (
        <div key={a._id} className={`${styles.card} ${styles.card_active}`}>
          <div className={styles.cardTop}>
            <div>
              <div className={styles.cardTitle}>{a.title}</div>
              {a.description && <div className={styles.cardDesc}>{a.description}</div>}
            </div>
            <div className={styles.timeLeft}><Countdown endTime={a.endTime} /></div>
          </div>

          <div className={styles.currentBid}>
            <div className={styles.currentBidLabel}>המחיר הנוכחי</div>
            <div className={styles.currentBidValue}>₪{a.currentPrice.toLocaleString()}</div>
            {a.bids.length > 0 && (
              <div className={styles.currentBidWho}>מוביל: {[...a.bids].reduce((m, b) => b.amount > m.amount ? b : m).memberName}</div>
            )}
          </div>

          <div className={styles.bidInput}>
            <input
              type="number"
              min={a.currentPrice + 1}
              placeholder={`מינימום ₪${a.currentPrice + 1}`}
              value={bidAmounts[a._id] || ''}
              onChange={e => setBidAmounts(prev => ({ ...prev, [a._id]: e.target.value }))}
            />
            <button
              className={styles.bidBtn}
              onClick={() => { const amt = Number(bidAmounts[a._id]); if (!amt) return; bidMutation.mutate({ id: a._id, amount: amt }); setBidAmounts(prev => ({ ...prev, [a._id]: '' })); }}
              disabled={bidMutation.isPending}
            >
              הצע
            </button>
          </div>
        </div>
      ))}

      {pending.length > 0 && <div className={styles.sectionLabel}>עומדות להתחיל</div>}
      {pending.map(a => (
        <div key={a._id} className={`${styles.card} ${styles.card_pending}`}>
          <div className={styles.cardTitle}>{a.title}</div>
          <div className={styles.cardDesc}>מתחיל ב-{new Date(a.startTime).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}</div>
          <div className={styles.cardDesc}>מחיר פתיחה: ₪{a.startPrice.toLocaleString()}</div>
        </div>
      ))}

      {ended.length > 0 && <div className={styles.sectionLabel}>הסתיימו</div>}
      {ended.map(a => (
        <div key={a._id} className={`${styles.card} ${styles.card_ended}`}>
          <div className={styles.cardTop}>
            <div className={styles.cardTitle}>{a.title}</div>
            <span className={`${styles.statusBadge} ${styles.status_ended}`}>הסתיים</span>
          </div>
          <div className={styles.priceRow}>
            <div className={styles.priceBox}>
              <div className={styles.priceLabel}>מחיר סופי</div>
              <div className={styles.priceValue}>₪{a.currentPrice.toLocaleString()}</div>
            </div>
            <div className={styles.priceBox}>
              <div className={styles.priceLabel}>זוכה</div>
              <div className={styles.priceValue}>{a.winner || 'אין הצעות'}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export default function AuctionPage() {
  const { gabai, memberName, memberSynagogue } = useAuth();
  const navigate = useNavigate();

  if (gabai) {
    return <GabaiAuctions synagogue={gabai.synagogue} />;
  }

  const synagogue = memberSynagogue || JSON.parse(sessionStorage.getItem('member_synagogue') || 'null');
  const name = memberName || sessionStorage.getItem('member_name') || '';

  if (!name || !synagogue) {
    navigate('/member');
    return null;
  }

  return <MemberAuctions synagogue={synagogue} memberName={name} />;
}
