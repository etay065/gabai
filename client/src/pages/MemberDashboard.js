import React, { useState, useMemo } from 'react';
import { HDate, HebrewCalendar, months } from '@hebcal/core';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Card, Badge, Button, Select, Textarea, Loader, EmptyState } from '../components/UI';
import styles from './MemberDashboard.module.css';

const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
const PARASHA = {'2025-05-03':'אחרי מות-קדושים','2025-05-10':'אמור','2025-05-17':'בהר-בחוקותי','2025-05-24':'במדבר','2025-06-07':'נשא','2025-06-14':'בהעלותך','2025-06-21':'שלח','2025-06-28':'קרח','2025-07-05':'חוקת','2025-07-12':'בלק','2025-07-19':'פינחס','2025-07-26':'מטות-מסעי','2025-08-02':'דברים','2025-08-09':'ואתחנן','2025-08-16':'עקב','2025-08-23':'ראה','2025-08-30':'שופטים','2025-09-06':'כי תצא','2025-09-13':'כי תבוא','2025-09-20':'נצבים-וילך','2025-10-18':'בראשית','2025-10-25':'נח','2025-11-01':'לך לך','2025-11-08':'וירא','2025-11-15':'חיי שרה','2025-11-22':'תולדות','2025-11-29':'ויצא','2025-12-06':'וישלח','2025-12-13':'וישב','2025-12-20':'מקץ','2025-12-27':'ויגש','2026-01-03':'ויחי','2026-01-10':'שמות','2026-01-17':'וארא','2026-01-24':'בא','2026-01-31':'בשלח','2026-02-07':'יתרו','2026-02-14':'משפטים','2026-02-21':'תרומה','2026-02-28':'תצוה','2026-03-07':'כי תשא','2026-03-14':'ויקהל','2026-03-21':'פקודי','2026-03-28':'ויקרא','2026-04-04':'צו','2026-04-25':'שמיני','2026-05-02':'תזריע-מצורע','2026-05-09':'אחרי מות-קדושים','2026-05-16':'אמור','2026-05-23':'בהר-בחוקותי','2026-05-30':'במדבר','2026-06-13':'נשא','2026-06-20':'בהעלותך','2026-06-27':'שלח','2026-07-04':'קרח','2026-07-11':'חוקת-בלק','2026-07-18':'פינחס','2026-07-25':'מטות-מסעי','2026-08-01':'דברים'};
const HOLIDAYS = {'2025-04-14':'פסח','2025-04-15':'פסח','2025-04-20':'פסח','2025-04-21':'פסח','2025-05-02':'יום העצמאות','2025-06-02':'שבועות','2025-06-03':'שבועות','2025-09-22':'ראש השנה','2025-09-23':'ראש השנה','2025-10-01':'יום כיפור','2025-10-06':'סוכות','2025-10-07':'סוכות','2025-10-14':'שמיני עצרת','2025-10-15':'שמחת תורה','2025-12-14':'חנוכה','2025-12-15':'חנוכה','2025-12-16':'חנוכה','2025-12-17':'חנוכה','2025-12-18':'חנוכה','2025-12-19':'חנוכה','2025-12-20':'חנוכה','2025-12-21':'חנוכה','2026-03-03':'פורים','2026-04-02':'פסח','2026-04-03':'פסח','2026-05-19':'שבועות','2026-05-20':'שבועות'};
const HEB_NUMS = ['','א\'','ב\'','ג\'','ד\'','ה\'','ו\'','ז\'','ח\'','ט\'','י\'','י"א','י"ב','י"ג','י"ד','ט"ו','ט"ז','י"ז','י"ח','י"ט','כ\'','כ"א','כ"ב','כ"ג','כ"ד','כ"ה','כ"ו','כ"ז','כ"ח','כ"ט','ל\''];
const GREG_MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const DAYS_HEADER = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

function toKey(d) {
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+day;
}

