import React, { useState, useMemo } from 'react';
import { HDate, months, Sedra } from '@hebcal/core';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Badge, Card, Button, Loader, EmptyState } from '../components/UI';
import { useLang } from '../i18n/LanguageContext';
import styles from './GabaiDashboard.module.css';

const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

function getParasha(date) {
  try {
    const hd = new HDate(date);
    const sedra = new Sedra(hd.getFullYear(), true);
    const abs = HDate.hebrew2abs(hd.getFullYear(), hd.getMonth(), hd.getDate());
    const parsha = sedra.lookup(abs);
    if (parsha && parsha.chag === false) {
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
      return parsha.parsha.map(n => hebrewNames[n] || n).join('-');
    }
    return null;
  } catch(e) { return null; }
}

const HOLIDAYS = {
  // 5785
  '2024-10-02':'ראש השנה','2024-10-03':'ראש השנה','2024-10-04':'צום גדליה',
  '2024-10-11':'יום כיפור',
  '2024-10-16':'סוכות','2024-10-17':'סוכות','2024-10-18':'חול המועד סוכות',
  '2024-10-19':'חול המועד סוכות','2024-10-20':'חול המועד סוכות','2024-10-21':'חול המועד סוכות',
  '2024-10-23':'הושענא רבה','2024-10-24':'שמיני עצרת','2024-10-25':'שמחת תורה',
  '2024-12-25':'חנוכה','2024-12-26':'חנוכה','2024-12-27':'חנוכה','2024-12-28':'חנוכה',
  '2024-12-29':'חנוכה','2024-12-30':'חנוכה','2024-12-31':'חנוכה','2025-01-01':'חנוכה',
  '2025-01-13':'עשרה בטבת',
  '2025-03-13':'תענית אסתר','2025-03-14':'פורים','2025-03-15':'שושן פורים',
  '2025-04-12':'שבת הגדול','2025-04-13':'ערב פסח',
  '2025-04-14':'פסח','2025-04-15':'פסח',
  '2025-04-16':'חול המועד פסח','2025-04-17':'חול המועד פסח',
  '2025-04-18':'חול המועד פסח','2025-04-19':'חול המועד פסח',
  '2025-04-20':'פסח','2025-04-21':'פסח',
  '2025-04-24':'יום השואה','2025-05-01':'יום הזיכרון','2025-05-02':'יום העצמאות',
  '2025-05-12':'פסח שני','2025-05-22':'ל"ג בעומר',
  '2025-06-01':'ערב שבועות','2025-06-02':'שבועות','2025-06-03':'שבועות',
  '2025-07-13':'י"ז בתמוז','2025-08-03':'תשעה באב',
  // 5786
  '2025-09-22':'ראש השנה','2025-09-23':'ראש השנה','2025-09-24':'צום גדליה',
  '2025-10-01':'יום כיפור',
  '2025-10-06':'סוכות','2025-10-07':'סוכות','2025-10-08':'חול המועד סוכות',
  '2025-10-09':'חול המועד סוכות','2025-10-10':'חול המועד סוכות','2025-10-11':'חול המועד סוכות',
  '2025-10-13':'הושענא רבה','2025-10-14':'שמיני עצרת','2025-10-15':'שמחת תורה',
  '2025-12-14':'חנוכה','2025-12-15':'חנוכה','2025-12-16':'חנוכה','2025-12-17':'חנוכה',
  '2025-12-18':'חנוכה','2025-12-19':'חנוכה','2025-12-20':'חנוכה','2025-12-21':'חנוכה',
  '2026-01-01':'עשרה בטבת',
  '2026-03-02':'תענית אסתר','2026-03-03':'פורים','2026-03-04':'שושן פורים',
  '2026-04-01':'ערב פסח','2026-04-02':'פסח','2026-04-03':'פסח',
  '2026-04-04':'חול המועד פסח','2026-04-05':'חול המועד פסח',
  '2026-04-06':'חול המועד פסח','2026-04-07':'חול המועד פסח',
  '2026-04-08':'פסח','2026-04-09':'פסח',
  '2026-04-12':'יום השואה','2026-04-20':'יום הזיכרון','2026-04-21':'יום העצמאות',
  '2026-05-01':'פסח שני','2026-05-11':'ל"ג בעומר',
  '2026-05-19':'שבועות','2026-05-20':'שבועות',
  '2026-07-02':'י"ז בתמוז','2026-07-23':'תשעה באב',
  // 5787
  '2026-09-11':'ראש השנה','2026-09-12':'ראש השנה','2026-09-13':'צום גדליה',
  '2026-09-20':'יום כיפור',
  '2026-09-25':'סוכות','2026-09-26':'סוכות','2026-09-27':'חול המועד סוכות',
  '2026-09-28':'חול המועד סוכות','2026-09-29':'חול המועד סוכות','2026-09-30':'חול המועד סוכות',
  '2026-10-02':'הושענא רבה','2026-10-03':'שמיני עצרת ושמחת תורה',
  '2027-01-04':'חנוכה','2027-01-05':'חנוכה','2027-01-06':'חנוכה','2027-01-07':'חנוכה',
  '2027-01-08':'חנוכה','2027-01-09':'חנוכה','2027-01-10':'חנוכה','2027-01-11':'חנוכה',
  '2027-03-23':'פורים','2027-03-24':'שושן פורים',
  '2027-04-21':'פסח','2027-04-22':'פסח','2027-04-27':'פסח','2027-04-28':'פסח',
  '2027-06-08':'שבועות','2027-06-09':'שבועות',
}

