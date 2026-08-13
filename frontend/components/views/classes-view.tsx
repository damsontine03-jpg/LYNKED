'use client'

import { useState } from 'react'
import { TeacherView } from '@/components/views/teacher-view'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useAppStore } from '@/lib/app-store'
import { CLASS_OPTIONS } from '@/lib/ui-helpers'
import type { User } from '@/lib/types'

export function ClassesView({ user }: { user: User }) {
  const { classes, teachers, addClass } = useAppStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('SSS 1')
  const [customName, setCustomName] = useState('')
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? user.id)

  const mine =
    user.role === 'teacher'
      ? classes.filter((c) => c.teacher_id === user.id)
      : classes

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const teacher =
      user.role === 'teacher'
        ? user
        : teachers.find((t) => t.id === teacherId) ?? teachers[0] ?? user
    addClass({
      name: customName.trim() || name,
      level: 'Senior Secondary',
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
          <h1 className="text-2xl font-semibold tracking-tight">Classes</h1>
          <p className="text-sm text-muted-foreground">
            {user.role === 'teacher'
              ? 'Classes you teach. Add another class at any time.'
              : 'Manage class groups and form tutors.'}
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Create class</Button>
      </div>
      {mine.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-muted-foreground shadow-sm">
          No classes yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {mine.map((c) => (
            <Card key={c.id} className="flex flex-col gap-2 p-5">
              <p className="text-lg font-semibold">{c.name}</p>
              <p className="text-sm text-muted-foreground">
                {c.level} · {c.teacher_name}
              </p>
              <p className="text-xs text-muted-foreground">{c.student_count} students</p>
            </Card>
          ))}
        </div>
      )}
      {user.role === 'teacher' ? <TeacherView user={user} /> : null}
      <Dialog open={open} onOpenChange={setOpen} title="Create class">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cls-name">Class</Label>
            <Select id="cls-name" value={name} onChange={(e) => setName(e.target.value)}>
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cls-custom">Or type a class name</Label>
            <Input
              id="cls-custom"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="SSS 2 Science"
            />
          </div>
          {user.role === 'admin' ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cls-teacher">Teacher</Label>
              <Select
                id="cls-teacher"
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
