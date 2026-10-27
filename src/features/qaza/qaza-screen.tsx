import * as React from "react"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BulkAddDialog } from "@/features/qaza/bulk-add-dialog"
import { useAppState } from "@/hooks/useAppState"
import { qazaBalances, qazaMadeUp, qazaTotal } from "@/lib/qaza"
import { FARD, SALAAH_NAMES } from "@/types"

const logDateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

const PAGE = 10

export function QazaScreen() {
  const { state, actions } = useAppState()
  const [bulkOpen, setBulkOpen] = React.useState(false)
  const [showAll, setShowAll] = React.useState(false)

  const balances = qazaBalances(state)
  const madeUp = qazaMadeUp(state)
  const visible = showAll ? madeUp : madeUp.slice(0, PAGE)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Qaza</h1>

      <Card>
        <CardHeader>
          <CardTitle>Outstanding</CardTitle>
          <CardDescription>
            <span className="text-2xl font-semibold text-foreground tabular-nums">
              {qazaTotal(balances)}
            </span>{" "}
            salaah to make up
          </CardDescription>
          <CardAction>
            <Button variant="outline" className="h-10" onClick={() => setBulkOpen(true)}>
              <PlusIcon /> Add past
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="divide-y">
          {FARD.map((s) => (
            <div key={s} className="flex items-center gap-3 py-2.5">
              <span className="font-medium">{SALAAH_NAMES[s]}</span>
              <span className="ml-auto text-lg font-semibold tabular-nums">{balances[s]}</span>
              <Button
                className="h-10 w-36"
                disabled={balances[s] === 0}
                onClick={() => {
                  actions.logQazaPrayed(s)
                  toast.success(`${SALAAH_NAMES[s]} qaza logged`)
                }}
              >
                Log a qaza prayed
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Made up</CardTitle>
          <CardDescription>{madeUp.length} qaza prayed so far</CardDescription>
        </CardHeader>
        <CardContent>
          {madeUp.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing logged yet. Each qaza you log appears here.
            </p>
          ) : (
            <ul className="divide-y">
              {visible.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium">{SALAAH_NAMES[e.salaah]}</span>
                  <span className="text-muted-foreground">{logDateFmt.format(new Date(e.at))}</span>
                </li>
              ))}
            </ul>
          )}
          {madeUp.length > PAGE && (
            <Button variant="ghost" className="mt-2 h-10 w-full" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Show less" : `Show all ${madeUp.length}`}
            </Button>
          )}
        </CardContent>
      </Card>

      <BulkAddDialog open={bulkOpen} onOpenChange={setBulkOpen} />
    </div>
  )
}