const HEB_NUMS = ['','א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ז׳','ח׳','ט׳','י׳','י"א','י"ב','י"ג','י"ד','ט"ו','ט"ז','י"ז','י"ח','י"ט','כ׳','כ"א','כ"ב','כ"ג','כ"ד','כ"ה','כ"ו','כ"ז','כ"ח','כ"ט','ל׳'];
const GREG_MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const DAYS_HEADER = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

function toKey(d) {
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+day;
}

function isHebLeap(y){return((7*y)+1)%19<7;}
function getHebDay(date) {
  const hd = new HDate(date);
  return { year: hd.getFullYear(), month: hd.getMonth(), day: hd.getDate(), hdate: hd };
}
function getHebMonthName(hd) {
  const m = hd.getMonth();
  if (m === months.ADAR_I) return 'אדר א׳';
  if (m === months.ADAR_II) return 'אדר ב׳';
  const names = ['','ניסן','אייר','סיון','תמוז','אב','אלול','תשרי','חשון','כסלו','טבת','שבט','אדר'];
  return names[m] || '';
}

function getCalDays(year,month){
  const first=new Date(year,month,1),last=new Date(year,month+1,0),days=[];
  for(let i=0;i<first.getDay();i++)days.push({date:new Date(year,month,-first.getDay()+i+1),cur:false});
  for(let d=1;d<=last.getDate();d++)days.push({date:new Date(year,month,d),cur:true});
  const rem=42-days.length;
  for(let i=1;i<=rem;i++)days.push({date:new Date(year,month+1,i),cur:false});
  return days;
}

