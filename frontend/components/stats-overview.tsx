import { CircleCheck, ClipboardList, ListTodo, TriangleAlert } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { daysUntil, isOverdue } from '@/lib/date-utils'
import type { Homework } from '@/lib/types'

function Stat({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: number
  icon: React.ReactNode
  tone: string
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg]:size-5"
        style={{ backgroundColor: `${tone}1f`, color: tone }}
      >
        {icon}
      </span>
      <div className="flex flex-col">
        <span className="text-2xl font-semibold leading-none tabular-nums">
          {value}
        </span>
        <span className="mt-1 text-xs text-muted-foreground">{label}</span>
      </div>
    </Card>
  )
}

export function StatsOverview({ homework }: { homework: Homework[] }) {
  const total = homework.length
  const completed = homework.filter((h) => h.status === 'completed').length
  const pending = homework.filter((h) => h.status === 'pending').length
  const overdue = homework.filter(
    (h) => h.status === 'pending' && isOverdue(h.due_date),
  ).length
  const dueSoon = homework.filter(
    (h) =>
      h.status === 'pending' &&
      !isOverdue(h.due_date) &&
      daysUntil(h.due_date) <= 2,
  ).length

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      <Stat
        label="Total assignments"
        value={total}
        icon={<ClipboardList />}
        tone="var(--chart-1)"
      />
      <Stat
        label="Still pending"
        value={pending}
        icon={<ListTodo />}
        tone="var(--chart-3)"
      />
      <Stat
        label="Completed"
        value={completed}
        icon={<CircleCheck />}
        tone="var(--chart-2)"
      />
      <Stat
        label={overdue > 0 ? 'Overdue' : 'Due soon'}
        value={overdue > 0 ? overdue : dueSoon}
        icon={<TriangleAlert />}
        tone="var(--chart-4)"
      />
    </div>
  )
}
