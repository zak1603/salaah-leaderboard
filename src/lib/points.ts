import { addDays } from "@/lib/dates"
import { ALL_SALAAH, FARD, type DayRecord, type Salaah, type SalaahEntry, type Status } from "@/types"

export const ON_TIME_POINTS = 10
export const LATE_POINTS = 5
export const JAMAAH_BONUS = 5
export const WITR_POINTS = 10

const PENDING: SalaahEntry = { status: "pending" }

export function entryOf(day: DayRecord | undefined, s: Salaah): SalaahEntry {
  return day?.salaah[s] ?? PENDING
}

export function isPrayed(status: Status) {
  return status === "on-time" || status === "late"
}

/**
 * on-time = 10 (+5 if jamaah), late = 5, missed/pending = 0.
 * Witr = 10 when prayed, never a Jamaah bonus.
 */
export function entryPoints(s: Salaah, e: SalaahEntry) {
  if (s === "witr") return isPrayed(e.status) ? WITR_POINTS : 0
  if (e.status === "on-time") return ON_TIME_POINTS + (e.jamaah ? JAMAAH_BONUS : 0)
  if (e.status === "late") return LATE_POINTS
  return 0
}

export function dayPoints(day: DayRecord | undefined) {
  if (!day) return 0
  return ALL_SALAAH.reduce((sum, s) => sum + entryPoints(s, entryOf(day, s)), 0)
}

/** 75 for the five fard (5 × 15), 85 with Witr. */
export function maxDayPoints(trackWitr: boolean) {
  return FARD.length * (ON_TIME_POINTS + JAMAAH_BONUS) + (trackWitr ? WITR_POINTS : 0)
}

export function totalPoints(days: Record<string, DayRecord>) {
  return Object.values(days).reduce((sum, d) => sum + dayPoints(d), 0)
}

/** Points over the 7 days ending on `today` (inclusive). */
export function weeklyPoints(days: Record<string, DayRecord>, today: string) {
  let sum = 0
  for (let i = 0; i < 7; i++) sum += dayPoints(days[addDays(today, -i)])
  return sum
}

export function prayedCount(day: DayRecord | undefined) {
  return FARD.filter((s) => isPrayed(entryOf(day, s).status)).length
}

export function hasPending(day: DayRecord | undefined) {
  return FARD.some((s) => entryOf(day, s).status === "pending")
}

/** Consecutive days with all five fard prayed. Today only counts once complete. */
export function currentStreak(days: Record<string, DayRecord>, today: string) {
  const complete = (k: string) => prayedCount(days[k]) === FARD.length
  let streak = 0
  let k = complete(today) ? today : addDays(today, -1)
  while (complete(k)) {
    streak++
    k = addDays(k, -1)
  }
  return streak
}

export function computeStats(days: Record<string, DayRecord>, today: string) {
  return {
    totalPoints: totalPoints(days),
    weeklyPoints: weeklyPoints(days, today),
    currentStreak: currentStreak(days, today),
  }
}

/** Earlier days (first recorded day → yesterday) with any fard still pending. */
export function pendingDays(days: Record<string, DayRecord>, today: string) {
  const first = Object.keys(days)
    .filter((k) => k < today)
    .sort()[0]
  const result: string[] = []
  if (!first) return result
  for (let k = first; k < today; k = addDays(k, 1)) {
    if (hasPending(days[k])) result.push(k)
  }
  return result
}
