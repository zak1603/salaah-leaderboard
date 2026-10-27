import * as React from "react"

import { todayKey } from "@/lib/dates"
import { initialState, loadState, saveState } from "@/lib/storage"
import { watchTheme } from "@/lib/theme"
import type { AppState, DayRecord, Fard, Salaah, Status } from "@/types"

type Actions = {
  setStatus: (date: string, salaah: Salaah, status: Status) => void
  setJamaah: (date: string, salaah: Fard, jamaah: boolean) => void
  setSettings: (settings: Partial<AppState["settings"]>) => void
  setName: (name: string) => void
  replaceState: (state: AppState) => void
  reset: () => void
}

type Ctx = { state: AppState; today: string; actions: Actions }

const AppStateContext = React.createContext<Ctx | null>(null)

/** Local date key that rolls over at midnight and when the tab regains focus. */
function useToday() {
  const [today, setToday] = React.useState(todayKey)
  React.useEffect(() => {
    const refresh = () => setToday(todayKey())
    const id = window.setInterval(refresh, 30_000)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [])
  return today
}

function updateDay(s: AppState, date: string, fn: (day: DayRecord) => DayRecord): AppState {
  const day = s.days[date] ?? { date, salaah: {} }
  return { ...s, days: { ...s.days, [date]: fn(day) } }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const today = useToday()
  const [state, setState] = React.useState(loadState)

  React.useEffect(() => saveState(state), [state])
  React.useEffect(() => watchTheme(state.settings.theme), [state.settings.theme])

  const actions = React.useMemo<Actions>(
    () => ({
      setStatus: (date, salaah, status) =>
        setState((s) =>
          updateDay(s, date, (day) => {
            const prev = day.salaah[salaah]
            // Jamaah only applies to on-time fard; drop it otherwise.
            const jamaah = status === "on-time" && prev?.jamaah === true
            return {
              ...day,
              salaah: { ...day.salaah, [salaah]: jamaah ? { status, jamaah } : { status } },
            }
          })
        ),

      setJamaah: (date, salaah, jamaah) =>
        setState((s) =>
          updateDay(s, date, (day) => {
            const status = day.salaah[salaah]?.status ?? "pending"
            if (status !== "on-time") return day
            return {
              ...day,
              salaah: { ...day.salaah, [salaah]: jamaah ? { status, jamaah } : { status } },
            }
          })
        ),

      setSettings: (settings) =>
        setState((s) => ({ ...s, settings: { ...s.settings, ...settings } })),

      setName: (name) => setState((s) => ({ ...s, currentUser: { name } })),

      replaceState: (next) => setState(next),

      reset: () => setState(initialState()),
    }),
    []
  )

  const value = React.useMemo(() => ({ state, today, actions }), [state, today, actions])

  return React.createElement(AppStateContext.Provider, { value }, children)
}

export function useAppState() {
  const ctx = React.useContext(AppStateContext)
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider")
  return ctx
}
