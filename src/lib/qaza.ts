import { entryOf } from "@/lib/points"
import { FARD, type AppState, type Fard } from "@/types"

/** Balance per fard = days marked missed + qaza log changes, never below 0. */
export function qazaBalances(state: Pick<AppState, "days" | "qazaLog">): Record<Fard, number> {
  const raw = Object.fromEntries(FARD.map((s) => [s, 0])) as Record<Fard, number>
  for (const day of Object.values(state.days)) {
    for (const s of FARD) if (entryOf(day, s).status === "missed") raw[s]++
  }
  for (const e of state.qazaLog) if (e.salaah !== "witr") raw[e.salaah] += e.change
  for (const s of FARD) raw[s] = Math.max(0, raw[s])
  return raw
}

export function qazaTotal(balances: Record<Fard, number>) {
  return FARD.reduce((sum, s) => sum + balances[s], 0)
}

/** Qaza prayed (made up), newest first. */
export function qazaMadeUp(state: Pick<AppState, "qazaLog">) {
  return state.qazaLog
    .filter((e) => e.change < 0)
    .sort((a, b) => b.at.localeCompare(a.at))
}
