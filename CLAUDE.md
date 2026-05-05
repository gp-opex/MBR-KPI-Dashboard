# CLAUDE.md - OPEX MBR & KPI Dashboard

**Always also read:** @CLAUDE-behaviors.md (general coding behavior rules - apply on every task in this project).

---

## Project Overview

This project builds the **QMS section** of the OPEX Monthly Business Review (MBR) & KPI dashboard. It is one of several team-member sections that combine into a single business-wide dashboard for GroundProbe.

## Purpose & Audience (drives every design decision)

The dashboard exists for two reasons, and every card / tile / metric should serve at least one of them:

1. **Hold BUs accountable for their own systems.** Each BU is the primary audience for their own slice. They should be able to filter to their BU and see exactly what they own and what's outstanding.
2. **Give the OPEX team a full cross-BU overview** for auditing and transparency. The "All BUs" view is the OPEX lens.

**Design rules that follow from this:**
- Every metric must be drillable per BU. No BU-aggregate-only numbers. If a card can only show a total, it doesn't belong here.
- Per-BU strips/tables are preferred over single rolled-up numbers — accountability requires names against numbers.
- Filter logic always applies. Filter to a BU = that BU's accountability view. No filter = audit view.
- Transparency over privacy: every BU can see every other BU's numbers. That's the point.

- **Owner:** QMS (Reliability & Support team)
- **Audience:** Whole business - leadership, operations, support teams
- **Format:** Single self-contained HTML file, no install required, opens in any browser
- **Charts:** Pure CSS/JS bar trends (no external chart library) - keeps the file portable
- **Main file:** `dashboard.html`
- **Layout:** v9 - "GroundProbe Support Operations" - Follow-the-Sun + All BUs filter

## Owner Background

- 9 years mechanical fitter & turner experience
- 4 years at GroundProbe: 2 yrs Field Service Tech, 2 yrs Reliability & Support
- Coding beginner - prefers clear explanations, procedure-style guidance, no jargon
- Strong technical reviewer - writes procedures and troubleshooting guides

When working with this owner: keep explanations short, name files and line numbers, avoid over-engineering, treat the code like a procedure (steps that can be followed).

## Tabs in the Dashboard

| Tab | Status | Data source |
|-----|--------|-------------|
| Support Operations | Live (v1.3, v9 layout) | `sup.*` schema in OPEX DB |
| D365 / Maintenance | Placeholder | `eam.*`, `ax.*`, `dbo.EntAsset*` schemas |
| Proactive Support | Placeholder | `proactive.*` schema |
| Agent Check-in | Placeholder | Zendesk Professional Suite (pending - integration meeting in progress) |
| About | Static | n/a |

The Support Operations tab is the only one with real data right now. The other tabs are styled placeholders ready to be wired up later, alongside the rest of the team's builds.

## Follow-the-Sun (FTS) vs All BUs

The Support Operations tab splits BUs into two filter groups:

- **Follow the Sun (FTS) - 24/7 desk:** `GPAU`, `GPSA`, `GPNA` - cyan filter buttons
- **All BUs (general):** `GPPT`, `GPID`, `GPCN`, `GPPE`, `GPCL`, `GPBR` - navy filter buttons

Some KPIs only apply to FTS (Calls Answered, Agent Check-in). When a non-FTS filter is active, those cards switch to a "not applicable" message. Filter logic is `applyFilter(filter)` in the JS - rows are tagged with `data-bu="GPAU,fts"` etc.

## Support Operations Tab - v9 Layout

Sections from top to bottom:

1. **Sub-header card** (navy) - title + snapshot date + version badge
2. **Filter section** - FTS row + All BUs row
3. **KPI Summary** (6 dark navy cards) - Calls answered, First reply time, Tickets >7 days, Tickets >30 days, Tickets closed, System uptime
4. **Two-col row 1:** Calls Answered (FTS only) | Aged Tickets thresholds
5. **Two-col row 2:** Ticket Volume Trend (current vs previous 4 weeks) | Time to First WO Creation (placeholder, D365 wiring pending)
6. **Two-col row 3:** Proactive Alerts (placeholder) | System Status (derived from open tickets)
7. **Two-col row 4:** Ticket Escalations (Zendesk config pending) | Agent Check-in (placeholder, no source yet)
8. **Footer text** - source attribution

