import { NextResponse } from 'next/server'
import { queryDb } from '@/lib/db'
import { getCached, setCached } from '@/lib/cache'
import type { TicketsClosedApiResponse } from '@/lib/types'

interface ClosedRow {
  ClosedCount: number
  Period: string
}

interface LastUpdateRow {
  LastUpdate: string
}

export async function GET() {
  const cacheKey = 'tickets-closed'
  const cached = getCached<TicketsClosedApiResponse>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const [closedRows, updateRows] = await Promise.all([
      queryDb<ClosedRow>(`
        SELECT
            COUNT(*)                       AS ClosedCount,
            FORMAT(MAX(CreatedDate), 'MMM yyyy') AS Period
        FROM sup.TicketAnalysis
        WHERE Status IN ('closed', 'solved')
          AND CreatedDate >= DATEFROMPARTS(
                YEAR(DATEADD(MONTH, -1, GETDATE())),
                MONTH(DATEADD(MONTH, -1, GETDATE())),
                1)
          AND CreatedDate < DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
      `),
      queryDb<LastUpdateRow>(`
        SELECT TOP 1
            CONVERT(varchar(30), UpdatedAtUtc, 127) AS LastUpdate
        FROM sup.Tickets
        ORDER BY UpdatedAtUtc DESC
      `),
    ])

    const result: TicketsClosedApiResponse = {
      count: closedRows[0]?.ClosedCount ?? 0,
      period: closedRows[0]?.Period ?? '',
      lastUpdate: updateRows[0]?.LastUpdate ?? null,
    }

    setCached(cacheKey, result, 3600)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/tickets-closed]', err)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }
}
