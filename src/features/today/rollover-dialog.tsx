import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SalaahRow } from "@/features/today/salaah-row"
import { useAppState } from "@/hooks/useAppState"
import { formatGregorian, formatHijri } from "@/lib/dates"
import { entryOf, pendingDays } from "@/lib/points"
import { FARD, type Status } from "@/types"

/**
 * Asks about earlier days with salaah still "Not yet". Nothing is marked
 * Missed unless the user chooses it; "Ask me later" leaves them untouched.
 */
export function RolloverDialog() {
  const { state, today, actions } = useAppState()
  const [dismissedOn, setDismissedOn] = React.useState<string | null>(null)

  const pending = React.useMemo(() => pendingDays(state.days, today), [state.days, today])
  const date = pending[0]
  if (!date) return null
  const day = state.days[date]

  const answerRest = (status: Status) => {
    for (const s of FARD) {
      if (entryOf(day, s).status === "pending") actions.setStatus(date, s, status)
    }
  }

  return (
    <Dialog open={dismissedOn !== today} onOpenChange={(o) => !o && setDismissedOn(today)}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Did you pray these?</DialogTitle>
          <DialogDescription>
            {formatGregorian(date)} · {formatHijri(date)}
            {pending.length > 1 && <> · {pending.length} days to review</>}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-10" onClick={() => answerRest("on-time")}>
            Rest on time
          </Button>
          <Button variant="outline" className="h-10" onClick={() => answerRest("missed")}>
            Rest missed
          </Button>
        </div>

        <div className="divide-y">
          {FARD.map((s) => (
            <SalaahRow key={s} date={date} salaah={s} entry={entryOf(day, s)} />
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" className="h-10" onClick={() => setDismissedOn(today)}>
            Ask me later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
