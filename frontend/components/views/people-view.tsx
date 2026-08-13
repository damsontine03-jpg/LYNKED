'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useAppStore } from '@/lib/app-store'
import { CLASS_OPTIONS, SUBJECT_OPTIONS } from '@/lib/ui-helpers'
import { MultiPick } from '@/components/ui/multi-pick'
import type { Role, User } from '@/lib/types'

export function PeopleView({
  user,
  kind,
}: {
  user: User
  kind: 'students' | 'teachers'
}) {
  const { students, teachers, addUser } = useAppStore()
  const people = kind === 'students' ? students : teachers
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [className, setClassName] = useState(
    user.className === 'Whole school' ? 'SSS 2' : user.className,
  )
  const [classNames, setClassNames] = useState<string[]>(['SSS 2'])
  const [subjects, setSubjects] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const role: Role = kind === 'students' ? 'student' : 'teacher'
    if (role === 'teacher' && classNames.length === 0) {
      setError('Choose at least one class.')
      return
    }
    if (role === 'teacher' && subjects.length === 0) {
      setError('Choose at least one subject.')
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
      })
      setName('')
      setEmail('')
      setSubjects([])
      setClassNames(['SSS 2'])
      setOpen(false)
      setNotice(
        result.emailSent
          ? `Account saved. A sign in code was emailed to ${email}.`
          : `Account saved. The email could not be sent. Ask them to open Sign in and request a code.`,
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
          <h1 className="text-2xl font-semibold tracking-tight capitalize">{kind}</h1>
          <p className="text-sm text-muted-foreground">
            {kind === 'students'
              ? 'Everyone enrolled in your school or class.'
              : 'Teaching staff across classes and subjects.'}
          </p>
        </div>
        {user.role === 'admin' ? (
          <Button
            onClick={() => {
              setOpen(true)
              setError('')
            }}
          >
            Add {kind === 'students' ? 'student' : 'teacher'}
          </Button>
        ) : null}
      </div>
      {notice ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-foreground shadow-sm">
          {notice}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {people.map((p) => (
          <Card key={p.id} className="flex items-center gap-3 p-4">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
              {p.name.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="font-medium">{p.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {p.email}
                {(p.classNames?.length ? p.classNames : [p.className]).filter(Boolean).length
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
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!busy) {
            setOpen(next)
            if (!next) setError('')
          }
        }}
        title={`Add ${kind === 'students' ? 'student' : 'teacher'}`}
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
              <Select
                id="p-class"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
              >
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <>
              <MultiPick
                label="Classes"
                options={CLASS_OPTIONS}
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
          )}
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
