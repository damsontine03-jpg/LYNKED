import type { NotificationType, Priority, SubmissionStatus } from './types'

const ACCENTS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function subjectAccent(subject: string): string {
  let hash = 0
  for (let i = 0; i < subject.length; i++) {
    hash = (hash * 31 + subject.charCodeAt(i)) >>> 0
  }
  return ACCENTS[hash % ACCENTS.length]
}

export const PRIORITY_META: Record<
  Priority,
  { label: string; variant: 'secondary' | 'warning' | 'destructive' }
> = {
  low: { label: 'Low priority', variant: 'secondary' },
  medium: { label: 'Medium priority', variant: 'warning' },
  high: { label: 'High priority', variant: 'destructive' },
}

export const SUBJECT_OPTIONS = [
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'English',
  'Science',
  'History',
  'Geography',
  'Computer Science',
  'Other',
]

export const SSS_STREAMS = ['Art', 'Commercial', 'Science'] as const

export const CLASS_GROUPS = [
  {
    label: 'Primary',
    options: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6'],
  },
  {
    label: 'Junior Secondary',
    options: ['JSS 1', 'JSS 2', 'JSS 3'],
  },
  {
    label: 'SSS 1',
    options: SSS_STREAMS.map((stream) => `SSS 1 ${stream}`),
  },
  {
    label: 'SSS 2',
    options: SSS_STREAMS.map((stream) => `SSS 2 ${stream}`),
  },
  {
    label: 'SSS 3',
    options: SSS_STREAMS.map((stream) => `SSS 3 ${stream}`),
  },
]

export const CLASS_OPTIONS = CLASS_GROUPS.flatMap((group) => [...group.options])

export const DEFAULT_CLASS = 'Class 1'

export function classLevel(name: string): string {
  const text = String(name || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
  if (text.startsWith('JSS') || text.startsWith('JS ')) return 'Junior Secondary'
  if (text.startsWith('SSS') || text.startsWith('SS ')) return 'Senior Secondary'
  return 'Primary'
}

export function groupedClassOptions(names: string[] = CLASS_OPTIONS) {
  const wanted = new Set(names.filter(Boolean))
  const groups = CLASS_GROUPS.map((group) => ({
    label: group.label,
    options: group.options.filter((option) => wanted.has(option)),
  })).filter((group) => group.options.length > 0)
  const known = new Set(CLASS_OPTIONS)
  const extra = names.filter((name) => name && !known.has(name))
  if (extra.length) groups.push({ label: 'Other', options: extra })
  return groups
}

export const NOTIFICATION_META: Record<
  NotificationType,
  { icon: string; tone: string; label: string }
> = {
  assignment: { icon: 'FilePlus2', tone: 'var(--chart-1)', label: 'New assignment' },
  deadline: { icon: 'AlarmClock', tone: 'var(--chart-3)', label: 'Deadline' },
  status: { icon: 'CircleCheck', tone: 'var(--chart-2)', label: 'Status update' },
  message: { icon: 'MessageCircle', tone: 'var(--chart-5)', label: 'Message' },
  announcement: { icon: 'Megaphone', tone: 'var(--chart-4)', label: 'Announcement' },
  grade: { icon: 'GraduationCap', tone: 'var(--chart-2)', label: 'Grade' },
  event: { icon: 'CalendarDays', tone: 'var(--chart-1)', label: 'School Event' },
  exam: { icon: 'ClipboardList', tone: 'var(--chart-3)', label: 'TimeTable' },
  submission: { icon: 'Inbox', tone: 'var(--chart-5)', label: 'Submission' },
}

export const SUBMISSION_META: Record<
  SubmissionStatus,
  { label: string; variant: 'secondary' | 'success' | 'warning' | 'destructive' | 'default' }
> = {
  not_submitted: { label: 'Not submitted', variant: 'secondary' },
  submitted: { label: 'Submitted', variant: 'success' },
  late: { label: 'Late', variant: 'warning' },
  graded: { label: 'Graded', variant: 'default' },
}

export function gradeTone(average: number): string {
  if (average >= 70) return 'var(--chart-2)'
  if (average >= 55) return 'var(--chart-1)'
  if (average >= 45) return 'var(--chart-3)'
  return 'var(--chart-4)'
}

export function greeting(name: string): string {
  const hour = new Date().getHours()
  const part =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const first = name.split(' ')[0]
  return `${part}, ${first}`
}

export function percent(score: number, max: number): number {
  if (max <= 0) return 0
  return Math.round((score / max) * 100)
}

export function letterGrade(score: number): string {
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}

export const REPORT_TERMS = ['First Term', 'Second Term', 'Third Term']
