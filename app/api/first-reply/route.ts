import { NextResponse } from 'next/server'
import { queryDb } from '@/lib/db'
import { getCached, setCached } from '@/lib/cache'
import type { FirstReplyApiResponse } from '@/lib/types'

interface ReplyRow {
  BusinessUnit: string
  AvgReplyMinutes: number
  TicketCount: number
}

export async function GET() {
  const cacheKey = 'first-reply'
  const cached = getCached<FirstReplyApiResponse>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const rows = await queryDb<ReplyRow>(`
      SELECT
          ta.BusinessUnit,
          AVG(CAST(tm.ReplyTimeInMinutes AS FLOAT)) AS AvgReplyMinutes,
          COUNT(*) AS TicketCount
      FROM sup.TicketAnalysis ta
      JOIN sup.TicketMetrics tm ON ta.TicketId = tm.TicketId
      WHERE ta.BusinessUnit IS NOT NULL
        AND tm.ReplyTimeInMinutes IS NOT NULL
        AND tm.ReplyTimeInMinutes > 0
        AND ta.CreatedDate >= DATEFROMPARTS(
              YEAR(DATEADD(MONTH, -1, GETDATE())),
              MONTH(DATEADD(MONTH, -1, GETDATE())),
              1)
        AND ta.CreatedDate < DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
      GROUP BY ta.BusinessUnit
      ORDER BY ta.BusinessUnit
    `)

    const result: FirstReplyApiResponse = {
      targetMinutes: 100,
      byBU: rows.map(r => ({
        bu: r.BusinessUnit,
        avgMinutes: Math.round(r.AvgReplyMinutes),
        ticketCount: r.TicketCount,
      })),
    }

    setCached(cacheKey, result, 3600)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/first-reply]', err)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }
}
