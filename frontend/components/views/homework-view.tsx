'use client'

import { useMemo, useState } from 'react'
import { Inbox, Plus, Search } from 'lucide-react'
import { HomeworkCard } from '@/components/homework-card'
import { HomeworkFormDialog } from '@/components/homework-form-dialog'
import { Reminders } from '@/components/reminders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { useAppStore } from '@/lib/app-store'
import { cn } from '@/lib/utils'
import type { Homework, HomeworkInput, Status, User } from '@/lib/types'

type Filter = 'all' | Status

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
]

export function HomeworkView({ user }: { user: User }) {
  const {
    visibleHomework,
    students,
    createHomework,
    updateHomework,
    deleteHomework,
    toggleStatus,
  } = useAppStore()

  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Homework | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Homework | null>(null)

  const isTeacher = user.role === 'teacher'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return visibleHomework
      .filter((h) => (filter === 'all' ? true : h.status === filter))
      .filter((h) =>
        q
          ? h.title.toLowerCase().includes(q) ||
            h.subject.toLowerCase().includes(q)
          : true,
      )
  }, [visibleHomework, filter, query])

  const counts = useMemo(
    () => ({
      all: visibleHomework.length,
      pending: visibleHomework.filter((h) => h.status === 'pending').length,
      completed: visibleHomework.filter((h) => h.status === 'completed')
        .length,
    }),
    [visibleHomework],
  )

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(hw: Homework) {
    setEditing(hw)
    setFormOpen(true)
  }

  function handleSubmit(input: HomeworkInput) {
    if (editing) {
      updateHomework(editing.id, input)
    } else {
      createHomework(input)
    }
  }

  function confirmDelete() {
    if (deleteTarget) {
      deleteHomework(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Homework
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            {isTeacher
              ? 'Create assignments and track how your class is progressing.'
              : 'Stay ahead of your deadlines and mark work as you finish it.'}
          </p>
        </div>
        {isTeacher ? (
          <Button size="lg" onClick={openCreate}>
            <Plus />
            Add homework
          </Button>
        ) : null}
      </div>

      <Reminders homework={visibleHomework} role={user.role} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Filter homework by status"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1"
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                filter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
              <span
                className={cn(
                  'rounded-full px-1.5 text-xs tabular-nums',
                  filter === f.value
                    ? 'bg-primary-foreground/20'
                    : 'bg-muted',
                )}
              >
                {counts[f.value]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title or subject"
            className="pl-9"
            aria-label="Search homework"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-6">
            <Inbox />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-medium">No homework here</p>
            <p className="text-sm text-muted-foreground">
              {query
                ? 'Try a different search term.'
                : isTeacher
                  ? 'Add your first assignment.'
                  : 'Nothing to show for this filter.'}
            </p>
          </div>
          {isTeacher && !query ? (
            <Button size="sm" onClick={openCreate}>
              <Plus />
              Add homework
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((hw) => (
            <HomeworkCard
              key={hw.id}
              homework={hw}
              role={user.role}
              onToggle={toggleStatus}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <HomeworkFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSubmit={handleSubmit}
        assignees={isTeacher ? students : undefined}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete homework?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be permanently removed.`
            : undefined
        }
        className="max-w-md"
      >
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="lg" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="destructive" size="lg" onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
