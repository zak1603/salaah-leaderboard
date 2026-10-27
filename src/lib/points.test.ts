import { describe, expect, it } from "vitest"

import {
  computeStats,
  currentStreak,
  dayPoints,
  entryOf,
  entryPoints,
  hasPending,
  isPrayed,
  maxDayPoints,
  pendingDays,
  prayedCount,
  totalPoints,
  weeklyPoints,
} from "@/lib/points"
import { FARD, type DayRecord, type Salaah, type SalaahEntry } from "@/types"

function day(date: string, salaah: Partial<Record<Salaah, SalaahEntry>> = {}): DayRecord {
  return { date, salaah }
}

/** All five fard with the same entry. */
function allFard(date: string, entry: SalaahEntry, extra: Partial<Record<Salaah, SalaahEntry>> = {}) {
  return day(date, { ...Object.fromEntries(FARD.map((s) => [s, entry])), ...extra })
}

function byDate(...records: DayRecord[]) {
  return Object.fromEntries(records.map((r) => [r.date, r]))
}

describe("entryPoints", () => {
  it("gives 10 pts for on-time", () => {
    expect(entryPoints("fajr", { status: "on-time" })).toBe(10)
  })

  it("adds a 5 pt Jamaah bonus to on-time", () => {
    expect(entryPoints("fajr", { status: "on-time", jamaah: true })).toBe(15)
  })

  it("gives 5 pts for late, with no Jamaah bonus", () => {
    expect(entryPoints("dhuhr", { status: "late" })).toBe(5)
    expect(entryPoints("dhuhr", { status: "late", jamaah: true })).toBe(5)
  })

  it("gives 0 pts for missed and pending", () => {
    expect(entryPoints("asr", { status: "missed" })).toBe(0)
    expect(entryPoints("asr", { status: "missed", jamaah: true })).toBe(0)
    expect(entryPoints("asr", { status: "pending" })).toBe(0)
  })

  it("gives Witr 10 pts when prayed and never a Jamaah bonus", () => {
    expect(entryPoints("witr", { status: "on-time" })).toBe(10)
    expect(entryPoints("witr", { status: "on-time", jamaah: true })).toBe(10)
    expect(entryPoints("witr", { status: "late" })).toBe(10)
    expect(entryPoints("witr", { status: "missed" })).toBe(0)
    expect(entryPoints("witr", { status: "pending" })).toBe(0)
  })
})

describe("entryOf / isPrayed", () => {
  it("treats a missing day or salaah as pending", () => {
    expect(entryOf(undefined, "fajr")).toEqual({ status: "pending" })
    expect(entryOf(day("2026-01-01"), "isha")).toEqual({ status: "pending" })
  })

  it("returns the stored entry", () => {
    expect(entryOf(day("2026-01-01", { fajr: { status: "late" } }), "fajr")).toEqual({ status: "late" })
  })

  it("counts only on-time and late as prayed", () => {
    expect(isPrayed("on-time")).toBe(true)
    expect(isPrayed("late")).toBe(true)
    expect(isPrayed("missed")).toBe(false)
    expect(isPrayed("pending")).toBe(false)
  })
})

describe("dayPoints", () => {
  it("is 0 for a day with no record", () => {
    expect(dayPoints(undefined)).toBe(0)
  })

  it("awards 15 for Fajr on time in Jamaah", () => {
    expect(dayPoints(day("2026-01-01", { fajr: { status: "on-time", jamaah: true } }))).toBe(15)
  })

  it("reaches 75 for five on-time Jamaah fard, 85 with Witr", () => {
    const d = allFard("2026-01-01", { status: "on-time", jamaah: true })
    expect(dayPoints(d)).toBe(75)
    expect(dayPoints({ ...d, salaah: { ...d.salaah, witr: { status: "on-time" } } })).toBe(85)
  })

  it("sums a mixed day", () => {
    const d = day("2026-01-01", {
      fajr: { status: "on-time", jamaah: true }, // 15
      dhuhr: { status: "on-time" }, // 10
      asr: { status: "late" }, // 5
      maghrib: { status: "missed" }, // 0
      witr: { status: "on-time" }, // 10
    })
    expect(dayPoints(d)).toBe(40)
  })
})

