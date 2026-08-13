'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useAppStore } from '@/lib/app-store'
import { daysUntil, formatDueDate, todayInputValue } from '@/lib/date-utils'
import { CLASS_OPTIONS, SUBJECT_OPTIONS, subjectAccent } from '@/lib/ui-helpers'
import type { Exam, User } from '@/lib/types'

export function ExamsView({ user }: { user: User }) {
  const { exams, upsertExam, deleteExam } = useAppStore()
  const [subject, setSubject] = useState('all')
  const [editing, setEditing] = useState<Partial<Exam> | null>(null)
  const canManage = user.role === 'admin'
  const filtered = useMemo(
    () =>
      [...exams]
        .filter((e) => (subject === 'all' ? true : e.subject === subject))
        .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)),
    [exams, subject],
  )
  const next = filtered[0]
  const until = next ? daysUntil(next.date) : null

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (!editing?.title || !editing.date || !editing.subject) return
    upsertExam({
      id: editing.id,
      title: editing.title,
      subject: editing.subject,
      date: editing.date,
      start_time: editing.start_time || '09:00',
      end_time: editing.end_time || '11:00',
      duration: editing.duration || '2h',
      room: editing.room || 'A1',
      className: editing.className || 'SSS 2',
      published: true,
    })
    setEditing(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Exam timetable</h1>
          <p className="text-sm text-muted-foreground">
            Papers for your class, with time, room, and countdown.
          </p>
        </div>
        {canManage ? (
          <Button
            onClick={() =>
              setEditing({
                title: '',
                subject: '',
                date: todayInputValue(),
                start_time: '09:00',
                end_time: '11:00',
                duration: '2h',
                room: '',
                className: user.className || '',
                published: true,
              })
            }
          >
            Add exam
          </Button>
        ) : null}
      </div>

      {next ? (
        <Card className="flex flex-col gap-1 p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Next exam</p>
          <p className="text-lg font-semibold">{next.subject}</p>
          <p className="text-sm text-muted-foreground">
            {formatDueDate(next.date)} · {next.start_time} to {next.end_time} · {next.room}
          </p>
          <p className="text-sm font-medium text-primary">
            {until === 0 ? 'Today' : until === 1 ? 'Tomorrow' : `${until} days away`}
          </p>
        </Card>
      ) : null}

      <Select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full sm:w-48">
        <option value="all">All subjects</option>
        {SUBJECT_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No exams scheduled yet.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((ex) => (
              <Card key={ex.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{ex.title}</p>
                    <p className="text-sm" style={{ color: subjectAccent(ex.subject) }}>
                      {ex.subject}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{ex.className}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDueDate(ex.date)} · {ex.start_time} to {ex.end_time}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ex.duration} · {ex.room}
                </p>
                {canManage ? (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(ex)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteExam(ex.id)}>
                      Delete
                    </Button>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Exam</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Room</th>
                  <th className="px-4 py-3 font-medium">Class</th>
                  {canManage ? <th className="px-4 py-3 font-medium" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((ex) => (
                  <tr key={ex.id}>
                    <td className="px-4 py-3">{ex.title}</td>
                    <td className="px-4 py-3" style={{ color: subjectAccent(ex.subject) }}>
                      {ex.subject}
                    </td>
                    <td className="px-4 py-3">{formatDueDate(ex.date)}</td>
                    <td className="px-4 py-3">
                      {ex.start_time} to {ex.end_time}
                    </td>
                    <td className="px-4 py-3">{ex.duration}</td>
                    <td className="px-4 py-3">{ex.room}</td>
                    <td className="px-4 py-3">{ex.className}</td>
                    {canManage ? (
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(ex)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteExam(ex.id)}>
                          Delete
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing?.id ? 'Edit exam' : 'Add exam'}
      >
        {editing ? (
          <form onSubmit={save} className="flex flex-col gap-3">
            <Label>Title</Label>
            <Input
              value={editing.title ?? ''}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
            <Label>Subject</Label>
            <Select
              value={editing.subject ?? 'Biology'}
              onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
            >
              {SUBJECT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Label>Class</Label>
            <Select
              value={editing.className ?? 'SSS 2'}
              onChange={(e) => setEditing({ ...editing, className: e.target.value })}
            >
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Label>Date</Label>
            <Input
              type="date"
              value={editing.date ?? ''}
              onChange={(e) => setEditing({ ...editing, date: e.target.value })}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Start</Label>
                <Input
                  type="time"
                  value={editing.start_time ?? ''}
                  onChange={(e) => setEditing({ ...editing, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label>End</Label>
                <Input
                  type="time"
                  value={editing.end_time ?? ''}
                  onChange={(e) => setEditing({ ...editing, end_time: e.target.value })}
                />
              </div>
            </div>
            <Label>Room</Label>
            <Input
              value={editing.room ?? ''}
              onChange={(e) => setEditing({ ...editing, room: e.target.value })}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit">Publish</Button>
            </div>
          </form>
        ) : null}
      </Dialog>
    </div>
  )
}
