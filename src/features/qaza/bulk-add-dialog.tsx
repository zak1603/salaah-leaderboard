import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppState } from "@/hooks/useAppState"
import { FARD, SALAAH_NAMES, type Fard } from "@/types"

type Mode = "each" | "days"
const blankCounts = () => Object.fromEntries(FARD.map((s) => [s, ""])) as Record<Fard, string>
const toCount = (v: string) => Math.max(0, Math.floor(Number(v) || 0))

export function BulkAddDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { actions } = useAppState()
  const [mode, setMode] = React.useState<Mode>("each")
  const [counts, setCounts] = React.useState(blankCounts)
  const [days, setDays] = React.useState("")

  const parsed = Object.fromEntries(
    FARD.map((s) => [s, toCount(mode === "days" ? days : counts[s])])
  ) as Record<Fard, number>
  const total = FARD.reduce((sum, s) => sum + parsed[s], 0)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (total === 0) return
    actions.addPastQaza(parsed)
    toast.success(`Added ${total} qaza`)
    setCounts(blankCounts())
    setDays("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add past qaza</DialogTitle>
            <DialogDescription>Salaah you missed before using the app.</DialogDescription>
          </DialogHeader>

          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList className="w-full">
              <TabsTrigger value="each">Per salaah</TabsTrigger>
              <TabsTrigger value="days">Days missed</TabsTrigger>
            </TabsList>
            <TabsContent value="each" className="flex flex-col gap-2 pt-2">
              {FARD.map((s) => (
                <div key={s} className="flex items-center gap-3">
                  <Label htmlFor={`bulk-${s}`} className="w-20">
                    {SALAAH_NAMES[s]}
                  </Label>
                  <Input
                    id={`bulk-${s}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="0"
                    className="h-10"
                    value={counts[s]}
                    onChange={(e) => setCounts((c) => ({ ...c, [s]: e.target.value }))}
                  />
                </div>
              ))}
            </TabsContent>
            <TabsContent value="days" className="flex flex-col gap-2 pt-2">
              <Label htmlFor="bulk-days">Number of days missed</Label>
              <Input
                id="bulk-days"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="0"
                className="h-10"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Adds this many to each of the five salaah.</p>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="submit" className="h-10" disabled={total === 0}>
              Add {total > 0 ? total : ""} qaza
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
