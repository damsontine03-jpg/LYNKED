'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { useAppStore } from '@/lib/app-store'
import { formatDueDate } from '@/lib/date-utils'
import { gradeTone, percent, SUBJECT_OPTIONS } from '@/lib/ui-helpers'
import { viewerStudentId } from '@/lib/roles'
import type { User } from '@/lib/types'

export function GradesView({ user }: { user: User }) {
  const { assignments, submissions, students } = useAppStore()
  const [subject, setSubject] = useState('all')
  const [studentId, setStudentId] = useState(
    user.role === 'student' || user.role === 'parent' ? viewerStudentId(user) : 'all',
  )

  const rows = useMemo(() => {
    return submissions
      .filter((s) => s.status === 'graded' && s.score != null && s.graded_at)
      .filter((s) => (studentId === 'all' ? true : s.student_id === studentId))
      .map((s) => {
        const a = assignments.find((x) => x.id === s.assignment_id)
        return a
          ? {
              id: s.id,
              subject: a.subject,
              title: a.title,
              className: a.className,
              teacher: a.teacher_name,
              score: s.score!,
              max: a.max_marks,
              pct: percent(s.score!, a.max_marks),
              feedback: s.feedback ?? '',
              graded_at: s.graded_at!,
            }
          : null
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .filter((r) => (subject === 'all' ? true : r.subject === subject))
      .sort((a, b) => b.graded_at.localeCompare(a.graded_at))
  }, [submissions, assignments, studentId, subject])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold uppercase tracking-tight">Assignment grades</h1>
        <p className="text-sm text-muted-foreground">
          {user.role === 'parent'
            ? `Scores and teacher feedback for ${user.childName || 'your child'}.`
            : 'Scores and teacher feedback on submitted assignments.'}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full sm:w-48">
          <option value="all">All subjects</option>
          {SUBJECT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        {user.role === 'teacher' || user.role === 'admin' ? (
          <Select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full sm:w-48"
          >
            <option value="all">All students</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {rows.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No graded work matches these filters.
          </Card>
        ) : (
          rows.map((r) => (
            <Card key={r.id} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-muted-foreground">
                  {r.subject} · {r.className} · {r.teacher} ·{' '}
                  {formatDueDate(r.graded_at.slice(0, 10))}
                </p>
                {r.feedback ? (
                  <p className="mt-2 text-sm text-muted-foreground text-pretty">
                    {r.feedback}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-start sm:items-end">
                <span
                  className="text-2xl font-semibold tabular-nums"
                  style={{ color: gradeTone(r.pct) }}
                >
                  {r.score}/{r.max}
                </span>
                <span className="text-xs text-muted-foreground">{r.pct}%</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
