export type ThemeKey = 'dark' | 'light'

export const THEMES = {
  dark: {
    pageBg:        'linear-gradient(160deg, #1a1f2e 0%, #0d1117 50%, #00204466 100%)',
    cardBg:        '#1E1E2A',
    cardBorder:    'rgba(255,255,255,0.06)',
    text:          '#FFFFFF',
    textSec:       '#94A3B8',
    textDim:       '#64748B',
    border:        'rgba(255,255,255,0.07)',
    divider:       'rgba(255,255,255,0.07)',
    shadow:        'none',
    inputBg:       'rgba(255,255,255,0.06)',
    rowBorder:     'rgba(255,255,255,0.06)',
  },
  light: {
    pageBg:        '#F4F6F9',
    cardBg:        '#FFFFFF',
    cardBorder:    'rgba(0,51,102,0.12)',
    text:          '#1F2A37',
    textSec:       '#64748B',
    textDim:       '#94A3B8',
    border:        'rgba(0,51,102,0.08)',
    divider:       '#e2e8f0',
    shadow:        '0 1px 4px rgba(0,0,0,0.06)',
    inputBg:       '#FFFFFF',
    rowBorder:     '#e2e8f0',
  },
} as const

export type Theme = typeof THEMES[ThemeKey]

export const B = {
  navy:    '#003366',
  cyan:    '#0099CC',
  good:    '#10b981',
  warn:    '#f59e0b',
  bad:     '#ef4444',
  goodBg:  '#d1fae5',
  warnBg:  '#fef3c7',
  badBg:   '#fee2e2',
  goodFg:  '#065f46',
  warnFg:  '#92400e',
  badFg:   '#991b1b',
} as const
