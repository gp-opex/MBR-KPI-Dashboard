'use client'

import { useState, useEffect } from 'react'
import { useTheme } from './ThemeContext'
import { THEMES, B, type Theme } from './theme'
import SiteHeader from './SiteHeader'
import TrendChart from './TrendChart'
import type {
  CallsApiResponse, FirstReplyApiResponse, AgedTicketsApiResponse,
  TicketTrendApiResponse, TicketsClosedApiResponse,
} from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const FTS_BUS = ['GPAU', 'GPSA', 'GPNA'] as const
const ALL_BUS = ['GPAU', 'GPSA', 'GPNA', 'GPPT', 'GPID', 'GPCN', 'GPPE', 'GPCL', 'GPBR'] as const
type Filter = 'fts' | 'all' | typeof ALL_BUS[number]

const TARGET_CALLS = 100
const TARGET_REPLY = 100
const TARGET_AGED_7 = 8
const TARGET_AGED_30 = 2

// ─── Style helpers ────────────────────────────────────────────────────────────

function statusColor(val: number, target: number, lowerIsBetter: boolean) {
  if (lowerIsBetter) {
    if (val <= target) return B.good
    if (val <= target * 1.5) return B.warn
    return B.bad
  }
  if (val >= target) return B.good
  if (val >= target * 0.95) return B.warn
  return B.bad
}

function pillStyle(val: number, target: number, lowerIsBetter: boolean) {
  const c = statusColor(val, target, lowerIsBetter)
  const bg = c === B.good ? B.goodBg : c === B.warn ? B.warnBg : B.badBg
  const fg = c === B.good ? B.goodFg : c === B.warn ? B.warnFg : B.badFg
  return { background: bg, color: fg, fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 600 }
}

function dotStyle(val: number, target: number, lowerIsBetter: boolean) {
  return {
    width: 9, height: 9, borderRadius: '50%', flexShrink: 0 as const,
    background: statusColor(val, target, lowerIsBetter),
  }
}

function card(T: Theme) {
  return {
    background: T.cardBg,
    border: `1.5px solid ${B.cyan}`,
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    boxShadow: T.shadow,
  }
}

const accentBar = { height: '3px', background: B.cyan, borderRadius: '2px', marginBottom: '10px' }

