'use client'

import {
  CircleCheck,
  Pencil,
  RotateCcw,
  Trash2,
  User as UserIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DueBadge, StatusBadge } from '@/components/status-badge'
import { formatDueDate } from '@/lib/date-utils'
import { PRIORITY_META, subjectAccent } from '@/lib/ui-helpers'
import { useAppStore } from '@/lib/app-store'
import { cn } from '@/lib/utils'
import type { Homework, Role } from '@/lib/types'

interface HomeworkCardProps {
  homework: Homework
  role: Role
  onToggle: (id: string) => void
  onEdit: (hw: Homework) => void
  onDelete: (hw: Homework) => void
}

export function HomeworkCard({
  homework,
  role,
  onToggle,
  onEdit,
  onDelete,
}: HomeworkCardProps) {
  const { students } = useAppStore()
  const accent = subjectAccent(homework.subject)
  const isDone = homework.status === 'completed'
  const priority = homework.priority
    ? PRIORITY_META[homework.priority]
    : null
  const assigneeName =
    students.find((s) => s.id === homework.student_id)?.name ?? 'student'

  return (
    <article
      className={cn(
        'group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-colors',
        'hover:border-ring/40',
        isDone && 'bg-muted/40',
      )}
    >
      {/* Subject accent stripe */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: accent }}
      />

      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
              style={{ color: accent }}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: accent }}
              />
              {homework.subject}
            </span>
          </div>
          <h3
            className={cn(
              'text-base font-semibold leading-snug text-balance',
              isDone && 'text-muted-foreground line-through',
            )}
          >
            {homework.title}
          </h3>
        </div>
      </div>

      {homework.description ? (
        <p className="pl-2 text-sm leading-relaxed text-muted-foreground text-pretty">
          {homework.description}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 pl-2">
        <StatusBadge status={homework.status} />
        <DueBadge dueDate={homework.due_date} status={homework.status} />
        {priority ? (
          <Badge variant={priority.variant}>{priority.label}</Badge>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 pl-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <UserIcon className="size-3.5" />
          {role === 'teacher'
            ? `Assigned to ${assigneeName}`
            : `Set by ${homework.assigned_by}`}
          <span aria-hidden="true">·</span>
          {formatDueDate(homework.due_date)}
        </span>

        <div className="flex items-center gap-1">
          {role === 'student' ? (
            <Button
              variant={isDone ? 'ghost' : 'default'}
              size="sm"
              onClick={() => onToggle(homework.id)}
            >
              {isDone ? (
                <>
                  <RotateCcw />
                  Mark pending
                </>
              ) : (
                <>
                  <CircleCheck />
                  Mark complete
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(homework)}
            >
              <Pencil />
              Edit
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(homework)}
            aria-label={`Delete ${homework.title}`}
          >
            <Trash2 className="text-destructive" />
          </Button>
        </div>
      </div>
    </article>
  )
}
