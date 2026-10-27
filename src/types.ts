export const FARD = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const
export type Fard = (typeof FARD)[number]
export type Salaah = Fard | "witr"
export const ALL_SALAAH: readonly Salaah[] = [...FARD, "witr"]

export const SALAAH_NAMES: Record<Salaah, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
  witr: "Witr",
}

export type Status = "pending" | "on-time" | "late" | "missed"
export const STATUSES: readonly Status[] = ["pending", "on-time", "late", "missed"]

export type SalaahEntry = { status: Status; jamaah?: boolean }

export interface DayRecord {
  date: string // local YYYY-MM-DD
  salaah: Partial<Record<Salaah, SalaahEntry>>
}

export interface QazaEntry {
  id: string
  salaah: Salaah
  change: number // +N for bulk-added past qaza, -1 for a qaza prayed
  at: string // ISO timestamp
}

export interface LeaderboardUser {
  id: string
  name: string
  totalPoints: number
  weeklyPoints: number
  currentStreak: number
  avatarUrl?: string
  updatedAt?: string // when their shared stat code was generated
}

export type Theme = "light" | "dark" | "system"

export interface AppState {
  version: 1
  days: Record<string, DayRecord> // keyed by date
  qazaLog: QazaEntry[]
  currentUser: { name: string }
  leaderboardUsers: LeaderboardUser[]
  settings: { trackWitr: boolean; theme: Theme }
}