function kpiCard(val: string | number, label: string, sub: string, subColor?: string) {
  return (
    <div style={{ background: B.navy, borderRadius: '8px', padding: '0.85rem 1rem' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#b3d4f0', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: 0 }}>{val}</p>
      <p style={{ fontSize: '11px', margin: '3px 0 0', color: subColor || '#b3d4f0' }}>{sub}</p>
    </div>
  )
}

function cardTitle(T: Theme, text: string, badge?: { label: string; color?: string }) {
  return (
    <p style={{ fontSize: '14px', fontWeight: 700, color: T.text, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const }}>
      {text}
      {badge && (
        <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 9px', borderRadius: '20px', background: badge.color || B.navy, color: '#fff' }}>
          {badge.label}
        </span>
      )}
    </p>
  )
}

function divider(T: Theme) {
  return <div style={{ height: '1px', background: T.divider, margin: '10px 0' }} />
}

function placeholderCard(T: Theme, title: string, badge: string) {
  return (
    <div style={card(T)}>
      <div style={accentBar} />
      {cardTitle(T, title, { label: badge, color: '#f59e0b' })}
      <p style={{ fontSize: '12px', color: T.textSec, margin: 0 }}>Data pending — configuration in progress.</p>
    </div>
  )
}

const twoCol: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
  gap: '12px',
  marginBottom: '12px',
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardClient() {
  const { mode } = useTheme()
  const T = THEMES[mode]

  // State
  const [filter, setFilter] = useState<Filter>('fts')
  const [callsPeriod, setCallsPeriod] = useState<'7' | '30'>('30')
  const [mrPeriod, setMrPeriod] = useState<'7' | '30'>('30')
  const [agedOpen7, setAgedOpen7] = useState(false)
  const [agedOpen30, setAgedOpen30] = useState(false)
  const [calls, setCalls] = useState<CallsApiResponse | null>(null)
  const [firstReply, setFirstReply] = useState<FirstReplyApiResponse | null>(null)
  const [agedTickets, setAgedTickets] = useState<AgedTicketsApiResponse | null>(null)
  const [ticketTrend, setTicketTrend] = useState<TicketTrendApiResponse | null>(null)
  const [ticketsClosed, setTicketsClosed] = useState<TicketsClosedApiResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/calls').then(r => r.json()).catch(() => null),
      fetch('/api/first-reply').then(r => r.json()).catch(() => null),
      fetch('/api/aged-tickets').then(r => r.json()).catch(() => null),
      fetch('/api/ticket-trend').then(r => r.json()).catch(() => null),
      fetch('/api/tickets-closed').then(r => r.json()).catch(() => null),
    ]).then(([c, fr, at, tt, tc]) => {
      setCalls(c)
      setFirstReply(fr)
      setAgedTickets(at)
      setTicketTrend(tt)
      setTicketsClosed(tc)
      setLoading(false)
    })
  }, [])

  // ── Computed KPIs ──
  const isFtsBu = (FTS_BUS as readonly string[]).includes(filter)
  const callsData = calls ? calls[`last${callsPeriod}` as 'last7' | 'last30'] : null

  let callPct = '—'
  let callsKpiSub = 'FTS only'
  if (callsData) {
    if (filter === 'fts') {
      callPct = callsData.overall.acceptedPct.toFixed(1) + '%'
      callsKpiSub = `${callsData.overall.total} calls · last ${callsPeriod}d`
    } else if (isFtsBu) {
      const b = callsData.byBU.find(x => x.bu === filter)
      callPct = b ? b.pct.toFixed(0) + '%' : '—'
      callsKpiSub = b ? `${b.total} calls · last ${callsPeriod}d` : '—'
    } else {
      callPct = '—'; callsKpiSub = 'FTS only · N/A'
    }
  }

  let avgReplyMin: number | null = null
  if (firstReply && firstReply.byBU.length > 0) {
    const buList = filter === 'all' ? firstReply.byBU
      : filter === 'fts' ? firstReply.byBU.filter(b => (FTS_BUS as readonly string[]).includes(b.bu))
      : firstReply.byBU.filter(b => b.bu === filter)
    if (buList.length > 0) {
      const totalTickets = buList.reduce((s, b) => s + b.ticketCount, 0)
      avgReplyMin = totalTickets > 0
        ? Math.round(buList.reduce((s, b) => s + b.avgMinutes * b.ticketCount, 0) / totalTickets)
        : null
    }
  }

  let v7 = 0, v30 = 0
  if (agedTickets) {
    if (filter === 'all') { v7 = agedTickets.summary.over7AllBUs; v30 = agedTickets.summary.over30AllBUs }
    else if (filter === 'fts') {
      v7  = FTS_BUS.reduce((s, bu) => s + (agedTickets.summary.byBU[bu]?.over7  || 0), 0)
      v30 = FTS_BUS.reduce((s, bu) => s + (agedTickets.summary.byBU[bu]?.over30 || 0), 0)
    } else {
      v7  = agedTickets.summary.byBU[filter]?.over7  || 0
      v30 = agedTickets.summary.byBU[filter]?.over30 || 0
    }
  }

  const agedFiltered = (agedTickets?.tickets || []).filter(t => {
    if (filter === 'all') return true
    if (filter === 'fts') return (FTS_BUS as readonly string[]).includes(t.bu)
    return t.bu === filter
  })

  // Data freshness banner
  const lastUpdate = ticketsClosed?.lastUpdate ? new Date(ticketsClosed.lastUpdate) : null
  const hoursAgo = lastUpdate ? (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60) : null
  const isStale = hoursAgo !== null && hoursAgo >= 12

  const viewLabel = filter === 'fts' ? 'Summary — Follow the Sun'
    : filter === 'all' ? 'Summary — All BUs'
    : `Summary — ${filter}`

  // ── Render ──
  return (
    <div style={{ background: T.pageBg, minHeight: '100vh', transition: 'background 0.25s' }}>
      <SiteHeader title="GroundProbe — Support Operations" />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 24px 40px' }}>

        {/* Dashboard sub-header */}
        <div style={{ background: B.navy, borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <p style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>GroundProbe — Support Operations</p>
            <p style={{ color: '#b3d4f0', fontSize: '12px', margin: '2px 0 0' }}>
              Support &amp; proactive monitoring · Snapshot {ticketsClosed?.period || '—'}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ marginBottom: '14px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: B.cyan, margin: '0 0 5px' }}>Follow the Sun — 24/7 support desk</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {(['fts', 'GPAU', 'GPSA', 'GPNA'] as Filter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ fontSize: '11px', padding: '4px 12px', border: `1.5px solid ${B.cyan}`, borderRadius: '20px', background: filter === f ? B.cyan : 'transparent', color: filter === f ? '#fff' : B.cyan, fontWeight: 500, cursor: 'pointer' }}>
                {f === 'fts' ? 'All Follow the Sun' : f}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: B.navy, margin: '0 0 5px' }}>All tickets — all BUs</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(['all', 'GPPT', 'GPID', 'GPCN', 'GPPE', 'GPCL', 'GPBR'] as Filter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ fontSize: '11px', padding: '4px 12px', border: `1.5px solid ${B.navy}`, borderRadius: '20px', background: filter === f ? B.navy : 'transparent', color: filter === f ? '#fff' : T.text, fontWeight: 500, cursor: 'pointer' }}>
                {f === 'all' ? 'All BUs' : f}
              </button>
            ))}
          </div>
        </div>

        {/* KPI grid */}
        <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: B.navy, margin: '0 0 8px' }}>{viewLabel}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '16px' }}>
          {kpiCard(
            callPct,
            'Calls answered',
            callsKpiSub,
            callPct !== '—' ? statusColor(parseFloat(callPct), TARGET_CALLS, false) : '#b3d4f0',
          )}
          {kpiCard(
            avgReplyMin !== null ? `${avgReplyMin}min` : '—',
            'First reply time',
            `Target: under ${TARGET_REPLY}min`,
            avgReplyMin !== null ? statusColor(avgReplyMin, TARGET_REPLY, true) : '#b3d4f0',
          )}
          {kpiCard(
            loading ? '—' : String(v7),
            'Tickets >7 days',
            `Max allowed: ${TARGET_AGED_7}`,
            !loading && agedTickets ? statusColor(v7, TARGET_AGED_7, true) : '#b3d4f0',
          )}
          {kpiCard(
            loading ? '—' : String(v30),
            'Tickets >30 days',
            `Max allowed: ${TARGET_AGED_30}`,
            !loading && agedTickets ? statusColor(v30, TARGET_AGED_30, true) : '#b3d4f0',
          )}
          {kpiCard(
            ticketsClosed?.count ?? '—',
            'Tickets closed',
            ticketsClosed?.period || 'Last full month',
            B.good,
          )}
          {kpiCard('—', 'System uptime', 'Placeholder', '#b3d4f0')}
        </div>

        {/* Row 1: Calls + First Reply + Aged Tickets */}
        <div style={twoCol}>

          {/* Calls Answered */}
          <div style={card(T)}>
            <div style={accentBar} />
            {cardTitle(T, 'Calls Answered', { label: 'Follow the Sun only', color: B.cyan })}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              {(['7', '30'] as const).map(p => (
                <button key={p} onClick={() => setCallsPeriod(p)} style={{ fontSize: '11px', padding: '3px 10px', border: `1.5px solid ${B.cyan}`, borderRadius: '14px', background: callsPeriod === p ? B.cyan : 'transparent', color: callsPeriod === p ? '#fff' : B.cyan, fontWeight: 500, cursor: 'pointer' }}>
                  Last {p} days
                </button>
              ))}
            </div>
            {(filter === 'all' || (!isFtsBu && filter !== 'fts')) ? (
              <p style={{ fontSize: '12px', color: T.textSec, margin: 0 }}>Call tracking applies to Follow the Sun BUs only — GPAU, GPSA, GPNA</p>
            ) : (
              <div>
                {(callsData?.byBU || [])
                  .filter(b => filter === 'fts' || b.bu === filter)
                  .map(b => (
                    <div key={b.bu} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: `1px solid ${T.rowBorder}` }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: statusColor(b.pct, TARGET_CALLS, false) }} />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: T.text, flex: 1 }}>{b.bu}</span>
                      <span style={{ fontSize: '12px', color: b.missed > 0 ? B.bad : T.textSec }}>
                        {b.pct}% {b.missed > 0 ? `— ${b.missed} missed (${b.total} total)` : `(${b.total} calls)`}
                      </span>
                    </div>
                  ))
                }
                {!loading && (!callsData || callsData.byBU.length === 0) && (
                  <p style={{ fontSize: '12px', color: T.textSec, margin: 0, fontStyle: 'italic' }}>No call data for selected period.</p>
                )}
              </div>
            )}
          </div>

          {/* First Reply Time */}
          <div style={card(T)}>
            <div style={accentBar} />
            {cardTitle(T, 'First Reply Time by BU', { label: 'Follow the Sun', color: B.cyan })}
            <p style={{ fontSize: '12px', color: T.textSec, margin: '0 0 8px' }}>
              Avg first reply, last full month ({ticketsClosed?.period || '—'}). Target: under {TARGET_REPLY} min.
            </p>
            {firstReply && firstReply.byBU.length > 0 ? (
              firstReply.byBU
                .filter(b => filter === 'all' || filter === 'fts' || b.bu === filter)
                .map(b => (
                  <div key={b.bu} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: `1px solid ${T.rowBorder}` }}>
                    <div style={dotStyle(b.avgMinutes, TARGET_REPLY, true)} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: T.text, flex: 1 }}>{b.bu}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: statusColor(b.avgMinutes, TARGET_REPLY, true) }}>
                      {b.avgMinutes}min — {b.avgMinutes <= TARGET_REPLY ? 'on target' : 'over target'}
                    </span>
                  </div>
                ))
            ) : (
              <p style={{ fontSize: '12px', color: T.textSec, margin: 0, fontStyle: 'italic' }}>
                {loading ? 'Loading…' : 'No first reply data for last full month.'}
              </p>
            )}
            {divider(T)}
            <p style={{ fontSize: '11px', color: T.textDim, margin: 0, fontStyle: 'italic' }}>
              Calendar hours (incl. weekends/overnight). Business-hours metric pending Zendesk Pro.
            </p>
          </div>

          {/* Aged Tickets */}
          <div style={card(T)}>
            <div style={accentBar} />
            <p style={{ fontSize: '14px', fontWeight: 700, color: T.text, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              Aged Tickets
              <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 9px', borderRadius: '20px', background: B.warnBg, color: B.warnFg }}>All BUs · Thresholds apply</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: T.textSec, fontWeight: 400 }}>Click to expand</span>
            </p>

            {/* >7 days row */}
            <div onClick={() => setAgedOpen7(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: `1px solid ${T.rowBorder}`, cursor: 'pointer' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: B.warn, flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: T.text, flex: 1 }}>Tickets &gt;7 days</span>
              {agedTickets && <span style={pillStyle(v7, TARGET_AGED_7, true)}>{v7} open · max {TARGET_AGED_7}</span>}
              <span style={{ color: B.cyan, fontSize: '11px', fontWeight: 700 }}>{agedOpen7 ? '▲' : '▼'}</span>
            </div>
            {agedOpen7 && (
              <div style={{ padding: '8px 0 8px 18px', borderBottom: `1px solid ${T.rowBorder}` }}>
                {agedFiltered.filter(t => t.age > 7).length === 0
                  ? <p style={{ fontSize: '12px', color: T.textSec, margin: 0, fontStyle: 'italic' }}>No tickets in this bucket for current filter.</p>
                  : <AgedTable tickets={agedFiltered.filter(t => t.age > 7)} T={T} />
                }
              </div>
            )}

            {/* >30 days row */}
            <div onClick={() => setAgedOpen30(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: `1px solid ${T.rowBorder}`, cursor: 'pointer' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: B.bad, flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: T.text, flex: 1 }}>Tickets &gt;30 days</span>
              {agedTickets && <span style={pillStyle(v30, TARGET_AGED_30, true)}>{v30} open · max {TARGET_AGED_30}</span>}
              <span style={{ color: B.cyan, fontSize: '11px', fontWeight: 700 }}>{agedOpen30 ? '▲' : '▼'}</span>
            </div>
            {agedOpen30 && (
              <div style={{ padding: '8px 0 8px 18px', borderBottom: `1px solid ${T.rowBorder}` }}>
                {agedFiltered.filter(t => t.age > 30).length === 0
                  ? <p style={{ fontSize: '12px', color: T.textSec, margin: 0, fontStyle: 'italic' }}>No tickets in this bucket for current filter.</p>
                  : <AgedTable tickets={agedFiltered.filter(t => t.age > 30)} T={T} />
                }
              </div>
            )}

            {divider(T)}
            <p style={{ fontSize: '12px', color: T.textSec, margin: 0 }}>
              Tickets &gt;30 days unacceptable per GP KPI standard. Immediate review required.
            </p>
          </div>

        </div>

        {/* Row 2: Trend + WO Placeholder */}
        <div style={twoCol}>

          <div style={card(T)}>
            <div style={accentBar} />
            {cardTitle(T, 'Ticket Volume Trend', { label: 'Last 4 wks vs previous 4 wks · All BUs' })}
            {ticketTrend
              ? <TrendChart data={ticketTrend} textColor={T.textSec} gridColor={T.border} />
              : <p style={{ fontSize: '12px', color: T.textSec, margin: 0, fontStyle: 'italic' }}>{loading ? 'Loading…' : 'No trend data available.'}</p>
            }
            {divider(T)}
            <p style={{ fontSize: '12px', color: T.textSec, margin: 0 }}>Tickets opened per ISO week across all BUs</p>
          </div>

          {/* Tickets vs Maintenance Requests card */}
          <div style={card(T)}>
            <div style={accentBar} />
            <p style={{ fontSize: '14px', fontWeight: 700, color: T.text, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const }}>
              Tickets vs Maintenance Requests
              <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 9px', borderRadius: '20px', background: '#f59e0b', color: '#fff' }}>Placeholder · D365 pending</span>
            </p>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              {(['7', '30'] as const).map(p => (
                <button key={p} onClick={() => setMrPeriod(p)} style={{ fontSize: '11px', padding: '3px 10px', border: `1.5px solid ${B.cyan}`, borderRadius: '14px', background: mrPeriod === p ? B.cyan : 'transparent', color: mrPeriod === p ? '#fff' : B.cyan, fontWeight: 500, cursor: 'pointer' }}>
                  Last {p} days
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
              {kpiCard('—', 'Tickets Created', `Zendesk · last ${mrPeriod}d`, '#b3d4f0')}
              {kpiCard('—', 'MRs Raised', `D365 · last ${mrPeriod}d`, '#b3d4f0')}
              {kpiCard('—', 'MR Coverage', '% tickets → MR', '#b3d4f0')}
            </div>
            {divider(T)}
            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.5px', color: T.text, margin: '0 0 6px' }}>MRs raised by Agent</p>
            {['Agent name', 'Agent name', 'Agent name'].map((name, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: `1px solid ${T.rowBorder}`, fontSize: '12px' }}>
                <span style={{ flex: 1, fontWeight: 700, color: T.text }}>{name}</span>
                <span style={{ color: T.textSec }}>— MRs raised</span>
              </div>
            ))}
            {divider(T)}
            <p style={{ fontSize: '11px', color: T.textSec, margin: '0 0 8px' }}>
              Tracks whether incoming tickets are resolved within Zendesk or require a Maintenance Request in D365 for business unit intervention.
            </p>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('D365 dashboard link to be configured') }}
              style={{ display: 'inline-block', fontSize: '12px', fontWeight: 700, color: '#fff', background: B.cyan, padding: '6px 14px', borderRadius: '20px', textDecoration: 'none' }}>
              Open D365 Dashboard →
            </a>
          </div>

        </div>

        {/* Row 3: System Status + Escalations */}
        <div style={twoCol}>
          {placeholderCard(T, 'System Status', 'Placeholder · Zendesk filter WIP')}
          {placeholderCard(T, 'Ticket Escalations', 'Zendesk config pending')}
        </div>

        {/* Row 4: Agent Check-in */}
        <div style={twoCol}>
          {placeholderCard(T, 'Agent Check-in / Check-out', 'Placeholder · Zendesk Pro pending')}
          {placeholderCard(T, 'Agent Quality Metric', 'Placeholder · Zendesk Pro pending')}
        </div>


      </main>
    </div>
  )
}

