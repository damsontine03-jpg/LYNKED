'use client'

import { useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { SubmissionStatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/app-store'
import { formatDueDate } from '@/lib/date-utils'
import type { Submission, User } from '@/lib/types'

export function SubmissionsView({ user }: { user: User }) {
  const { assignments, submissions, gradeSubmission } = useAppStore()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [grading, setGrading] = useState<Submission | null>(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return submissions
      .map((s) => ({
        sub: s,
        assignment: assignments.find((a) => a.id === s.assignment_id),
      }))
      .filter((r) => r.assignment)
      .filter((r) => (status === 'all' ? true : r.sub.status === status))
      .filter((r) =>
        q
          ? r.sub.student_name.toLowerCase().includes(q) ||
            (r.assignment?.title.toLowerCase().includes(q) ?? false)
          : true,
      )
  }, [submissions, assignments, query, status])

  function openGrade(sub: Submission) {
    setGrading(sub)
    setScore(sub.score != null ? String(sub.score) : '')
    setFeedback(sub.feedback ?? '')
  }

  function saveGrade() {
    if (!grading) return
    const n = Number(score)
    if (Number.isNaN(n)) return
    gradeSubmission(grading.id, n, feedback)
    setGrading(null)
  }

  const assignment = grading
    ? assignments.find((a) => a.id === grading.assignment_id)
    : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Submissions</h1>
        <p className="text-sm text-muted-foreground">
          Review student work, download files, and enter grades.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student or assignment"
            className="pl-9"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full sm:w-48">
          <option value="all">All statuses</option>
          <option value="not_submitted">Not submitted</option>
          <option value="submitted">Submitted</option>
          <option value="late">Late</option>
          <option value="graded">Graded</option>
        </Select>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No submissions match these filters.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3 md:hidden">
            {rows.map(({ sub, assignment: a }) => (
              <div
                key={sub.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{sub.student_name}</p>
                    <p className="truncate text-sm text-muted-foreground">{a?.title}</p>
                  </div>
                  <SubmissionStatusBadge status={sub.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {sub.submitted_at
                    ? formatDueDate(sub.submitted_at.slice(0, 10))
                    : 'Not submitted'}
                  {sub.score != null ? ` · ${sub.score}/${a?.max_marks}` : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sub.file ? (
                    <Button variant="ghost" size="sm">
                      <Download />
                      Download
                    </Button>
                  ) : null}
                  {user.role !== 'student' && sub.status !== 'not_submitted' ? (
                    <Button size="sm" onClick={() => openGrade(sub)}>
                      Grade
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Assignment</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Grade</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ sub, assignment: a }) => (
                  <tr key={sub.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{sub.student_name}</td>
                    <td className="px-4 py-3">{a?.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sub.submitted_at
                        ? formatDueDate(sub.submitted_at.slice(0, 10))
                        : 'None'}
                    </td>
                    <td className="px-4 py-3">
                      <SubmissionStatusBadge status={sub.status} />
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {sub.score != null ? `${sub.score}/${a?.max_marks}` : 'None'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {sub.file ? (
                          <Button variant="ghost" size="sm">
                            <Download />
                            Download
                          </Button>
                        ) : null}
                        {user.role !== 'student' && sub.status !== 'not_submitted' ? (
                          <Button size="sm" onClick={() => openGrade(sub)}>
                            Grade
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog
        open={Boolean(grading)}
        onOpenChange={(open) => !open && setGrading(null)}
        title="Grade submission"
        description={
          grading
            ? `${grading.student_name} · ${assignment?.title ?? ''}`
            : undefined
        }
      >
        <div className="flex flex-col gap-4">
          {grading?.file ? (
            <p className="text-sm text-muted-foreground">File: {grading.file.name}</p>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="grade-score">
              Score / {assignment?.max_marks ?? 0}
            </Label>
            <Input
              id="grade-score"
              type="number"
              min={0}
              max={assignment?.max_marks}
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="grade-fb">Feedback</Label>
            <Textarea
              id="grade-fb"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setGrading(null)}>
              Cancel
            </Button>
            <Button onClick={saveGrade}>Save grade</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
