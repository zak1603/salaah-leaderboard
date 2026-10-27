/** Local-time YYYY-MM-DD key. Never use toISOString() for day keys (it's UTC). */
export function dayKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function todayKey() {
  return dayKey(new Date())
}

export function parseKey(key: string) {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, n: number) {
  const date = parseKey(key)
  date.setDate(date.getDate() + n)
  return dayKey(date)
}

export const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/

const gregorianFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
})
const hijriFmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

export function formatGregorian(key: string) {
  return gregorianFmt.format(parseKey(key))
}

export function formatHijri(key: string) {
  return hijriFmt.format(parseKey(key))
}
