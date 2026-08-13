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

export const CLASS_OPTIONS = ['SSS 1', 'SSS 2', 'SSS 3']

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
  event: { icon: 'CalendarDays', tone: 'var(--chart-1)', label: 'Event' },
  exam: { icon: 'ClipboardList', tone: 'var(--chart-3)', label: 'Exam' },
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
