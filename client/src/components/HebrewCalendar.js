import React, { useState, useMemo } from 'react';
import styles from './HebrewCalendar.module.css';

// ── פרשות השבוע ────────────────────────────────────────────────────────────
const PARASHA_SCHEDULE = {
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
  '2026-08-08':'ואתחנן','2026-08-15':'עקב','2026-08-22':'ראה',
  '2026-08-29':'שופטים','2026-09-05':'כי תצא','2026-09-12':'כי תבוא',
  '2026-09-19':'נצבים-וילך',
};

// ── חגים ────────────────────────────────────────────────────────────────────
const HOLIDAYS = {
  '2025-04-12':'שבת הגדול','2025-04-13':'ערב פסח',
  '2025-04-14':'פסח','2025-04-15':'פסח',
  '2025-04-16':'חול המועד','2025-04-17':'חול המועד',
  '2025-04-18':'חול המועד','2025-04-19':'חול המועד',
  '2025-04-20':'פסח','2025-04-21':'פסח',
  '2025-04-24':'יום השואה','2025-05-01':'יום הזיכרון',
  '2025-05-02':'יום העצמאות','2025-05-12':'פסח שני',
  '2025-05-22':'ל"ג בעומר',
  '2025-06-01':'ערב שבועות','2025-06-02':'שבועות','2025-06-03':'שבועות',
  '2025-07-13':'י"ז בתמוז','2025-08-03':'תשעה באב',
  '2025-09-22':'ראש השנה','2025-09-23':'ראש השנה',
  '2025-09-24':'צום גדליה',
  '2025-10-01':'יום כיפור',
  '2025-10-06':'סוכות','2025-10-07':'סוכות',
  '2025-10-08':'חול המועד','2025-10-09':'חול המועד',
  '2025-10-10':'חול המועד','2025-10-11':'חול המועד',
  '2025-10-12':'חול המועד',
  '2025-10-13':'הושענא רבה',
  '2025-10-14':'שמיני עצרת','2025-10-15':'שמחת תורה',
  '2025-12-14':'חנוכה','2025-12-15':'חנוכה','2025-12-16':'חנוכה',
  '2025-12-17':'חנוכה','2025-12-18':'חנוכה','2025-12-19':'חנוכה',
  '2025-12-20':'חנוכה','2025-12-21':'חנוכה',
  '2026-01-01':'עשרה בטבת',
  '2026-03-02':'תענית אסתר','2026-03-03':'פורים','2026-03-04':'שושן פורים',
  '2026-04-01':'ערב פסח',
  '2026-04-02':'פסח','2026-04-03':'פסח',
  '2026-04-04':'חול המועד','2026-04-05':'חול המועד',
  '2026-04-06':'חול המועד','2026-04-07':'חול המועד',
  '2026-04-08':'פסח','2026-04-09':'פסח',
  '2026-04-12':'יום השואה',
  '2026-04-20':'יום הזיכרון','2026-04-21':'יום העצמאות',
  '2026-05-01':'פסח שני','2026-05-11':'ל"ג בעומר',
  '2026-05-19':'שבועות','2026-05-20':'שבועות',
  '2026-07-02':'י"ז בתמוז','2026-07-23':'תשעה באב',
};

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

// מספרים עבריים לימי החודש
const HEB_NUMS = {
  1:'א׳',2:'ב׳',3:'ג׳',4:'ד׳',5:'ה׳',6:'ו׳',7:'ז׳',8:'ח׳',9:'ט׳',10:'י׳',
  11:'י"א',12:'י"ב',13:'י"ג',14:'י"ד',15:'ט"ו',16:'ט"ז',17:'י"ז',18:'י"ח',19:'י"ט',20:'כ׳',
  21:'כ"א',22:'כ"ב',23:'כ"ג',24:'כ"ד',25:'כ"ה',26:'כ"ו',27:'כ"ז',28:'כ"ח',29:'כ"ט',30:'ל׳',
};

// המרה גרגוריאנית → עברית (אלגוריתם מדויק)
function gregToHeb(date) {
  const jd = gregToJD(date.getFullYear(), date.getMonth()+1, date.getDate());
  return jdToHeb(Math.floor(jd + 0.5));
}

function gregToJD(y, m, d) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y/100);
  const B = 2 - A + Math.floor(A/4);
  return Math.floor(365.25*(y+4716)) + Math.floor(30.6001*(m+1)) + d + B - 1524;
}

