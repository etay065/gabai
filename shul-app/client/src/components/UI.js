import React from 'react';
import styles from './UI.module.css';

export function Card({ children, style }) {
  return <div className={styles.card} style={style}>{children}</div>;
}

export function Badge({ children, variant = 'default' }) {
  return <span className={`${styles.badge} ${styles['badge_' + variant]}`}>{children}</span>;
}

export function Button({ children, variant = 'primary', onClick, disabled, style, type = 'button' }) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles['btn_' + variant]}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}

export function Input({ label, error, ...props }) {
  return (
    <div className={styles.fieldGroup}>
      {label && <label className={styles.fieldLabel}>{label}</label>}
      <input className={styles.fieldInput} {...props} />
      {error && <span className={styles.fieldError} role="alert">{error}</span>}
    </div>
  );
}

export function Select({ label, children, style, ...props }) {
  return (
    <div className={styles.fieldGroup}>
      {label && <label className={styles.fieldLabel}>{label}</label>}
      <select className={styles.fieldInput} style={style} {...props}>{children}</select>
    </div>
  );
}

export function Textarea({ label, ...props }) {
  return (
    <div className={styles.fieldGroup}>
      {label && <label className={styles.fieldLabel}>{label}</label>}
      <textarea className={styles.fieldInput} {...props} />
    </div>
  );
}

export function DayPills({ days, activeDay, onSelect, pendingCounts = {} }) {
  return (
    <div className={styles.dayBar} role="group" aria-label="בחירת יום">
      {days.map((d, i) => (
        <button
          key={i}
          className={`${styles.dayPill} ${i === activeDay ? styles.dayPillActive : ''}`}
          onClick={() => onSelect(i)}
          aria-pressed={i === activeDay}
        >
          {d}
          {pendingCounts[i] ? <span className={styles.pendingDot} aria-label={`${pendingCounts[i]} ממתינות`}>{pendingCounts[i]}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Loader() {
  return <div className={styles.loader} role="status" aria-label="טוען...">טוען...</div>;
}

export function EmptyState({ text }) {
  return <div className={styles.empty}>{text}</div>;
}
