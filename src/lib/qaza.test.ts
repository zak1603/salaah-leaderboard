import { describe, expect, it } from "vitest"

import { qazaBalances, qazaMadeUp, qazaTotal } from "@/lib/qaza"
import type { DayRecord, QazaEntry } from "@/types"

const missed = (date: string, ...salaah: (keyof DayRecord["salaah"])[]): DayRecord => ({
  date,
  salaah: Object.fromEntries(salaah.map((s) => [s, { status: "missed" }])),
})

const log = (salaah: QazaEntry["salaah"], change: number, at = "2026-03-01T10:00:00.000Z"): QazaEntry => ({
  id: `${salaah}-${change}-${at}`,
  salaah,
  change,
  at,
})

describe("qazaBalances", () => {
  it("adds 1 for each missed fard", () => {
    const days = { "2026-03-01": missed("2026-03-01", "fajr", "isha"), "2026-03-02": missed("2026-03-02", "fajr") }
    expect(qazaBalances({ days, qazaLog: [] })).toEqual({ fajr: 2, dhuhr: 0, asr: 0, maghrib: 0, isha: 1 })
  })

  it("removes the qaza when a missed salaah is changed back", () => {
    const days = { "2026-03-01": { date: "2026-03-01", salaah: { fajr: { status: "on-time" as const } } } }
    expect(qazaBalances({ days, qazaLog: [] }).fajr).toBe(0)
  })

  it("applies bulk additions and qaza prayed from the log", () => {
    const days = { "2026-03-01": missed("2026-03-01", "asr") }
    const qazaLog = [log("asr", 10), log("asr", -1), log("asr", -1), log("dhuhr", 3)]
    expect(qazaBalances({ days, qazaLog })).toEqual({ fajr: 0, dhuhr: 3, asr: 9, maghrib: 0, isha: 0 })
  })

  it("never goes below 0", () => {
    expect(qazaBalances({ days: {}, qazaLog: [log("maghrib", -1)] }).maghrib).toBe(0)
  })

  it("ignores Witr entries and missed Witr", () => {
    const days = { "2026-03-01": missed("2026-03-01", "witr") }
    const balances = qazaBalances({ days, qazaLog: [log("witr", 5)] })
    expect(qazaTotal(balances)).toBe(0)
  })
})

describe("qazaTotal", () => {
  it("sums every balance", () => {
    expect(qazaTotal({ fajr: 1, dhuhr: 2, asr: 3, maghrib: 4, isha: 5 })).toBe(15)
  })
})

describe("qazaMadeUp", () => {
  it("lists qaza prayed newest first, excluding bulk additions", () => {
    const qazaLog = [
      log("fajr", -1, "2026-03-01T05:00:00.000Z"),
      log("fajr", 20, "2026-03-02T05:00:00.000Z"),
      log("isha", -1, "2026-03-03T05:00:00.000Z"),
    ]
    expect(qazaMadeUp({ qazaLog }).map((e) => e.at)).toEqual([
      "2026-03-03T05:00:00.000Z",
      "2026-03-01T05:00:00.000Z",
    ])
  })
})
