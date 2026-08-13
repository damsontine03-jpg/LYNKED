// Small, dependency-free helpers for reasoning about deadlines.

export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** Whole days from today until the given ISO date (negative = in the past). */
export function daysUntil(isoDate: string): number {
  const due = parseIsoDate(isoDate)
  const diff = due.getTime() - startOfToday().getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

export function isOverdue(isoDate: string): boolean {
  return daysUntil(isoDate) < 0
}

/** Human friendly relative label, e.g. "Due today", "in 3 days", "2 days ago". */
export function relativeDueLabel(isoDate: string): string {
  const days = daysUntil(isoDate)
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days === -1) return 'Due yesterday'
  if (days > 1) return `Due in ${days} days`
  return `${Math.abs(days)} days overdue`
}

export function formatDueDate(isoDate: string): string {
  return parseIsoDate(isoDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** Compact table date, e.g. "Oct 15". */
export function formatShortDate(isoDate: string): string {
  return parseIsoDate(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Value for a native date input's min attribute (today). */
export function todayInputValue(): string {
  return startOfToday().toISOString().slice(0, 10)
}

/** Compact relative timestamp for feeds and chat, e.g. "5m", "3h", "2d". */
export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/** Clock time for chat bubbles, e.g. "14:32". */
export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
