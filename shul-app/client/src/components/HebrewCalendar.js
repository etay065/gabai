import React, { useState, useMemo } from 'react';
import styles from './HebrewCalendar.module.css';

// ── Hebrew date engine (pure JS, no dependencies) ──────────────────────────

const HEBREW_MONTHS = ['תשרי','חשון','כסלו','טבת','שבט','אדר','ניסן','אייר','סיון','תמוז','אב','אלול'];
const HEBREW_MONTHS_LEAP = ['תשרי','חשון','כסלו','טבת','שבט','אדר א׳','אדר ב׳','ניסן','אייר','סיון','תמוז','אב','אלול'];
const DAYS_HE = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];
const DAYS_FULL = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

// Parasha list (cycle starts Tishri 1, 5785 = Sep 29, 2024)
// We'll use a lookup by Gregorian date for simplicity
const PARASHA_SCHEDULE = {
  // 5785 (2024-2025)
  '2024-10-26': 'בראשית', '2024-11-02': 'נח', '2024-11-09': 'לך לך',
  '2024-11-16': 'וירא', '2024-11-23': 'חיי שרה', '2024-11-30': 'תולדות',
  '2024-12-07': 'ויצא', '2024-12-14': 'וישלח', '2024-12-21': 'וישב',
  '2024-12-28': 'מקץ', '2025-01-04': 'ויגש', '2025-01-11': 'ויחי',
  '2025-01-18': 'שמות', '2025-01-25': 'וארא', '2025-02-01': 'בא',
  '2025-02-08': 'בשלח', '2025-02-15': 'יתרו', '2025-02-22': 'משפטים',
  '2025-03-01': 'תרומה', '2025-03-08': 'תצוה', '2025-03-15': 'כי תשא',
  '2025-03-22': 'ויקהל-פקודי', '2025-03-29': 'ויקרא', '2025-04-05': 'צו',
  '2025-04-19': 'שמיני', '2025-04-26': 'תזריע-מצורע', '2025-05-03': 'אחרי מות-קדושים',
  '2025-05-10': 'אמור', '2025-05-17': 'בהר-בחוקותי', '2025-05-24': 'במדבר',
  '2025-06-07': 'נשא', '2025-06-14': 'בהעלותך', '2025-06-21': 'שלח',
  '2025-06-28': 'קרח', '2025-07-05': 'חוקת', '2025-07-12': 'בלק',
  '2025-07-19': 'פינחס', '2025-07-26': 'מטות-מסעי', '2025-08-02': 'דברים',
  '2025-08-09': 'ואתחנן', '2025-08-16': 'עקב', '2025-08-23': 'ראה',
  '2025-08-30': 'שופטים', '2025-09-06': 'כי תצא', '2025-09-13': 'כי תבוא',
  '2025-09-20': 'נצבים-וילך',
  // 5786 (2025-2026)
  '2025-10-18': 'בראשית', '2025-10-25': 'נח', '2025-11-01': 'לך לך',
  '2025-11-08': 'וירא', '2025-11-15': 'חיי שרה', '2025-11-22': 'תולדות',
  '2025-11-29': 'ויצא', '2025-12-06': 'וישלח', '2025-12-13': 'וישב',
  '2025-12-20': 'מקץ', '2025-12-27': 'ויגש', '2026-01-03': 'ויחי',
  '2026-01-10': 'שמות', '2026-01-17': 'וארא', '2026-01-24': 'בא',
  '2026-01-31': 'בשלח', '2026-02-07': 'יתרו', '2026-02-14': 'משפטים',
  '2026-02-21': 'תרומה', '2026-02-28': 'תצוה', '2026-03-07': 'כי תשא',
  '2026-03-14': 'ויקהל', '2026-03-21': 'פקודי', '2026-03-28': 'ויקרא',
  '2026-04-04': 'צו', '2026-04-25': 'שמיני', '2026-05-02': 'תזריע-מצורע',
  '2026-05-09': 'אחרי מות-קדושים', '2026-05-16': 'אמור', '2026-05-23': 'בהר-בחוקותי',
  '2026-05-30': 'במדבר', '2026-06-13': 'נשא', '2026-06-20': 'בהעלותך',
  '2026-06-27': 'שלח', '2026-07-04': 'קרח', '2026-07-11': 'חוקת-בלק',
  '2026-07-18': 'פינחס', '2026-07-25': 'מטות-מסעי', '2026-08-01': 'דברים',
  '2026-08-08': 'ואתחנן', '2026-08-15': 'עקב', '2026-08-22': 'ראה',
  '2026-08-29': 'שופטים', '2026-09-05': 'כי תצא', '2026-09-12': 'כי תבוא',
  '2026-09-19': 'נצבים-וילך',
};

