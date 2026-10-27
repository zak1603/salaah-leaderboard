import { describe, expect, it } from "vitest"

import { addDays, dayKey, formatHijri, parseKey } from "@/lib/dates"

describe("dates", () => {
  it("keys days by local date, not UTC", () => {
    // 23:30 local is still the same local day whatever the UTC offset.
    expect(dayKey(new Date(2026, 2, 10, 23, 30))).toBe("2026-03-10")
    expect(dayKey(new Date(2026, 0, 5, 0, 15))).toBe("2026-01-05")
  })

  it("round-trips keys through parseKey", () => {
    expect(dayKey(parseKey("2026-12-31"))).toBe("2026-12-31")
  })

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01")
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31")
  })

  it("formats the Hijri date with the Umm al-Qura calendar", () => {
    expect(formatHijri("2026-03-20")).toMatch(/1447/)
  })
})
