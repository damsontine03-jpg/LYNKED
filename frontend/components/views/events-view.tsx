'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/app-store'
import { formatDueDate, todayInputValue } from '@/lib/date-utils'
import { EVENT_IMAGES } from '@/lib/images'
import type { SchoolEvent, User } from '@/lib/types'

export function EventsView({ user }: { user: User }) {
  const { events, upsertEvent, deleteEvent } = useAppStore()
  const [selected, setSelected] = useState<SchoolEvent | null>(null)
  const [editing, setEditing] = useState<Partial<SchoolEvent> | null>(null)
  const canManage = user.role === 'admin'
  const upcoming = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
    [events],
  )

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (!editing?.title || !editing.date) return
    upsertEvent({
      id: editing.id,
      title: editing.title,
      date: editing.date,
      start_time: editing.start_time || '09:00',
      end_time: editing.end_time || '12:00',
      location: editing.location || 'School',
      description: editing.description || '',
      organizer: editing.organizer || user.name,
      published: editing.published ?? true,
    })
    setEditing(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Events</h1>
          <p className="text-sm text-muted-foreground">
            School days, trips, and gatherings.
          </p>
        </div>
        {canManage ? (
          <Button
            onClick={() =>
              setEditing({
                title: '',
                date: todayInputValue(),
                start_time: '09:00',
                end_time: '12:00',
                location: '',
                description: '',
                organizer: user.name,
                published: true,
              })
            }
          >
            Create event
          </Button>
        ) : null}
      </div>

      {upcoming.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-muted-foreground shadow-sm">
          No events posted yet.
        </p>
      ) : (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {upcoming.map((ev) => (
          <Card key={ev.id} className="flex flex-col overflow-hidden p-0">
            {EVENT_IMAGES[ev.title] ? (
              <div className="relative h-36 w-full overflow-hidden bg-muted">
                <Image
                  src={EVENT_IMAGES[ev.title]}
                  alt={ev.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : null}
            <div className="flex flex-col gap-2 p-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold">{ev.title}</h2>
              {!ev.published ? <Badge variant="secondary">Draft</Badge> : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDueDate(ev.date)} · {ev.start_time} to {ev.end_time}
            </p>
            <p className="text-sm text-muted-foreground">{ev.location}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSelected(ev)}>
                Details
              </Button>
              {canManage ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(ev)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteEvent(ev.id)}>
                    Delete
                  </Button>
                </>
              ) : null}
            </div>
            </div>
          </Card>
        ))}
      </div>
      )}

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected?.title ?? 'Event'}
      >
        {selected ? (
          <div className="flex flex-col gap-3 text-sm">
            {EVENT_IMAGES[selected.title] ? (
              <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-muted">
                <Image
                  src={EVENT_IMAGES[selected.title]}
                  alt={selected.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : null}
            <p>
              {formatDueDate(selected.date)} · {selected.start_time} to {selected.end_time}
            </p>
            <p>{selected.location}</p>
            <p className="text-muted-foreground">{selected.description}</p>
            <p className="text-xs text-muted-foreground">Organised by {selected.organizer}</p>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing?.id ? 'Edit event' : 'Create event'}
      >
        {editing ? (
          <form onSubmit={save} className="flex flex-col gap-3">
            <Field label="Title">
              <Input
                value={editing.title ?? ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                required
              />
            </Field>
            <Field label="Date">
              <Input
                type="date"
                value={editing.date ?? ''}
                onChange={(e) => setEditing({ ...editing, date: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Start">
                <Input
                  type="time"
                  value={editing.start_time ?? ''}
                  onChange={(e) => setEditing({ ...editing, start_time: e.target.value })}
                />
              </Field>
              <Field label="End">
                <Input
                  type="time"
                  value={editing.end_time ?? ''}
                  onChange={(e) => setEditing({ ...editing, end_time: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Location">
              <Input
                value={editing.location ?? ''}
                onChange={(e) => setEditing({ ...editing, location: e.target.value })}
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={editing.description ?? ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={3}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit">Publish</Button>
            </div>
          </form>
        ) : null}
      </Dialog>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