describe("maxDayPoints", () => {
  it("is 75 without Witr and 85 with it", () => {
    expect(maxDayPoints(false)).toBe(75)
    expect(maxDayPoints(true)).toBe(85)
  })
})

describe("totalPoints", () => {
  it("is 0 with no days", () => {
    expect(totalPoints({})).toBe(0)
  })

  it("sums every recorded day", () => {
    const days = byDate(
      allFard("2026-01-01", { status: "on-time" }), // 50
      allFard("2026-01-02", { status: "late" }) // 25
    )
    expect(totalPoints(days)).toBe(75)
  })
})

describe("weeklyPoints", () => {
  it("sums the 7 days ending today and ignores older days", () => {
    const days = byDate(
      allFard("2026-03-10", { status: "on-time" }), // today: 50
      allFard("2026-03-04", { status: "late" }), // 6 days ago: 25
      allFard("2026-03-03", { status: "on-time", jamaah: true }), // 7 days ago: excluded
      allFard("2026-03-11", { status: "on-time" }) // future: excluded
    )
    expect(weeklyPoints(days, "2026-03-10")).toBe(75)
  })

  it("crosses month boundaries using local dates", () => {
    const days = byDate(allFard("2026-02-28", { status: "late" }))
    expect(weeklyPoints(days, "2026-03-02")).toBe(25)
  })
})

describe("prayedCount / hasPending", () => {
  it("counts prayed fard only (not Witr)", () => {
    const d = day("2026-01-01", {
      fajr: { status: "on-time" },
      dhuhr: { status: "late" },
      asr: { status: "missed" },
      witr: { status: "on-time" },
    })
    expect(prayedCount(d)).toBe(2)
    expect(prayedCount(undefined)).toBe(0)
  })

  it("flags days with any fard still pending", () => {
    expect(hasPending(undefined)).toBe(true)
    expect(hasPending(day("2026-01-01", { fajr: { status: "missed" } }))).toBe(true)
    expect(hasPending(allFard("2026-01-01", { status: "missed" }))).toBe(false)
  })
})

describe("currentStreak", () => {
  const done = (date: string) => allFard(date, { status: "late" })

  it("counts today once all five are prayed", () => {
    const days = byDate(done("2026-03-08"), done("2026-03-09"), done("2026-03-10"))
    expect(currentStreak(days, "2026-03-10")).toBe(3)
  })

  it("keeps yesterday's streak alive while today is incomplete", () => {
    const days = byDate(done("2026-03-08"), done("2026-03-09"), day("2026-03-10", { fajr: { status: "on-time" } }))
    expect(currentStreak(days, "2026-03-10")).toBe(2)
  })

  it("breaks on a day with a missed fard", () => {
    const days = byDate(
      done("2026-03-07"),
      { ...done("2026-03-08"), salaah: { ...done("2026-03-08").salaah, isha: { status: "missed" } } },
      done("2026-03-09")
    )
    expect(currentStreak(days, "2026-03-10")).toBe(1)
  })

  it("is 0 with no days", () => {
    expect(currentStreak({}, "2026-03-10")).toBe(0)
  })
})

describe("computeStats", () => {
  it("combines total, weekly and streak", () => {
    const days = byDate(
      allFard("2026-01-01", { status: "on-time" }),
      allFard("2026-03-09", { status: "on-time", jamaah: true }),
      allFard("2026-03-10", { status: "on-time", jamaah: true })
    )
    expect(computeStats(days, "2026-03-10")).toEqual({
      totalPoints: 200,
      weeklyPoints: 150,
      currentStreak: 2,
    })
  })
})

describe("pendingDays", () => {
  it("is empty with no earlier records", () => {
    expect(pendingDays({}, "2026-03-10")).toEqual([])
    expect(pendingDays(byDate(day("2026-03-10")), "2026-03-10")).toEqual([])
  })

  it("lists earlier days with pending fard, including unrecorded gaps", () => {
    const days = byDate(
      day("2026-03-07", { fajr: { status: "on-time" } }),
      allFard("2026-03-08", { status: "missed" }),
      day("2026-03-10")
    )
    expect(pendingDays(days, "2026-03-10")).toEqual(["2026-03-07", "2026-03-09"])
  })
})
