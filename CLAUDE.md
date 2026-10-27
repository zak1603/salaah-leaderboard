# Salaah Leaderboard

Mobile-first (360 px, one-handed) app that tracks today's five fard salaah, qaza balances, point tallies and a community leaderboard. Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui (Base UI preset). No backend: all state lives in localStorage.

## Commands

- `npm run dev`: dev server
- `npm run lint`: ESLint
- `npm run build`: type-check (`tsc -b`) + production build
- `npm test`: Vitest, once. `npm run coverage` enforces 100% on `src/lib/points.ts`
- `npx shadcn@latest add <name>`: add a UI component to `src/components/ui/`

## Points (source of truth: `src/lib/points.ts`)

| Status    | Base | Jamaah bonus      | Max |
| --------- | ---- | ----------------- | --- |
| on-time   | +10  | +5 if `jamaah`    | 15  |
| late      | +5   | none              | 5   |
| missed / pending | 0 | none           | 0   |
| Witr (6th, optional) | +10 when prayed | none | 10 |

Daily max: 75 (5 × 15), 85 with Witr. Totals, weekly (7 days ending today) and streaks are always derived from `days`, never stored. A streak day has all five fard prayed (on-time or late).

Qaza balance per fard = days marked `missed` + sum of `qazaLog[].change` (+N bulk add, -1 prayed), floored at 0 (`src/lib/qaza.ts`).

## Project structure

| Path | What it does |
| --- | --- |
| `src/components/ui/` | shadcn/ui components (generated; don't hand-edit unless needed) |
| `src/features/today/` | Today screen, status picker, Jamaah toggles, tally card, day-rollover dialog |
| `src/features/qaza/` | Balances, log a qaza, bulk add, made-up history |
| `src/features/history/` | Date picker, past-day editing, points-coloured month |
| `src/features/leaderboard/` | Rankings (total, weekly, streak); share codes |
| `src/features/settings/` | Witr toggle, theme, export/import, reset |
| `src/lib/storage.ts` | The **only** code that touches localStorage: load, save, version check, migrations |
| `src/lib/dates.ts` | Local date keys and Hijri formatting |
| `src/lib/points.ts` | Pure point/tally/streak functions |
| `src/lib/qaza.ts` | Pure functions deriving qaza balances |
| `src/hooks/useAppState.ts` | React state + persistence for the whole app |
| `src/types.ts` | `AppState`, `DayRecord`, `QazaEntry`, `LeaderboardUser` |

## House rules

1. **Branch + PR.** `main` stays releasable; every task is its own branch and PR.
2. **Only `src/lib/storage.ts` touches localStorage.** Components and hooks go through it. If the `AppState` shape changes, bump `version` and add a migration in `MIGRATIONS` in the same PR. The key stays `salaah-leaderboard:v1`.
3. **Dates are local `YYYY-MM-DD` strings.** Never key a day with `toISOString()` (UTC). Use `src/lib/dates.ts`.
4. **Green before you push:** `npm run lint`, `npm run build` and `npm test` all pass, with 100% coverage of `src/lib/points.ts`. Any change to a point rule ships with a test.
