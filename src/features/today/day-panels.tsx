import { Progress } from "@/components/ui/progress"
import { useAppState } from "@/hooks/useAppState"
import { dayPoints, entryOf, maxDayPoints, prayedCount } from "@/lib/points"
import { SalaahRow, WitrRow } from "@/features/today/salaah-row"
import { FARD } from "@/types"

/** "3 of 5 prayed" and "35 / 75 pts earned" for one day. */
export function DayTally({ date }: { date: string }) {
  const { state } = useAppState()
  const day = state.days[date]
  const prayed = prayedCount(day)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-2xl font-semibold tabular-nums">
            {prayed} of {FARD.length}
          </div>
          <div className="text-xs text-muted-foreground">prayed</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular-nums">
            {dayPoints(day)}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              / {maxDayPoints(state.settings.trackWitr)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">pts earned</div>
        </div>
      </div>
      <Progress value={(prayed / FARD.length) * 100} aria-label="Salaah prayed" />
    </div>
  )
}

export function DaySalaahList({ date }: { date: string }) {
  const { state } = useAppState()
  const day = state.days[date]

  return (
    <div className="divide-y">
      {FARD.map((s) => (
        <SalaahRow key={s} date={date} salaah={s} entry={entryOf(day, s)} />
      ))}
      {state.settings.trackWitr && <WitrRow date={date} entry={entryOf(day, "witr")} />}
    </div>
  )
}
