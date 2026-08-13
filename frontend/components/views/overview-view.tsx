'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Gamepad2,
  GraduationCap,
  Megaphone,
  MessageCircle,
  Plus,
  Users,
} from 'lucide-react'
import { StatsOverview } from '@/components/stats-overview'
import { Reminders } from '@/components/reminders'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/app-store'
import { IMAGES } from '@/lib/images'
import { greeting, gradeTone } from '@/lib/ui-helpers'
import { daysUntil, formatDueDate, isOverdue } from '@/lib/date-utils'
import type { AppView } from '@/lib/nav'
import type { User } from '@/lib/types'

export function OverviewView({
  user,
  onNavigate,
}: {
  user: User
  onNavigate: (view: AppView) => void
}) {
  if (user.role === 'admin') {
    return <AdminDashboard user={user} onNavigate={onNavigate} />
  }
  if (user.role === 'teacher') {
    return <TeacherDashboard user={user} onNavigate={onNavigate} />
  }
  return <StudentDashboard user={user} onNavigate={onNavigate} />
}

function StudentDashboard({
  user,
  onNavigate,
}: {
  user: User
  onNavigate: (view: AppView) => void
}) {
  const {
    assignments,
    submissions,
    visibleHomework,
    exams,
    events,
    conversations,
    announcements,
  } = useAppStore()

  const mine = useMemo(
    () =>
      assignments
        .filter((a) => a.status === 'published')
        .map((a) => ({
          assignment: a,
          sub: submissions.find(
            (s) => s.assignment_id === a.id && s.student_id === user.id,
          ),
        })),
    [assignments, submissions, user.id],
  )

  const dueCount = mine.filter(
    (m) => m.sub?.status === 'not_submitted' && !isOverdue(m.assignment.due_date),
  ).length
  const pendingSubs = mine.filter((m) => m.sub?.status === 'not_submitted').length
  const recentGrades = mine
    .filter((m) => m.sub?.status === 'graded')
    .slice(0, 3)
  const upcomingExams = [...exams]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)
  const upcomingEvents = [...events]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)
  const urgent = mine
    .filter((m) => m.sub?.status === 'not_submitted')
    .sort(
      (a, b) =>
        new Date(a.assignment.due_date).getTime() -
        new Date(b.assignment.due_date).getTime(),
    )
    .slice(0, 4)

  return (
    <div className="flex flex-col gap-6">
      <Hero
        kicker={user.className}
        title={greeting(user.name)}
        body="Here is what you need to do today. Check assignments, exams, and work that is due soon."
      />

      <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Assignments due" value={dueCount} />
        <StatCard label="Pending submissions" value={pendingSubs} />
        <StatCard label="Recent grades" value={recentGrades.length} />
        <StatCard label="Upcoming exams" value={upcomingExams.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Reminders homework={visibleHomework} role={user.role} />
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="text-sm font-medium">Upcoming assignments</h2>
            {urgent.length === 0 ? (
              <p className="text-sm text-muted-foreground">You are caught up.</p>
            ) : (
              urgent.map(({ assignment, sub }) => (
                <button
                  key={assignment.id}
                  type="button"
                  onClick={() => onNavigate('assignments')}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{assignment.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {assignment.subject} · {assignment.teacher_name}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDueDate(assignment.due_date)}
                    {sub ? ` · ${sub.status.replace('_', ' ')}` : ''}
                  </span>
                </button>
              ))
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="text-sm font-medium">Upcoming exams</h2>
            {upcomingExams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No exams scheduled yet.</p>
            ) : (
              upcomingExams.map((ex) => (
              <div key={ex.id} className="flex justify-between gap-2 text-sm">
                <span className="min-w-0">
                  {ex.subject}
                  <span className="block text-xs text-muted-foreground">
                    {ex.room} · {ex.start_time}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {daysUntil(ex.date) === 0 ? 'Today' : `in ${daysUntil(ex.date)}d`}
                </span>
              </div>
              ))
            )}
            <Button variant="secondary" size="sm" className="justify-between" onClick={() => onNavigate('exams')}>
              Exam timetable <ArrowRight />
            </Button>
          </Card>

          <Card className="flex flex-col gap-3 p-5">
            <h2 className="text-sm font-medium">Upcoming events</h2>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events yet.</p>
            ) : (
              upcomingEvents.map((ev) => (
              <div key={ev.id} className="text-sm">
                <p className="font-medium">{ev.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDueDate(ev.date)} · {ev.location}
                </p>
              </div>
              ))
            )}
          </Card>

          <Card className="flex flex-col gap-3 p-5">
            <h2 className="text-sm font-medium">School notices</h2>
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No school notices yet.</p>
            ) : (
              announcements.slice(0, 2).map((a) => (
              <div key={a.id} className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.body}</p>
                </div>
                {a.priority === 'important' ? (
                  <Badge variant="destructive">Important</Badge>
                ) : null}
              </div>
              ))
            )}
          </Card>

          <Card className="flex flex-col gap-3 p-5">
            <h2 className="text-sm font-medium">Recent grades</h2>
            {recentGrades.length === 0 ? (
              <p className="text-sm text-muted-foreground">No grades yet.</p>
            ) : (
              recentGrades.map(({ assignment, sub }) => (
                <div key={assignment.id} className="flex justify-between text-sm">
                  <span className="truncate">{assignment.title}</span>
                  <span
                    className="font-semibold tabular-nums"
                    style={{
                      color: gradeTone(
                        Math.round(((sub?.score ?? 0) / assignment.max_marks) * 100),
                      ),
                    }}
                  >
                    {sub?.score}/{assignment.max_marks}
                  </span>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-medium">Quick actions</h2>
        <div className="stagger grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'Assignments', view: 'assignments' as const, icon: BookOpen },
            { label: 'Grades', view: 'grades' as const, icon: GraduationCap },
            { label: 'Chat', view: 'chat' as const, icon: MessageCircle },
            { label: 'Exams', view: 'exams' as const, icon: ClipboardList },
            { label: 'Events', view: 'events' as const, icon: CalendarDays },
            { label: 'Games', view: 'games' as const, icon: Gamepad2 },
          ].map((a) => (
            <Button
              key={a.view}
              variant="secondary"
              size="sm"
              className="justify-between"
              onClick={() => onNavigate(a.view)}
            >
              <span className="inline-flex items-center gap-2">
                <a.icon className="size-4" />
                {a.label}
              </span>
              <ArrowRight />
            </Button>
          ))}
        </div>
        {conversations[0]?.lastMessage ? (
          <p className="text-xs text-muted-foreground">
            Latest chat: {conversations[0].lastMessage.body}
          </p>
        ) : null}
      </Card>
    </div>
  )
}

