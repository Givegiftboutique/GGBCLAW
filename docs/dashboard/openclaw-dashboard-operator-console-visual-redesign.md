# OpenClaw Dashboard Operator Console Visual Redesign

Sprint 25E changes the dashboard from an engineering-style report viewer into a Chinese-first operator console.

This is local-only and not production. Production remains `no-go-for-production`, `productionReady` remains false, and adapter / endpoint / auth / connection / data returned flags remain false.

## What Changed

- The shell uses a modern console layout with a dark sidebar, glass-style cards, clearer status chips, and responsive work areas.
- The home page is now an Operator Console command center.
- Agent pages focus on current Agent status and next steps.
- Task pages use a work queue card layout instead of a spreadsheet-first view.
- Reviews and RBAC pages explain safe permission simulation instead of showing raw permission dumps.
- Balance and refresh panels are presented as operator status cards.
- Raw enum, permission keys, report paths, and technical flags remain available only in collapsed technical details.

## Still Forbidden

- No production gateway connection.
- No endpoint or sign-in credential input.
- No provider external account access or scraping.
- No mutation, restart, deploy, approve, reject, backup restore, or settings update action.
# Sprint 26A Note

The modern console now includes a `本機 OpenClaw 連接` panel. It shows local read-only connector status and never adds production endpoint, auth, mutation, restart, or deploy controls.
