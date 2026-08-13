import {
  AlarmClock,
  Bell,
  BookOpen,
  CalendarDays,
  CircleCheck,
  ClipboardList,
  Contact,
  FilePlus2,
  FileText,
  Gamepad2,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Library,
  Megaphone,
  MessageCircle,
  School,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  AlarmClock,
  Bell,
  BookOpen,
  CalendarDays,
  CircleCheck,
  ClipboardList,
  Contact,
  FilePlus2,
  FileText,
  Gamepad2,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Library,
  Megaphone,
  MessageCircle,
  School,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
}

export function LucideIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Icon = ICONS[name] ?? CircleCheck
  return <Icon className={className} />
}