function TeacherDashboard({
  user,
  onNavigate,
}: {
  user: User
  onNavigate: (view: AppView) => void
}) {
  const { assignments, submissions, students, visibleHomework, exams, events, conversations } =
    useAppStore()
  const awaiting = submissions.filter(
    (s) => s.status === 'submitted' || s.status === 'late',
  ).length
  const late = submissions.filter((s) => s.status === 'late').length
  const unread = conversations.reduce((n, c) => n + c.unread, 0)

  return (
    <div className="flex flex-col gap-6">
      <Hero
        kicker={user.className}
        title={greeting(user.name)}
        body="Grade new work and check late submissions."
      />
      <StatsOverview homework={visibleHomework} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col gap-3 p-5 lg:col-span-2">
          <h2 className="text-sm font-medium">Needs attention</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Awaiting grading" value={awaiting} />
            <StatCard label="Late submissions" value={late} />
            <StatCard label="Unread messages" value={unread} />
          </div>
          <Reminders homework={visibleHomework} role={user.role} />
        </Card>
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3 p-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="size-4 text-primary" />
              My classes
            </div>
            <span className="text-3xl font-semibold tabular-nums">{students.length}</span>
            <span className="text-xs text-muted-foreground">students in {user.className}</span>
            <Button variant="secondary" size="sm" className="justify-between" onClick={() => onNavigate('classes')}>
              Open classes <ArrowRight />
            </Button>
          </Card>
          <Card className="flex flex-col gap-2 p-5">
            <h2 className="text-sm font-medium">Upcoming</h2>
            {exams.length === 0 && events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled yet.</p>
            ) : (
              <>
                {exams.slice(0, 2).map((e) => (
                  <p key={e.id} className="text-sm">
                    {e.subject} exam · {formatDueDate(e.date)}
                  </p>
                ))}
                {events.slice(0, 2).map((e) => (
                  <p key={e.id} className="text-sm text-muted-foreground">
                    {e.title} · {formatDueDate(e.date)}
                  </p>
                ))}
              </>
            )}
          </Card>
        </div>
      </div>
      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-medium">Active assignments</h2>
        {assignments.filter((a) => a.status === 'published').length === 0 ? (
          <p className="text-sm text-muted-foreground">No published assignments yet.</p>
        ) : (
          assignments
            .filter((a) => a.status === 'published')
            .slice(0, 4)
            .map((a) => (
              <div
                key={a.id}
                className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <span className="min-w-0 truncate">{a.title}</span>
                <span className="shrink-0 text-muted-foreground">
                  {formatDueDate(a.due_date)}
                </span>
              </div>
            ))
        )}
        <Button variant="secondary" size="sm" className="justify-between" onClick={() => onNavigate('assignments')}>
          Manage assignments <ArrowRight />
        </Button>
      </Card>
      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-medium">Recent submissions</h2>
        {submissions.filter((s) => s.submitted_at).length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          submissions
            .filter((s) => s.submitted_at)
            .sort((a, b) => (b.submitted_at ?? '').localeCompare(a.submitted_at ?? ''))
            .slice(0, 4)
            .map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-2"
              >
                <span className="min-w-0 truncate">
                  {s.student_name} · {assignments.find((a) => a.id === s.assignment_id)?.title}
                </span>
                <span className="shrink-0 capitalize text-muted-foreground">
                  {s.status.replace('_', ' ')}
                </span>
              </div>
            ))
        )}
        <Button variant="secondary" size="sm" className="justify-between" onClick={() => onNavigate('submissions')}>
          Open submissions <ArrowRight />
        </Button>
      </Card>
    </div>
  )
}

