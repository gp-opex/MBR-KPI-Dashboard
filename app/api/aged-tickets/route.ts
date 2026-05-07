import { NextResponse } from 'next/server'
import { queryDb } from '@/lib/db'
import { getCached, setCached } from '@/lib/cache'
import type { AgedTicketsApiResponse, AgedTicket } from '@/lib/types'

interface SummaryRow {
  BusinessUnit: string
  Over7: number
  Over30: number
}

interface TicketRow {
  TicketId: number
  BusinessUnit: string
  Subject: string
  AgeInDays: number
  Status: string
}

export async function GET() {
  const cacheKey = 'aged-tickets'
  const cached = getCached<AgedTicketsApiResponse>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const [summaryRows, ticketRows] = await Promise.all([
      queryDb<SummaryRow>(`
        SELECT
            BusinessUnit,
            SUM(IsBetween7And30) + SUM(IsMoreThan30) AS Over7,
            SUM(IsMoreThan30)                         AS Over30
        FROM sup.TicketAnalysis
        WHERE BusinessUnit IS NOT NULL
        GROUP BY BusinessUnit
        ORDER BY BusinessUnit
      `),
      queryDb<TicketRow>(`
        SELECT
            TicketId,
            BusinessUnit,
            Subject,
            AgeInDays,
            Status
        FROM sup.TicketAnalysis
        WHERE BusinessUnit IS NOT NULL
          AND (IsBetween7And30 = 1 OR IsMoreThan30 = 1)
        ORDER BY AgeInDays DESC
      `, 200),
    ])

    const byBU: Record<string, { over7: number; over30: number }> = {}
    let over7AllBUs = 0
    let over30AllBUs = 0

    for (const r of summaryRows) {
      byBU[r.BusinessUnit] = { over7: r.Over7, over30: r.Over30 }
      over7AllBUs += r.Over7
      over30AllBUs += r.Over30
    }

    const tickets: AgedTicket[] = ticketRows.map(r => ({
      id: r.TicketId,
      bu: r.BusinessUnit,
      subject: r.Subject,
      age: r.AgeInDays,
      status: r.Status,
    }))

    const result: AgedTicketsApiResponse = {
      summary: { over7AllBUs, over30AllBUs, target7: 8, target30: 2, byBU },
      tickets,
    }

    setCached(cacheKey, result, 1800)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/aged-tickets]', err)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }
}
