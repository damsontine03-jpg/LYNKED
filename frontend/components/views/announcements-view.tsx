'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/app-store'
import { formatDueDate } from '@/lib/date-utils'
import type { AnnouncementPriority, User } from '@/lib/types'

export function AnnouncementsView({ user }: { user: User }) {
  const { announcements, sendAnnouncement } = useAppStore()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState<AnnouncementPriority>('normal')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    sendAnnouncement(title, body, priority)
    setTitle('')
    setBody('')
    setPriority('normal')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
        <p className="text-sm text-muted-foreground">
          Notices for the whole school. Important items also show on dashboards.
        </p>
      </div>

      {user.role === 'admin' ? (
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-sm font-medium">Publish announcement</h2>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <Label htmlFor="an-title">Title</Label>
            <Input id="an-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Label htmlFor="an-body">Content</Label>
            <Textarea id="an-body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
            <Label htmlFor="an-pri">Priority</Label>
            <Select
              id="an-pri"
              value={priority}
              onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
            >
              <option value="normal">Normal</option>
              <option value="important">Important</option>
            </Select>
            <Button type="submit" disabled={!title.trim()} className="self-start">
              Publish
            </Button>
          </form>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3">
        {announcements.map((a) => (
          <Card
            key={a.id}
            className={
              a.priority === 'important'
                ? 'border-destructive/40 bg-destructive/5 p-5'
                : 'p-5'
            }
          >
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold">{a.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {a.author} · {formatDueDate(a.date)}
                </p>
              </div>
              {a.priority === 'important' ? (
                <Badge variant="destructive">Important</Badge>
              ) : (
                <Badge variant="secondary">Notice</Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
