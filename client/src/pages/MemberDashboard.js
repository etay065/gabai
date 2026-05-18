import React, { useState, useMemo, useEffect } from 'react';
import { HDate, HebrewCalendar, months, Sedra, ParshaEvent, greg } from '@hebcal/core';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Card, Badge, Button, Select, Textarea, Loader, EmptyState } from '../components/UI';
import { useLang } from '../i18n/LanguageContext';
import styles from './MemberDashboard.module.css';

const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
function getParasha(date) {
  try {
    const hd = new HDate(date);
    const sedra = new Sedra(hd.getFullYear(), true);
    const abs = HDate.hebrew2abs(hd.getFullYear(), hd.getMonth(), hd.getDate());
    const parsha = sedra.lookup(abs);
    if (parsha && parsha.chag === false) {
      const names = parsha.parsha;
      const hebrewNames = {
        'Bereshit':'בראשית','Noach':'נח','Lech-Lecha':'לך לך','Vayera':'וירא',
        'Chayei Sara':'חיי שרה','Toldot':'תולדות','Vayetzei':'ויצא','Vayishlach':'וישלח',
        'Vayeshev':'וישב','Miketz':'מקץ','Vayigash':'ויגש','Vayechi':'ויחי',
        'Shemot':'שמות','Vaera':'וארא','Bo':'בא','Beshalach':'בשלח',
        'Yitro':'יתרו','Mishpatim':'משפטים','Terumah':'תרומה','Tetzaveh':'תצוה',
        'Ki Tisa':'כי תשא','Vayakhel':'ויקהל','Pekudei':'פקודי','Vayakhel-Pekudei':'ויקהל-פקודי',
        'Vayikra':'ויקרא','Tzav':'צו','Shmini':'שמיני','Tazria':'תזריע',
        'Metzora':'מצורע','Tazria-Metzora':'תזריע-מצורע','Achrei Mot':'אחרי מות',
        'Kedoshim':'קדושים','Achrei Mot-Kedoshim':'אחרי מות-קדושים',
        'Emor':'אמור','Behar':'בהר','Bechukotai':'בחוקותי','Behar-Bechukotai':'בהר-בחוקותי',
        'Bamidbar':'במדבר','Nasso':'נשא',"Beha'alotcha":'בהעלותך','Shelach':'שלח',
        'Korach':'קרח','Chukat':'חוקת','Balak':'בלק','Chukat-Balak':'חוקת-בלק',
        'Pinchas':'פינחס','Matot':'מטות','Masei':'מסעי','Matot-Masei':'מטות-מסעי',
        'Devarim':'דברים','Vaetchanan':'ואתחנן','Eikev':'עקב','Reeh':'ראה',
        'Shoftim':'שופטים','Ki Teitzei':'כי תצא','Ki Tavo':'כי תבוא',
        'Nitzavim':'נצבים','Vayeilech':'וילך','Nitzavim-Vayeilech':'נצבים-וילך',
        "Ha'Azinu":'האזינו','Vezot Haberakhah':'וזאת הברכה',
      };
      return names.map(n => hebrewNames[n] || n).join('-');
    }
    return null;
  } catch(e) { return null; }
}
const HOLIDAYS = {
  // === 5785 (2024-2025) ===
  '2024-10-02':'ערב ראש השנה','2024-10-03':'ראש השנה','2024-10-04':'ראש השנה',
  '2024-10-11':'ערב יום כיפור','2024-10-12':'יום כיפור',
  '2024-10-16':'ערב סוכות','2024-10-17':'סוכות','2024-10-18':'חול המועד סוכות',
  '2024-10-19':'חול המועד סוכות','2024-10-20':'חול המועד סוכות','2024-10-21':'חול המועד סוכות',
  '2024-10-23':'הושענא רבה','2024-10-24':'שמיני עצרת ושמחת תורה',
  '2024-12-25':'חנוכה','2024-12-26':'חנוכה','2024-12-27':'חנוכה','2024-12-28':'חנוכה',
  '2024-12-29':'חנוכה','2024-12-30':'חנוכה','2024-12-31':'חנוכה','2025-01-01':'חנוכה',
  '2025-01-13':'עשרה בטבת',
  '2025-02-13':'ט"ו בשבט',
  '2025-03-13':'תענית אסתר','2025-03-14':'פורים','2025-03-15':'שושן פורים',
  '2025-04-12':'ערב פסח',
  '2025-04-13':'פסח','2025-04-14':'פסח',
  '2025-04-15':'חול המועד פסח','2025-04-16':'חול המועד פסח',
  '2025-04-17':'חול המועד פסח','2025-04-18':'חול המועד פסח',
  '2025-04-19':'פסח','2025-04-20':'פסח',
  '2025-04-24':'יום השואה','2025-05-01':'יום הזיכרון','2025-05-02':'יום העצמאות',
  '2025-05-12':'פסח שני','2025-05-22':'ל"ג בעומר',
  '2025-06-01':'ערב שבועות','2025-06-02':'שבועות',
  '2025-07-13':'י"ז בתמוז','2025-08-03':'תשעה באב',
  // === 5786 (2025-2026) ===
  '2025-09-21':'ערב ראש השנה','2025-09-22':'ראש השנה','2025-09-23':'ראש השנה',
  '2025-09-24':'צום גדליה',
  '2025-09-30':'ערב יום כיפור','2025-10-01':'יום כיפור',
  '2025-10-05':'ערב סוכות','2025-10-06':'סוכות','2025-10-07':'סוכות',
  '2025-10-08':'חול המועד סוכות','2025-10-09':'חול המועד סוכות',
  '2025-10-10':'חול המועד סוכות','2025-10-11':'חול המועד סוכות',
  '2025-10-12':'הושענא רבה','2025-10-13':'שמיני עצרת ושמחת תורה',
  '2025-12-14':'חנוכה','2025-12-15':'חנוכה','2025-12-16':'חנוכה','2025-12-17':'חנוכה',
  '2025-12-18':'חנוכה','2025-12-19':'חנוכה','2025-12-20':'חנוכה','2025-12-21':'חנוכה',
  '2026-01-01':'עשרה בטבת',
  '2026-02-02':'ט"ו בשבט',
  '2026-03-02':'תענית אסתר','2026-03-03':'פורים','2026-03-04':'שושן פורים',
  '2026-04-01':'ערב פסח',
  '2026-04-02':'פסח','2026-04-03':'פסח',
  '2026-04-04':'חול המועד פסח','2026-04-05':'חול המועד פסח',
  '2026-04-06':'חול המועד פסח','2026-04-07':'חול המועד פסח',
  '2026-04-08':'פסח','2026-04-09':'פסח',
  '2026-04-16':'יום השואה','2026-04-22':'יום הזיכרון','2026-04-23':'יום העצמאות',
  '2026-04-30':'פסח שני','2026-05-11':'ל"ג בעומר',
  '2026-05-21':'ערב שבועות','2026-05-22':'שבועות',
  '2026-07-02':'י"ז בתמוז','2026-07-23':'תשעה באב',
  // === 5787 (2026-2027) ===
  '2026-09-11':'ערב ראש השנה','2026-09-12':'ראש השנה','2026-09-13':'ראש השנה',
  '2026-09-14':'צום גדליה',
  '2026-09-20':'ערב יום כיפור','2026-09-21':'יום כיפור',
  '2026-09-25':'ערב סוכות','2026-09-26':'סוכות','2026-09-27':'סוכות',
  '2026-09-28':'חול המועד סוכות','2026-09-29':'חול המועד סוכות',
  '2026-09-30':'חול המועד סוכות','2026-10-01':'חול המועד סוכות',
  '2026-10-02':'הושענא רבה','2026-10-03':'שמיני עצרת ושמחת תורה',
  '2026-12-03':'ערב חנוכה','2026-12-04':'חנוכה','2026-12-05':'חנוכה','2026-12-06':'חנוכה',
  '2026-12-07':'חנוכה','2026-12-08':'חנוכה','2026-12-09':'חנוכה',
  '2026-12-10':'חנוכה','2026-12-11':'חנוכה',
  '2026-12-21':'עשרה בטבת',
  '2027-01-22':'ט"ו בשבט',
  '2027-03-22':'פורים','2027-03-23':'שושן פורים',
  '2027-04-20':'ערב פסח',
  '2027-04-21':'פסח','2027-04-22':'פסח',
  '2027-04-23':'חול המועד פסח','2027-04-24':'חול המועד פסח',
  '2027-04-25':'חול המועד פסח','2027-04-26':'חול המועד פסח',
  '2027-04-27':'פסח','2027-04-28':'פסח',
  '2027-05-06':'יום השואה','2027-05-12':'יום הזיכרון','2027-05-13':'יום העצמאות',
  '2027-05-20':'פסח שני','2027-05-30':'ל"ג בעומר',
  '2027-06-10':'ערב שבועות','2027-06-11':'שבועות',
  '2027-07-22':'י"ז בתמוז','2027-08-12':'תשעה באב',
  // === 5788 (2027-2028) ===
  '2027-09-30':'ערב ראש השנה','2027-10-01':'ראש השנה','2027-10-02':'ראש השנה',
  '2027-10-10':'ערב יום כיפור','2027-10-11':'יום כיפור',
  '2027-10-15':'ערב סוכות','2027-10-16':'סוכות','2027-10-17':'סוכות',
  '2027-10-18':'חול המועד סוכות','2027-10-19':'חול המועד סוכות',
  '2027-10-20':'חול המועד סוכות','2027-10-21':'חול המועד סוכות',
  '2027-10-22':'הושענא רבה','2027-10-23':'שמיני עצרת ושמחת תורה',
  '2027-12-24':'חנוכה','2027-12-25':'חנוכה','2027-12-26':'חנוכה','2027-12-27':'חנוכה',
  '2027-12-28':'חנוכה','2027-12-29':'חנוכה','2027-12-30':'חנוכה','2027-12-31':'חנוכה',
};
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
  const maxD=maxDate||new Date(today.getFullYear()+3,today.getMonth(),today.getDate());
  const canBack=!(vy===minD.getFullYear()&&vm===minD.getMonth());
  const canFwd=!(vy===maxD.getFullYear()&&vm===maxD.getMonth());
  const goBack=()=>{if(vm===0){setVm(11);setVy(y=>y-1);}else setVm(m=>m-1);};
  const goFwd=()=>{if(vm===11){setVm(0);setVy(y=>y+1);}else setVm(m=>m+1);};
  const mid=new Date(vy,vm,15),mh=getHebDay(mid);
  // Get Hebrew months at start and end of Gregorian month
  const firstDay = new Date(vy, vm, 1);
  const lastDay = new Date(vy, vm + 1, 0);
  const hFirst = getHebDay(firstDay);
  const hLast = getHebDay(lastDay);
  const firstMonthStr = getHebMonthName(hFirst.hdate);
  const lastMonthStr = getHebMonthName(hLast.hdate);
  const hebMonthStr = firstMonthStr === lastMonthStr
    ? `${firstMonthStr} ${hFirst.year}`
    : `${lastMonthStr}-${firstMonthStr} ${hLast.year}`;
  return (
    <div style={{border:'1px solid var(--clr-border)',borderRadius:'var(--radius-lg)',overflow:'hidden',marginBottom:'1rem',direction:'rtl'}}>
      <div style={{background:'var(--navy-800)',padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <button onClick={goBack} disabled={!canBack} style={{width:28,height:28,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.2)',background:'transparent',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{'>'}</button>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{GREG_MONTHS_HE[vm]} {vy}</div>
          <div style={{fontSize:10,color:'var(--navy-300)'}}>{hebMonthStr} {mh.year}</div>
        </div>
        <button onClick={goFwd} disabled={!canFwd} style={{width:28,height:28,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.2)',background:'transparent',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{'<'}</button>
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
          const parasha=isSat?getParasha(date):null,holiday=HOLIDAYS[key];
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
  const [availability, setAvailability] = useState([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const { t, lang, toggleLang } = useLang();
  const synagogue = memberSynagogue || JSON.parse(sessionStorage.getItem('member_synagogue') || 'null');
  const name = memberName || sessionStorage.getItem('member_name') || '';
  const today = new Date(); today.setHours(0,0,0,0);
  const maxDate = new Date(today); maxDate.setFullYear(maxDate.getFullYear() + 3);
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
  useEffect(() => {
    if (!selectedDate || !synagogue?._id) { setAvailability([]); return; }
    setLoadingAvail(true);
    api.get('/schedule/availability', { params: { synagogueId: synagogue._id, date: toKey(selectedDate) } })
      .then(r => setAvailability(r.data.slots || []))
      .catch(() => setAvailability([]))
      .finally(() => setLoadingAvail(false));
  }, [selectedDate, synagogue?._id]);

  if (!name || !synagogue) { navigate('/member'); return null; }
  const handleSubmit = e => {
    e.preventDefault();
    if (!selectedDate) { toast.error('יש לבחור תאריך'); return; }
    const key = toKey(selectedDate);
    submitMutation.mutate({ ...form, memberName: name, synagogueId: synagogue._id, day: selectedDate.getDay(), shabbatLabel: getParasha(selectedDate) || HOLIDAYS[key] || '', requestDate: key });
  };
  const statusLabel = s => ({ pending: 'ממתין לאישור', approved: 'אושר', declined: 'נדחה' })[s] || s;
  const selKey = selectedDate ? toKey(selectedDate) : null;
  const isSaturday = selectedDate?.getDay() === 6;
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <img src="/logo-transparent.png" alt="logo" style={{width:44,height:44,objectFit:"contain",marginLeft:6}} />
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>Gab-AI</div>
          <div className={styles.headerSub}>שלום, {name} - {synagogue.name}</div>
        </div>
        <button className={styles.auctionBtn} onClick={() => navigate('/auctions')}>🏷️</button>
        <button className={styles.auctionBtn} onClick={toggleLang}>{lang === 'he' ? 'EN' : 'עב'}</button>
        <button className={styles.backBtn} onClick={() => navigate('/')}>{t('member.exit')}</button>
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
            <Badge variant={r.type === 'תפילה' ? 'tefila' : r.type === 'קריאת תורה' ? 'torah' : r.type === 'תרגום' ? 'targum' : 'darshan'}>{r.type} - {r.sub}</Badge>
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
                {selectedDate && getParasha(selectedDate) && <div className={styles.selectedExtra}>פרשת {getParasha(selectedDate)}</div>}
                {selKey && HOLIDAYS[selKey] && <div className={styles.selectedExtra}>🎉 {HOLIDAYS[selKey]}</div>}
              </div>
            )}
            {selectedDate && availability.length > 0 && (
              <div style={{marginBottom:'1rem'}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--clr-text2)',marginBottom:8}}>זמינות לתאריך זה:</div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {availability.map((slot,i) => (
                    <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',borderRadius:'var(--radius-md)',background:slot.taken?'#FFF0F0':'#F0FFF4',border:`1px solid ${slot.taken?'#FAC0C0':'#B8E6C8'}`}}>
                      <div style={{fontSize:13,fontWeight:600,color:slot.taken?'#C0392B':'#27AE60'}}>
                        {slot.time && <span style={{marginLeft:8,fontSize:11,opacity:0.7}}>{slot.time}</span>}
                        {slot.sub}
                        {slot.label && <span style={{fontSize:11,color:'var(--clr-text2)',marginRight:6}}> · {slot.label}</span>}
                      </div>
                      <div style={{fontSize:12,fontWeight:700,color:slot.taken?'#C0392B':'#27AE60'}}>
                        {slot.taken ? `תפוס${slot.takenBy?' — '+slot.takenBy:''}` : '✓ פנוי'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedDate && (
              <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--clr-text2)', marginBottom: 6 }}>סוג בקשה</label>
                  <div className={styles.typeGrid}>
                    {['תפילה', 'קריאת תורה', 'דרשן', 'תרגום'].map(t => (
                      <button key={t} type="button"
                        className={styles.typeOpt + ' ' + (form.type === t ? styles.typeOptSel : '')}
                        onClick={() => setForm(f => ({ ...f, type: t, sub: t === 'תפילה' ? 'שחרית' : t === 'קריאת תורה' ? 'כהן ראשון' : t === 'דרשן' ? 'דרשה' : 'תרגום ראשון' }))}>
                        <span className={styles.typeOptIcon}>{t === 'תפילה' ? '🕯️' : t === 'קריאת תורה' ? '📖' : t === 'דרשן' ? '🎤' : '📜'}</span>{t}
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
                ) : form.type === 'דרשן' ? (
                  <Select label="סוג הדרשה" value={form.sub} onChange={e => setForm(f => ({ ...f, sub: e.target.value }))}>
                    {['דרשה', 'שיעור תורה', 'הספד', 'דברי תורה קצרים'].map(d => <option key={d}>{d}</option>)}
                  </Select>
                ) : (
                  <Select label="תרגום" value={form.sub} onChange={e => setForm(f => ({ ...f, sub: e.target.value }))}>
                    {['תרגום ראשון', 'תרגום שני', 'תרגום שלישי', 'תרגום רביעי', 'תרגום חמישי', 'תרגום שישי', 'תרגום שביעי', 'תרגום מפטיר'].map(d => <option key={d}>{d}</option>)}
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
