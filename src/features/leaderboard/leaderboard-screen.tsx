import * as React from "react"
import { FlameIcon, Share2Icon, UserPlusIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { decodeShareCode, encodeShareCode } from "@/features/leaderboard/share-code"
import { useAppState } from "@/hooks/useAppState"
import { computeStats } from "@/lib/points"
import type { LeaderboardUser } from "@/types"

type Metric = "totalPoints" | "weeklyPoints" | "currentStreak"
const METRICS: { value: Metric; label: string; unit: string }[] = [
  { value: "totalPoints", label: "All time", unit: "pts" },
  { value: "weeklyPoints", label: "Last 7 days", unit: "pts" },
  { value: "currentStreak", label: "Streak", unit: "days" },
]

type Row = LeaderboardUser & { isMe: boolean }

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?"

function ago(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return "today"
  return days === 1 ? "1 day ago" : `${days} days ago`
}

export function LeaderboardScreen() {
  const { state, today, actions } = useAppState()
  const [metric, setMetric] = React.useState<Metric>("totalPoints")
  const [shareOpen, setShareOpen] = React.useState(false)
  const [addOpen, setAddOpen] = React.useState(false)

  const me = computeStats(state.days, today)
  const myName = state.currentUser.name.trim() || "Me"

  // Ties break on total points, then name, so streak ranking stays meaningful.
  const rows: Row[] = [
    { id: "me", name: myName, ...me, isMe: true },
    ...state.leaderboardUsers.map((u) => ({ ...u, isMe: false })),
  ].sort((a, b) => b[metric] - a[metric] || b.totalPoints - a.totalPoints || a.name.localeCompare(b.name))

  const unit = METRICS.find((m) => m.value === metric)!.unit

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Leaderboard</h1>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="All time" value={me.totalPoints} unit="pts" />
        <Stat label="Last 7 days" value={me.weeklyPoints} unit="pts" />
        <Stat label="Streak" value={me.currentStreak} unit="days" flame />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Community</CardTitle>
          <CardDescription>Stored on this device. Swap stat codes with friends to compare.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-10" onClick={() => setShareOpen(true)}>
              <Share2Icon /> Share my code
            </Button>
            <Button variant="outline" className="h-10" onClick={() => setAddOpen(true)}>
              <UserPlusIcon /> Add member
            </Button>
          </div>

          <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
            <TabsList className="w-full">
              {METRICS.map((m) => (
                <TabsTrigger key={m.value} value={m.value}>
                  {m.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">{unit}</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={r.id} className={cn(r.isMe && "bg-muted/50")}>
                  <TableCell className="font-medium tabular-nums">{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        {r.avatarUrl && <AvatarImage src={r.avatarUrl} alt="" />}
                        <AvatarFallback className="text-xs">{initials(r.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col">
                        <span className="flex items-center gap-1.5 truncate font-medium">
                          {r.name}
                          {r.isMe && <Badge variant="secondary">You</Badge>}
                        </span>
                        {r.updatedAt && (
                          <span className="text-xs text-muted-foreground">updated {ago(r.updatedAt)}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{r[metric]}</TableCell>
                  <TableCell>
                    {!r.isMe && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${r.name}`}
                        onClick={() => actions.removeLeaderboardUser(r.id)}
                      >
                        <XIcon />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        code={encodeShareCode({ name: myName, ...me, updatedAt: new Date().toISOString() })}
      />
      <AddMemberDialog open={addOpen} onOpenChange={setAddOpen} myName={myName} />
    </div>
  )
}

function Stat({ label, value, unit, flame }: { label: string; value: number; unit: string; flame?: boolean }) {
  return (
    <Card size="sm" className="gap-1">
      <CardContent className="flex flex-col gap-0.5 px-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="flex items-center gap-1 text-xl font-semibold tabular-nums">
          {flame && <FlameIcon className="size-4 text-orange-500" />}
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </CardContent>
    </Card>
  )
}

function ShareDialog({
  open,
  onOpenChange,
  code,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  code: string
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success("Code copied")
    } catch {
      toast.error("Couldn't copy. Select the code and copy it manually.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your stat code</DialogTitle>
          <DialogDescription>
            Send this to friends to add under "Add member". Share a fresh code whenever your
            totals change.
          </DialogDescription>
        </DialogHeader>
        <textarea
          readOnly
          value={code}
          onFocus={(e) => e.target.select()}
          className="h-24 w-full resize-none rounded-lg border bg-muted/50 p-2 font-mono text-xs break-all"
        />
        <DialogFooter>
          <Button className="h-10" onClick={copy}>
            Copy code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddMemberDialog({
  open,
  onOpenChange,
  myName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  myName: string
}) {
  const { actions } = useAppState()
  const [code, setCode] = React.useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const user = decodeShareCode(code)
      if (user.name.toLowerCase() === myName.toLowerCase()) {
        toast.error("That's your own code")
        return
      }
      actions.upsertLeaderboardUser(user)
      toast.success(`${user.name} added to the leaderboard`)
      setCode("")
      onOpenChange(false)
    } catch {
      toast.error("That code isn't valid")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add a community member</DialogTitle>
            <DialogDescription>
              Paste the code they shared. A newer code for the same name updates their entry.
            </DialogDescription>
          </DialogHeader>
          <Input
            className="h-10 font-mono text-xs"
            placeholder="SLB1:…"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <DialogFooter>
            <Button type="submit" className="h-10" disabled={!code.trim()}>
              Add to leaderboard
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