KPI thresholds baked into the layout (per GP standards):
- Calls answered target: 100%
- First reply time target: under 100 min
- Tickets >7 days max: 8
- Tickets >30 days max: 2 (any number above is unacceptable)

## Data Source - OPEX SQL Database

Connection is via the `mcp__opex-db__*` tools available in this Cowork session.

**Key views used by the Support Operations tab:**

- `sup.TicketAnalysis` - per-ticket: TicketId, BusinessUnit, Subject, Priority, Status, CreatedDate, YearMonth, AgeInDays, IsBetween7And30, IsMoreThan30
- `sup.vw_Tickets` - ticket flags: ViaChannel, IsReopenedTicket, IsOneTouchTicket, TicketType
- `sup.TicketMetricsAnalysis` - SLA per ticket: FirstResolutionTimeInHours, FullResolutionTimeInHours, ReplyTimeInHours, ReplyTimeSLAMet, ResolutionTimeSLAMet
- `sup.vw_TicketsByDay` - one row per ticket with DayOfWeek (aggregate ourselves)
- `sup.CallRecordsWeekly` - per BU per week: TotalCalls, AcceptedCalls, MissedCalls, AcceptanceRate (FTS BUs only)
- `sup.vw_CallRecords_Enhanced` - per call: CallDate, CallType, CallDirection, IsAccepted, IsMissed, BU mapping
- `sup.TicketTags` - **best source for BU on open/aged tickets** - tags `gpau`, `gpbr`, `gpna`, `gpsa`, `gpcn`, `gpcl`, `gpid`, `gppe`, `gppt`, `gpru`, `gpco`
- `sup.TicketCustomFields` - custom field "BU owning SSR" (TicketFieldId = `29407458`) - filled on ~99% of tickets but missing on most aged-open ones
- `sup.TicketFields` - dictionary of custom field IDs and titles

## Resolving Business Unit (BU) for a Ticket

`sup.TicketAnalysis.BusinessUnit` is **NULL on most aged-open tickets**, so for any BU breakdown of open tickets the join must fall back to tags. Recommended SQL pattern:

```sql
-- Resolve BU with priority: TicketAnalysis -> Tag
SELECT ta.TicketId,
       UPPER(COALESCE(
         ta.BusinessUnit,
         (SELECT TOP 1 Tag FROM sup.TicketTags
          WHERE TicketId = ta.TicketId
            AND Tag IN ('gpau','gpbr','gpna','gpsa','gpcn','gpcl','gpid','gppe','gppt','gpru','gpco'))
       )) AS BU
FROM sup.TicketAnalysis ta;
```

The custom field "BU owning SSR" is also available (`TicketCustomFields.Value` where `TicketFieldId = 29407458`) but tags are higher coverage on open tickets so prefer tags as the fallback.

**Data freshness pattern:** The dashboard currently uses a **JSON snapshot** baked into the bottom of `dashboard.html` (search for `const DATA =`). To refresh, re-run the build queries and replace the snapshot.

**KNOWN ISSUE - opex-db ETL lag:** The opex-db sync of Zendesk data has historically been weeks behind real Zendesk. Always check freshness BEFORE pulling data:

```sql
SELECT MAX(CreatedAtUtc) AS LatestCreated,
       MAX(UpdatedAtUtc) AS LatestUpdated,
       GETDATE()         AS DBNow,
       DATEDIFF(day, MAX(UpdatedAtUtc), GETDATE()) AS LagDays
FROM sup.Tickets;
```

If `LagDays > 7`, the ">7 days outstanding" KPI will under-report because tickets created in the last 7-30 days won't be in the database yet. Show a staleness banner on the dashboard in that case (search `Data is stale` in dashboard.html for the existing pattern).

## How to Refresh the Support Operations Data

1. Run these queries against `opex-db` and capture the results.
2. Replace the matching values inside the `DATA` object in `dashboard.html`.
3. Update `DATA.buildDate` to today.
4. Save - open the file in a browser to verify.

**Queries used by v1.1 (v9 layout):**