function jdToHeb(jd) {
  const EPOCH = 347997;
  let year = Math.floor((jd - EPOCH) * 98496.0 / 35975351.0) + 1;
  while (jd >= hebNewYear(year + 1)) year++;
  const start = hebNewYear(year);
  let month = jd < gregToJD(year, 1, 1) + 180 ? 7 : 1;
  while (jd > start + hebMonthLen(year, month) - 1) {
    month = month === 13 ? 1 : month === 6 && !isHebLeap(year) ? 8 : month + 1;
  }
  const day = jd - start + 1 - hebMonthOffset(year, month);
  return { year, month, day: Math.round(day) };
}

function isHebLeap(y) { return ((7*y)+1) % 19 < 7; }

function hebElapsedDays(y) {
  const monthsElapsed = Math.floor((235*y - 234) / 19);
  const parts = 12084 + 13753 * monthsElapsed;
  let day = monthsElapsed * 29 + Math.floor(parts / 25920);
  if ((3*(day+1)) % 7 < 3) day++;
  return day;
}

function hebNewYear(y) {
  const ny = hebElapsedDays(y);
  const ny2 = hebElapsedDays(y+1);
  const dny = ny2 - ny;
  let corr = 0;
  if (dny === 356) corr = 2;
  else if (dny === 382) { const ny3 = hebElapsedDays(y-1); if ((ny - ny3) === 356) corr = 1; }
  return 347997 + ny + corr;
}

function hebMonthOffset(y, m) {
  const lengths = hebMonthLengths(y);
  let offset = 0;
  for (let i = 7; i < m && i <= 13; i++) offset += lengths[i-1] || 0;
  for (let i = 1; i < m && m <= 6; i++) offset += lengths[i-1] || 0;
  return offset;
}

function hebMonthLengths(y) {
  const ny = hebElapsedDays(y);
  const ny2 = hebElapsedDays(y+1);
  const dny = ny2 - ny;
  const leap = isHebLeap(y);
  if (dny === 353) return [30,29,29,29,30,29,0,30,29,30,29,30,29];
  if (dny === 354) return [30,29,30,29,30,29,0,30,29,30,29,30,29];
  if (dny === 355) return [30,30,30,29,30,29,0,30,29,30,29,30,29];
  if (dny === 383) return [30,29,29,29,30,30,29,30,29,30,29,30,29];
  if (dny === 384) return [30,29,30,29,30,30,29,30,29,30,29,30,29];
  return                  [30,30,30,29,30,30,29,30,29,30,29,30,29];
}

function hebMonthLen(y, m) {
  return hebMonthLengths(y)[m-1] || 29;
}

const HEB_MONTH_NAMES = ['','ניסן','אייר','סיון','תמוז','אב','אלול','תשרי','חשון','כסלו','טבת','שבט','אדר','אדר ב׳'];

function getHebMonthName(y, m) {
  if (m === 12 && !isHebLeap(y)) return 'אדר';
  return HEB_MONTH_NAMES[m] || '';
}

function hebYearToLetters(y) {
  const thousands = Math.floor(y / 1000);
  const rem = y % 1000;
  const hundreds = Math.floor(rem / 100);
  const tens = Math.floor((rem % 100) / 10);
  const ones = rem % 10;
  const H = ['','ק','ר','ש','ת'];
  const T = ['','י','כ','ל','מ','נ','ס','ע','פ','צ'];
  const O = ['','א','ב','ג','ד','ה','ו','ז','ח','ט'];
  let s = H[hundreds] + T[tens] + O[ones];
  // תיקון: ט"ו → טו, ט"ז → טז
  if (tens === 1 && ones === 5) s = 'טו';
  if (tens === 1 && ones === 6) s = 'טז';
  return 'ה׳' + (hundreds ? H[hundreds] : '') + (tens || ones ? (s.length > 1 ? s.slice(0,-1) + '"' + s.slice(-1) : s) : '');
}

const GREG_MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const DAYS_FULL = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];
const DAYS_HEADER = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month+1, 0);
  const days = [];
  for (let i = 0; i < firstDay.getDay(); i++)
    days.push({ date: new Date(year, month, -firstDay.getDay()+i+1), cur: false });
  for (let d = 1; d <= lastDay.getDate(); d++)
    days.push({ date: new Date(year, month, d), cur: true });
  const rem = 42 - days.length;
  for (let i = 1; i <= rem; i++)
    days.push({ date: new Date(year, month+1, i), cur: false });
  return days;
}