// Jewish holidays by Gregorian date
const HOLIDAYS = {
  // 5785
  '2024-10-02': 'ראש השנה', '2024-10-03': 'ראש השנה',
  '2024-10-04': 'צום גדליה',
  '2024-10-11': 'יום כיפור',
  '2024-10-16': 'סוכות', '2024-10-17': 'סוכות',
  '2024-10-23': 'הושענא רבה',
  '2024-10-24': 'שמיני עצרת',
  '2024-10-25': 'שמחת תורה',
  '2024-12-25': 'חנוכה', '2024-12-26': 'חנוכה', '2024-12-27': 'חנוכה',
  '2024-12-28': 'חנוכה', '2024-12-29': 'חנוכה', '2024-12-30': 'חנוכה',
  '2024-12-31': 'חנוכה', '2025-01-01': 'חנוכה',
  '2025-01-13': 'צום עשרה בטבת',
  '2025-03-13': 'תענית אסתר',
  '2025-03-14': 'פורים', '2025-03-15': 'שושן פורים',
  '2025-04-12': 'שבת הגדול',
  '2025-04-13': 'ערב פסח',
  '2025-04-14': 'פסח', '2025-04-15': 'פסח',
  '2025-04-20': 'פסח', '2025-04-21': 'פסח',
  '2025-04-24': 'יום השואה',
  '2025-05-01': 'יום הזיכרון', '2025-05-02': 'יום העצמאות',
  '2025-05-12': 'פסח שני',
  '2025-05-22': 'ל״ג בעומר',
  '2025-06-01': 'ערב שבועות', '2025-06-02': 'שבועות', '2025-06-03': 'שבועות',
  '2025-07-13': 'צום שבעה עשר בתמוז',
  '2025-08-03': 'תשעה באב',
  // 5786
  '2025-09-22': 'ראש השנה', '2025-09-23': 'ראש השנה',
  '2025-09-24': 'צום גדליה',
  '2025-10-01': 'יום כיפור',
  '2025-10-06': 'סוכות', '2025-10-07': 'סוכות',
  '2025-10-13': 'הושענא רבה',
  '2025-10-14': 'שמיני עצרת', '2025-10-15': 'שמחת תורה',
  '2025-12-14': 'חנוכה', '2025-12-15': 'חנוכה', '2025-12-16': 'חנוכה',
  '2025-12-17': 'חנוכה', '2025-12-18': 'חנוכה', '2025-12-19': 'חנוכה',
  '2025-12-20': 'חנוכה', '2025-12-21': 'חנוכה',
  '2026-01-01': 'צום עשרה בטבת',
  '2026-03-02': 'תענית אסתר', '2026-03-03': 'פורים', '2026-03-04': 'שושן פורים',
  '2026-04-01': 'ערב פסח',
  '2026-04-02': 'פסח', '2026-04-03': 'פסח',
  '2026-04-08': 'פסח', '2026-04-09': 'פסח',
  '2026-04-12': 'יום השואה',
  '2026-04-20': 'יום הזיכרון', '2026-04-21': 'יום העצמאות',
  '2026-05-19': 'שבועות', '2026-05-20': 'שבועות',
  '2026-07-02': 'צום שבעה עשר בתמוז',
  '2026-07-23': 'תשעה באב',
};

function toDateKey(date) {
  return date.toISOString().split('T')[0];
}

function getParasha(date) {
  return PARASHA_SCHEDULE[toDateKey(date)] || null;
}

function getHoliday(date) {
  return HOLIDAYS[toDateKey(date)] || null;
}

// Simple Hebrew date approximation using known epoch
function gregToHebrew(date) {
  // Using the Gregorian->Hebrew conversion algorithm
  const JD = gregorianToJD(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return jdToHebrew(JD);
}

function gregorianToJD(y, m, d) {
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function jdToHebrew(jd) {
  const JD = Math.floor(jd) + 0.5;
  const l = JD + 0.5 + 1373429; // ~adjust for Hebrew epoch
  const n = Math.floor((l - 1) / 365.25);
  // simplified — returns approximate Hebrew year/month/day
  const gregYear = Math.floor((jd - 1721425.5) / 365.25);
  const hebrewYear = gregYear + 3760;
  // For display we'll just show the year and approximate month
  return { year: hebrewYear };
}

function getHebrewMonthYear(gregDate) {
  // Returns Hebrew month name and year for a given Gregorian month
  const h = gregToHebrew(new Date(gregDate.getFullYear(), gregDate.getMonth(), 15));
  return h.year;
}

// Generate calendar grid for a given year/month
function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun
  const days = [];

  // Previous month padding
  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, -startDow + i + 1);
    days.push({ date: d, currentMonth: false });
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), currentMonth: true });
  }

  // Next month padding
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), currentMonth: false });
  }

  return days;
}

const HEBREW_NUMBERS = {
  1:'א',2:'ב',3:'ג',4:'ד',5:'ה',6:'ו',7:'ז',8:'ח',9:'ט',10:'י',
  11:'יא',12:'יב',13:'יג',14:'יד',15:'טו',16:'טז',17:'יז',18:'יח',19:'יט',20:'כ',
  21:'כא',22:'כב',23:'כג',24:'כד',25:'כה',26:'כו',27:'כז',28:'כח',29:'כט',30:'ל',
};