function AdminDashboard({
  user,
  onNavigate,
}: {
  user: User
  onNavigate: (view: AppView) => void
}) {
  const { students, teachers, classes, subjects, assignments, submissions, exams, events, announcements } =
    useAppStore()
  const pending = submissions.filter((s) => s.status === 'not_submitted').length

  return (
    <div className="flex flex-col gap-6">
      <Hero
        kicker="School overview"
        title={greeting(user.name)}
        body="People, classes, and items waiting to go live."
      />
      <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Students" value={students.length} />
        <StatCard label="Teachers" value={teachers.length} />
        <StatCard label="Classes" value={classes.length} />
        <StatCard label="Subjects" value={subjects.length} />
        <StatCard label="Active assignments" value={assignments.filter((a) => a.status === 'published').length} />
        <StatCard label="Pending submissions" value={pending} />
        <StatCard label="Upcoming exams" value={exams.length} />
        <StatCard label="Upcoming events" value={events.filter((e) => e.published).length} />
      </div>
      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-medium">Quick actions</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'Add student', view: 'students' as const, icon: Users },
            { label: 'Add teacher', view: 'teachers' as const, icon: Users },
            { label: 'Create class', view: 'classes' as const, icon: Plus },
            { label: 'Create event', view: 'events' as const, icon: CalendarDays },
            { label: 'Exam timetable', view: 'exams' as const, icon: ClipboardList },
            { label: 'Announcement', view: 'announcements' as const, icon: Megaphone },
          ].map((a) => (
            <Button key={a.label} variant="secondary" size="sm" className="justify-between" onClick={() => onNavigate(a.view)}>
              <span className="inline-flex items-center gap-2">
                <a.icon className="size-4" />
                {a.label}
              </span>
              <ArrowRight />
            </Button>
          ))}
        </div>
      </Card>
      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-medium">Announcements</h2>
        {announcements.slice(0, 3).map((a) => (
          <div key={a.id} className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.body}</p>
            </div>
            {a.priority === 'important' ? <Badge variant="destructive">Important</Badge> : null}
          </div>
        ))}
      </Card>
    </div>
  )
}

function Hero({
  kicker,
  title,
  body,
}: {
  kicker: string
  title: string
  body: string
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 sm:p-8">
      <div
        aria-hidden
        className="blob-soft pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="hero-rise flex flex-col gap-2">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <GraduationCap className="size-3.5 text-primary" />
            {kicker}
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {title}
          </h1>
          <p className="max-w-lg text-sm text-muted-foreground text-pretty">{body}</p>
        </div>
        <div className="hero-art hidden sm:block">
          <div className="hero-float">
            <Image
              src={IMAGES.flyingPencil}
              alt=""
              width={280}
              height={200}
              className="h-28 w-auto shrink-0 object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </Card>
  )
}
