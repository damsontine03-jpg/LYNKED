'use client'

import { Award, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { subjectAccent, gradeTone } from '@/lib/ui-helpers'
import { cn } from '@/lib/utils'
import type { ReportCard } from '@/lib/types'

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function ReportCardView({
  card,
  showStudentName = false,
}: {
  card: ReportCard
  showStudentName?: boolean
}) {
  const tone = gradeTone(card.average)

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          {showStudentName ? (
            <span className="text-base font-semibold">{card.student_name}</span>
          ) : null}
          <span className="text-sm text-muted-foreground">
            {card.className} · {card.term}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span
              className="text-3xl font-semibold leading-none tabular-nums"
              style={{ color: tone }}
            >
              {card.average}%
            </span>
            <span className="mt-1 text-xs text-muted-foreground">Average</span>
          </div>
          <div
            className="flex size-14 flex-col items-center justify-center rounded-2xl text-lg font-bold"
            style={{ backgroundColor: `${tone}22`, color: tone }}
          >
            {card.overall_grade}
          </div>
        </div>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-1 text-xs">
          <Award className="size-3.5 text-primary" />
          Position: {ordinal(card.position)}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-1 text-xs">
          <TrendingUp className="size-3.5 text-primary" />
          {card.results.length} subjects
        </span>
      </div>

      {/* Subject results */}
      <div className="flex flex-col gap-2">
        {card.results.map((r) => {
          const accent = subjectAccent(r.subject)
          return (
            <div
              key={r.subject}
              className="flex flex-col gap-2 rounded-xl border border-border bg-background/40 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className="inline-flex items-center gap-2 text-sm font-medium"
                  style={{ color: accent }}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  {r.subject}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums">
                    {r.score}
                  </span>
                  <Badge variant="outline">{r.grade}</Badge>
                </div>
              </div>
              {/* Score bar */}
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                role="presentation"
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${r.score}%`, backgroundColor: accent }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{r.remark}</p>
            </div>
          )
        })}
      </div>

      {/* Teacher remark */}
      <div
        className={cn(
          'rounded-xl border border-dashed border-border bg-background/40 p-4',
        )}
      >
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Teacher&apos;s remark
        </span>
        <p className="mt-1 text-sm leading-relaxed text-pretty">
          {card.teacher_remark || 'No remark yet.'}
        </p>
      </div>
    </div>
  )
}
