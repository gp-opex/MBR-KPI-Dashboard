import { NextResponse } from 'next/server'
import { queryDb } from '@/lib/db'
import { getCached, setCached } from '@/lib/cache'
import type { CallsByBU, CallsPeriodData } from '@/lib/types'

interface CallRow {
  BusinessUnit: string
  TotalCalls: number
  AcceptedCalls: number
  MissedCalls: number
}

function buildPeriod(rows: CallRow[]): CallsPeriodData {
  const byBU: CallsByBU[] = rows.map(r => {
    const pct = r.TotalCalls > 0 ? (r.AcceptedCalls / r.TotalCalls) * 100 : 0
    return {
      bu: r.BusinessUnit,
      total: r.TotalCalls,
      accepted: r.AcceptedCalls,
      missed: r.MissedCalls,
      pct: Math.round(pct * 10) / 10,
      status: pct >= 100 ? 'good' : pct >= 80 ? 'warn' : 'bad',
    }
  })

  const totals = rows.reduce((a, r) => ({
    total: a.total + r.TotalCalls,
    accepted: a.accepted + r.AcceptedCalls,
    missed: a.missed + r.MissedCalls,
  }), { total: 0, accepted: 0, missed: 0 })

  const overallPct = totals.total > 0 ? (totals.accepted / totals.total) * 100 : 0

  return {
    overall: { ...totals, acceptedPct: Math.round(overallPct * 10) / 10 },
    byBU,
  }
}

export async function GET() {
  const cacheKey = 'calls'
  const cached = getCached<ReturnType<typeof buildPeriod>>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const [rows7, rows30] = await Promise.all([
      queryDb<CallRow>(`
        SELECT BusinessUnit,
               SUM(TotalCalls)    AS TotalCalls,
               SUM(AcceptedCalls) AS AcceptedCalls,
               SUM(MissedCalls)   AS MissedCalls
        FROM sup.CallRecordsWeekly
        WHERE WeekStartDate >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
        GROUP BY BusinessUnit
        ORDER BY BusinessUnit
      `),
      queryDb<CallRow>(`
        SELECT BusinessUnit,
               SUM(TotalCalls)    AS TotalCalls,
               SUM(AcceptedCalls) AS AcceptedCalls,
               SUM(MissedCalls)   AS MissedCalls
        FROM sup.CallRecordsWeekly
        WHERE WeekStartDate >= DATEADD(DAY, -30, CAST(GETDATE() AS DATE))
        GROUP BY BusinessUnit
        ORDER BY BusinessUnit
      `),
    ])

    const result = { last7: buildPeriod(rows7), last30: buildPeriod(rows30) }
    setCached(cacheKey, result, 3600)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/calls]', err)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }
}