export default function HebrewCalendar({ onSelectDate, selectedDate, minDate, maxDate, markedDates = {} }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [vy, setVy] = useState(today.getFullYear());
  const [vm, setVm] = useState(today.getMonth());

  const days = useMemo(() => getCalendarDays(vy, vm), [vy, vm]);

  const goBack = () => { if (vm===0){setVm(11);setVy(y=>y-1);}else setVm(m=>m-1); };
  const goFwd  = () => { if (vm===11){setVm(0);setVy(y=>y+1);}else setVm(m=>m+1); };

  const minD = minDate || today;
  const maxD = maxDate || new Date(today.getFullYear()+1, today.getMonth(), today.getDate());
  const canBack = !(vy===minD.getFullYear() && vm===minD.getMonth());
  const canFwd  = !(vy===maxD.getFullYear() && vm===maxD.getMonth());

  // Hebrew month/year for header
  const mid = new Date(vy, vm, 15);
  const midHeb = gregToHeb(mid);
  const firstHeb = gregToHeb(new Date(vy, vm, 1));
  const lastHeb  = gregToHeb(new Date(vy, vm+1, 0));
  const hebHeader = firstHeb.month === lastHeb.month
    ? `${getHebMonthName(midHeb.year, midHeb.month)} ${hebYearToLetters(midHeb.year)}`
    : `${getHebMonthName(firstHeb.year, firstHeb.month)}–${getHebMonthName(lastHeb.year, lastHeb.month)} ${hebYearToLetters(midHeb.year)}`;

  return (
    <div className={styles.cal}>
      <div className={styles.calHeader}>
        <button className={styles.navBtn} onClick={goFwd} disabled={!canFwd} aria-label="חודש הבא">›</button>
        <div className={styles.calTitle}>
          <div className={styles.calMonthHe}>{GREG_MONTHS_HE[vm]} {vy}</div>
          <div className={styles.calYearHe}>{hebHeader}</div>
        </div>
        <button className={styles.navBtn} onClick={goBack} disabled={!canBack} aria-label="חודש קודם">‹</button>
      </div>

      <div className={styles.calGrid}>
        {DAYS_HEADER.map(d => (
          <div key={d} className={`${styles.dayHeader} ${d==='שבת'?styles.shabbatHeader:''}`}>{d}</div>
        ))}

        {days.map((item, i) => {
          const { date, cur } = item;
          const key = toKey(date);
          const disabled = !cur || date < minD || date > maxD;
          const selected = selectedDate && toKey(selectedDate) === key;
          const isToday  = key === toKey(today);
          const isSat    = date.getDay() === 6;
          const parasha  = isSat ? PARASHA_SCHEDULE[key] : null;
          const holiday  = HOLIDAYS[key];
          const marked   = markedDates[key];
          const heb      = cur ? gregToHeb(date) : null;
          const hebNum   = heb ? (HEB_NUMS[heb.day] || heb.day) : '';

          return (
            <div key={i}
              className={[
                styles.dayCell,
                !cur       ? styles.otherMonth : '',
                disabled   ? styles.disabled   : '',
                selected   ? styles.selected   : '',
                isToday    ? styles.today       : '',
                isSat&&cur ? styles.shabbat     : '',
                holiday&&cur&&!isSat ? styles.holiday : '',
              ].filter(Boolean).join(' ')}
              onClick={() => !disabled && cur && onSelectDate(date)}
            >
              <div className={styles.dayTop}>
                <span className={`${styles.gregNum} ${isToday?styles.todayCircle:''}`}>{date.getDate()}</span>
                {cur && <span className={styles.hebNum}>{hebNum}</span>}
              </div>
              {parasha && cur && <span className={styles.parasha}>{parasha}</span>}
              {holiday && cur && <span className={styles.holidayLabel}>{holiday}</span>}
              {marked && cur && (
                <span className={`${styles.reqDot} ${marked.pending > 0 ? styles.reqDotPending : styles.reqDotApproved}`}>
                  {marked.pending > 0 ? marked.pending : '✓'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={styles.legendShabbat}></span>שבת / פרשה</span>
        <span className={styles.legendItem}><span className={styles.legendHoliday}></span>חג</span>
        <span className={styles.legendItem}><span className={styles.legendPending}></span>ממתין</span>
      </div>
    </div>
  );
}
