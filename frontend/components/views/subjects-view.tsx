'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClassSelect } from '@/components/ui/class-select'
import { Select } from '@/components/ui/select'
import { useAppStore } from '@/lib/app-store'
import { CLASS_OPTIONS, DEFAULT_CLASS, SUBJECT_OPTIONS, subjectAccent } from '@/lib/ui-helpers'
import type { User } from '@/lib/types'

export function SubjectsView({ user }: { user: User }) {
  const { subjects, teachers, addSubject, deleteSubject } = useAppStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('Biology')
  const [customName, setCustomName] = useState('')
  const [code, setCode] = useState('BIO')
  const [className, setClassName] = useState(
    user.classNames?.[0] || user.className || DEFAULT_CLASS,
  )
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? user.id)

  const mine =
    user.role === 'teacher'
      ? subjects.filter((s) => s.teacher_id === user.id)
      : subjects
  const classChoices = user.classNames?.length ? user.classNames : CLASS_OPTIONS

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const teacher =
      user.role === 'teacher'
        ? user
        : teachers.find((t) => t.id === teacherId) ?? teachers[0] ?? user
    const subjectName = customName.trim() || name
    addSubject({
      name: subjectName,
      code: code.trim() || subjectName.slice(0, 3).toUpperCase(),
      className,
      teacher_id: teacher.id,
      teacher_name: teacher.name,
    })
    setCustomName('')
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Subjects</h1>
          <p className="text-sm text-muted-foreground">
            {user.role === 'teacher'
              ? 'Subjects you teach. Add one you take, or remove one added by mistake.'
              : 'Link subjects to classes and teachers.'}
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Add subject</Button>
      </div>
      {mine.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-muted-foreground shadow-sm">
          No subjects yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {mine.map((s) => {
            const accent = subjectAccent(s.name)
            return (
              <Card key={s.id} className="relative overflow-hidden p-5">
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1"
                  style={{ backgroundColor: accent }}
                />
                <p className="pl-2 font-semibold">{s.name}</p>
                <p className="pl-2 text-xs text-muted-foreground">
                  {s.code} · {s.className} · {s.teacher_name}
                </p>
                {user.role === 'admin' || s.teacher_id === user.id ? (
                  <div className="pl-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSubject(s.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : null}
              </Card>
            )
          })}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen} title="Add subject">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-name">Subject</Label>
            <Select id="s-name" value={name} onChange={(e) => setName(e.target.value)}>
              {SUBJECT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-custom">Or type a subject</Label>
            <Input
              id="s-custom"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Further Mathematics"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-code">Code</Label>
            <Input id="s-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-class">Class</Label>
            <ClassSelect
              id="s-class"
              names={classChoices}
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
          </div>
          {user.role === 'admin' ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-teacher">Teacher</Label>
              <Select
                id="s-teacher"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
