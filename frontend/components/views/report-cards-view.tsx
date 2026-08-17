'use client'

import { useMemo, useState } from 'react'
import { Eye, EyeOff, FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { ReportCardView } from '@/components/report-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/app-store'
import { gradeTone, letterGrade, percent, REPORT_TERMS } from '@/lib/ui-helpers'
import { cn } from '@/lib/utils'
import type { ReportCard, User } from '@/lib/types'

type ResultRow = ReportCard['results'][number]

type CardForm = {
  id?: string
  studentId: string
  term: string
  results: ResultRow[]
  teacher_remark: string
}

export function ReportCardsView({ user }: { user: User }) {
  const {
    visibleReportCards,
    toggleReportCardPublished,
    createReportCard,
    updateReportCard,
    students,
    subjects,
    assignments,
    submissions,
  } = useAppStore()
  const canWrite = user.role === 'teacher' || user.role === 'admin'

  const roster = useMemo(() => {
    if (user.role === 'admin') return students
    const names = user.classNames?.length ? user.classNames : [user.className]
    const mine = students.filter((s) => names.includes(s.className))
    return mine.length ? mine : students
  }, [students, user])

  const [selectedId, setSelectedId] = useState<string | null>(
    visibleReportCards[0]?.id ?? null,
  )
  const [form, setForm] = useState<CardForm | null>(null)

  const selected = useMemo(
    () =>
      visibleReportCards.find((c) => c.id === selectedId) ??
      visibleReportCards[0] ??
      null,
    [visibleReportCards, selectedId],
  )

  function resultsFromWork(studentId: string) {
    const bySubject = new Map<string, number[]>()
    for (const assignment of assignments) {
      const sub = submissions.find(
        (s) =>
          s.assignment_id === assignment.id &&
          s.student_id === studentId &&
          s.status === 'graded' &&
          s.score != null,
      )
      if (!sub || sub.score == null) continue
      const list = bySubject.get(assignment.subject) ?? []
      list.push(percent(sub.score, assignment.max_marks))
      bySubject.set(assignment.subject, list)
    }
    const rows: ResultRow[] = []
    for (const [subject, vals] of bySubject) {
      const score = Math.round(vals.reduce((sum, n) => sum + n, 0) / vals.length)
      rows.push({ subject, score, grade: letterGrade(score), remark: '' })
    }
    const className = students.find((s) => s.id === studentId)?.className
    for (const subject of subjects) {
      if (user.role !== 'admin' && subject.teacher_id !== user.id) continue
      if (className && subject.className !== className) continue
      if (rows.some((row) => row.subject === subject.name)) continue
      rows.push({ subject: subject.name, score: 0, grade: letterGrade(0), remark: '' })
    }
    if (rows.length === 0) {
      rows.push({ subject: 'Mathematics', score: 0, grade: letterGrade(0), remark: '' })
    }
    return rows
  }

  function startCreate() {
    const studentId = roster[0]?.id ?? ''
    setForm({
      studentId,
      term: REPORT_TERMS[0],
      results: studentId ? resultsFromWork(studentId) : [],
      teacher_remark: '',
    })
  }

  function startEdit(card: ReportCard) {
    setForm({
      id: card.id,
      studentId: card.student_id,
      term: card.term,
      results: card.results.map((row) => ({ ...row })),
      teacher_remark: card.teacher_remark,
    })
  }

  function saveForm(published: boolean) {
    if (!form?.studentId || !form.term || form.results.every((row) => !row.subject.trim())) {
      return
    }
    const results = form.results
      .filter((row) => row.subject.trim())
      .map((row) => ({
        ...row,
        subject: row.subject.trim(),
        grade: letterGrade(Number(row.score) || 0),
      }))
    if (form.id) {
      updateReportCard(form.id, {
        term: form.term,
        results,
        teacher_remark: form.teacher_remark.trim(),
        published,
      })
    } else {
      createReportCard({
        student_id: form.studentId,
        term: form.term,
        results,
        teacher_remark: form.teacher_remark.trim(),
        published,
      })
    }
    setForm(null)
  }

  const formDialog = (
    <Dialog
      open={Boolean(form)}
      onOpenChange={(open) => !open && setForm(null)}
      title={form?.id ? 'Edit report card' : 'Create report card'}
      description="Fill the template, then save a draft or publish it to the student."
      className="max-w-2xl"
    >
      {form ? (
        <form
          className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto"
          onSubmit={(e) => {
            e.preventDefault()
            saveForm(false)
          }}
        >
          <p className="text-sm text-muted-foreground">
            Scores start from assignment grades where they exist. You can change any score
            before you publish. Grade uses 80 to 100 A, 70 to 79 B, 60 to 69 C, 50 to 59 D,
            below 50 F.
          </p>
          {!form.id ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rc-student">Student</Label>
              <Select
                id="rc-student"
                value={form.studentId}
                onChange={(e) => {
                  const studentId = e.target.value
                  setForm({
                    ...form,
                    studentId,
                    results: resultsFromWork(studentId),
                  })
                }}
              >
                {roster.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} · {student.className}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rc-term">Term</Label>
            <Select
              id="rc-term"
              value={form.term}
              onChange={(e) => setForm({ ...form, term: e.target.value })}
            >
              {REPORT_TERMS.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Subjects</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setForm({
                    ...form,
                    results: [
                      ...form.results,
                      { subject: '', score: 0, grade: letterGrade(0), remark: '' },
                    ],
                  })
                }
              >
                <Plus />
                Add subject
              </Button>
            </div>
            {form.results.map((row, index) => (
              <div
                key={`${row.subject}-${index}`}
                className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_5rem_4rem_auto]"
              >
                <Input
                  value={row.subject}
                  placeholder="Subject"
                  onChange={(e) => {
                    const results = [...form.results]
                    results[index] = { ...row, subject: e.target.value }
                    setForm({ ...form, results })
                  }}
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={row.score}
                  aria-label="Score"
                  onChange={(e) => {
                    const score = Math.max(0, Math.min(100, Number(e.target.value) || 0))
                    const results = [...form.results]
                    results[index] = { ...row, score, grade: letterGrade(score) }
                    setForm({ ...form, results })
                  }}
                />
                <Input value={row.grade} readOnly aria-label="Grade" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove subject"
                  onClick={() =>
                    setForm({
                      ...form,
                      results: form.results.filter((_, i) => i !== index),
                    })
                  }
                >
                  <Trash2 />
                </Button>
                <Input
                  className="sm:col-span-4"
                  value={row.remark}
                  placeholder="Subject remark"
                  onChange={(e) => {
                    const results = [...form.results]
                    results[index] = { ...row, remark: e.target.value }
                    setForm({ ...form, results })
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rc-remark">Teacher remark</Label>
            <Textarea
              id="rc-remark"
              value={form.teacher_remark}
              onChange={(e) => setForm({ ...form, teacher_remark: e.target.value })}
              placeholder="Write a remark for the term"
              rows={3}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary">
              Save draft
            </Button>
            <Button type="button" onClick={() => saveForm(true)}>
              Publish to student
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  )

  if (visibleReportCards.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Header role={user.role} onCreate={canWrite ? startCreate : undefined} />
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-6">
            <FileText />
          </span>
          <p className="font-medium">No report cards yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {canWrite
              ? 'Fill the report card template for a student. Assignment grades are added for you where they exist.'
              : user.role === 'parent'
                ? 'No published report card for your child yet.'
                : 'Your teacher has not published a report card for you yet.'}
          </p>
          {canWrite ? (
            <Button onClick={startCreate}>
              <Plus />
              Create report card
            </Button>
          ) : null}
        </div>
        {formDialog}
      </div>
    )
  }

  if (canWrite) {
    return (
      <div className="flex flex-col gap-6">
        <Header role={user.role} onCreate={startCreate} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[18rem_1fr]">
          <div className="flex flex-col gap-2">
            {visibleReportCards.map((card) => {
              const tone = gradeTone(card.average)
              const active = selected?.id === card.id
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSelectedId(card.id)}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-2xl border p-3 text-left transition-colors',
                    active
                      ? 'border-primary/60 bg-accent/60'
                      : 'border-border bg-card hover:border-ring/40',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                      style={{ backgroundColor: `${tone}22`, color: tone }}
                    >
                      {card.overall_grade}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">
                        {card.student_name}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {card.term} · {card.average}% average
                      </span>
                    </div>
                  </div>
                  <Badge variant={card.published ? 'success' : 'outline'}>
                    {card.published ? 'Shared' : 'Draft'}
                  </Badge>
                </button>
              )
            })}
          </div>

          {selected ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => startEdit(selected)}>
                  <Pencil />
                  Edit template
                </Button>
                <Button
                  variant={selected.published ? 'ghost' : 'default'}
                  size="sm"
                  onClick={() => toggleReportCardPublished(selected.id)}
                >
                  {selected.published ? (
                    <>
                      <EyeOff />
                      Unshare
                    </>
                  ) : (
                    <>
                      <Eye />
                      Share with student
                    </>
                  )}
                </Button>
              </div>
              <ReportCardView card={selected} showStudentName />
            </div>
          ) : null}
        </div>
        {formDialog}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Header role={user.role} />
      {visibleReportCards.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {visibleReportCards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => setSelectedId(card.id)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                selected?.id === card.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {card.term}
            </button>
          ))}
        </div>
      ) : null}
      {selected ? (
        <div className="max-w-2xl">
          <ReportCardView card={selected} />
        </div>
      ) : null}
    </div>
  )
}

function Header({
  role,
  onCreate,
}: {
  role: User['role']
  onCreate?: () => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Report Card</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          {role === 'teacher' || role === 'admin'
            ? 'Fill a report card template, include assignment grades, then publish it to the student.'
            : role === 'parent'
              ? 'Published termly results for your child.'
              : 'Your termly results and your teacher’s remarks.'}
        </p>
      </div>
      {onCreate ? (
        <Button onClick={onCreate}>
          <Plus />
          Create report card
        </Button>
      ) : null}
    </div>
  )
}