// ─── Aged ticket drilldown table ──────────────────────────────────────────────

function AgedTable({ tickets, T }: { tickets: { id: number; bu: string; subject: string; age: number; status: string }[]; T: Theme }) {
  return (
    <div>
      <div style={{ display: 'flex', fontSize: '10px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 0 4px', borderBottom: `1px solid ${T.rowBorder}` }}>
        <span style={{ minWidth: '65px' }}>Ticket #</span>
        <span style={{ flex: 1 }}>Subject</span>
        <span style={{ minWidth: '55px', textAlign: 'center' }}>BU</span>
        <span style={{ minWidth: '50px', textAlign: 'right' }}>Age</span>
        <span style={{ minWidth: '65px', textAlign: 'right' }}>Status</span>
      </div>
      {tickets.map(t => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${T.rowBorder}`, fontSize: '12px' }}>
          <span style={{ minWidth: '65px', fontWeight: 700, color: B.cyan }}>#{t.id}</span>
          <span style={{ flex: 1, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{t.subject}</span>
          <span style={{ minWidth: '55px', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px', background: B.cyan, color: '#fff' }}>{t.bu}</span>
          </span>
          <span style={{ minWidth: '50px', textAlign: 'right', fontWeight: 700, color: t.age > 30 ? B.bad : B.warn }}>{t.age}d</span>
          <span style={{ minWidth: '65px', textAlign: 'right', color: T.textSec, textTransform: 'capitalize' }}>{t.status}</span>
        </div>
      ))}
    </div>
  )
}
