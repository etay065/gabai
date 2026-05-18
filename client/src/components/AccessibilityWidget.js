import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'gab-ai-a11y';

const defaults = {
  fontSize: 0,       // -1, 0, 1, 2
  highContrast: false,
  grayscale: false,
  bigCursor: false,
  stopAnimations: false,
  underlineLinks: false,
};

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) }; }
    catch { return defaults; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    const root = document.documentElement;
    // font size
    const sizes = [-2, 0, 2, 4, 6];
    root.style.setProperty('--a11y-font-offset', sizes[settings.fontSize + 1] + 'px');
    // high contrast
    root.classList.toggle('a11y-contrast', settings.highContrast);
    // grayscale
    root.classList.toggle('a11y-grayscale', settings.grayscale);
    // big cursor
    root.classList.toggle('a11y-cursor', settings.bigCursor);
    // stop animations
    root.classList.toggle('a11y-no-motion', settings.stopAnimations);
    // underline links
    root.classList.toggle('a11y-links', settings.underlineLinks);
  }, [settings]);

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }));
  const reset = () => setSettings(defaults);

  const Row = ({ label, checked, onChange }) => (
    <label style={rowStyle}>
      <span style={{ flex: 1, fontSize: 14, color: '#0D1526' }}>{label}</span>
      <div
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 11,
          background: checked ? '#2E4491' : '#ccc',
          position: 'relative', cursor: 'pointer', transition: 'background .2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff', transition: 'left .2s',
        }} />
      </div>
    </label>
  );

  return (
    <>
      {/* Skip to content */}
      <a href="#main-content" style={skipStyle}>דלג לתוכן הראשי</a>

      {/* Floating button */}
      <button
        aria-label="פתח תפריט נגישות"
        onClick={() => setOpen(o => !o)}
        style={fabStyle}
      >
        ♿
      </button>

      {/* Panel */}
      {open && (
        <div role="dialog" aria-label="הגדרות נגישות" style={panelStyle}>
          <div style={panelHeader}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>נגישות</span>
            <button onClick={() => setOpen(false)} aria-label="סגור" style={closeBtn}>✕</button>
          </div>

          {/* Font size */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
            <div style={{ fontSize: 13, color: '#3A4E7A', marginBottom: 8 }}>גודל טקסט</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => set('fontSize', Math.max(-1, settings.fontSize - 1))} style={sizeBtn}>A-</button>
              <button onClick={() => set('fontSize', 0)} style={{ ...sizeBtn, fontSize: 11, color: '#888' }}>איפוס</button>
              <button onClick={() => set('fontSize', Math.min(3, settings.fontSize + 1))} style={{ ...sizeBtn, fontSize: 18 }}>A+</button>
            </div>
          </div>

          <div style={{ padding: '8px 16px 16px' }}>
            <Row label="ניגודיות גבוהה" checked={settings.highContrast} onChange={v => set('highContrast', v)} />
            <Row label="גווני אפור" checked={settings.grayscale} onChange={v => set('grayscale', v)} />
            <Row label="סמן גדול" checked={settings.bigCursor} onChange={v => set('bigCursor', v)} />
            <Row label="עצור אנימציות" checked={settings.stopAnimations} onChange={v => set('stopAnimations', v)} />
            <Row label="הדגשת קישורים" checked={settings.underlineLinks} onChange={v => set('underlineLinks', v)} />
          </div>

          <div style={{ padding: '0 16px 16px' }}>
            <button onClick={reset} style={resetBtn}>איפוס הכל</button>
          </div>
        </div>
      )}
    </>
  );
}

const fabStyle = {
  position: 'fixed', bottom: 24, left: 24, zIndex: 9999,
  width: 52, height: 52, borderRadius: '50%',
  background: '#2E4491', color: '#fff', fontSize: 24,
  border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const panelStyle = {
  position: 'fixed', bottom: 84, left: 24, zIndex: 9999,
  width: 260, background: '#fff', borderRadius: 14,
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)', direction: 'rtl',
  overflow: 'hidden',
};
const panelHeader = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 16px', background: '#2E4491', color: '#fff',
};
const closeBtn = {
  background: 'transparent', border: 'none', color: '#fff',
  fontSize: 16, cursor: 'pointer', padding: 4,
};
const rowStyle = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '8px 0', cursor: 'pointer',
};
const sizeBtn = {
  flex: 1, padding: '6px 0', border: '1px solid #ddd',
  borderRadius: 8, background: '#f4f6fc', cursor: 'pointer',
  fontWeight: 700, fontSize: 15,
};
const resetBtn = {
  width: '100%', padding: '8px 0', border: '1px solid #2E4491',
  borderRadius: 8, color: '#2E4491', background: 'transparent',
  cursor: 'pointer', fontWeight: 600, fontSize: 13,
};
const skipStyle = {
  position: 'absolute', top: -40, left: 8, zIndex: 10000,
  background: '#2E4491', color: '#fff', padding: '8px 16px',
  borderRadius: 8, textDecoration: 'none', fontSize: 14,
  transition: 'top .2s',
};
