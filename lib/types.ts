export interface CallsByBU {
  bu: string
  total: number
  accepted: number
  missed: number
  pct: number
  status: 'good' | 'warn' | 'bad'
}

export interface CallsPeriodData {
  overall: { total: number; accepted: number; missed: number; acceptedPct: number }
  byBU: CallsByBU[]
}

export interface CallsApiResponse {
  last7: CallsPeriodData
  last30: CallsPeriodData
}

export interface FirstReplyBU {
  bu: string
  avgMinutes: number
  ticketCount: number
}

export interface FirstReplyApiResponse {
  targetMinutes: number
  byBU: FirstReplyBU[]
}

export interface AgedTicket {
  id: number
  bu: string
  subject: string
  age: number
  status: string
}

export interface AgedTicketsApiResponse {
  summary: {
    over7AllBUs: number
    over30AllBUs: number
    target7: number
    target30: number
    byBU: Record<string, { over7: number; over30: number }>
  }
  tickets: AgedTicket[]
}

export interface TicketTrendApiResponse {
  labels: string[]
  current: number[]
  previous: number[]
}

export interface TicketsClosedApiResponse {
  count: number
  period: string
  lastUpdate: string | null
}
