import * as React from "react"
import { CalendarDaysIcon, HourglassIcon, SettingsIcon, SunriseIcon, TrophyIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import { HistoryScreen } from "@/features/history/history-screen"
import { LeaderboardScreen } from "@/features/leaderboard/leaderboard-screen"
import { QazaScreen } from "@/features/qaza/qaza-screen"
import { SettingsDialog } from "@/features/settings/settings-dialog"
import { RolloverDialog } from "@/features/today/rollover-dialog"
import { TodayScreen } from "@/features/today/today-screen"
import { useAppState } from "@/hooks/useAppState"

const TABS = [
  { id: "today", label: "Today", icon: SunriseIcon, Screen: TodayScreen },
  { id: "qaza", label: "Qaza", icon: HourglassIcon, Screen: QazaScreen },
  { id: "history", label: "History", icon: CalendarDaysIcon, Screen: HistoryScreen },
  { id: "board", label: "Board", icon: TrophyIcon, Screen: LeaderboardScreen },
] as const

type TabId = (typeof TABS)[number]["id"]

export function App() {
  const { state } = useAppState()
  const [tab, setTab] = React.useState<TabId>("today")
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const { Screen } = TABS.find((t) => t.id === tab)!

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/90 px-4 py-2 backdrop-blur">
        <span className="font-semibold">Salaah Leaderboard</span>
        <Button variant="ghost" size="icon-lg" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon />
        </Button>
      </header>

      <main className="flex-1 px-4 pt-4 pb-24">
        <Screen />
      </main>

      {/* Bottom nav keeps every screen within thumb reach. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
        aria-label="Main"
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? "page" : undefined}
              onClick={() => {
                setTab(id)
                window.scrollTo({ top: 0 })
              }}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 text-xs text-muted-foreground transition-colors",
                tab === id && "font-medium text-foreground"
              )}
            >
              <Icon className={cn("size-5", tab === id && "text-primary")} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <RolloverDialog />
      <Toaster theme={state.settings.theme} position="top-center" offset={{ top: 64 }} mobileOffset={{ top: 64 }} />
    </div>
  )
}

export default App
