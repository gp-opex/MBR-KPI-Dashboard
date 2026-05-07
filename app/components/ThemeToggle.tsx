'use client'

import { B, type ThemeKey } from './theme'

export default function ThemeToggle({ mode, onToggle }: { mode: ThemeKey; onToggle: () => void }) {
  const dk = mode === 'dark'
  return (
    <button
      onClick={onToggle}
      title={dk ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        position: 'relative', width: 50, height: 26, borderRadius: 13,
        border: 'none', background: dk ? 'rgba(255,255,255,0.1)' : B.cyan,
        cursor: 'pointer', padding: 0, flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: dk ? 3 : 27, width: 20, height: 20,
        borderRadius: '50%', background: '#FFF', transition: 'left 0.25s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}>
        {dk ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#231F20" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={B.navy} strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </div>
    </button>
  )
}
