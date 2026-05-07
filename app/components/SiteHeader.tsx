'use client'

import { useTheme } from './ThemeContext'
import ThemeToggle from './ThemeToggle'
import { THEMES } from './theme'

export default function SiteHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { mode, toggle } = useTheme()
  const T = THEMES[mode]

  return (
    <header style={{ backgroundColor: '#003366', borderBottom: `1px solid ${T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.4px', color: '#FFFFFF' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '11px', color: '#b3d4f0', marginTop: '2px' }}>{subtitle}</div>}
        </div>
        <ThemeToggle mode={mode} onToggle={toggle} />
      </div>
    </header>
  )
}
