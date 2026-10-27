import * as React from "react"
import { DownloadIcon, MonitorIcon, MoonIcon, SunIcon, UploadIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppState } from "@/hooks/useAppState"
import { totalPoints } from "@/lib/points"
import { qazaBalances, qazaTotal } from "@/lib/qaza"
import { STORAGE_KEY, exportJson, importJson } from "@/lib/storage"
import type { AppState, Theme } from "@/types"

const THEMES: { value: Theme; label: string; icon: typeof SunIcon }[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
]

function summary(s: AppState) {
  const days = Object.keys(s.days).length
  return `${days} day${days === 1 ? "" : "s"} · ${totalPoints(s.days)} pts · ${qazaTotal(qazaBalances(s))} qaza`
}

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { state, today, actions } = useAppState()
  const [confirmReset, setConfirmReset] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const exportData = () => {
    const url = URL.createObjectURL(new Blob([exportJson(state)], { type: "application/json" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `${STORAGE_KEY.replace(":", "-")}-${today}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = async (file: File) => {
    try {
      const next = importJson(await file.text())
      actions.replaceState(next)
      toast.success("Data imported", { description: summary(next) })
      onOpenChange(false)
    } catch {
      toast.error("That file isn't a valid salaah-leaderboard export")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Your name on the leaderboard</Label>
            <Input
              id="name"
              className="h-10"
              maxLength={40}
              value={state.currentUser.name}
              onChange={(e) => actions.setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Theme</span>
            <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Theme">
              {THEMES.map(({ value, label, icon: Icon }) => {
                const active = state.settings.theme === value
                return (
                  <Button
                    key={value}
                    role="radio"
                    aria-checked={active}
                    variant="outline"
                    className={cn(
                      "h-10",
                      active &&
                        "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    )}
                    onClick={() => actions.setSettings({ theme: value })}
                  >
                    <Icon /> {label}
                  </Button>
                )
              })}
            </div>
          </div>

          <Label htmlFor="witr" className="flex items-center gap-3 font-normal">
            <Checkbox
              id="witr"
              checked={state.settings.trackWitr}
              onCheckedChange={(c) => actions.setSettings({ trackWitr: c === true })}
            />
            Track Witr as a sixth row (+10 pts)
          </Label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Data</span>
            <p className="text-xs text-muted-foreground">{summary(state)}</p>
            <div className="grid grid-cols-2 gap-1.5">
              <Button variant="outline" className="h-10" onClick={exportData}>
                <DownloadIcon /> Export
              </Button>
              <Button variant="outline" className="h-10" onClick={() => fileRef.current?.click()}>
                <UploadIcon /> Import
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void importData(file)
                e.target.value = ""
              }}
            />
            <Button variant="destructive" className="h-10" onClick={() => setConfirmReset(true)}>
              Reset everything
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset everything?</DialogTitle>
            <DialogDescription>
              This deletes every salaah record, qaza balance and leaderboard entry on this
              device. Export first if you might want it back.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="h-10" />}>Cancel</DialogClose>
            <Button
              variant="destructive"
              className="h-10"
              onClick={() => {
                actions.reset()
                setConfirmReset(false)
                onOpenChange(false)
                toast.success("All data reset")
              }}
            >
              Yes, reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
