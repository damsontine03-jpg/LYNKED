'use client'

import { useMemo, useState } from 'react'
import { Download, Inbox, Paperclip, Plus, Send, Trash2 } from 'lucide-react'
import { AssignmentFormDialog } from '@/components/assignment-form-dialog'
import { SubmissionStatusBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/app-store'
import { formatDueDate, formatShortDate } from '@/lib/date-utils'
import { CLASS_OPTIONS, DEFAULT_CLASS, SUBJECT_OPTIONS } from '@/lib/ui-helpers'
import { canCreateAssignments, canSubmitAssignments, viewerStudentId } from '@/lib/roles'
import { showToast } from '@/lib/toast'
import type { Assignment, AssignmentInput, Submission, User } from '@/lib/types'

export function AssignmentsView({ user }: { user: User }) {
  const {
    assignments,
    submissions,
    teachers,
    createAssignment,
    createHomework,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
  } = useAppStore()
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Assignment | null>(null)
  const [detail, setDetail] = useState<Assignment | null>(null)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [fileName, setFileName] = useState('')
  const [comment, setComment] = useState('')
  const [submittedToast, setSubmittedToast] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null)

  const teacherIds = useMemo(() => new Set(teachers.map((t) => t.id)), [teachers])
  const studentId = viewerStudentId(user)
  const canSubmit = canSubmitAssignments(user.role)
  const canCreate = canCreateAssignments(user.role)
  const isViewer = user.role === 'student' || user.role === 'parent'

  const scoped = useMemo(() => {
    if (user.role === 'student' || user.role === 'parent') {
      return assignments.filter((a) => a.status === 'published')
    }
    if (user.role === 'admin') return assignments
    return assignments.filter(
      (a) => a.teacher_id === user.id || teacherIds.has(a.teacher_id),
    )
  }, [assignments, teacherIds, user.id, user.role])

  const filtered = useMemo(() => {
    return scoped.filter((a) =>
      subjectFilter === 'all' ? true : a.subject === subjectFilter,
    )
  }, [scoped, subjectFilter])

  const mySub = (assignmentId: string) =>
    submissions.find(
      (s) => s.assignment_id === assignmentId && s.student_id === studentId,
    )

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function handleSave(input: AssignmentInput) {
    if (editing) {
      updateAssignment(editing.id, input)
      return
    }
    if (user.role === 'student') {
      createHomework({
        title: input.title,
        subject: input.subject,
        due_date: input.due_date,
        status: 'pending',
        description: input.instructions,
        student_id: user.id,
      })
      return
    }
    createAssignment(input)
  }

  function handleSubmitWork() {
    if (!canSubmit || !detail || !fileName) return
    submitAssignment(detail.id, fileName, comment)
    setSubmitOpen(false)
    setSubmittedToast(true)
    setFileName('')
    setComment('')
    showToast('Assignment submitted')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold uppercase tracking-tight">
          {user.role === 'parent' ? 'Child assignments' : 'Upcoming assignments'}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full bg-white sm:w-44"
          >
            <option value="all">All subjects</option>
            {[...new Set(scoped.map((a) => a.subject))].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          {canCreate ? (
            <Button size="lg" className="uppercase" onClick={openCreate}>
              <Plus />
              Add homework
            </Button>
          ) : null}
        </div>
      </div>

      {isViewer ? (
        <UpcomingTable
          assignments={filtered.filter((a) => a.status === 'published')}
          submissionFor={(id) => mySub(id)}
          onOpen={(a) => {
            setDetail(a)
            setSubmittedToast(Boolean(mySub(a.id)?.submitted_at))
          }}
        />
      ) : (
        <TeacherAssignmentTable
          assignments={filtered}
          submissions={submissions}
          onOpen={(a) => {
            setEditing(a)
            setFormOpen(true)
          }}
          onDelete={setDeleteTarget}
        />
      )}

      <AssignmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        defaultClass={
          user.classNames?.[0] ||
          (user.className === 'Whole school' ? DEFAULT_CLASS : user.className)
        }
        classOptions={
          isViewer
            ? []
            : user.classNames?.length
              ? user.classNames
              : CLASS_OPTIONS
        }
        subjectOptions={
          user.role === 'teacher' && user.subjects?.length
            ? user.subjects
            : SUBJECT_OPTIONS
        }
        onSubmit={handleSave}
      />

      <Dialog
        open={Boolean(detail)}
        onOpenChange={(open) => !open && setDetail(null)}
        title={detail?.title ?? 'Assignment'}
        description={detail ? `${detail.subject} · ${detail.teacher_name}` : undefined}
        className="max-w-xl"
      >
        {detail ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
              {detail.instructions}
            </p>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <Meta label="Posted" value={formatDueDate(detail.posted_at)} />
              <Meta label="Due" value={formatDueDate(detail.due_date)} />
              <Meta label="Maximum marks" value={String(detail.max_marks)} />
              <Meta
                label="Status"
                value={
                  <SubmissionStatusBadge
                    status={mySub(detail.id)?.status ?? 'not_submitted'}
                  />
                }
              />
            </div>
            {detail.attachment ? (
              <Button variant="secondary" className="justify-between">
                <span className="inline-flex items-center gap-2">
                  <Download className="size-4" />
                  Download assignment
                </span>
                <span className="text-xs text-muted-foreground">
                  {detail.attachment.name}
                </span>
              </Button>
            ) : null}

            {submittedToast && mySub(detail.id)?.file ? (
              <Card className="flex flex-col gap-2 p-4">
                <p className="text-sm font-semibold text-success">Assignment submitted</p>
                <p className="text-xs text-muted-foreground">
                  {mySub(detail.id)?.file?.name} ·{' '}
                  {mySub(detail.id)?.submitted_at
                    ? formatDueDate(mySub(detail.id)!.submitted_at!.slice(0, 10))
                    : ''}
                </p>
                {mySub(detail.id)?.status === 'graded' ? (
                  <p className="text-sm">
                    Score {mySub(detail.id)?.score}/{detail.max_marks}. {mySub(detail.id)?.feedback}
                  </p>
                ) : null}
              </Card>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={() => setDetail(null)}>
                Close
              </Button>
              {canSubmit ? (
                <Button
                  onClick={() => {
                    setSubmitOpen(true)
                    setSubmittedToast(false)
                  }}
                >
                  <Send />
                  {mySub(detail.id)?.submitted_at ? 'Replace submission' : 'Submit assignment'}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete assignment?"
        description={
          deleteTarget
            ? `${deleteTarget.title} will be removed for the class.`
            : undefined
        }
        className="max-w-md"
      >
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (!deleteTarget) return
              deleteAssignment(deleteTarget.id)
              setDeleteTarget(null)
            }}
          >
            Delete
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        title="Submit assignment"
        description="Upload your completed work. You can add a short note for your teacher."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sub-file">File</Label>
            <Input
              id="sub-file"
              type="file"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sub-comment">Comment (optional)</Label>
            <Textarea
              id="sub-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setSubmitOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitWork} disabled={!fileName}>
              Submit
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function TableStatus({ done }: { done: boolean }) {
  return (
    <Badge variant={done ? 'success' : 'warning'}>
      {done ? 'Completed' : 'Pending'}
    </Badge>
  )
}

function TeacherStatus({
  publishStatus,
  submissions,
}: {
  publishStatus: Assignment['status']
  submissions: Submission[]
}) {
  if (publishStatus === 'draft') {
    return <Badge variant="outline">Draft</Badge>
  }
  const turnedIn = submissions.filter((s) => s.status !== 'not_submitted').length
  const allIn = submissions.length > 0 && turnedIn === submissions.length
  return (
    <div className="flex flex-col items-end gap-0.5 sm:items-start">
      <Badge variant={allIn ? 'success' : 'secondary'}>
        {allIn ? 'All submitted' : 'Open'}
      </Badge>
      {submissions.length > 0 ? (
        <span className="text-[0.7rem] text-muted-foreground tabular-nums">
          {turnedIn}/{submissions.length} in
        </span>
      ) : null}
    </div>
  )
}

function UpcomingTable({
  assignments,
  submissionFor,
  onOpen,
}: {
  assignments: Assignment[]
  submissionFor: (id: string) => Submission | undefined
  onOpen: (a: Assignment) => void
}) {
  if (assignments.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-8 text-center text-sm text-muted-foreground shadow-sm">
        No upcoming assignments.
      </p>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3 md:hidden">
        {assignments.map((a) => {
          const sub = submissionFor(a.id)
          const done = sub?.status === 'graded' || sub?.status === 'submitted'
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onOpen(a)}
              className="flex flex-col gap-2 rounded-2xl bg-white p-4 text-left shadow-[0_8px_30px_rgba(30,80,50,0.08)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{a.subject}</p>
                  <p className="truncate font-medium">{a.title}</p>
                </div>
                <TableStatus done={Boolean(done)} />
              </div>
              <p className="text-xs text-muted-foreground">{formatShortDate(a.due_date)}</p>
            </button>
          )
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-[0_8px_30px_rgba(30,80,50,0.08)] md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-primary text-xs font-bold uppercase tracking-wider text-primary-foreground">
            <tr>
              <th className="px-5 py-3.5 font-bold">Subject</th>
              <th className="px-5 py-3.5 font-bold">Assignment</th>
              <th className="px-5 py-3.5 font-bold">Due date</th>
              <th className="px-5 py-3.5 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => {
              const sub = submissionFor(a.id)
              const done = sub?.status === 'graded' || sub?.status === 'submitted'
              return (
                <tr
                  key={a.id}
                  className="cursor-pointer border-b border-border last:border-0 transition-colors duration-200 hover:bg-muted/50"
                  onClick={() => onOpen(a)}
                >
                  <td className="px-5 py-4 font-medium">{a.subject}</td>
                  <td className="px-5 py-4">{a.title}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {formatShortDate(a.due_date)}
                  </td>
                  <td className="px-5 py-4">
                    <TableStatus done={Boolean(done)} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

function TeacherAssignmentTable({
  assignments,
  submissions,
  onOpen,
  onDelete,
}: {
  assignments: Assignment[]
  submissions: Submission[]
  onOpen: (a: Assignment) => void
  onDelete: (a: Assignment) => void
}) {
  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-6">
          <Inbox />
        </span>
        <p className="font-medium">No assignments yet</p>
        <p className="text-sm text-muted-foreground">Create the first one for your class.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3 md:hidden">
        {assignments.map((a) => {
          const subs = submissions.filter((s) => s.assignment_id === a.id)
          return (
            <div
              key={a.id}
              className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgba(30,80,50,0.08)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{a.subject}</p>
                  <p className="truncate font-medium">
                    {a.title}
                    {a.attachment ? (
                      <Paperclip className="ml-1 inline size-3 text-muted-foreground" />
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatShortDate(a.due_date)}
                  </p>
                </div>
                <TeacherStatus publishStatus={a.status} submissions={subs} />
              </div>
              <div className="flex flex-wrap justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => onOpen(a)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete(a)}
                  aria-label={`Delete ${a.title}`}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-[0_8px_30px_rgba(30,80,50,0.08)] md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-primary text-xs font-bold uppercase tracking-wider text-primary-foreground">
            <tr>
              <th className="px-5 py-3.5 font-bold">Subject</th>
              <th className="px-5 py-3.5 font-bold">Assignment</th>
              <th className="px-5 py-3.5 font-bold">Due date</th>
              <th className="px-5 py-3.5 font-bold">Status</th>
              <th className="px-5 py-3.5 font-bold" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assignments.map((a) => {
              const subs = submissions.filter((s) => s.assignment_id === a.id)
              return (
                <tr key={a.id} className="border-b border-border last:border-0 transition-colors duration-200 hover:bg-muted/40">
                  <td className="px-5 py-4 font-medium">{a.subject}</td>
                  <td className="px-5 py-4">
                    {a.title}
                    {a.attachment ? (
                      <Paperclip className="ml-1 inline size-3 text-muted-foreground" />
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {formatShortDate(a.due_date)}
                  </td>
                  <td className="px-5 py-4">
                    <TeacherStatus publishStatus={a.status} submissions={subs} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onOpen(a)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onDelete(a)}
                        aria-label={`Delete ${a.title}`}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
