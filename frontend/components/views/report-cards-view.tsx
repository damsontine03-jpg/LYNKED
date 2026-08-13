'use client'

import { useMemo, useState } from 'react'
import { Eye, EyeOff, FileText, Pencil } from 'lucide-react'
import { ReportCardView } from '@/components/report-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/app-store'
import { gradeTone } from '@/lib/ui-helpers'
import { cn } from '@/lib/utils'
import type { ReportCard, User } from '@/lib/types'

export function ReportCardsView({ user }: { user: User }) {
  const { visibleReportCards, toggleReportCardPublished, updateReportCard } =
    useAppStore()
  const isTeacher = user.role === 'teacher'

  const [selectedId, setSelectedId] = useState<string | null>(
    visibleReportCards[0]?.id ?? null,
  )
  const [editing, setEditing] = useState<ReportCard | null>(null)
  const [remarkDraft, setRemarkDraft] = useState('')

  const selected = useMemo(
    () =>
      visibleReportCards.find((c) => c.id === selectedId) ??
      visibleReportCards[0] ??
      null,
    [visibleReportCards, selectedId],
  )

  function openEdit(card: ReportCard) {
    setEditing(card)
    setRemarkDraft(card.teacher_remark)
  }

  function saveRemark() {
    if (editing) {
      updateReportCard(editing.id, { teacher_remark: remarkDraft.trim() })
      setEditing(null)
    }
  }

  if (visibleReportCards.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Header isTeacher={isTeacher} />
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-6">
            <FileText />
          </span>
          <p className="font-medium">No report cards yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {isTeacher
              ? 'Report cards will appear here once results are recorded.'
              : "Your teacher hasn't published a report card for you yet."}
          </p>
        </div>
      </div>
    )
  }

  // Teacher: master-detail with a roster list.
  if (isTeacher) {
    return (
      <div className="flex flex-col gap-6">
        <Header isTeacher />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[18rem_1fr]">
          {/* Roster */}
          <div className="flex flex-col gap-2">
            {visibleReportCards.map((card) => {
              const tone = gradeTone(card.average)
              const active = selected?.id === card.id
              return (
                <button
                  key={card.id}
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
                        {card.average}% average
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

          {/* Detail */}
          {selected ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => openEdit(selected)}>
                  <Pencil />
                  Edit remark
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

        <Dialog
          open={Boolean(editing)}
          onOpenChange={(open) => !open && setEditing(null)}
          title="Edit teacher's remark"
          description={
            editing ? `Remark for ${editing.student_name}` : undefined
          }
          className="max-w-lg"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="remark">Remark</Label>
              <Textarea
                id="remark"
                value={remarkDraft}
                onChange={(e) => setRemarkDraft(e.target.value)}
                placeholder="Write an encouraging, specific remark..."
                rows={4}
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="lg" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button size="lg" onClick={saveRemark}>
                Save remark
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    )
  }

  // Student: their own published cards.
  return (
    <div className="flex flex-col gap-6">
      <Header isTeacher={false} />
      {visibleReportCards.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {visibleReportCards.map((card) => (
            <button
              key={card.id}
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

function Header({ isTeacher }: { isTeacher: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight">Report cards</h1>
      <p className="text-sm text-muted-foreground text-pretty">
        {isTeacher
          ? 'Review results, add remarks and share each report card with the student.'
          : 'Your termly results and your teacher’s remarks.'}
      </p>
    </div>
  )
}
