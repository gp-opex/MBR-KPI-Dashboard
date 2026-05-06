# MBR & KPI Dashboard

updated

QMS section of the GroundProbe OPEX Monthly Business Review (MBR) and KPI dashboard.

A single self-contained HTML file. No install required — opens in any browser.

## Purpose

Two-fold:

1. **Hold BUs accountable for their own systems** — every metric is drillable per BU. Each BU is the primary audience for their own slice.
2. **Give the OPEX team a full cross-BU overview** for auditing and transparency.

## Single tab — Support Operations

Layout follows the v9 design with a Follow-the-Sun (24/7 desk: GPAU, GPSA, GPNA) and All BUs filter at the top.

Cards on the page (in order):

- **KPI Summary** — Calls answered, First reply time, Tickets >7 days, Tickets >30 days, Tickets closed, System uptime
- **Calls Answered** (FTS only) — per-BU acceptance rate
- **Aged Tickets** — clickable rows that expand to show each ticket with BU ownership
- **Ticket Volume Trend** — current 4 weeks vs previous 4 weeks
- **Time to First WO Creation** — per-BU strip; includes link placeholder for D365 dashboard
- **Proactive Alerts — Web-Upload** — 7-day / 30-day toggle; per-BU tile shows systems active + alarms triggered
- **System Status** — per-SSR rows with status and downtime (pending Zendesk filter)
- **Ticket Escalations** — L3 / L4 (pending Zendesk routing config)
- **Agent Check-in / Check-out** — Today / 7-day toggle, includes "Tickets solved during shift"
- **Agent Quality Metric** — table of all agents checked in over 30 days; includes Solve Rate and Non-Solved Touch Rate

## Files

- `dashboard.html` — the dashboard itself (open in a browser)
- `CLAUDE.md` — project context (data sources, queries, conventions, design rules)
- `CLAUDE-behaviors.md` — general AI coding behaviour rules
- `support_dashboard_v9.html` — earlier prototype (kept for reference)

## Data sources (all from OPEX SQL DB)

- `sup.*` schema — Zendesk tickets, metrics, calls, tags
- `proactive.*` schema — webupload presence, daily failure summary
- `logs.ProcessedFiles` — radar log uploads
- D365 link pending
- Zendesk Professional Suite features (Agent presence, System Status filter) pending

## Known issue

The OPEX SQL ETL for `sup.*` is currently behind real Zendesk by ~3 weeks (last sync 11 April 2026). The dashboard shows a staleness banner. Fix is upstream — needs the ETL pipeline restarted.

## Refreshing the data

The dashboard uses a JSON snapshot baked into `dashboard.html` (search for `const DATA =`). To refresh: re-run the SQL queries listed in `CLAUDE.md` and replace the matching values.

## Owner

QMS — Reliability & Support team, GroundProbe.
