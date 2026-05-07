# MBR KPI Dashboard — Database Schema Documentation

## Connection

| Property | Value |
|---|---|
| Server | `opex-db` |
| Schema | `sup` |
| Auth | SQL login — credentials in `.env.local` |

---

## Schema: `sup`

### Tables used by the dashboard

---

### `sup.CallRecordsWeekly`

Pre-aggregated weekly call data. **Only FTS business units have records (GPAU, GPSA, GPNA).**

| Column | Type | Notes |
|---|---|---|
| `Year` | int | Calendar year |
| `WeekNumber` | int | ISO week number |
| `WeekLabel` | varchar(68) | Human-readable label e.g. `"2026-W18"` |
| `MonthStartDate` | date | First day of the month the week falls in |
| `WeekStartDate` | date | Monday of the ISO week |
| `DayType` | varchar(7) | `"Weekday"` or `"Weekend"` |
| `BusinessUnit` | varchar(4) | `GPAU`, `GPSA`, `GPNA` |
| `TotalCalls` | int | All inbound calls |
| `AcceptedCalls` | int | Calls answered |
| `MissedCalls` | int | Calls not answered |
| `OtherCalls` | int | Other dispositions |
| `AcceptanceRate` | numeric | `AcceptedCalls / TotalCalls` (0–100) |
| `MissedRate` | numeric | `MissedCalls / TotalCalls` (0–100) |
| `AvgDurationSeconds` | int | Average call duration in seconds |
| `MovingAvgAcceptanceRate` | numeric | Rolling average acceptance rate |

**Data range:** 2024-07-28 → present

**Used by API route:** `/api/calls`

---

### `sup.TicketAnalysis`

One row per open/pending/hold ticket. Pre-computed age flags. Primary source for aged ticket KPIs.

| Column | Type | Notes |
|---|---|---|
| `TicketId` | bigint | Zendesk ticket ID |
| `BusinessUnit` | nvarchar(100) | `GPAU`, `GPSA`, `GPNA`, `GPPT`, `GPID`, `GPCN`, `GPPE`, `GPCL`, `GPBR`. **Can be NULL on recent tickets.** |
| `Subject` | nvarchar(500) | Ticket subject line |
| `Priority` | nvarchar(10) | `normal`, `high`, `urgent`, `low` |
| `Status` | nvarchar(10) | `open`, `pending`, `hold`, `closed`, `solved` |
| `CreatedDate` | date | Date ticket was created |
| `YearMonth` | nvarchar | Formatted year-month string |
| `AgeInDays` | int | Days since ticket was created (as of last sync) |
| `IsBetween7And30` | int | `1` if age is between 7 and 30 days, else `0` |
| `IsMoreThan30` | int | `1` if age exceeds 30 days, else `0` |

**Notes:**
- `BusinessUnit` is NULL on the most recently synced tickets — always filter `WHERE BusinessUnit IS NOT NULL` when grouping by BU
- Aged ticket thresholds: >7 days max allowed = 8, >30 days max allowed = 2 (GP KPI standard)

**Used by API routes:** `/api/aged-tickets`, `/api/ticket-trend`, `/api/tickets-closed`

---

### `sup.TicketMetrics`

One row per ticket. Timing metrics from Zendesk.

| Column | Type | Notes |
|---|---|---|
| `Id` | bigint | Metrics row ID |
| `TicketId` | bigint | FK → `Tickets.Id` |
| `Reopens` | bigint | Number of times ticket was reopened |
| `Replies` | bigint | Total reply count |
| `AssignedAtUtc` | smalldatetime | When ticket was assigned |
| `SolvedAtUtc` | smalldatetime | When ticket was solved |
| `ReplyTimeInMinutes` | bigint | **First reply time in minutes** (calendar hours incl. weekends) |
| `FirstResolutionTimeInMinutes` | bigint | Time to first resolution |
| `FullResolutionTimeInMinutes` | bigint | Time to full resolution |
| `AgentWaitTimeInMinutes` | bigint | Time agent spent waiting |
| `RequesterWaitTimeInMinutes` | bigint | Time requester spent waiting |
| `OnHoldTimeInMinutes` | bigint | Time ticket spent on hold |

**Notes:**
- Join to `TicketAnalysis` via `TicketId` to get `BusinessUnit`
- `ReplyTimeInMinutes` is calendar hours (not business hours) — business-hours metric pending Zendesk Pro upgrade
- Target: first reply under 100 minutes

**Used by API route:** `/api/first-reply`

---

### `sup.Tickets`

Raw Zendesk ticket data. Used as supporting reference.

