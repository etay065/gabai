import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Badge, Card, Button, Loader, EmptyState } from '../components/UI';
import styles from './GabaiDashboard.module.css';

const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

const PARASHA = {
  '2025-04-19':'שמיני','2025-04-26':'תזריע-מצורע','2025-05-03':'אחרי מות-קדושים',
  '2025-05-10':'אמור','2025-05-17':'בהר-בחוקותי','2025-05-24':'במדבר',
  '2025-06-07':'נשא','2025-06-14':'בהעלותך','2025-06-21':'שלח',
  '2025-06-28':'קרח','2025-07-05':'חוקת','2025-07-12':'בלק',
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

const HOLIDAYS = {
  '2025-04-13':'ערב פסח','2025-04-14':'פסח','2025-04-15':'פסח',
  '2025-04-20':'פסח','2025-04-21':'פסח',
  '2025-04-24':'יום השואה','2025-05-01':'יום הזיכרון','2025-05-02':'יום העצמאות',
  '2025-05-22':'ל"ג בעומר','2025-06-02':'שבועות','2025-06-03':'שבועות',
  '2025-07-13':'י"ז בתמוז','2025-08-03':'תשעה באב',
  '2025-09-22':'ראש השנה','2025-09-23':'ראש השנה','2025-10-01':'יום כיפור',
  '2025-10-06':'סוכות','2025-10-07':'סוכות','2025-10-13':'הושענא רבה',
  '2025-10-14':'שמיני עצרת','2025-10-15':'שמחת תורה',
  '2025-12-14':'חנוכה','2025-12-15':'חנוכה','2025-12-16':'חנוכה',
  '2025-12-17':'חנוכה','2025-12-18':'חנוכה','2025-12-19':'חנוכה',
  '2025-12-20':'חנוכה','2025-12-21':'חנוכה',
  '2026-03-03':'פורים','2026-04-02':'פסח','2026-04-03':'פסח',
  '2026-04-08':'פסח','2026-04-09':'פסח',
  '2026-05-19':'שבועות','2026-05-20':'שבועות','2026-07-23':'תשעה באב',
};

const HEB_NUMS = ['','א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ז׳','ח׳','ט׳','י׳','י"א','י"ב','י"ג','י"ד','ט"ו','ט"ז','י"ז','י"ח','י"ט','כ׳','כ"א','כ"ב','כ"ג','כ"ד','כ"ה','כ"ו','כ"ז','כ"ח','כ"ט','ל׳'];
const GREG_MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const DAYS_HEADER = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

function toKey(d) {
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+day;
}

function isHebLeap(y){return((7*y)+1)%19<7;}
function hebElapsed(y){const m=Math.floor((235*y-234)/19);const p=12084+13753*m;let d=m*29+Math.floor(p/25920);if((3*(d+1))%7<3)d++;return d;}
function hebNewYear(y){const ny=hebElapsed(y),ny2=hebElapsed(y+1),dny=ny2-ny;let c=0;if(dny===356)c=2;else if(dny===382){if((ny-hebElapsed(y-1))===356)c=1;}return 347997+ny+c;}
function hebMonthLens(y){const diff=hebNewYear(y+1)-hebNewYear(y);if(diff===353)return[30,29,29,29,30,29,0,30,29,30,29,30,29];if(diff===354)return[30,29,30,29,30,29,0,30,29,30,29,30,29];if(diff===355)return[30,30,30,29,30,29,0,30,29,30,29,30,29];if(diff===383)return[30,29,29,29,30,30,29,30,29,30,29,30,29];if(diff===384)return[30,29,30,29,30,30,29,30,29,30,29,30,29];return[30,30,30,29,30,30,29,30,29,30,29,30,29];}
function gregToJD(y,m,d){if(m<=2){y--;m+=12;}const A=Math.floor(y/100);const B=2-A+Math.floor(A/4);return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524;}
function jdToHeb(jd){let year=Math.floor((jd-347997)*98496/35975351)+1;while(jd>=hebNewYear(year+1))year++;const lens=hebMonthLens(year);let rem=jd-hebNewYear(year);let month=7;while(rem>=(lens[month-1]||0)){rem-=(lens[month-1]||0);month=month===13?1:month+1;}return{year,month,day:rem+1};}
function getHebDay(date){const jd=gregToJD(date.getFullYear(),date.getMonth()+1,date.getDate());return jdToHeb(Math.floor(jd+0.5));}
const HEB_MONTH_NAMES=['','ניסן','אייר','סיון','תמוז','אב','אלול','תשרי','חשון','כסלו','טבת','שבט','אדר','אדר ב׳'];

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

  return(
    <div style={{border:'1px solid var(--clr-border)',borderRadius:'var(--radius-lg)',overflow:'hidden',marginBottom:'1rem',direction:'rtl'}}>
      <div style={{background:'var(--navy-800)',padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <button onClick={goFwd} disabled={!canFwd} style={{width:28,height:28,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.2)',background:'transparent',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{GREG_MONTHS_HE[vm]} {vy}</div>
          <div style={{fontSize:10,color:'var(--navy-300)'}}>{HEB_MONTH_NAMES[mh.month]} {mh.year}</div>
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
          const parasha=isSat?PARASHA[key]:null;
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

  const [tab, setTab] = useState('requests');
  const [selectedDate, setSelectedDate] = useState(null);
  const [schedDate, setSchedDate] = useState(null);

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
        <button className={styles.auctionBtn} onClick={() => navigate('/auctions')}>🏷️ התמחרויות</button>
        <button className={styles.logoutBtn} onClick={() => { logoutGabai(); navigate('/'); }}>יציאה</button>
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
                    {PARASHA[toKey(selectedDate)] ? ` · פרשת ${PARASHA[toKey(selectedDate)]}` : ''}
                  </span>
                  <button className={styles.clearDate} onClick={() => setSelectedDate(null)}>הצג כל הממתינות ✕</button>
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
                      {r.status==='pending'&&<span className={styles.dot}/>}
                      <span className={styles.reqName}>{r.memberName}</span>
                    </div>
                    <div className={styles.reqTime}>
                      📅 {formatReqDate(r)}
                      {r.shabbatLabel ? ` · ${r.shabbatLabel}` : ''}
                    </div>
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
                    {PARASHA[toKey(schedDate)] ? ` · פרשת ${PARASHA[toKey(schedDate)]}` : ''}
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
