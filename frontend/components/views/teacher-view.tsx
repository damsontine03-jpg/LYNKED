'use client'

import { useMemo, useState } from 'react'
import { Megaphone, MessageCircle, Send, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/app-store'
import { isOverdue } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import type { User } from '@/lib/types'

export function TeacherView({ user }: { user: User }) {
  const { students, visibleHomework, sendAnnouncement } = useAppStore()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)

  // Per-student progress computed from the teacher's assignments.
  const roster = useMemo(() => {
    return students.map((s) => {
      const items = visibleHomework.filter((h) => h.student_id === s.id)
      const total = items.length
      const completed = items.filter((h) => h.status === 'completed').length
      const overdue = items.filter(
        (h) => h.status === 'pending' && isOverdue(h.due_date),
      ).length
      const rate = total === 0 ? 0 : Math.round((completed / total) * 100)
      return { student: s, total, completed, overdue, rate }
    })
  }, [students, visibleHomework])

  function handleAnnounce(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    sendAnnouncement(title, body)
    setTitle('')
    setBody('')
    setSent(true)
    setTimeout(() => setSent(false), 2500)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Class progress</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Monitor each student&apos;s progress and send announcements to the class.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem]">
        {/* Roster progress */}
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="size-4 text-primary" />
            Students ({students.length})
          </div>

          <div className="flex flex-col divide-y divide-border">
            {roster.map(({ student, total, completed, overdue, rate }) => (
              <div
                key={student.id}
                className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
                      {student.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{student.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {completed}/{total} completed
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    {overdue > 0 ? (
                      <Badge variant="destructive">{overdue} overdue</Badge>
                    ) : null}
                    <span className="w-10 text-right text-sm font-semibold tabular-nums">
                      {rate}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      rate >= 70
                        ? 'bg-success'
                        : rate >= 40
                          ? 'bg-primary'
                          : 'bg-warning',
                    )}
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Announcement composer */}
        <Card className="flex h-fit flex-col gap-4 p-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Megaphone className="size-4 text-primary" />
            Send announcement
          </div>
          <form onSubmit={handleAnnounce} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Reminder"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ann-body">Message</Label>
              <Textarea
                id="ann-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share a note with the whole class..."
                rows={3}
              />
            </div>
            <Button type="submit" className="justify-center" disabled={!title.trim()}>
              <Send />
              Send to class
            </Button>
            {sent ? (
              <p className="inline-flex items-center gap-1.5 text-xs text-success">
                <MessageCircle className="size-3.5" />
                Announcement sent to all students.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Every student receives this in their notifications.
              </p>
            )}
          </form>
        </Card>
      </div>
    </div>
  )
}