function MiniCalendar({selectedDate, onSelectDate, markedDates={}}){
  const today=new Date(); today.setHours(0,0,0,0);
  const minDate=new Date(2020,0,1);
  const maxDate=new Date(today.getFullYear()+1,today.getMonth(),today.getDate());
  const [vy,setVy]=useState(today.getFullYear());
  const [vm,setVm]=useState(today.getMonth());
  const days=useMemo(()=>getCalDays(vy,vm),[vy,vm]);
  const canBack=!(vy===minDate.getFullYear()&&vm===minDate.getMonth());
  const canFwd=!(vy===maxDate.getFullYear()&&vm===maxDate.getMonth());
  const goBack=()=>{if(vm===0){setVm(11);setVy(y=>y-1);}else setVm(m=>m-1);};
  const goFwd=()=>{if(vm===11){setVm(0);setVy(y=>y+1);}else setVm(m=>m+1);};
  const mid=new Date(vy,vm,15),mh=getHebDay(mid);
  const hebMonthStr=getHebMonthName(mh.hdate);

  return(
    <div style={{border:'1px solid var(--clr-border)',borderRadius:'var(--radius-lg)',overflow:'hidden',marginBottom:'1rem',direction:'rtl'}}>
      <div style={{background:'var(--navy-800)',padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <button onClick={goFwd} disabled={!canFwd} style={{width:28,height:28,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.2)',background:'transparent',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{GREG_MONTHS_HE[vm]} {vy}</div>
          <div style={{fontSize:10,color:'var(--navy-300)'}}>{hebMonthStr} {mh.year}</div>
        </div>
        <button onClick={goBack} disabled={!canBack} style={{width:28,height:28,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.2)',background:'transparent',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderRight:'1px solid var(--clr-border)',borderTop:'1px solid var(--clr-border)'}}>
        {DAYS_HEADER.map(d=>(
          <div key={d} style={{padding:'5px 2px',textAlign:'center',fontSize:10,fontWeight:700,color:d==='שבת'?'var(--navy-600)':'var(--clr-text2)',background:d==='שבת'?'var(--navy-50)':'var(--clr-bg2)',borderLeft:'1px solid var(--clr-border)',borderBottom:'1px solid var(--clr-border)'}}>{d}</div>
        ))}
        {days.map((item,i)=>{
          const {date,cur}=item;
          const key=toKey(date);
          const selected=selectedDate&&toKey(selectedDate)===key;
          const isToday=key===toKey(today);
          const isSat=date.getDay()===6;
          const parasha=isSat?getParasha(date):null;
          const holiday=HOLIDAYS[key];
          const marked=markedDates[key];
          const heb=cur?getHebDay(date):null;
          const hebNum=heb?HEB_NUMS[heb.day]||heb.day:'';
          let bg='var(--clr-bg)';
          if(!cur)bg='var(--clr-bg2)';
          else if(selected)bg='var(--navy-100)';
          else if(isSat)bg='#F5F3FF';
          else if(holiday)bg='#FFF8E6';
          return(
            <div key={i} onClick={()=>cur&&onSelectDate(date)}
              style={{minHeight:62,padding:'4px 4px 3px',borderLeft:'1px solid var(--clr-border)',borderBottom:'1px solid var(--clr-border)',cursor:cur?'pointer':'default',background:bg,outline:selected?'2.5px solid var(--navy-600)':'none',outlineOffset:selected?'-2px':'0',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:1,position:'relative'}}>
              <div style={{display:'flex',justifyContent:'space-between',width:'100%',alignItems:'flex-start'}}>
                <span style={{fontSize:9,color:'var(--clr-text3)',lineHeight:1.4}}>{cur?hebNum:''}</span>
                <span style={{fontSize:13,fontWeight:600,background:isToday&&!selected?'var(--navy-700)':'transparent',color:!cur?'var(--clr-border2)':isToday&&!selected?'#fff':isSat?'var(--navy-700)':'var(--clr-text)',width:isToday?20:undefined,height:isToday?20:undefined,borderRadius:isToday?'50%':undefined,display:'flex',alignItems:'center',justifyContent:'center'}}>{date.getDate()}</span>
              </div>
              {parasha&&cur&&<span style={{fontSize:'8px',color:'var(--navy-600)',fontWeight:700,textAlign:'right',width:'100%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{parasha}</span>}
              {holiday&&cur&&<span style={{fontSize:'8px',color:'#8B6914',fontWeight:700,textAlign:'right',width:'100%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{holiday}</span>}
              {marked&&cur&&(
                <span style={{position:'absolute',bottom:3,left:4,fontSize:9,fontWeight:700,minWidth:14,height:14,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px',background:marked.pending>0?'var(--gold-400)':'var(--green-200)',color:marked.pending>0?'var(--navy-900)':'var(--green-700)'}}>
                  {marked.pending>0?marked.pending:'✓'}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div style={{display:'flex',gap:10,padding:'6px 14px',background:'var(--clr-bg2)',borderTop:'1px solid var(--clr-border)',justifyContent:'flex-end',flexWrap:'wrap'}}>
        <span style={{fontSize:10,color:'var(--clr-text2)',display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'#F5F3FF',border:'1px solid var(--navy-200)',display:'inline-block'}}></span>שבת</span>
        <span style={{fontSize:10,color:'var(--clr-text2)',display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:50,background:'var(--gold-400)',display:'inline-block'}}></span>ממתין</span>
        <span style={{fontSize:10,color:'var(--clr-text2)',display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:50,background:'var(--green-200)',display:'inline-block'}}></span>אושר</span>
      </div>
    </div>
  );
}

export default function GabaiDashboard() {
  const { gabai, logoutGabai } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const synagogue = gabai?.synagogue;
  const { t, lang, toggleLang } = useLang();

  const [tab, setTab] = useState('requests');
  const [selectedDate, setSelectedDate] = useState(null);
  const [schedDate, setSchedDate] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editReq, setEditReq] = useState(null);
  const [manualForm, setManualForm] = useState({ memberName: '', requestDate: '', type: 'תפילה', sub: 'שחרית', reason: '', status: 'approved' });

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

  const createMutation = useMutation({
    mutationFn: data => api.post('/requests', data),
    onSuccess: () => { qc.invalidateQueries(['allRequests']); setShowAddForm(false); toast.success('בקשה נוספה'); setManualForm({ memberName: '', requestDate: '', type: 'תפילה', sub: 'שחרית', reason: '', status: 'approved' }); },
    onError: err => toast.error(err.response?.data?.message || 'שגיאה'),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => api.put('/requests/' + id, data),
    onSuccess: () => { qc.invalidateQueries(['allRequests']); setEditReq(null); toast.success('בקשה עודכנה'); },
    onError: () => toast.error('שגיאה בעדכון'),
  });

  const deleteMutation = useMutation({
    mutationFn: id => api.delete('/requests/' + id),
    onSuccess: () => { qc.invalidateQueries(['allRequests']); toast.success('בקשה נמחקה'); },
    onError: () => toast.error('שגיאה במחיקה'),
  });

  const pendingAll = allRequests.filter(r => r.status === 'pending');
  const approved   = allRequests.filter(r => r.status === 'approved').length;

  // סינון בקשות לפי תאריך נבחר
  const filteredReqs = selectedDate
    ? allRequests.filter(r => r.requestDate === toKey(selectedDate))
    : pendingAll;

  // נקודות על הלוח
  const markedDates = allRequests.reduce((acc, r) => {
    if (r.requestDate) {
      if (!acc[r.requestDate]) acc[r.requestDate] = { pending: 0, total: 0 };
      acc[r.requestDate].total++;
      if (r.status === 'pending') acc[r.requestDate].pending++;
    }
    return acc;
  }, {});

  // לוח זמנים — לפי תאריך נבחר
  const schedDay = schedDate ? schedDate.getDay() : null;
  const daySchedule = schedDay !== null ? (scheduleAll.find(s => s.day === schedDay)?.prayers || []) : [];
  const approvedForSchedDate = schedDate
    ? allRequests.filter(r => r.requestDate === toKey(schedDate) && r.status === 'approved')
    : [];

  const statusLabel = s => ({ pending:'ממתין', approved:'אושר ✓', declined:'נדחה' })[s] || s;

  const formatReqDate = r => {
    if (r.requestDate) {
      return new Date(r.requestDate+'T12:00:00').toLocaleDateString('he-IL', { weekday:'long', day:'numeric', month:'long' });
    }
    return DAYS[r.day];
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.avatar}>{gabai?.username?.charAt(0)?.toUpperCase()}</div>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>Gab-AI · לוח הגבאי</div>
          <div className={styles.headerSub}>{synagogue?.name}{synagogue?.parasha ? ` · פרשת ${synagogue.parasha}` : ''}</div>
        </div>
        <div className={styles.headerBtns}>
          <button className={styles.iconBtn} onClick={toggleLang} title="language">{lang === 'he' ? 'EN' : 'עב'}</button>
          <button className={styles.iconBtn} onClick={() => navigate("/members")} title="members">👥</button>
          <button className={styles.iconBtn} onClick={() => navigate("/auctions")} title="auctions">🏷️</button>
          <button className={styles.logoutBtn} onClick={() => { logoutGabai(); navigate('/'); }}>{t('gabai.exit')}</button>
        </div>
      </header>

      <nav className={styles.tabs}>
        {[['requests','בקשות',pendingAll.length],['schedule','לוח זמנים',0],['settings','הגדרות',0]].map(([key,label,cnt]) => (
          <button key={key} className={`${styles.tab} ${tab===key?styles.tabActive:''}`} onClick={() => setTab(key)}>
            {label}{cnt>0&&<span className={styles.tabBadge}>{cnt}</span>}
          </button>
        ))}
      </nav>

      <main className={styles.body}>

        {/* ── REQUESTS ── */}
        {tab === 'requests' && (
          <>
            <div className={styles.metrics}>
              <div className={`${styles.metric} ${styles.metricPending}`}>
                <div className={styles.metricNum}>{pendingAll.length}</div><div className={styles.metricLbl}>ממתינות</div>
              </div>
              <div className={`${styles.metric} ${styles.metricApproved}`}>
                <div className={styles.metricNum}>{approved}</div><div className={styles.metricLbl}>אושרו</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricNum}>{allRequests.length}</div><div className={styles.metricLbl}>סה"כ</div>
              </div>
            </div>

            <MiniCalendar
              selectedDate={selectedDate}
              onSelectDate={d => setSelectedDate(prev => prev && toKey(prev)===toKey(d) ? null : d)}
              markedDates={markedDates}
            />

            <div className={styles.listHeader}>
              {selectedDate ? (
                <>
                  <span className={styles.listTitle}>
                    {selectedDate.toLocaleDateString('he-IL',{weekday:'long',day:'numeric',month:'long'})}
                    {getParasha(selectedDate) ? ` · פרשת ${getParasha(selectedDate)}` : ''}
                  </span>
                  <button className={styles.clearDate} onClick={() => setSelectedDate(null)}>הצג כל הממתינות ✕</button>
                </>
              ) : (
                <span className={styles.listTitle}>כל הבקשות הממתינות</span>
              )}
            </div>

            <button className={styles.addManualBtn} onClick={() => { setManualForm({ memberName: '', requestDate: selectedDate ? toKey(selectedDate) : '', type: 'תפילה', sub: 'שחרית', reason: '', status: 'approved' }); setShowAddForm(true); }}>
              + הוסף בקשה ידנית
            </button>

            {loadingReqs && <Loader />}
            {!loadingReqs && filteredReqs.length === 0 && (
              <EmptyState text={selectedDate ? 'אין בקשות לתאריך זה' : 'אין בקשות ממתינות'} />
            )}

            {filteredReqs.map(r => (
              <Card key={r._id}>
                <div className={styles.reqRow}>
                  <div>
                    <div className={styles.reqNameRow}>
                      {r.status==='pending'&&<span className={styles.dot}/>}
                      <span className={styles.reqName}>{r.memberName}</span>
                    </div>
                    <div className={styles.reqTime}>
                      📅 {formatReqDate(r)}
                      {r.shabbatLabel ? ` · ${r.shabbatLabel}` : ''}
                    </div>
                  </div>
                  <div className={styles.reqActions}>
                    <button className={styles.editBtn} onClick={() => { setEditReq(r); setManualForm({ memberName: r.memberName, requestDate: r.requestDate, type: r.type, sub: r.sub, reason: r.reason||'', status: r.status }); }}>✏️</button>
                    <button className={styles.deleteBtn2} onClick={() => { if(window.confirm('למחוק בקשה זו?')) deleteMutation.mutate(r._id); }}>🗑️</button>
                  </div>
                </div>
                <Badge variant={r.type==='תפילה'?'tefila':'torah'}>{r.type} — {r.sub}</Badge>
                {r.reason && <p className={styles.reason}>{r.reason}</p>}
                <div className={styles.actions}>
                  {r.status==='pending' ? (
                    <>
                      <Button variant="approve" onClick={() => statusMutation.mutate({id:r._id,status:'approved'})}>✓ אישור</Button>
                      <Button variant="decline" onClick={() => statusMutation.mutate({id:r._id,status:'declined'})}>✕ דחייה</Button>
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
            <MiniCalendar
              selectedDate={schedDate}
              onSelectDate={d => setSchedDate(prev => prev && toKey(prev)===toKey(d) ? null : d)}
              markedDates={markedDates}
            />

            {!schedDate && (
              <EmptyState text="בחר תאריך בלוח כדי לראות את לוח התפילות" />
            )}

            {schedDate && (
              <>
                <div className={styles.listHeader}>
                  <span className={styles.listTitle}>
                    {schedDate.toLocaleDateString('he-IL',{weekday:'long',day:'numeric',month:'long'})}
                    {getParasha(schedDate) ? ` · פרשת ${getParasha(schedDate)}` : ''}
                  </span>
                  <button className={styles.clearDate} onClick={() => setSchedDate(null)}>נקה ✕</button>
                </div>

                {daySchedule.length === 0 && <EmptyState text="אין לוח זמנים מוגדר ליום זה" />}

                {daySchedule.map((p, i) => {
                  const reqs = approvedForSchedDate.filter(r => r.sub === p.name);
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

                {/* בקשות שאושרו לתאריך זה */}
                {approvedForSchedDate.length > 0 && (
                  <>
                    <div className={styles.listHeader} style={{marginTop:'1rem'}}>
                      <span className={styles.listTitle}>אושרו לתאריך זה</span>
                    </div>
                    {approvedForSchedDate.map(r => (
                      <Card key={r._id}>
                        <div className={styles.reqNameRow}>
                          <span className={styles.reqName}>{r.memberName}</span>
                        </div>
                        <Badge variant={r.type==='תפילה'?'tefila':'torah'}>{r.type} — {r.sub}</Badge>
                        {r.reason && <p className={styles.reason}>{r.reason}</p>}
                      </Card>
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && <GabaiSettings synagogue={synagogue} qc={qc} />}
      </main>

      {(showAddForm || editReq) && (
        <div className={styles.modalBg} onClick={() => { setShowAddForm(false); setEditReq(null); }}>
          <div className={styles.modalSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHandle} />
            <h3 className={styles.modalTitle}>{editReq ? 'עריכת בקשה' : 'הוספה ידנית'}</h3>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>שם המתפלל</label>
              <input className={styles.fieldInput} value={manualForm.memberName} onChange={e => setManualForm(f => ({ ...f, memberName: e.target.value }))} placeholder="שם מלא" />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>תאריך</label>
              <input className={styles.fieldInput} type="date" value={manualForm.requestDate} onChange={e => setManualForm(f => ({ ...f, requestDate: e.target.value }))} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>סוג בקשה</label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:6}}>
                {[['תפילה','🕯️'],['קריאת תורה','📖'],['דרשן','🎤']].map(([t,icon]) => (
                  <button key={t} type="button"
                    style={{padding:'8px 4px',border: manualForm.type===t ? '2px solid var(--navy-600)' : '1.5px solid var(--clr-border2)',borderRadius:'var(--radius-md)',background: manualForm.type===t ? 'var(--navy-50)' : 'var(--clr-bg)',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}
                    onClick={() => setManualForm(f => ({ ...f, type: t, sub: t==='תפילה'?'שחרית':t==='קריאת תורה'?'כהן ראשון':'דרשה' }))}>
                    <span>{icon}</span>{t}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>{manualForm.type === 'תפילה' ? 'תפילה' : manualForm.type === 'קריאת תורה' ? 'עלייה' : 'סוג'}</label>
              <select className={styles.fieldInput} value={manualForm.sub} onChange={e => setManualForm(f => ({ ...f, sub: e.target.value }))}>
                {manualForm.type === 'תפילה' && ['שחרית','מוסף','מנחה','קבלת שבת','מעריב'].map(p => <option key={p}>{p}</option>)}
                {manualForm.type === 'קריאת תורה' && ['כהן ראשון','לוי שני','שלישי','רביעי','חמישי','שישי','שביעי','מפטיר'].map(a => <option key={a}>{a}</option>)}
                {manualForm.type === 'דרשן' && ['דרשה','שיעור תורה','הספד','דברי תורה קצרים'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>סטטוס</label>
              <select className={styles.fieldInput} value={manualForm.status} onChange={e => setManualForm(f => ({ ...f, status: e.target.value }))}>
                <option value="approved">אושר</option>
                <option value="pending">ממתין</option>
                <option value="declined">נדחה</option>
              </select>
            </div>
            <div className={styles.fieldGroup} style={{marginBottom:'1rem'}}>
              <label className={styles.fieldLabel}>סיבה (אופציונלי)</label>
              <input className={styles.fieldInput} value={manualForm.reason} onChange={e => setManualForm(f => ({ ...f, reason: e.target.value }))} placeholder="יאהרצייט, בר מצווה..." />
            </div>
            <button style={{width:'100%',padding:'0.75rem',background:'var(--navy-700)',color:'#fff',border:'none',borderRadius:'var(--radius-md)',fontSize:14,fontWeight:600,cursor:'pointer',marginBottom:8}}
              onClick={() => {
                const d = manualForm.requestDate ? new Date(manualForm.requestDate + 'T12:00:00') : new Date();
                const data = { ...manualForm, synagogueId: synagogue._id, day: manualForm.requestDate ? d.getDay() : 6, shabbatLabel: manualForm.requestDate ? (getParasha(new Date(manualForm.requestDate + 'T12:00:00')) || HOLIDAYS[manualForm.requestDate] || '') : '' };
                if (editReq) editMutation.mutate({ id: editReq._id, data });
                else createMutation.mutate(data);
              }}
              disabled={!manualForm.memberName}>
              {editReq ? 'עדכן בקשה' : 'הוסף בקשה'}
            </button>
            <button style={{width:'100%',padding:'0.65rem',background:'transparent',border:'1px solid var(--clr-border2)',borderRadius:'var(--radius-md)',fontSize:13,color:'var(--clr-text2)',cursor:'pointer'}}
              onClick={() => { setShowAddForm(false); setEditReq(null); }}>
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GabaiSettings({ synagogue, qc }) {
  const [form, setForm] = useState({ name: synagogue?.name||'', city: synagogue?.city||'', parasha: synagogue?.parasha||'' });
  const [passForm, setPassForm] = useState({ newPassword:'', confirm:'' });

  React.useEffect(() => {
    if(synagogue) setForm({ name:synagogue.name, city:synagogue.city, parasha:synagogue.parasha });
  }, [synagogue]);

  const saveSettings = async e => {
    e.preventDefault();
    await api.put('/synagogues/'+synagogue._id, form);
    qc.invalidateQueries(['settings']);
    toast.success('ההגדרות נשמרו ✓');
  };

  const changePass = async e => {
    e.preventDefault();
    if(passForm.newPassword!==passForm.confirm){toast.error('הסיסמאות אינן תואמות');return;}
    if(passForm.newPassword.length<4){toast.error('סיסמה קצרה מדי');return;}
    await api.post('/auth/change-password',{newPassword:passForm.newPassword});
    toast.success('הסיסמה עודכנה ✓');
    setPassForm({newPassword:'',confirm:''});
  };

  return (
    <div>
      <div className={styles.settingsSection}>הגדרות בית הכנסת</div>
      <Card>
        <form onSubmit={saveSettings}>
          <div className={styles.fieldGroup}><label className={styles.fieldLabel}>שם בית הכנסת</label><input className={styles.fieldInput} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
          <div className={styles.fieldGroup}><label className={styles.fieldLabel}>עיר</label><input className={styles.fieldInput} value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))}/></div>
          <div className={styles.fieldGroup} style={{marginBottom:0}}><label className={styles.fieldLabel}>פרשת השבוע</label><input className={styles.fieldInput} value={form.parasha} onChange={e=>setForm(f=>({...f,parasha:e.target.value}))}/></div>
          <Button type="submit" style={{marginTop:'1rem'}}>שמור</Button>
        </form>
      </Card>
      <div className={styles.settingsSection} style={{marginTop:'1.25rem'}}>שינוי סיסמה</div>
      <Card>
        <form onSubmit={changePass}>
          <div className={styles.fieldGroup}><label className={styles.fieldLabel}>סיסמה חדשה</label><input className={styles.fieldInput} type="password" value={passForm.newPassword} onChange={e=>setPassForm(f=>({...f,newPassword:e.target.value}))} placeholder="לפחות 4 תווים"/></div>
          <div className={styles.fieldGroup} style={{marginBottom:0}}><label className={styles.fieldLabel}>אימות</label><input className={styles.fieldInput} type="password" value={passForm.confirm} onChange={e=>setPassForm(f=>({...f,confirm:e.target.value}))} placeholder="••••••"/></div>
          <Button type="submit" style={{marginTop:'1rem'}}>עדכן</Button>
        </form>
      </Card>
    </div>
  );
}
