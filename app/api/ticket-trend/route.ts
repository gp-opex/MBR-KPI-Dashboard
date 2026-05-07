import { NextResponse } from 'next/server'
import { queryDb } from '@/lib/db'
import { getCached, setCached } from '@/lib/cache'
import type { TicketTrendApiResponse } from '@/lib/types'

interface TrendRow {
  Yr: number
  ISOWeek: number
  TicketCount: number
}

export async function GET() {
  const cacheKey = 'ticket-trend'
  const cached = getCached<TicketTrendApiResponse>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const rows = await queryDb<TrendRow>(`
      SELECT
          DATEPART(YEAR, CreatedDate)     AS Yr,
          DATEPART(ISO_WEEK, CreatedDate) AS ISOWeek,
          COUNT(*)                        AS TicketCount
      FROM sup.TicketAnalysis
      WHERE CreatedDate >= DATEADD(DAY, -56, CAST(GETDATE() AS DATE))
      GROUP BY DATEPART(YEAR, CreatedDate), DATEPART(ISO_WEEK, CreatedDate)
      ORDER BY Yr ASC, ISOWeek ASC
    `)

    // Take the last 8 weeks, split into previous (first 4) and current (last 4)
    const sorted = rows.slice(-8)
    const prev = sorted.slice(0, 4)
    const curr = sorted.slice(4)

    // Pad to 4 if fewer weeks returned
    while (prev.length < 4) prev.unshift({ Yr: 0, ISOWeek: 0, TicketCount: 0 })
    while (curr.length < 4) curr.unshift({ Yr: 0, ISOWeek: 0, TicketCount: 0 })

    const labels = curr.map((_, i) => i === curr.length - 1 ? 'Latest' : `Wk-${curr.length - 1 - i}`)

    const result: TicketTrendApiResponse = {
      labels,
      current: curr.map(r => r.TicketCount),
      previous: prev.map(r => r.TicketCount),
    }

    setCached(cacheKey, result, 3600)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/ticket-trend]', err)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }
}
