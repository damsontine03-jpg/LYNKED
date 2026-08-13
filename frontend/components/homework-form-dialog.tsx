'use client'

import { useEffect, useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { SUBJECT_OPTIONS } from '@/lib/ui-helpers'
import { todayInputValue } from '@/lib/date-utils'
import type { Homework, HomeworkInput, Priority, Status, User } from '@/lib/types'

interface HomeworkFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Existing record when editing, or null when creating. */
  initial: Homework | null
  onSubmit: (input: HomeworkInput) => void
  /** When provided (teacher creating), shows an assignee selector. */
  assignees?: User[]
}

function emptyForm(assignees?: User[]): HomeworkInput {
  return {
    title: '',
    description: '',
    subject: 'Biology',
    due_date: todayInputValue(),
    status: 'pending',
    priority: 'medium',
    // Default to the whole class when a roster is available.
    student_id: assignees && assignees.length > 0 ? 'all' : '',
  }
}

export function HomeworkFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  assignees,
}: HomeworkFormDialogProps) {
  const [form, setForm] = useState<HomeworkInput>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = Boolean(initial)

  // Sync the form whenever the dialog opens for a new target.
  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        title: initial.title,
        description: initial.description ?? '',
        subject: initial.subject,
        due_date: initial.due_date,
        status: initial.status,
        priority: initial.priority ?? 'medium',
        student_id: initial.student_id,
      })
    } else {
      setForm(emptyForm(assignees))
    }
    setErrors({})
  }, [open, initial])

  function set<K extends keyof HomeworkInput>(key: K, value: HomeworkInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!form.title.trim()) nextErrors.title = 'A title is required.'
    if (!form.subject.trim()) nextErrors.subject = 'Choose a subject.'
    if (!form.due_date) nextErrors.due_date = 'Set a due date.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit({ ...form, title: form.title.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit homework' : 'Add homework'}
      description={
        isEditing
          ? 'Update the assignment details.'
          : 'Create a new assignment and choose who receives it.'
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hw-title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="hw-title"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Photosynthesis lab report"
            aria-invalid={Boolean(errors.title)}
            autoFocus
          />
          {errors.title ? (
            <p className="text-xs text-destructive">{errors.title}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hw-subject">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Select
              id="hw-subject"
              value={form.subject}
              onChange={(e) => set('subject', e.target.value)}
            >
              {SUBJECT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hw-due">
              Due date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="hw-due"
              type="date"
              value={form.due_date}
              onChange={(e) => set('due_date', e.target.value)}
              aria-invalid={Boolean(errors.due_date)}
            />
            {errors.due_date ? (
              <p className="text-xs text-destructive">{errors.due_date}</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hw-priority">Priority</Label>
            <Select
              id="hw-priority"
              value={form.priority}
              onChange={(e) => set('priority', e.target.value as Priority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hw-status">Status</Label>
            <Select
              id="hw-status"
              value={form.status}
              onChange={(e) => set('status', e.target.value as Status)}
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </Select>
          </div>
        </div>

        {assignees && assignees.length > 0 && !isEditing ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hw-assignee">Assign to</Label>
            <Select
              id="hw-assignee"
              value={form.student_id}
              onChange={(e) => set('student_id', e.target.value)}
            >
              <option value="all">Whole class</option>
              {assignees.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hw-desc">Description</Label>
          <Textarea
            id="hw-desc"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Add any instructions or details (optional)"
          />
        </div>

        <div className="mt-1 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" size="lg">
            {isEditing ? 'Save changes' : 'Add homework'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
