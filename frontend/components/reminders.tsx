import { Bell, PartyPopper } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DueBadge } from '@/components/status-badge'
import { daysUntil, isOverdue } from '@/lib/date-utils'
import { subjectAccent } from '@/lib/ui-helpers'
import type { Homework, Role } from '@/lib/types'

export function Reminders({
  homework,
  role,
}: {
  homework: Homework[]
  role: Role
}) {
  // Upcoming = pending items due within a week, plus anything overdue.
  const upcoming = homework
    .filter((h) => h.status === 'pending')
    .filter((h) => isOverdue(h.due_date) || daysUntil(h.due_date) <= 7)
    .sort(
      (a, b) =>
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
    )
    .slice(0, 4)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4">
          <Bell />
        </span>
        <CardTitle className="text-base">Deadline reminders</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {upcoming.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg bg-success/10 p-4 text-sm text-foreground">
            <PartyPopper className="size-5 shrink-0 text-success" />
            <span>
              {role === 'student'
                ? 'You are all caught up. No homework due soon.'
                : 'No upcoming deadlines for the class right now.'}
            </span>
          </div>
        ) : (
          upcoming.map((h) => {
            const accent = subjectAccent(h.subject)
            return (
              <div
                key={h.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {h.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {h.subject}
                    </span>
                  </div>
                </div>
                <DueBadge dueDate={h.due_date} status={h.status} />
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
