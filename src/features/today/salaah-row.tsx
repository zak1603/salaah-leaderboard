import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useAppState } from "@/hooks/useAppState"
import { entryPoints, isPrayed } from "@/lib/points"
import { SALAAH_NAMES, type Fard, type SalaahEntry, type Status } from "@/types"

const ACTIVE = {
  "on-time":
    "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-600/90 hover:text-white dark:border-emerald-500 dark:bg-emerald-600",
  late: "border-amber-500 bg-amber-500 text-white hover:bg-amber-500/90 hover:text-white dark:border-amber-500 dark:bg-amber-600",
  missed:
    "border-red-600 bg-red-600 text-white hover:bg-red-600/90 hover:text-white dark:border-red-500 dark:bg-red-600",
} as const

const OPTIONS: { status: Exclude<Status, "pending">; label: string }[] = [
  { status: "on-time", label: "On time" },
  { status: "late", label: "Late / qaza" },
  { status: "missed", label: "Missed" },
]

/** One tap sets a status; tapping the active status again returns it to "Not yet". */
export function SalaahRow({
  date,
  salaah,
  entry,
  showJamaah = true,
}: {
  date: string
  salaah: Fard
  entry: SalaahEntry
  showJamaah?: boolean
}) {
  const { actions } = useAppState()
  const onTime = entry.status === "on-time"
  const jamaahId = `jamaah-${date}-${salaah}`

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex min-h-6 items-center gap-3">
        <span className="font-medium">{SALAAH_NAMES[salaah]}</span>
        {entry.status === "pending" && (
          <span className="text-xs text-muted-foreground">Not yet</span>
        )}
        <div className="ml-auto flex items-center gap-3">
          {showJamaah && (
            <Label
              htmlFor={jamaahId}
              className={cn("flex items-center gap-2 text-xs font-normal", !onTime && "opacity-50")}
            >
              <Checkbox
                id={jamaahId}
                checked={onTime && entry.jamaah === true}
                disabled={!onTime}
                onCheckedChange={(checked) => actions.setJamaah(date, salaah, checked === true)}
              />
              Jamaah +5
            </Label>
          )}
          <span className="w-9 text-right text-sm font-medium tabular-nums">
            +{entryPoints(salaah, entry)}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5" role="group" aria-label={`${SALAAH_NAMES[salaah]} status`}>
        {OPTIONS.map((o) => {
          const active = entry.status === o.status
          return (
            <Button
              key={o.status}
              variant="outline"
              aria-pressed={active}
              className={cn("h-10 px-1 text-xs", active && ACTIVE[o.status])}
              onClick={() => actions.setStatus(date, salaah, active ? "pending" : o.status)}
            >
              {o.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export function WitrRow({ date, entry }: { date: string; entry: SalaahEntry }) {
  const { actions } = useAppState()
  const prayed = isPrayed(entry.status)
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex flex-col">
        <span className="font-medium">{SALAAH_NAMES.witr}</span>
        <span className="text-xs text-muted-foreground">No Jamaah bonus</span>
      </div>
      <span className="ml-auto w-9 text-right text-sm font-medium tabular-nums">
        +{entryPoints("witr", entry)}
      </span>
      <Button
        variant="outline"
        aria-pressed={prayed}
        className={cn("h-10 w-28 text-xs", prayed && ACTIVE["on-time"])}
        onClick={() => actions.setStatus(date, "witr", prayed ? "pending" : "on-time")}
      >
        {prayed ? "Prayed" : "Mark prayed"}
      </Button>
    </div>
  )
}
