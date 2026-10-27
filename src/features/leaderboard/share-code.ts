import type { LeaderboardUser } from "@/types"

// A stat code lets people compare totals without a server: one person shares
// a code, others paste it into "Add member".
const CODE_PREFIX = "SLB1:"

export type SharedStats = Omit<LeaderboardUser, "id">

const count = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0

export function encodeShareCode(u: SharedStats) {
  const json = JSON.stringify([u.name, u.totalPoints, u.weeklyPoints, u.currentStreak, u.updatedAt])
  const bytes = new TextEncoder().encode(json)
  return CODE_PREFIX + btoa(String.fromCharCode(...bytes))
}

export function decodeShareCode(code: string): SharedStats {
  const trimmed = code.trim()
  if (!trimmed.startsWith(CODE_PREFIX)) throw new Error("Invalid code")
  const binary = atob(trimmed.slice(CODE_PREFIX.length))
  const json = new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
  const [name, totalPoints, weeklyPoints, currentStreak, updatedAt] = JSON.parse(json)
  if (typeof name !== "string" || !name.trim()) throw new Error("Invalid code")
  return {
    name: name.slice(0, 40),
    totalPoints: count(totalPoints),
    weeklyPoints: count(weeklyPoints),
    currentStreak: count(currentStreak),
    updatedAt: typeof updatedAt === "string" ? updatedAt : new Date().toISOString(),
  }
}