| Column | Type | Notes |
|---|---|---|
| `Id` | bigint | Zendesk ticket ID |
| `CreatedAtUtc` | smalldatetime | Ticket creation timestamp (UTC) |
| `UpdatedAtUtc` | smalldatetime | Last update timestamp (UTC) |
| `Type` | nvarchar(20) | `incident`, `problem`, `question`, `task` |
| `Subject` | nvarchar(500) | Ticket subject |
| `Description` | nvarchar(MAX) | Full ticket body |
| `Priority` | nvarchar(10) | `normal`, `high`, `urgent`, `low` |
| `Status` | nvarchar(10) | `new`, `open`, `pending`, `hold`, `solved`, `closed` |
| `ViaChannel` | nvarchar(10) | `email`, `web`, `api`, `chat` |
| `FromName` | nvarchar(200) | Requester name |
| `FromAddress` | nvarchar(200) | Requester email |
| `RequesterId` | bigint | Zendesk requester ID |

**Note:** No `BusinessUnit` column — BU is stored in `TicketAnalysis`.

---

### `sup.CallRecords`

Raw call event log. Aggregated into `CallRecordsWeekly`.

| Column | Type | Notes |
|---|---|---|
| `Id` | nvarchar(50) | Call record ID |
| `ExtensionId` | bigint | Phone extension |
| `StartDateTime` | smalldatetime | Call start time |
| `DurationInSeconds` | int | Call duration |
| `CallType` | nvarchar(50) | Type classification |
| `CallDirection` | nvarchar(50) | `inbound`, `outbound` |
| `CallAction` | nvarchar(50) | Action taken |
| `CallResult` | nvarchar(50) | `accepted`, `missed`, etc. |
| `CallDescription` | nvarchar(500) | Free-text description |
| `CallFrom` | nvarchar(50) | Caller number |
| `CallFromName` | nvarchar(50) | Caller name |

---

### Views (reference only — not directly queried by API routes)

| View | Purpose |
|---|---|
| `vw_CallRecords_Enhanced` | Enriched call records with date parts, IsAccepted/IsMissed flags, ISO week |
| `vw_CallRecordsWeekly` | Same structure as `CallRecordsWeekly` table |
| `vw_TicketMetrics` | Enriched metrics with SLA buckets (rt_less_than_1hrs, rt_1_8hrs, etc.) |
| `vw_Tickets` | Enriched tickets with IsReopenedTicket, IsOneTouchTicket flags |
| `vw_TicketsByDay` | Ticket counts aggregated by day of week |

---

## Business Units Reference

| BU Code | Region | Follow the Sun (FTS) |
|---|---|---|
| `GPAU` | Australia | Yes |
| `GPSA` | South Africa | Yes |
| `GPNA` | North America | Yes |
| `GPPT` | Portugal | No |
| `GPID` | Indonesia | No |
| `GPCN` | China | No |
| `GPPE` | Peru | No |
| `GPCL` | Chile | No |
| `GPBR` | Brazil | No |

**FTS BUs** (GPAU, GPSA, GPNA) have call tracking. All BUs have ticket data.

---

## KPI Targets

| KPI | Target | Source |
|---|---|---|
| Calls answered | 100% | `sup.CallRecordsWeekly.AcceptanceRate` |
| First reply time | < 100 minutes | `sup.TicketMetrics.ReplyTimeInMinutes` |
| Tickets > 7 days open | ≤ 8 | `sup.TicketAnalysis.IsBetween7And30` + `IsMoreThan30` |
| Tickets > 30 days open | ≤ 2 | `sup.TicketAnalysis.IsMoreThan30` |

---

## API Routes → Query Mapping

| API Route | Tables | Description |
|---|---|---|
| `/api/calls` | `sup.CallRecordsWeekly` | Accepted/missed calls by FTS BU, last 7d and 30d |
| `/api/first-reply` | `sup.TicketAnalysis` + `sup.TicketMetrics` | Avg first reply time per BU, last full month |
| `/api/aged-tickets` | `sup.TicketAnalysis` | >7d and >30d counts by BU + drilldown ticket list |
| `/api/ticket-trend` | `sup.TicketAnalysis` | Tickets opened per ISO week, last 8 weeks |
| `/api/tickets-closed` | `sup.TicketAnalysis` | Closed ticket count for last full month |

---

## Sections Without DB Data (Placeholders)

| Dashboard Section | Status | Blocker |
|---|---|---|
| Time to First WO Creation | Placeholder | D365 integration pending |
| System Status | Placeholder | Zendesk filter WIP |
| Ticket Escalations | Placeholder | Zendesk L3/L4 routing config pending |
| Agent Check-in / Check-out | Placeholder | Zendesk Professional Suite pending |
| Agent Quality Metric | Placeholder | Zendesk Professional Suite pending |
