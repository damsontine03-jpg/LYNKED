'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClassSelect } from '@/components/ui/class-select'
import { useAppStore } from '@/lib/app-store'
import { CLASS_GROUPS, CLASS_OPTIONS, DEFAULT_CLASS, SUBJECT_OPTIONS } from '@/lib/ui-helpers'
import { MultiPick } from '@/components/ui/multi-pick'
import type { Role, User } from '@/lib/types'

const LABELS = {
  students: { title: 'Students', add: 'student', blurb: 'Everyone enrolled in your school or class.' },
  teachers: { title: 'Teachers', add: 'teacher', blurb: 'Teaching staff across classes and subjects.' },
  parents: {
    title: 'Parents',
    add: 'parent',
    blurb: 'Guardians linked with a student ID. They can view schoolwork and message class teachers.',
  },
} as const

export function PeopleView({
  user,
  kind,
}: {
  user: User
  kind: 'students' | 'teachers' | 'parents'
}) {
  const { students, teachers, parents, addUser } = useAppStore()
  const people = kind === 'students' ? students : kind === 'teachers' ? teachers : parents
  const copy = LABELS[kind]
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [childPublicId, setChildPublicId] = useState('')
  const [className, setClassName] = useState(
    user.className === 'Whole school' ? DEFAULT_CLASS : user.className || DEFAULT_CLASS,
  )
  const [classNames, setClassNames] = useState<string[]>([DEFAULT_CLASS])
  const [subjects, setSubjects] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const role: Role =
      kind === 'students' ? 'student' : kind === 'teachers' ? 'teacher' : 'parent'
    if (role === 'teacher' && classNames.length === 0) {
      setError('Choose at least one class.')
      return
    }
    if (role === 'teacher' && subjects.length === 0) {
      setError('Choose at least one subject.')
      return
    }
    if (role === 'parent' && !childPublicId.trim()) {
      setError('Enter the student ID for their child.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await addUser({
        name,
        email,
        role,
        className: role === 'teacher' ? classNames[0] : className,
        classNames: role === 'teacher' ? classNames : [className],
        subjects: role === 'teacher' ? subjects : [],
        childPublicId: role === 'parent' ? childPublicId.trim() : undefined,
      })
      setName('')
      setEmail('')
      setChildPublicId('')
      setSubjects([])
      setClassNames([DEFAULT_CLASS])
      setOpen(false)
      setNotice(
        result.emailSent
          ? `Account saved${result.publicId ? ` with ID ${result.publicId}` : ''}. A sign in code was emailed to ${email}.`
          : `Account saved${result.publicId ? ` with ID ${result.publicId}` : ''}. The email could not be sent. Ask them to open Sign in and request a code.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this person.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.blurb}</p>
        </div>
        {user.role === 'admin' ? (
          <Button
            onClick={() => {
              setOpen(true)
              setError('')
            }}
          >
            Add {copy.add}
          </Button>
        ) : null}
      </div>
      {notice ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-foreground shadow-sm">
          {notice}
        </p>
      ) : null}
      {people.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-muted-foreground shadow-sm">
          No {copy.title.toLowerCase()} yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {people.map((p) => (
            <Card key={p.id} className="flex items-center gap-3 p-4">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
                {p.name.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="font-medium">{p.name}</p>
                {p.publicId ? (
                  <p className="font-mono text-xs font-semibold tracking-wide text-primary">
                    {p.publicId}
                  </p>
                ) : null}
                <p className="truncate text-xs text-muted-foreground">
                  {p.email}
                  {p.childName ? ` · Child: ${p.childName}` : ''}
                  {p.childPublicId ? ` · ${p.childPublicId}` : ''}
                  {(p.classNames?.length ? p.classNames : [p.className]).filter(Boolean)
                    .length
                    ? ` · ${(p.classNames?.length ? p.classNames : [p.className]).join(', ')}`
                    : ''}
                  {p.subjects?.length
                    ? ` · ${p.subjects.join(', ')}`
                    : p.subject
                      ? ` · ${p.subject}`
                      : ''}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!busy) {
            setOpen(next)
            if (!next) setError('')
          }
        }}
        title={`Add ${copy.add}`}
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            They will be saved to the school list. An email with a 6 digit sign in code goes to them.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-name">Name</Label>
            <Input
              id="p-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-email">Email</Label>
            <Input
              id="p-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {kind === 'students' ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-class">Class</Label>
              <ClassSelect
                id="p-class"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
              />
            </div>
          ) : null}
          {kind === 'teachers' ? (
            <>
              <MultiPick
                label="Classes"
                options={CLASS_OPTIONS}
                groups={CLASS_GROUPS}
                selected={classNames}
                onChange={setClassNames}
                allowCustom
                customPlaceholder="Type another class"
              />
              <MultiPick
                label="Subjects"
                options={SUBJECT_OPTIONS}
                selected={subjects}
                onChange={setSubjects}
                allowCustom
                customPlaceholder="Type another subject"
              />
            </>
          ) : null}
          {kind === 'parents' ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-child">Child student ID</Label>
              <Input
                id="p-child"
                value={childPublicId}
                onChange={(e) => setChildPublicId(e.target.value.toUpperCase())}
                placeholder="STU-A7K2M9"
                required
              />
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Save and email code'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
