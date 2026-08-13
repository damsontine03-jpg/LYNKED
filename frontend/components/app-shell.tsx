'use client'

import { useState } from 'react'
import { FloatingChat } from '@/components/chat/floating-chat'
import { TopNav } from '@/components/nav/top-nav'
import { AssignmentsView } from '@/components/views/assignments-view'
import { SubmissionsView } from '@/components/views/submissions-view'
import { GradesView } from '@/components/views/grades-view'
import { OverviewView } from '@/components/views/overview-view'
import { ReportCardsView } from '@/components/views/report-cards-view'
import { ClassesView } from '@/components/views/classes-view'
import { PeopleView } from '@/components/views/people-view'
import { SubjectsView } from '@/components/views/subjects-view'
import { ChatView } from '@/components/views/chat-view'
import { EventsView } from '@/components/views/events-view'
import { ExamsView } from '@/components/views/exams-view'
import { GamesView } from '@/components/views/games-view'
import { NotificationsView } from '@/components/views/notifications-view'
import { AnnouncementsView } from '@/components/views/announcements-view'
import { ProfileView } from '@/components/views/profile-view'
import { SettingsView } from '@/components/views/settings-view'
import type { AppView } from '@/lib/nav'
import type { User } from '@/lib/types'

export function AppShell({ user }: { user: User }) {
  const [view, setView] = useState<AppView>('overview')

  const allowed = new Set(
    [
      'overview',
      'notifications',
      'profile',
      'events',
      'exams',
      user.role === 'student' || user.role === 'teacher' ? 'assignments' : null,
      user.role === 'student' ? 'grades' : null,
      user.role === 'student' ? 'chat' : null,
      user.role === 'student' ? 'games' : null,
      user.role === 'student' ? 'reportcards' : null,
      user.role === 'teacher' ? 'classes' : null,
      user.role === 'teacher' ? 'submissions' : null,
      user.role === 'teacher' ? 'grades' : null,
      user.role === 'teacher' ? 'students' : null,
      user.role === 'teacher' ? 'chat' : null,
      user.role === 'teacher' ? 'reportcards' : null,
      user.role === 'teacher' ? 'subjects' : null,
      user.role === 'admin' ? 'classes' : null,
      user.role === 'admin' ? 'students' : null,
      user.role === 'admin' ? 'teachers' : null,
      user.role === 'admin' ? 'subjects' : null,
      user.role === 'admin' ? 'announcements' : null,
      user.role === 'admin' ? 'settings' : null,
    ].filter(Boolean) as AppView[],
  )

  const activeView = allowed.has(view) ? view : 'overview'

  return (
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-hidden bg-background">
      <TopNav user={user} activeView={activeView} onNavigate={setView} />

      <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-3 py-4 pb-24 sm:px-6 sm:py-8 sm:pb-28">
        <div
          key={activeView}
          className="duration-500 animate-in fade-in-0 slide-in-from-bottom-3"
        >
          {activeView === 'overview' ? (
            <OverviewView user={user} onNavigate={setView} />
          ) : null}
          {activeView === 'assignments' ? <AssignmentsView user={user} /> : null}
          {activeView === 'submissions' ? (
            <SubmissionsView user={user} />
          ) : null}
          {activeView === 'grades' ? <GradesView user={user} /> : null}
          {activeView === 'reportcards' ? (
            <ReportCardsView user={user} />
          ) : null}
          {activeView === 'classes' ? <ClassesView user={user} /> : null}
          {activeView === 'students' ? (
            <PeopleView user={user} kind="students" />
          ) : null}
          {activeView === 'teachers' ? (
            <PeopleView user={user} kind="teachers" />
          ) : null}
          {activeView === 'subjects' ? <SubjectsView user={user} /> : null}
          {activeView === 'chat' ? <ChatView user={user} /> : null}
          {activeView === 'events' ? <EventsView user={user} /> : null}
          {activeView === 'exams' ? <ExamsView user={user} /> : null}
          {activeView === 'games' ? <GamesView user={user} /> : null}
          {activeView === 'notifications' ? (
            <NotificationsView user={user} />
          ) : null}
          {activeView === 'announcements' ? (
            <AnnouncementsView user={user} />
          ) : null}
          {activeView === 'profile' ? <ProfileView user={user} /> : null}
          {activeView === 'settings' ? <SettingsView user={user} /> : null}
        </div>
      </main>

      {user.role !== 'admin' ? <FloatingChat user={user} /> : null}
    </div>
  )
}