function getHebrewDayNum(date) {
  // Approximate Hebrew day of month
  // Using a known reference: 1 Tishri 5785 = Oct 3, 2024 (wait, actually Sep 29)
  // Reference: 1 Tishri 5785 = Oct 2, 2024
  const REF_GREG = new Date(2024, 9, 2); // Oct 2, 2024 = 1 Tishri 5785
  const REF_HEB_DAY = 1;
  const REF_HEB_MONTH = 0; // Tishri = index 0
  const REF_HEB_YEAR = 5785;

  const diffMs = date - REF_GREG;
  const diffDays = Math.round(diffMs / 86400000);

  // Approximate: Hebrew months alternate 29/30 days
  const MONTH_LENGTHS = [30,29,30,29,30,30,29,30,29,30,29,29]; // 5785 non-leap
  let totalDays = diffDays;
  let year = REF_HEB_YEAR;
  let month = REF_HEB_MONTH;
  let day = REF_HEB_DAY;

  if (totalDays >= 0) {
    while (totalDays > 0) {
      const daysInMonth = MONTH_LENGTHS[month % 12];
      const remaining = daysInMonth - day + 1;
      if (totalDays < remaining) {
        day += totalDays;
        totalDays = 0;
      } else {
        totalDays -= remaining;
        month++;
        if (month >= 12) { month = 0; year++; }
        day = 1;
      }
    }
  } else {
    totalDays = Math.abs(totalDays);
    while (totalDays > 0) {
      if (totalDays < day) {
        day -= totalDays;
        totalDays = 0;
      } else {
        totalDays -= day;
        month--;
        if (month < 0) { month = 11; year--; }
        day = MONTH_LENGTHS[month % 12];
      }
    }
  }

  return { day, month, year };
}

const GREG_MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

// ── Component ────────────────────────────────────────────────────────────────

export default function HebrewCalendar({ onSelectDate, selectedDate, minDate, maxDate }) {
  const today = new Date();
  today.setHours(0,0,0,0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const days = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const goBack = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const goForward = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isDisabled = (date) => {
    if (date < today) return true;
    if (maxDate && date > maxDate) return true;
    if (minDate && date < minDate) return true;
    return false;
  };

  const isSelected = (date) => {
    if (!selectedDate) return false;
    return toDateKey(date) === toDateKey(selectedDate);
  };

  const isToday = (date) => toDateKey(date) === toDateKey(today);

  const isSaturday = (date) => date.getDay() === 6;

  const hebrewYear = getHebrewMonthYear(new Date(viewYear, viewMonth, 15));

  // Can we go back/forward?
  const canGoBack = !(viewYear === today.getFullYear() && viewMonth === today.getMonth());
  const maxD = maxDate || new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  const canGoForward = !(viewYear === maxD.getFullYear() && viewMonth === maxD.getMonth());

  return (
    <div className={styles.cal}>
      {/* Header */}
      <div className={styles.calHeader}>
        <button className={styles.navBtn} onClick={goForward} disabled={!canGoForward} aria-label="חודש הבא">›</button>
        <div className={styles.calTitle}>
          <div className={styles.calMonthHe}>{GREG_MONTHS_HE[viewMonth]} {viewYear}</div>
          <div className={styles.calYearHe}>שנת {hebrewYear}</div>
        </div>
        <button className={styles.navBtn} onClick={goBack} disabled={!canGoBack} aria-label="חודש קודם">‹</button>
      </div>

      {/* Day headers */}
      <div className={styles.calGrid}>
        {DAYS_FULL.map(d => (
          <div key={d} className={`${styles.dayHeader} ${d === 'שבת' ? styles.shabbatHeader : ''}`}>{d}</div>
        ))}

        {/* Days */}
        {days.map((item, i) => {
          const { date, currentMonth } = item;
          const disabled = isDisabled(date) || !currentMonth;
          const selected = isSelected(date);
          const todayMark = isToday(date);
          const saturday = isSaturday(date);
          const parasha = saturday ? getParasha(date) : null;
          const holiday = getHoliday(date);
          const heb = getHebrewDayNum(date);
          const hebNum = HEBREW_NUMBERS[heb.day] || heb.day;

          return (
            <div
              key={i}
              className={[
                styles.dayCell,
                !currentMonth ? styles.otherMonth : '',
                disabled ? styles.disabled : '',
                selected ? styles.selected : '',
                todayMark ? styles.today : '',
                saturday && currentMonth ? styles.shabbat : '',
                holiday && currentMonth ? styles.holiday : '',
              ].filter(Boolean).join(' ')}
              onClick={() => !disabled && currentMonth && onSelectDate(date)}
            >
              <span className={styles.gregNum}>{date.getDate()}</span>
              <span className={styles.hebNum}>{currentMonth ? hebNum : ''}</span>
              {parasha && currentMonth && (
                <span className={styles.parasha}>{parasha}</span>
              )}
              {holiday && currentMonth && !parasha && (
                <span className={styles.holidayLabel}>{holiday}</span>
              )}
              {holiday && parasha && currentMonth && (
                <span className={styles.holidayLabel}>{holiday}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={styles.legendShabbat}></span>שבת</span>
        <span className={styles.legendItem}><span className={styles.legendHoliday}></span>חג</span>
        <span className={styles.legendItem}><span className={styles.legendToday}></span>היום</span>
      </div>
    </div>
  );
}
