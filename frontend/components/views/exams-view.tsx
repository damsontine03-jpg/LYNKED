'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClassSelect } from '@/components/ui/class-select'
import { Select } from '@/components/ui/select'
import { useAppStore } from '@/lib/app-store'
import { daysUntil, formatDueDate, todayInputValue } from '@/lib/date-utils'
import { DEFAULT_CLASS, SUBJECT_OPTIONS, subjectAccent } from '@/lib/ui-helpers'
import { cn } from '@/lib/utils'
import type { Exam, User } from '@/lib/types'

type TimetableKind = 'class' | 'exam'

export function ExamsView({ user }: { user: User }) {
  const { exams, upsertExam, deleteExam } = useAppStore()
  const [tab, setTab] = useState<TimetableKind | 'all'>('class')
  const [editing, setEditing] = useState<Partial<Exam> | null>(null)
  const canManage = user.role === 'admin'
  const isExamTab = tab === 'exam'
  const showAll = tab === 'all'
  const addKind: TimetableKind = tab === 'exam' ? 'exam' : 'class'

  const filtered = useMemo(
    () =>
      [...exams]
        .filter((e) => (tab === 'all' ? true : (e.kind || 'class') === tab))
        .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)),
    [exams, tab],
  )
  const next = filtered[0]
  const until = next ? daysUntil(next.date) : null

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (!editing?.title || !editing.date || !editing.subject) return
    const start = editing.start_time || '09:00'
    const end = editing.end_time || '11:00'
    upsertExam({
      id: editing.id,
      title: editing.title,
      subject: editing.subject,
      date: editing.date,
      start_time: start,
      end_time: end,
      duration: editing.duration || durationFromTimes(start, end),
      room: editing.room || 'A1',
      className: editing.className || DEFAULT_CLASS,
      published: true,
      kind: editing.kind || addKind,
    })
    setEditing(null)
  }

  function startAdd() {
    setEditing({
      title: '',
      subject: '',
      date: todayInputValue(),
      start_time: '09:00',
      end_time: '11:00',
      duration: '2h',
      room: '',
      className:
        user.className === 'Whole school' ? DEFAULT_CLASS : user.className || DEFAULT_CLASS,
      published: true,
      kind: addKind,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">TimeTable</h1>
          <p className="text-sm text-muted-foreground">
            {showAll
              ? user.role === 'parent'
                ? 'Class times and exam papers for your child, with date, time, and room.'
                : user.role === 'admin'
                  ? 'Publish class times and exam papers for every class.'
                  : 'Class times and exam papers, with date, time, and room.'
              : isExamTab
                ? user.role === 'parent'
                  ? 'Exam papers for your child, with date, time, and room.'
                  : user.role === 'admin'
                    ? 'Publish exam papers with date, time, and room for each class.'
                    : 'Exam papers for your class, with date, time, and room.'
                : user.role === 'parent'
                  ? 'See when each subject meets for your child, with time and room.'
                  : user.role === 'admin'
                    ? 'Publish the class timetable for every class, with subject, day, time, and room.'
                    : 'See when each subject meets, with time and room.'}
          </p>
        </div>
        {canManage ? (
          <Button onClick={startAdd}>{addKind === 'exam' ? 'Add exam' : 'Add class'}</Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <TabButton active={tab === 'class'} onClick={() => setTab('class')}>
            Class TimeTable
          </TabButton>
          <TabButton active={tab === 'exam'} onClick={() => setTab('exam')}>
            Exam TimeTable
          </TabButton>
        </div>
        <Select
          value={tab}
          onChange={(e) => setTab(e.target.value as TimetableKind | 'all')}
          className="w-full sm:w-56"
          aria-label="Filter timetable"
        >
          <option value="all">All tables</option>
          <option value="class">Class TimeTable</option>
          <option value="exam">Exam TimeTable</option>
        </Select>
      </div>

      {next ? (
        <Card className="flex flex-col gap-1 p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {showAll ? 'Up next' : isExamTab ? 'Next exam' : 'Up next'}
          </p>
          <p className="text-lg font-semibold">{next.subject}</p>
          <p className="text-sm text-muted-foreground">
            {formatDueDate(next.date)} · {next.start_time} to {next.end_time} · {next.room}
          </p>
          <p className="text-sm font-medium text-primary">
            {until === 0 ? 'Today' : until === 1 ? 'Tomorrow' : `${until} days away`}
          </p>
        </Card>
      ) : null}

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {showAll
            ? 'Nothing on the timetable yet.'
            : isExamTab
              ? 'Nothing on the exam timetable yet.'
              : 'Nothing on the class timetable yet.'}
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
                    {showAll ? (
                      <p className="text-xs text-muted-foreground">
                        {(ex.kind || 'class') === 'exam' ? 'Exam TimeTable' : 'Class TimeTable'}
                      </p>
                    ) : null}
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
                  {showAll ? <th className="px-4 py-3 font-medium">Table</th> : null}
                  <th className="px-4 py-3 font-medium">
                    {showAll ? 'Title' : isExamTab ? 'Paper' : 'Period'}
                  </th>
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
                    {showAll ? (
                      <td className="px-4 py-3 text-muted-foreground">
                        {(ex.kind || 'class') === 'exam' ? 'Exam' : 'Class'}
                      </td>
                    ) : null}
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
        title={
          (editing?.kind || addKind) === 'exam'
            ? editing?.id
              ? 'Edit exam'
              : 'Add exam'
            : editing?.id
              ? 'Edit class'
              : 'Add class'
        }
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
            <ClassSelect
              value={editing.className ?? DEFAULT_CLASS}
              onChange={(e) => setEditing({ ...editing, className: e.target.value })}
            />
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

function durationFromTimes(start: string, end: string) {
  const [startHour, startMin] = start.split(':').map(Number)
  const [endHour, endMin] = end.split(':').map(Number)
  const minutes = endHour * 60 + endMin - (startHour * 60 + startMin)
  if (!Number.isFinite(minutes) || minutes <= 0) return '2h'
  if (minutes % 60 === 0) return `${minutes / 60}h`
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
