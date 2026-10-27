import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DaySalaahList, DayTally } from "@/features/today/day-panels"
import { useAppState } from "@/hooks/useAppState"
import { dayKey, formatGregorian, formatHijri, parseKey } from "@/lib/dates"
import { dayPoints, maxDayPoints } from "@/lib/points"

const BUCKETS = [
  { name: "low", label: "< 40%", cell: "[&_button]:bg-emerald-500/15", swatch: "bg-emerald-500/15" },
  { name: "mid", label: "40–69%", cell: "[&_button]:bg-emerald-500/35", swatch: "bg-emerald-500/35" },
  { name: "high", label: "70–99%", cell: "[&_button]:bg-emerald-500/60", swatch: "bg-emerald-500/60" },
  { name: "full", label: "100%", cell: "[&_button]:bg-emerald-600 [&_button]:text-white", swatch: "bg-emerald-600" },
] as const

type Bucket = (typeof BUCKETS)[number]["name"]

function bucketFor(ratio: number): Bucket {
  if (ratio >= 1) return "full"
  if (ratio >= 0.7) return "high"
  if (ratio >= 0.4) return "mid"
  return "low"
}

const MODIFIER_CLASSES = Object.fromEntries(BUCKETS.map((b) => [b.name, b.cell]))

export function HistoryScreen() {
  const { state, today } = useAppState()
  const [selected, setSelected] = React.useState(today)
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [month, setMonth] = React.useState(() => parseKey(today))
  const max = maxDayPoints(state.settings.trackWitr)

  // Colour each day by its share of the daily maximum.
  const modifiers = React.useMemo(() => {
    const result: Record<Bucket, Date[]> = { low: [], mid: [], high: [], full: [] }
    for (const [key, day] of Object.entries(state.days)) {
      const points = dayPoints(day)
      if (points > 0) result[bucketFor(points / max)].push(parseKey(key))
    }
    return result
  }, [state.days, max])

  const select = (d: Date) => {
    setSelected(dayKey(d))
    setMonth(d) // keep the month view on the picked date
    setPickerOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">History</h1>
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger render={<Button variant="outline" className="h-10" />}>
            <CalendarIcon /> {parseKey(selected).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <Calendar
              mode="single"
              required
              selected={parseKey(selected)}
              onSelect={select}
              disabled={{ after: parseKey(today) }}
              defaultMonth={parseKey(selected)}
              captionLayout="dropdown"
              modifiers={modifiers}
              modifiersClassNames={MODIFIER_CLASSES}
              className="[--cell-size:--spacing(10)]"
            />
          </PopoverContent>
        </Popover>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-3">
          <Calendar
            mode="single"
            required
            selected={parseKey(selected)}
            onSelect={select}
            disabled={{ after: parseKey(today) }}
            month={month}
            onMonthChange={setMonth}
            modifiers={modifiers}
            modifiersClassNames={MODIFIER_CLASSES}
            className="[--cell-size:--spacing(10)]"
          />
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {BUCKETS.map((b) => (
              <span key={b.name} className="flex items-center gap-1">
                <span className={`size-3 rounded-sm ${b.swatch}`} />
                {b.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{formatGregorian(selected)}</CardTitle>
          <CardDescription>{formatHijri(selected)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <DayTally date={selected} />
          <DaySalaahList date={selected} />
        </CardContent>
      </Card>
    </div>
  )
}