function getHebDay(date) {
  const hd = new HDate(date);
  return { year: hd.getFullYear(), month: hd.getMonth(), day: hd.getDate(), hdate: hd };
}
const HEB_MONTH_NAMES = ['','ניסן','אייר','סיון','תמוז','אב','אלול','תשרי','חשון','כסלו','טבת','שבט','אדר','אדר ב׳','אדר א׳'];
function getHebMonthName(hd) {
  const m = hd.getMonth();
  const y = hd.getFullYear();
  if (m === months.ADAR_I) return 'אדר א׳';
  if (m === months.ADAR_II) return 'אדר ב׳';
  return HEB_MONTH_NAMES[m] || '';
}

function getCalDays(year,month){
  const first=new Date(year,month,1),last=new Date(year,month+1,0),days=[];
  for(let i=0;i<first.getDay();i++)days.push({date:new Date(year,month,-first.getDay()+i+1),cur:false});
  for(let d=1;d<=last.getDate();d++)days.push({date:new Date(year,month,d),cur:true});
  const rem=42-days.length;
  for(let i=1;i<=rem;i++)days.push({date:new Date(year,month+1,i),cur:false});
  return days;
}

function MiniCalendar({selectedDate, onSelectDate, minDate, maxDate}) {
  const today=new Date(); today.setHours(0,0,0,0);
  const [vy,setVy]=useState(today.getFullYear());
  const [vm,setVm]=useState(today.getMonth());
  const days=useMemo(()=>getCalDays(vy,vm),[vy,vm]);
  const minD=minDate||today;
  const maxD=maxDate||new Date(today.getFullYear()+1,today.getMonth(),today.getDate());
  const canBack=!(vy===minD.getFullYear()&&vm===minD.getMonth());
  const canFwd=!(vy===maxD.getFullYear()&&vm===maxD.getMonth());
  const goBack=()=>{if(vm===0){setVm(11);setVy(y=>y-1);}else setVm(m=>m-1);};
  const goFwd=()=>{if(vm===11){setVm(0);setVy(y=>y+1);}else setVm(m=>m+1);};
  const mid=new Date(vy,vm,15),mh=getHebDay(mid);
  const hebMonthStr = getHebMonthName(mh.hdate);
  return (
    <div style={{border:'1px solid var(--clr-border)',borderRadius:'var(--radius-lg)',overflow:'hidden',marginBottom:'1rem',direction:'rtl'}}>
      <div style={{background:'var(--navy-800)',padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <button onClick={goFwd} disabled={!canFwd} style={{width:28,height:28,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.2)',background:'transparent',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{'>'}</button>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{GREG_MONTHS_HE[vm]} {vy}</div>
          <div style={{fontSize:10,color:'var(--navy-300)'}}>{hebMonthStr} {mh.year}</div>
        </div>
        <button onClick={goBack} disabled={!canBack} style={{width:28,height:28,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.2)',background:'transparent',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{'<'}</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderRight:'1px solid var(--clr-border)',borderTop:'1px solid var(--clr-border)'}}>
        {DAYS_HEADER.map(d=>(
          <div key={d} style={{padding:'5px 2px',textAlign:'center',fontSize:10,fontWeight:700,color:d==='שבת'?'var(--navy-600)':'var(--clr-text2)',background:d==='שבת'?'var(--navy-50)':'var(--clr-bg2)',borderLeft:'1px solid var(--clr-border)',borderBottom:'1px solid var(--clr-border)'}}>{d}</div>
        ))}
        {days.map((item,i)=>{
          const {date,cur}=item,key=toKey(date);
          const disabled=!cur||date<minD||date>maxD;
          const selected=selectedDate&&toKey(selectedDate)===key;
          const isToday=key===toKey(today),isSat=date.getDay()===6;
          const parasha=isSat?PARASHA[key]:null,holiday=HOLIDAYS[key];
          const heb=cur?getHebDay(date):null,hebNum=heb?HEB_NUMS[heb.day]||heb.day:'';
          let bg='var(--clr-bg)';
          if(!cur)bg='var(--clr-bg2)';
          else if(selected)bg='var(--navy-100)';
          else if(isSat)bg='#F5F3FF';
          else if(holiday)bg='#FFF8E6';
          return(
            <div key={i} onClick={()=>{if(!disabled&&cur)onSelectDate(date);}}
              style={{minHeight:58,padding:'4px 4px 3px',borderLeft:'1px solid var(--clr-border)',borderBottom:'1px solid var(--clr-border)',cursor:disabled?'not-allowed':'pointer',background:bg,outline:selected?'2px solid var(--navy-600)':'none',outlineOffset:selected?'-2px':'0',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:1}}>
              <div style={{display:'flex',justifyContent:'space-between',width:'100%',alignItems:'flex-start'}}>
                <span style={{fontSize:9,color:'var(--clr-text3)',lineHeight:1.4}}>{cur?hebNum:''}</span>
                <span style={{fontSize:13,fontWeight:600,background:isToday&&!selected?'var(--navy-700)':'transparent',color:!cur?'var(--clr-border2)':isToday&&!selected?'#fff':isSat?'var(--navy-700)':'var(--clr-text)',width:isToday?20:undefined,height:isToday?20:undefined,borderRadius:isToday?'50%':undefined,display:'flex',alignItems:'center',justifyContent:'center'}}>{date.getDate()}</span>
              </div>
              {parasha&&cur&&<span style={{fontSize:'8px',color:'var(--navy-600)',fontWeight:700,textAlign:'right',width:'100%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{parasha}</span>}
              {holiday&&cur&&<span style={{fontSize:'8px',color:'#8B6914',fontWeight:700,textAlign:'right',width:'100%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{holiday}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
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
    onSuccess: () => { qc.invalidateQueries(['myRequests']); setShowCal(false); setSelectedDate(null); setForm({ type: 'תפילה', sub: 'שחרית', reason: '' }); toast.success('הבקשה נשלחה לגבאי'); },
    onError: err => toast.error(err.response?.data?.message || 'שגיאה בשליחה'),
  });
  if (!name || !synagogue) { navigate('/member'); return null; }
  const handleSubmit = e => {
    e.preventDefault();
    if (!selectedDate) { toast.error('יש לבחור תאריך'); return; }
    const key = toKey(selectedDate);
    submitMutation.mutate({ ...form, memberName: name, synagogueId: synagogue._id, day: selectedDate.getDay(), shabbatLabel: PARASHA[key] || HOLIDAYS[key] || '', requestDate: key });
  };
  const statusLabel = s => ({ pending: 'ממתין לאישור', approved: 'אושר', declined: 'נדחה' })[s] || s;
  const selKey = selectedDate ? toKey(selectedDate) : null;
  const isSaturday = selectedDate?.getDay() === 6;
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.avatar}>{name.charAt(0)}</div>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>Gab-AI</div>
          <div className={styles.headerSub}>שלום, {name} - {synagogue.name}</div>
        </div>
        <button className={styles.auctionBtn} onClick={() => navigate('/auctions')}>🏷️</button>
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
        <button className={styles.newBtn} onClick={() => setShowCal(true)}>+ בקשה חדשה</button>
        <div className={styles.sectionLabel}>הבקשות שלי</div>
        {isLoading && <Loader />}
        {!isLoading && myRequests?.length === 0 && (<EmptyState text="טרם הגשת בקשות" />)}
        {myRequests?.map(r => (
          <Card key={r._id}>
            <div className={styles.reqRow}>
              <div>
                <div className={styles.reqDay}>{r.shabbatLabel ? DAYS[r.day] + ' - ' + r.shabbatLabel : DAYS[r.day]}</div>
                <div className={styles.reqTime}>{r.requestDate ? new Date(r.requestDate + 'T12:00:00').toLocaleDateString('he-IL', { dateStyle: 'medium' }) : new Date(r.createdAt).toLocaleDateString('he-IL', { dateStyle: 'medium' })}</div>
              </div>
              <Badge variant={r.status}>{statusLabel(r.status)}</Badge>
            </div>
            <Badge variant={r.type === 'תפילה' ? 'tefila' : r.type === 'קריאת תורה' ? 'torah' : 'darshan'}>{r.type} - {r.sub}</Badge>
            {r.reason && <p className={styles.reason}>{r.reason}</p>}
          </Card>
        ))}
      </main>
      {showCal && (
        <div className={styles.modalBg} onClick={() => setShowCal(false)}>
          <div className={styles.modalSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHandle} />
            <h3 className={styles.modalTitle}>בקשה חדשה</h3>
            <p className={styles.modalSub}>{synagogue.name} - בחר תאריך</p>
            <MiniCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} minDate={today} maxDate={maxDate} />
            {selectedDate && (
              <div className={styles.selectedInfo}>
                <div className={styles.selectedDate}>📅 {selectedDate.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                {selKey && PARASHA[selKey] && <div className={styles.selectedExtra}>פרשת {PARASHA[selKey]}</div>}
                {selKey && HOLIDAYS[selKey] && <div className={styles.selectedExtra}>🎉 {HOLIDAYS[selKey]}</div>}
              </div>
            )}
            {selectedDate && (
              <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--clr-text2)', marginBottom: 6 }}>סוג בקשה</label>
                  <div className={styles.typeGrid}>
                    {['תפילה', 'קריאת תורה', 'דרשן'].map(t => (
                      <button key={t} type="button"
                        className={styles.typeOpt + ' ' + (form.type === t ? styles.typeOptSel : '')}
                        onClick={() => setForm(f => ({ ...f, type: t, sub: t === 'תפילה' ? 'שחרית' : t === 'קריאת תורה' ? 'כהן ראשון' : 'דרשה' }))}>
                        <span className={styles.typeOptIcon}>{t === 'תפילה' ? '🕯️' : t === 'קריאת תורה' ? '📖' : '🎤'}</span>{t}
                      </button>
                    ))}
                  </div>
                </div>
                {form.type === 'תפילה' ? (
                  <Select label="איזו תפילה?" value={form.sub} onChange={e => setForm(f => ({ ...f, sub: e.target.value }))}>
                    {(isSaturday ? ['שחרית', 'מוסף', 'מנחה', 'מעריב'] : selectedDate?.getDay() === 5 ? ['שחרית', 'מנחה', 'קבלת שבת', 'מעריב'] : ['שחרית', 'מנחה', 'מעריב']).map(p => <option key={p}>{p}</option>)}
                  </Select>
                ) : form.type === 'קריאת תורה' ? (
                  <Select label="עלייה לתורה" value={form.sub} onChange={e => setForm(f => ({ ...f, sub: e.target.value }))}>
                    {['כהן ראשון', 'לוי שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי', 'מפטיר'].map(a => <option key={a}>{a}</option>)}
                  </Select>
                ) : (
                  <Select label="סוג הדרשה" value={form.sub} onChange={e => setForm(f => ({ ...f, sub: e.target.value }))}>
                    {['דרשה', 'שיעור תורה', 'הספד', 'דברי תורה קצרים'].map(d => <option key={d}>{d}</option>)}
                  </Select>
                )}
                <Textarea label="סיבה (אופציונלי)" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="יאהרצייט, בר מצווה, שמחה..." rows={2} />
                <Button type="submit" disabled={submitMutation.isPending}>{submitMutation.isPending ? 'שולח...' : 'שלח בקשה'}</Button>
              </form>
            )}
            <Button variant="secondary" onClick={() => setShowCal(false)} style={{ marginTop: 10 }}>ביטול</Button>
          </div>
        </div>
      )}
    </div>
  );
}
