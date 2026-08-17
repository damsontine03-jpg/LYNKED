// Domain types for the school learning platform.
// Shaped to map onto Supabase tables later (auth, storage, RLS).

export type Role = 'student' | 'teacher' | 'admin' | 'parent'

export type Status = 'pending' | 'completed'

export type Priority = 'low' | 'medium' | 'high'

export type AssignmentPublishStatus = 'draft' | 'published'

export type SubmissionStatus =
  | 'not_submitted'
  | 'submitted'
  | 'late'
  | 'graded'

export type AnnouncementPriority = 'normal' | 'important'

export type ConversationKind = 'dm' | 'group'

export interface FileRef {
  name: string
  sizeLabel: string
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: Role
  /** Primary class the user belongs to / teaches, e.g. "Class 1" or "SSS 1 Science". */
  className: string
  classNames?: string[]
  subject?: string
  subjects?: string[]
  childId?: string
  childEmail?: string
  childName?: string
  childPublicId?: string
  publicId?: string
}

export interface SchoolClass {
  id: string
  name: string
  level: string
  teacher_id: string
  teacher_name: string
  student_count: number
}

export interface SubjectRecord {
  id: string
  name: string
  code: string
  teacher_id: string
  teacher_name: string
  className: string
}

export interface Homework {
  id: string
  title: string
  description?: string
  subject: string
  due_date: string
  status: Status
  assigned_by: string
  teacher_id: string
  student_id: string
  priority?: Priority
  created_at: string
}

export interface HomeworkInput {
  title: string
  description?: string
  subject: string
  due_date: string
  status: Status
  priority?: Priority
  student_id: string
}

export interface Assignment {
  id: string
  title: string
  subject: string
  className: string
  topic: string
  instructions: string
  attachment?: FileRef
  posted_at: string
  due_date: string
  max_marks: number
  teacher_id: string
  teacher_name: string
  status: AssignmentPublishStatus
}

export interface AssignmentInput {
  title: string
  subject: string
  className: string
  topic: string
  instructions: string
  attachmentName?: string
  due_date: string
  max_marks: number
  status: AssignmentPublishStatus
}

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  student_name: string
  file?: FileRef
  comment?: string
  submitted_at?: string
  status: SubmissionStatus
  score?: number
  feedback?: string
  graded_at?: string
}

export interface GradeRow {
  id: string
  assignment_id: string
  assignment_title: string
  subject: string
  className: string
  teacher_name: string
  score: number
  max_marks: number
  percentage: number
  feedback: string
  graded_at: string
}

export interface ReportCard {
  id: string
  student_id: string
  student_name: string
  className: string
  term: string
  results: { subject: string; score: number; grade: string; remark: string }[]
  average: number
  overall_grade: string
  position: number
  teacher_remark: string
  published: boolean
  updated_at: string
}

export type NotificationType =
  | 'assignment'
  | 'deadline'
  | 'status'
  | 'message'
  | 'announcement'
  | 'grade'
  | 'event'
  | 'exam'
  | 'submission'

export interface AppNotification {
  id: string
  user_id: string | 'all'
  type: NotificationType
  title: string
  body: string
  created_at: string
  read: boolean
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  sender_role: Role
  sender_name: string
  body: string
  created_at: string
}

export interface Conversation {
  id: string
  kind: ConversationKind
  participant_id: string
  participant_name: string
  participant_role: Role
  online: boolean
}

export interface SchoolEvent {
  id: string
  title: string
  date: string
  start_time: string
  end_time: string
  location: string
  description: string
  organizer: string
  published: boolean
}

export interface Exam {
  id: string
  title: string
  subject: string
  date: string
  start_time: string
  end_time: string
  duration: string
  room: string
  className: string
  published: boolean
  kind: 'class' | 'exam'
}

export interface Announcement {
  id: string
  title: string
  body: string
  date: string
  priority: AnnouncementPriority
  author: string
  published: boolean
}

export interface GameInfo {
  id: string
  title: string
  description: string
  category: string
  accent: string
}

export interface GameScore {
  game_id: string
  high_score: number
  last_played?: string
  favorite: boolean
}

export interface AuthInput {
  email: string
  phone?: string
  verificationKey?: string
  role: Role
  name?: string
  className?: string
}