```sql
-- 1. Calls answered (FTS only, last 4 weeks) -> DATA.calls
SELECT BusinessUnit,
       AVG(CAST(AcceptanceRate AS FLOAT)) AS AvgAcceptance,
       SUM(TotalCalls)    AS TotalCalls,
       SUM(AcceptedCalls) AS AcceptedCalls,
       SUM(MissedCalls)   AS MissedCalls
FROM sup.CallRecordsWeekly
WHERE WeekStartDate >= DATEADD(week,-4,GETDATE())
GROUP BY BusinessUnit
ORDER BY TotalCalls DESC;

-- 2. Aged open tickets by BU -> DATA.aged.byBU
-- Note: "Over7Total" = tickets aged > 7 days (includes > 30 day ones).
--       This is what the "Tickets >7 days" KPI on the dashboard expects.
-- Uses TAG fallback because TicketAnalysis.BusinessUnit is NULL on most open tickets.
WITH resolved AS (
  SELECT ta.TicketId,
         ta.IsBetween7And30,
         ta.IsMoreThan30,
         ta.AgeInDays,
         UPPER(COALESCE(
           ta.BusinessUnit,
           (SELECT TOP 1 Tag FROM sup.TicketTags
            WHERE TicketId = ta.TicketId
              AND Tag IN ('gpau','gpbr','gpna','gpsa','gpcn','gpcl','gpid','gppe','gppt','gpru','gpco'))
         )) AS BU
  FROM sup.TicketAnalysis ta
  WHERE ta.Status IN ('open','pending','new','hold')
)
SELECT BU,
       COUNT(*)                                  AS OpenCount,
       SUM(IsBetween7And30)                      AS Aged7to30,
       SUM(IsMoreThan30)                         AS Over30,
       SUM(IsBetween7And30) + SUM(IsMoreThan30)  AS Over7Total,
       MAX(AgeInDays)                            AS MaxAge
FROM resolved
GROUP BY BU
ORDER BY Over7Total DESC;

-- 3. Aged open totals (all BUs) -> DATA.aged.over7AllBUs / over30AllBUs
-- over7AllBUs takes Over7Total here (NOT Aged7to30 alone).
SELECT
  SUM(CASE WHEN Status IN ('open','pending','new','hold') AND (IsBetween7And30=1 OR IsMoreThan30=1) THEN 1 ELSE 0 END) AS Over7Total,
  SUM(CASE WHEN Status IN ('open','pending','new','hold') AND IsMoreThan30=1                                THEN 1 ELSE 0 END) AS Over30Total
FROM sup.TicketAnalysis;

-- 4. Weekly ticket volume (last 8 weeks) -> DATA.trend (split into current 4 + previous 4)
SELECT TOP 12
       DATEPART(iso_week, CreatedDate) AS Wk,
       YEAR(CreatedDate)               AS Yr,
       MIN(CreatedDate)                AS WeekStart,
       COUNT(*)                        AS Tickets
FROM sup.TicketAnalysis
WHERE CreatedDate IS NOT NULL
GROUP BY YEAR(CreatedDate), DATEPART(iso_week, CreatedDate)
ORDER BY Yr DESC, Wk DESC;

-- 5. First reply time + tickets closed (last full month) -> DATA.firstReply, DATA.ticketsClosed
SELECT TOP 1 YearMonth,
             AVG(CAST(ReplyTimeInHours AS FLOAT)) * 60 AS AvgReplyMinutes
FROM sup.TicketMetricsAnalysis
WHERE YearMonth IS NOT NULL
GROUP BY YearMonth
ORDER BY YearMonth DESC;

SELECT TOP 1 YearMonth,
             SUM(CASE WHEN Status IN ('solved','closed') THEN 1 ELSE 0 END) AS Closed
FROM sup.TicketAnalysis
WHERE CreatedDate IS NOT NULL
GROUP BY YearMonth
ORDER BY YearMonth DESC;
```

> Tip: when the snapshot data is several weeks old, the latest YearMonth above will lag the wall-clock date. The dashboard labels its sub-header with `DATA.buildDate` so the lag is visible.

## Dashboard File Structure

`dashboard.html` is one self-contained file with three sections:

