# MBR & KPI Dashboard

QMS section of the GroundProbe OPEX Monthly Business Review (MBR) and KPI dashboard.

A single self-contained HTML file. No install required - opens in any browser.

## Tabs

| Tab | Status | Data source |
|-----|--------|-------------|
| Zendesk Support | Live (v1) | `sup.*` schema in OPEX DB |
| D365 / Maintenance | Placeholder | `eam.*`, `ax.*` schemas |
| Proactive Support | Placeholder | `proactive.*` schema |
| About | Static | n/a |

## Files

- `dashboard.html` - the dashboard itself (open in a browser)
- `CLAUDE.md` - project context for Claude (data sources, queries, conventions)
- `CLAUDE-behaviors.md` - general AI coding behaviour rules
- `support_dashboard_v9.html` - earlier prototype (kept for reference)

## Refreshing the data

The Zendesk tab uses a JSON snapshot embedded at the bottom of `dashboard.html` (search for `const DATA =`). To refresh, re-run the SQL queries listed in `CLAUDE.md` and replace the matching arrays.

## Owner

QMS - Reliability & Support team, GroundProbe.
