'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ClassSelect } from '@/components/ui/class-select'
import { Select } from '@/components/ui/select'
import { CLASS_OPTIONS, SUBJECT_OPTIONS } from '@/lib/ui-helpers'
import { todayInputValue } from '@/lib/date-utils'
import type { Assignment, AssignmentInput } from '@/lib/types'

const TYPES = ['Homework', 'Project', 'Quiz', 'Essay', 'Lab']

function emptyForm(className: string, subject: string): AssignmentInput {
  return {
    title: '',
    subject,
    className,
    topic: 'Homework',
    instructions: '',
    due_date: todayInputValue(),
    max_marks: 20,
    status: 'published',
  }
}

export function AssignmentFormDialog({
  open,
  onOpenChange,
  initial,
  defaultClass,
  classOptions = CLASS_OPTIONS,
  subjectOptions = SUBJECT_OPTIONS,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: Assignment | null
  defaultClass: string
  classOptions?: string[]
  subjectOptions?: string[]
  onSubmit: (input: AssignmentInput) => void
}) {
  const defaultSubject = subjectOptions[0] || SUBJECT_OPTIONS[0]
  const [form, setForm] = useState<AssignmentInput>(
    emptyForm(defaultClass, defaultSubject),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const classes = [...new Set(classOptions)]
  const subjects = [...new Set(subjectOptions.length ? subjectOptions : SUBJECT_OPTIONS)]

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        title: initial.title,
        subject: initial.subject,
        className: initial.className,
        topic: initial.topic || 'Homework',
        instructions: initial.instructions,
        due_date: initial.due_date,
        max_marks: initial.max_marks,
        status: initial.status,
      })
    } else {
      setForm(emptyForm(defaultClass, subjectOptions[0] || SUBJECT_OPTIONS[0]))
    }
    setErrors({})
  }, [open, initial, defaultClass, subjectOptions])

  if (!open) return null

  function set<K extends keyof AssignmentInput>(key: K, value: AssignmentInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addAssignment() {
    const next: Record<string, string> = {}
    if (!form.title.trim()) next.title = 'Enter an assignment name.'
    if (!form.due_date) next.due_date = 'Set a due date.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSubmit({
      ...form,
      title: form.title.trim(),
      topic: form.topic || 'Homework',
      status: 'published',
    })
    onOpenChange(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#dceee3]/95 px-3 py-6 sm:items-center sm:px-4 sm:py-8 md:pt-[4.25rem]">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-[0_16px_50px_rgba(30,80,50,0.12)] sm:p-10">
        <h2 className="mb-6 text-center text-xl font-bold uppercase tracking-wide sm:mb-8 sm:text-2xl">
          {initial ? 'Edit homework' : 'Add new homework'}
        </h2>

        <div className="flex flex-col gap-5">
          <Field label="Subject" error={errors.subject}>
            <Select value={form.subject} onChange={(e) => set('subject', e.target.value)}>
              {[...new Set([...subjects, form.subject].filter(Boolean))].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>

          {classes.length > 0 ? (
            <Field label="Class">
              <ClassSelect
                names={[...new Set([...classes, form.className].filter(Boolean))]}
                value={form.className}
                onChange={(e) => set('className', e.target.value)}
              />
            </Field>
          ) : null}

          <Field label="Assignment name" error={errors.title}>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="HW 12"
            />
          </Field>

          <Field label="Due date" error={errors.due_date}>
            <div className="relative">
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => set('due_date', e.target.value)}
                className="pr-10"
              />
              <CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </Field>

          <Field label="Type">
            <Select value={form.topic} onChange={(e) => set('topic', e.target.value)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Notes">
            <Textarea
              value={form.instructions}
              onChange={(e) => set('instructions', e.target.value)}
              rows={4}
              placeholder="Any extra details"
            />
          </Field>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button type="button" variant="outline" size="lg" className="uppercase" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" size="lg" className="uppercase" onClick={addAssignment}>
              {initial ? 'Save changes' : 'Add assignment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
