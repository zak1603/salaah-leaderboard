// The only module that touches localStorage.
import { DATE_KEY_RE } from "@/lib/dates"
import {
  ALL_SALAAH,
  STATUSES,
  type AppState,
  type DayRecord,
  type LeaderboardUser,
  type Salaah,
  type SalaahEntry,
  type Status,
  type Theme,
} from "@/types"

export const STORAGE_KEY = "salaah-leaderboard:v1"
export const CURRENT_VERSION = 1

/**
 * Upgrades from older shapes, keyed by the version they upgrade *from*.
 * When AppState changes: bump CURRENT_VERSION and add a step here.
 */
const MIGRATIONS: Record<number, (raw: Record<string, unknown>) => Record<string, unknown>> = {}

export function initialState(): AppState {
  return {
    version: 1,
    days: {},
    qazaLog: [],
    currentUser: { name: "Me" },
    leaderboardUsers: [],
    settings: { trackWitr: true, theme: "system" },
  }
}

/* ---------- validation ---------- */

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v)
const count = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0
const str = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback)

function migrate(raw: Obj): Obj {
  let data = raw
  let version = typeof data.version === "number" ? data.version : 0
  while (version < CURRENT_VERSION) {
    const step = MIGRATIONS[version]
    if (!step) throw new Error(`No migration from version ${version}`)
    data = step(data)
    version = data.version as number
  }
  if (version !== CURRENT_VERSION) throw new Error(`Unsupported version ${version}`)
  return data
}

function normalizeDay(date: string, raw: unknown): DayRecord {
  const day: DayRecord = { date, salaah: {} }
  const salaah = isObj(raw) && isObj(raw.salaah) ? raw.salaah : {}
  for (const s of ALL_SALAAH) {
    const e = salaah[s]
    if (!isObj(e) || !STATUSES.includes(e.status as Status)) continue
    const entry: SalaahEntry = { status: e.status as Status }
    if (e.jamaah === true) entry.jamaah = true
    day.salaah[s] = entry
  }
  return day
}

function normalizeUser(u: Obj): LeaderboardUser {
  return {
    id: str(u.id, crypto.randomUUID()),
    name: str(u.name, "Unknown").slice(0, 40),
    totalPoints: count(u.totalPoints),
    weeklyPoints: count(u.weeklyPoints),
    currentStreak: count(u.currentStreak),
    ...(typeof u.avatarUrl === "string" && { avatarUrl: u.avatarUrl }),
    ...(typeof u.updatedAt === "string" && { updatedAt: u.updatedAt }),
  }
}

/** Migrates and coerces untrusted JSON into a valid AppState. Throws if unusable. */
export function parseState(input: unknown): AppState {
  if (!isObj(input)) throw new Error("Not a salaah-leaderboard file")
  const raw = migrate(input)
  const base = initialState()
  const settings = isObj(raw.settings) ? raw.settings : {}
  const user = isObj(raw.currentUser) ? raw.currentUser : {}

  const days: Record<string, DayRecord> = {}
  if (isObj(raw.days)) {
    for (const [k, v] of Object.entries(raw.days)) {
      if (DATE_KEY_RE.test(k)) days[k] = normalizeDay(k, v)
    }
  }

  return {
    version: 1,
    days,
    qazaLog: Array.isArray(raw.qazaLog)
      ? raw.qazaLog
          .filter(isObj)
          .filter((e) => ALL_SALAAH.includes(e.salaah as Salaah) && Number.isInteger(e.change))
          .map((e) => ({
            id: str(e.id, crypto.randomUUID()),
            salaah: e.salaah as Salaah,
            change: e.change as number,
            at: str(e.at, new Date().toISOString()),
          }))
      : [],
    currentUser: { name: str(user.name, base.currentUser.name).slice(0, 40) },
    leaderboardUsers: Array.isArray(raw.leaderboardUsers)
      ? raw.leaderboardUsers.filter(isObj).map(normalizeUser)
      : [],
    settings: {
      trackWitr: settings.trackWitr !== false,
      theme: (["light", "dark", "system"] as Theme[]).includes(settings.theme as Theme)
        ? (settings.theme as Theme)
        : "system",
    },
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return parseState(JSON.parse(raw))
  } catch {
    // Corrupt or foreign data: start fresh rather than crash.
  }
  return initialState()
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function exportJson(state: AppState) {
  return JSON.stringify(state, null, 2)
}

export function importJson(text: string): AppState {
  return parseState(JSON.parse(text))
}
