import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DaySalaahList, DayTally } from "@/features/today/day-panels"
import { useAppState } from "@/hooks/useAppState"
import { formatGregorian, formatHijri } from "@/lib/dates"

export function TodayScreen() {
  const { today } = useAppState()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">{formatGregorian(today)}</h1>
        <p className="text-sm text-muted-foreground">{formatHijri(today)}</p>
      </div>

      <Card>
        <CardContent>
          <DayTally date={today} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today's salaah</CardTitle>
          <CardDescription>
            On time +10 (+5 in Jamaah) · Late +5 · Tap again to undo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DaySalaahList date={today} />
        </CardContent>
      </Card>
    </div>
  )
}
