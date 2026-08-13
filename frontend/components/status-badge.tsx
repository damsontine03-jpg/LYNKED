import { AlarmClock, CalendarClock, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { daysUntil, isOverdue, relativeDueLabel } from '@/lib/date-utils'
import { SUBMISSION_META } from '@/lib/ui-helpers'
import type { Status, SubmissionStatus } from '@/lib/types'

export function StatusBadge({ status }: { status: Status }) {
  if (status === 'completed') {
    return (
      <Badge variant="success">
        Completed
      </Badge>
    )
  }
  return (
    <Badge variant="warning">
      Pending
    </Badge>
  )
}

/** Deadline pill that changes tone as a deadline approaches / passes. */
export function DueBadge({
  dueDate,
  status,
}: {
  dueDate: string
  status: Status
}) {
  const label = relativeDueLabel(dueDate)

  if (status === 'completed') {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <CalendarClock />
        {label}
      </Badge>
    )
  }

  if (isOverdue(dueDate)) {
    return (
      <Badge variant="destructive">
        <TriangleAlert />
        {label}
      </Badge>
    )
  }

  if (daysUntil(dueDate) <= 2) {
    return (
      <Badge variant="warning">
        <AlarmClock />
        {label}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="text-muted-foreground">
      <CalendarClock />
      {label}
    </Badge>
  )
}

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const meta = SUBMISSION_META[status]
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}
