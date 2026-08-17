import type { Role } from './types'

export type AppView =
  | 'overview'
  | 'assignments'
  | 'submissions'
  | 'grades'
  | 'classes'
  | 'students'
  | 'teachers'
  | 'parents'
  | 'subjects'
  | 'chat'
  | 'events'
  | 'exams'
  | 'games'
  | 'notifications'
  | 'announcements'
  | 'profile'
  | 'settings'
  | 'reportcards'

export interface NavItem {
  view: AppView
  label: string
  shortLabel?: string
  icon: string
  roles: Role[]
  group: 'home' | 'academic' | 'community' | 'school'
}

export const NAV_ITEMS: NavItem[] = [
  { view: 'overview', label: 'Dashboard', icon: 'LayoutDashboard', roles: ['student', 'teacher', 'admin', 'parent'], group: 'home' },
  { view: 'classes', label: 'Classes', icon: 'School', roles: ['teacher'], group: 'academic' },
  { view: 'classes', label: 'Classes', icon: 'School', roles: ['admin'], group: 'academic' },
  { view: 'assignments', label: 'Assignments', shortLabel: 'Tasks', icon: 'BookOpen', roles: ['student', 'teacher', 'parent'], group: 'academic' },
  { view: 'submissions', label: 'Submissions', shortLabel: 'Inbox', roles: ['teacher'], icon: 'Inbox', group: 'academic' },
  { view: 'grades', label: 'Assignment grades', shortLabel: 'Grades', icon: 'GraduationCap', roles: ['student', 'teacher', 'parent'], group: 'academic' },
  { view: 'reportcards', label: 'Report Card', icon: 'FileText', roles: ['student', 'teacher', 'parent'], group: 'academic' },
  { view: 'students', label: 'Students', icon: 'Users', roles: ['teacher', 'admin'], group: 'academic' },
  { view: 'teachers', label: 'Teachers', icon: 'Contact', roles: ['admin'], group: 'academic' },
  { view: 'parents', label: 'Parents', icon: 'Heart', roles: ['admin'], group: 'academic' },
  { view: 'subjects', label: 'Subjects', icon: 'Library', roles: ['teacher', 'admin'], group: 'academic' },
  { view: 'chat', label: 'Chat', icon: 'MessageCircle', roles: ['student', 'teacher', 'parent'], group: 'community' },
  { view: 'events', label: 'School Events', icon: 'CalendarDays', roles: ['student', 'teacher', 'admin', 'parent'], group: 'school' },
  { view: 'exams', label: 'TimeTable', icon: 'ClipboardList', roles: ['student', 'teacher', 'admin', 'parent'], group: 'school' },
  { view: 'announcements', label: 'Announcements', shortLabel: 'Notices', icon: 'Megaphone', roles: ['admin'], group: 'school' },
  { view: 'games', label: 'Games', icon: 'Gamepad2', roles: ['student'], group: 'community' },
  { view: 'notifications', label: 'Notifications', icon: 'Bell', roles: ['student', 'teacher', 'admin', 'parent'], group: 'community' },
  { view: 'profile', label: 'Profile', icon: 'UserRound', roles: ['student', 'teacher', 'admin', 'parent'], group: 'home' },
  { view: 'settings', label: 'Settings', icon: 'Settings', roles: ['admin'], group: 'home' },
]

export const NAV_GROUPS: { id: NavItem['group']; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'academic', label: 'Academic' },
  { id: 'community', label: 'Community' },
  { id: 'school', label: 'School' },
]