1. **CSS** (`<style>` block at top) - all design tokens are CSS variables under `:root`.
2. **HTML body** - app header, tab nav, four `<section class="tab-content">` blocks (one per tab).
3. **JS** (`<script>` block at bottom) - `DATA` snapshot object, tab-switching code, `applyFilter(filter)`, `renderKpis(filter)`, and the `buildTrend()` IIFE for the bar trend.

**v9 colour palette (use CSS variables, do not hard-code hex):**

| Variable | Hex | Use |
|----------|-----|-----|
| `--navy` | `#003366` | App header, KPI card background, primary text |
| `--cyan` | `#0099CC` | FTS filter accent, card border, accent bar, version badge |
| `--navy-text-soft` | `#b3d4f0` | Sub-text on dark navy backgrounds |
| `--grey-card` | `#D9D9D9` | Card background |
| `--grey-border` | `#b3b3b3` | Dividers and card borders |
| `--good` / `--good-soft` | `#10b981` / `#6ee7b7` | OK status |
| `--warn` / `--warn-soft` | `#f59e0b` / `#fcd34d` | Caution status |
| `--bad` / `--bad-soft` | `#ef4444` / `#fca5a5` | Threshold breached |

## Conventions for This Project

- **Don't break the single-file pattern.** Everything stays in `dashboard.html` so the file can be emailed or dropped on SharePoint without dependencies. No external JS/CSS libraries.
- **Don't use localStorage / sessionStorage** - dashboards may be opened from restricted intranet locations.
- **Use CSS variables, not hard-coded colours** - they're all defined in `:root`. Match the v9 palette above.
- **KPI sub-text colour rule:** `kpi-good` (green) for tracking well, `kpi-warn` (amber) for caution, `kpi-bad` (red) for breach, `kpi-muted` for placeholder/unavailable. Big number stays white on navy.
- **Don't invent data.** Every number visible must trace back to a query in this file. If a data source isn't available yet, show `—` (em-dash) and a `Placeholder` badge so it's visible the value is pending.
- **FTS-only metrics** (Calls Answered, Agent Check-in) must show a "not applicable" message when filter is non-FTS, never a number.
- **Add new tabs by copying an existing placeholder** - matches the pattern used by other team members.
- **Each card needs a header badge** indicating data state: `b-fts` (cyan, FTS-only), `b-warn` (amber, placeholder), `b-draft` (white, derived/draft), `b-db` (navy, live DB).

## Future Work / Backlog

**Wire up placeholder cards on the Support Operations tab:**
- **Time to First WO Creation** - need D365 link (avg time from OPEX alert to BU work order creation, by BU)
- **Proactive Alerts** - from `proactive.DailyFailureSummary` + `proactive.NotificationLog`
- **System Status** - currently placeholder. Awaiting the live system-status feed (source TBC).
- **L3 / L4 Escalations** - waiting on Zendesk routing config
- **Agent Check-in / Check-out** - need a roster source

**Other tabs:**
- Wire up D365 tab from `eam.MaintenanceRequestAge`, `eam.AssetFaultsByFaultCause`, `opex.MonthlyAvailability`, `opex.DowntimeAvailability`.
- Wire up Proactive tab from `proactive.DailyFailureSummary`, `proactive.NotificationLog`, `proactive.vw_*Failures` views.

**Cross-cutting:**
- Build a Cowork live-artifact version that pulls fresh data on every reload (no manual refresh).
- Coordinate with other team members on a single landing page that links to each section.
- ~~BU-tagging gap on open tickets~~ - resolved via tag fallback (see "Resolving Business Unit (BU) for a Ticket" section). Long-term: fix the upstream so `TicketAnalysis.BusinessUnit` populates on open tickets too.

## Glossary

- **MBR** - Monthly Business Review
- **KPI** - Key Performance Indicator
- **BU** - Business Unit (GPAU, GPBR, GPNA, GPSA, GPCN, GPCL, GPID, GPPE, GPPT)
- **FTS** - Follow the Sun: 24/7 support desk rotation across GPAU + GPSA + GPNA
- **SLA** - Service Level Agreement (reply time / resolution time targets)
- **One-touch ticket** - resolved without needing a follow-up reply
- **Reopened ticket** - solved/closed and then re-opened by the requester
- **WO** - Work Order (D365 record raised by a BU after an alert)
- **L3 / L4** - Tier 3 / Tier 4 escalation levels in the Zendesk routing
