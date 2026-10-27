import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { totalPoints } from "@/lib/points"
import { qazaBalances } from "@/lib/qaza"
import {
  STORAGE_KEY,
  exportJson,
  importJson,
  initialState,
  loadState,
  parseState,
  saveState,
} from "@/lib/storage"
import type { AppState } from "@/types"

const sample: AppState = {
  version: 1,
  days: {
    "2026-03-09": {
      date: "2026-03-09",
      salaah: { fajr: { status: "on-time", jamaah: true }, dhuhr: { status: "missed" }, witr: { status: "on-time" } },
    },
    "2026-03-10": { date: "2026-03-10", salaah: { asr: { status: "late" } } },
  },
  qazaLog: [
    { id: "a", salaah: "isha", change: 4, at: "2026-03-09T20:00:00.000Z" },
    { id: "b", salaah: "isha", change: -1, at: "2026-03-10T05:00:00.000Z" },
  ],
  currentUser: { name: "Aisha" },
  leaderboardUsers: [{ id: "u1", name: "Bilal", totalPoints: 900, weeklyPoints: 300, currentStreak: 6 }],
  settings: { trackWitr: false, theme: "dark" },
}

// Newer Node versions ship a global localStorage that shadows jsdom's and
// needs a backing file, so give each test a fresh in-memory Storage.
function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  }
}

beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()))
afterEach(() => vi.unstubAllGlobals())

describe("storage", () => {
  it("saves under the versioned key and loads it back", () => {
    saveState(sample)
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
    expect(loadState()).toEqual(sample)
  })

  it("starts fresh when nothing or garbage is stored", () => {
    expect(loadState()).toEqual(initialState())
    localStorage.setItem(STORAGE_KEY, "{not json")
    expect(loadState()).toEqual(initialState())
  })

  it("export → reset → import restores days, points and qaza exactly", () => {
    const file = exportJson(sample)
    saveState(initialState())
    const restored = importJson(file)
    expect(restored).toEqual(sample)
    expect(totalPoints(restored.days)).toBe(totalPoints(sample.days))
    expect(qazaBalances(restored)).toEqual(qazaBalances(sample))
  })

  it("rejects files from other apps or unknown versions", () => {
    expect(() => parseState(null)).toThrow()
    expect(() => parseState({ foo: 1 })).toThrow()
    expect(() => parseState({ version: 99 })).toThrow()
  })

  it("drops invalid statuses, dates and log entries", () => {
    const parsed = parseState({
      version: 1,
      days: {
        "not-a-date": { salaah: { fajr: { status: "on-time" } } },
        "2026-03-10": { salaah: { fajr: { status: "great" }, asr: { status: "late", jamaah: "yes" } } },
      },
      qazaLog: [{ salaah: "fajr", change: 1.5 }, { salaah: "tahajjud", change: 1 }],
    })
    expect(parsed.days).toEqual({ "2026-03-10": { date: "2026-03-10", salaah: { asr: { status: "late" } } } })
    expect(parsed.qazaLog).toEqual([])
    expect(parsed.settings).toEqual({ trackWitr: true, theme: "system" })
  })
})
