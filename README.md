# MBR & KPI Dashboard

**GroundProbe — Support Operations**  
Live OPEX Monthly Business Review and KPI dashboard built with Next.js, pulling real-time data from SQL Server via the `sup` schema.

---

## Overview

Replaces the static `dashboard.html` with a fully dynamic web app. Data is fetched server-side from the `opex-db` SQL Server instance and cached in memory, then served to the client via Next.js API routes.

**KPIs tracked:**
- Call volume & call-in rate
- Ticket volume trend (last 12 months, bar chart)
- First reply time (SLA performance by business unit)
- Aged open tickets (drilldown by BU and queue)
- Tickets closed
- Business unit filter (FTS group + individual BUs)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Frontend | React 19, Tailwind CSS v4, Chart.js 4 |
| Backend | Next.js API Routes |
| Database | SQL Server via `mssql` v12 |
| Font | Source Sans 3 (Google Fonts) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Access to `opex-db` SQL Server instance (internal network / VPN)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env.local` file in the project root:

```env
DB_SERVER=opex-db
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
```

### 3. Run the dev server

```bash
npm run dev
```

App runs at [http://localhost:3003](http://localhost:3003).

---

## Project Structure

```
app/
  api/
    calls/            # Call volume data
    aged-tickets/     # Aged open tickets with BU breakdown
    first-reply/      # First reply SLA by BU
    ticket-trend/     # 12-month ticket volume trend
    tickets-closed/   # Tickets closed count
  components/
    DashboardClient.tsx   # Main dashboard UI (client component)
    SiteHeader.tsx        # Top nav with theme toggle
    ThemeContext.tsx       # Light/dark theme provider
    ThemeToggle.tsx        # Theme toggle button
    TrendChart.tsx         # Bar chart (Chart.js wrapper)
    theme.ts               # Theme palette constants
  globals.css
  layout.tsx
  page.tsx
lib/
  db.ts       # mssql connection pool + queryDb() helper
  cache.ts    # In-memory TTL cache (30min / 1hr by endpoint)
  types.ts    # TypeScript interfaces for API responses
DB_SCHEMA.md  # Full SQL Server schema documentation
```

---

## Features

- **Live data** — fetched from SQL Server on page load, cached server-side
- **Business unit filter** — FTS group (AU + NZ + ZA) and individual BUs
- **Dark / light theme** — toggle in header, persisted via localStorage
- **Data freshness indicator** — footer shows last sync time (BNE timezone) and staleness warning if >4 hours

---

## Database

See [DB_SCHEMA.md](DB_SCHEMA.md) for full schema documentation covering all tables and views used by the API routes.

Schema: `sup` on server `opex-db`  
Key tables: `TicketAnalysis`, `TicketVolume`, `CallVolume`

---

## Notes

- D365 integration is pending
- L3/L4 ticket data pending Zendesk configuration
- `dashboard.html` in the repo root is the original static reference file
