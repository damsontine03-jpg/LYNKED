import { daysUntil, formatDueDate, isOverdue } from './date-utils'
import { percent } from './ui-helpers'
import { viewerStudentId } from './roles'
import type {
  Announcement,
  AppNotification,
  Assignment,
  ChatMessage,
  Conversation,
  Exam,
  Homework,
  ReportCard,
  Role,
  SchoolClass,
  SchoolEvent,
  SubjectRecord,
  Submission,
  User,
} from './types'

export const ASSISTANT_CONV_ID = 'conv-assistant'
export const ASSISTANT_ID = 'assistant'

export const ASSISTANT_CONVERSATION: Conversation = {
  id: ASSISTANT_CONV_ID,
  kind: 'dm',
  participant_id: ASSISTANT_ID,
  participant_name: 'LynkED Assistant',
  participant_role: 'teacher',
  online: true,
}

export interface AssistantContext {
  user: User
  assignments: Assignment[]
  submissions: Submission[]
  homework: Homework[]
  exams: Exam[]
  events: SchoolEvent[]
  notifications: AppNotification[]
  reportCards: ReportCard[]
  students: User[]
  teachers: User[]
  parents: User[]
  classes: SchoolClass[]
  subjects: SubjectRecord[]
  announcements: Announcement[]
}

const SUGGESTIONS: Record<Role, string[]> = {
  student: [
    'What homework is due soon?',
    'Show my pending assignments.',
    'When is my next exam?',
    'Show my latest grades.',
    'Show my notifications.',
  ],
  parent: [
    'What assignments does my child have?',
    'Show my child\'s latest grades.',
    'When is the next exam?',
    'What events are coming up?',
    'Contact my child\'s teacher.',
  ],
  teacher: [
    'Who hasn\'t submitted homework?',
    'Show class performance.',
    'What assignments are due?',
    'Show upcoming exams.',
    'Show missing marks.',
  ],
  admin: [
    'Show platform activity.',
    'Show available classes.',
    'Show upcoming exams.',
    'Show recent notifications.',
    'Show grading settings.',
  ],
}

const LIST_CAP = 6

export function suggestedQuestions(role: Role) {
  return SUGGESTIONS[role]
}

export function isGreeting(text: string) {
  const q = normalize(text)
  return /^(hi|hello|hey|good morning|good afternoon|good evening)(\s|$)/.test(q)
}

export function isAcknowledgement(text: string) {
  const q = normalize(text)
  return /^(ok|okay|k|yes|yeah|yep|sure|alright|all right|got it|thanks|thank you|cool|great|perfect|fine|noted)( thanks| thank you)?$/.test(
    q,
  )
}

export function assistantGreeting(name: string) {
  const first = firstName(name)
  return `Hello, ${first}. I am your school assistant. I can help you find schoolwork, grades, the timetable, events, and where to go in LynkED.`
}

export function assistantReply(text: string, ctx: AssistantContext) {
  const q = normalize(text)
  const { user } = ctx
  const first = firstName(user.name)
  const child = user.childName || 'your child'

  const blocked = privacyReply(q, ctx)
  if (blocked) return blocked

  if (isGreeting(text) || q === 'help' || q.includes('how can you help') || q === 'what can you do') {
    return [
      assistantGreeting(user.name),
      '',
      roleHelp(user.role, child),
    ].join('\n')
  }

  if (isAcknowledgement(text)) {
    return `Happy to help. ${roleHelp(user.role, child)}`
  }

  if (wantsNav(q)) return navigationReply(q, user.role)

  if (wantsContactTeacher(q)) {
    if (user.role === 'student' || user.role === 'parent') {
      return `Open Chat from the main navigation to message a teacher. I am the school assistant, not a class teacher.`
    }
    if (user.role === 'teacher') {
      return `Open Chat from the main navigation to message students and parents.`
    }
    return `Teachers and families message each other in Chat. I can help with school information here.`
  }

  if (wantsSubmitForChild(q) && user.role === 'parent') {
    return `Parents cannot submit assignments through the platform. ${child} needs to complete and submit the work.`
  }

  if (wantsChangeGrade(q)) {
    if (user.role === 'student' || user.role === 'parent') {
      return `I cannot change official grades. Please contact the teacher or a school administrator.`
    }
    return `Enter or change marks in Assignment grades or Submissions. I cannot change official records from this chat.`
  }

  if (wantsReportCard(q)) return reportCardReply(ctx)
  if (wantsGrades(q) && !has(q, 'homework', 'pending', 'due', 'submit')) {
    return gradesReply(ctx)
  }
  if (wantsHomework(q)) return homeworkReply(q, ctx)
  if (wantsMissingMarks(q) && (user.role === 'teacher' || user.role === 'admin')) {
    return missingMarksReply(ctx)
  }
  if (wantsClassPerformance(q) && (user.role === 'teacher' || user.role === 'admin')) {
    return classPerformanceReply(ctx)
  }
  if (wantsGrades(q)) return gradesReply(ctx)
  if (wantsExam(q)) return examReply(q, ctx)
  if (wantsEvents(q)) return eventsReply(ctx)
  if (wantsNotifications(q)) return notificationsReply(ctx)
  if (wantsClasses(q)) return classesReply(ctx)
  if (wantsCounts(q)) return countsReply(q, ctx)
  if (wantsGradingScale(q)) {
    return `Settings does not include a grading scale yet. I cannot invent one. Report Card grades are entered by teachers.`
  }
  if (wantsDashboard(q)) return dashboardReply(user.role, child)
  if (wantsActivity(q) && user.role === 'admin') return activityReply(ctx)

  if (q.split(' ').length <= 2) {
    return `I am here if you need anything. ${roleHelp(user.role, child)}`
  }

  return [
    `I don't have that information available right now, ${first}.`,
    '',
    roleHelp(user.role, child),
  ].join('\n')
}

export function loadAssistantMessages(userId: string): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(`ht.assistant.${userId}`)
    return raw ? (JSON.parse(raw) as ChatMessage[]) : []
  } catch {
    return []
  }
}

export function saveAssistantMessages(userId: string, rows: ChatMessage[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(`ht.assistant.${userId}`, JSON.stringify(rows))
}

export function clearAssistantMessages(userId: string) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(`ht.assistant.${userId}`)
}

function normalize(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'there'
}

function has(q: string, ...needles: string[]) {
  return needles.some((n) => q.includes(n))
}

function roleHelp(role: Role, child: string) {
  if (role === 'parent') {
    return `You can ask about ${child}'s assignments, grades, exams, events, or how to contact a teacher.`
  }
  if (role === 'teacher') {
    return `You can ask about homework that is due, who has not submitted, class scores, exams, or missing marks.`
  }
  if (role === 'admin') {
    return `You can ask about students, teachers, classes, exams, notifications, or how the dashboard works.`
  }
  return `You can ask about homework, assignments, exams, events, grades, or notifications.`
}

function privacyReply(q: string, ctx: AssistantContext) {
  const { user, students } = ctx
  const self = firstName(user.name).toLowerCase()
  const child = (user.childName || '').toLowerCase()
  const mentioned = students.filter((s) => {
    const name = s.name.toLowerCase()
    const first = firstName(s.name).toLowerCase()
    if (name.length < 3) return false
    return (q.includes(name) || (first.length > 2 && q.includes(first))) && s.id !== user.id && s.id !== user.childId
  })

  const asksOthersWork = has(
    q,
    'john',
    'sarah',
    'another student',
    'someone else',
    'other student',
    'their grade',
    'their score',
    'his grade',
    'her grade',
    'his score',
    'her score',
  )

  if (user.role === 'student' && (mentioned.length > 0 || asksOthersWork)) {
    const aboutSelf = mentioned.every((s) => firstName(s.name).toLowerCase() === self)
    if (!aboutSelf || asksOthersWork) {
      return `I can only show you academic information that belongs to your account.`
    }
  }

  if (user.role === 'parent' && mentioned.length > 0) {
    const aboutChild = mentioned.every(
      (s) => s.id === user.childId || firstName(s.name).toLowerCase() === child,
    )
    if (!aboutChild) {
      return `I can only show information for ${user.childName || 'your child'}.`
    }
  }

  return null
}

function wantsNav(q: string) {
  return has(q, 'where can i', 'where do i', 'where is', 'how do i find', 'how do i open', 'take me to', 'open ')
}

function wantsContactTeacher(q: string) {
  return has(
    q,
    'contact my child',
    'contact the teacher',
    'message the teacher',
    'talk to the teacher',
    'speak to a teacher',
    'speak to my teacher',
    'message a teacher',
    'talk to a teacher',
  )
}

function wantsSubmitForChild(q: string) {
  return has(q, 'submit my child', 'submit the homework', 'complete my child', 'do my child', 'hand in for')
}

function wantsChangeGrade(q: string) {
  return has(q, 'change my grade', 'change the grade', 'change my child', 'make it an a', 'edit my marks', 'edit the marks', 'change official')
}

function wantsHomework(q: string) {
  return has(
    q,
    'homework',
    'assignment',
    'assignments',
    'task',
    'tasks',
    'due soon',
    'due tomorrow',
    'due this',
    'are due',
    'pending',
    'not submitted',
    'hasn t submitted',
    'haven t submitted',
    'have not submitted',
    'incomplete',
    'completed',
  )
}

function wantsMissingMarks(q: string) {
  return has(q, 'missing marks', 'missing scores', 'not graded', 'awaiting grading', 'need grading')
}

function wantsClassPerformance(q: string) {
  return has(q, 'class performance', 'class average', 'average score', 'how is the class')
}

function wantsGrades(q: string) {
  return has(q, 'grade', 'grades', 'marks', 'score', 'scores', 'latest grade')
}

function wantsReportCard(q: string) {
  return has(q, 'report card', 'report cards', 'end of term')
}

function wantsExam(q: string) {
  return has(q, 'exam', 'exams', 'timetable', 'time table', 'next paper', 'exam schedule')
}

function wantsEvents(q: string) {
  return has(q, 'event', 'events', 'school activit', 'this week')
}

function wantsNotifications(q: string) {
  return has(q, 'notification', 'notifications', 'alerts', 'notices')
}

function wantsClasses(q: string) {
  return has(q, 'available class', 'show class', 'list class', 'what classes', 'classes are')
}

function wantsCounts(q: string) {
  return has(q, 'how many student', 'how many teacher', 'how many parent', 'registered')
}

function wantsGradingScale(q: string) {
  return has(q, 'grading scale', 'grading settings', 'grade scale', 'what is an a')
}

function wantsDashboard(q: string) {
  return has(q, 'dashboard', 'administrator dashboard', 'how the platform', 'how lynked')
}

function wantsActivity(q: string) {
  return has(q, 'platform activity', 'school overview', 'what is happening')
}

function navigationReply(q: string, role: Role) {
  if (has(q, 'report')) return `Open Report Card from the main navigation.`
  if (has(q, 'mark', 'grade')) {
    if (role === 'teacher') {
      return `Enter marks from Submissions after a student sends work. You can also review scores in Assignment grades.`
    }
    return `Open Assignment grades from the main navigation.`
  }
  if (has(q, 'submit', 'submission')) {
    if (role === 'teacher') return `Open Submissions from the main navigation.`
    if (role === 'parent') {
      return `Parents cannot submit work. Ask your child to open Assignments and send the file.`
    }
    return `Open Assignments, pick the task, and send your file.`
  }
  if (has(q, 'homework', 'assignment', 'task')) {
    return `Open Assignments from the main navigation.`
  }
  if (has(q, 'exam', 'timetable', 'time table')) return `Open TimeTable from the main navigation.`
  if (has(q, 'event')) return `Open School Events from the main navigation.`
  if (has(q, 'chat', 'message', 'teacher')) return `Open Chat from the main navigation to message a person.`
  if (has(q, 'notification')) return `Open Notifications from the main navigation.`
  if (has(q, 'class')) return `Open Classes from the main navigation.`
  if (has(q, 'setting')) return `Open Settings from the main navigation.`
  return `Use the main navigation to move around LynkED. I can also look up assignments, grades, the timetable, and events for you.`
}

function viewerId(user: User) {
  return viewerStudentId(user)
}

function homeworkReply(q: string, ctx: AssistantContext) {
  const { user, assignments, submissions, homework } = ctx
  const dueSoon = has(q, 'due soon', 'due tomorrow', 'this week', 'upcoming')
  const pendingOnly = has(q, 'pending', 'incomplete', 'not completed', 'still')
  const completedOnly = has(q, 'completed', 'finished', 'done')
  const missingStudents = has(q, 'hasn t submitted', 'haven t submitted', 'have not submitted', 'who has not', 'not submitted')

  if ((user.role === 'teacher' || user.role === 'admin') && missingStudents) {
    return missingSubmissionsReply(ctx)
  }

  if (user.role === 'student' || user.role === 'parent') {
    const sid = viewerId(user)
    const whose = user.role === 'parent' ? user.childName || 'your child' : 'you'
    const rows = assignments
      .filter((a) => a.status === 'published')
      .map((a) => {
        const sub = submissions.find((s) => s.assignment_id === a.id && s.student_id === sid)
        const status = sub?.status ?? 'not_submitted'
        return { assignment: a, status }
      })
      .sort((a, b) => a.assignment.due_date.localeCompare(b.assignment.due_date))

    let picked = rows
    if (pendingOnly) {
      picked = rows.filter((r) => r.status === 'not_submitted')
    } else if (completedOnly) {
      picked = rows.filter((r) => r.status !== 'not_submitted')
    } else if (dueSoon) {
      picked = rows.filter(
        (r) => r.status === 'not_submitted' && daysUntil(r.assignment.due_date) <= 7 && !isOverdue(r.assignment.due_date),
      )
    }

    if (picked.length === 0) {
      if (homework.length > 0 && pendingOnly) {
        const pendingHw = homework.filter((h) => h.status === 'pending')
        if (pendingHw.length === 0) {
          return `There is no pending homework for ${whose} right now. Open Assignments to see the full list.`
        }
      }
      return `I don't have matching assignments for ${whose} right now. Open Assignments to see the full list.`
    }

    const label =
      user.role === 'parent'
        ? pendingOnly
          ? `${whose} has ${picked.length} pending assignment${picked.length === 1 ? '' : 's'}:`
          : `${whose} has ${picked.length} assignment${picked.length === 1 ? '' : 's'}:`
        : pendingOnly
          ? `You have ${picked.length} pending assignment${picked.length === 1 ? '' : 's'}:`
          : `Here are ${picked.length} assignment${picked.length === 1 ? '' : 's'}:`

    const lines = picked.slice(0, LIST_CAP).map((r, i) => {
      const due = isOverdue(r.assignment.due_date)
        ? 'overdue'
        : daysUntil(r.assignment.due_date) === 0
          ? 'due today'
          : daysUntil(r.assignment.due_date) === 1
            ? 'due tomorrow'
            : `due ${formatDueDate(r.assignment.due_date)}`
      return `${i + 1}. ${r.assignment.subject} · ${r.assignment.title} · ${due}`
    })
    const extra =
      picked.length > LIST_CAP ? `\nOpen Assignments to see the rest.` : `\nOpen Assignments for the full details.`
    return [label, '', ...lines].join('\n') + extra
  }

  const published = assignments
    .filter((a) => a.status === 'published')
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
  const picked = dueSoon
    ? published.filter((a) => daysUntil(a.due_date) <= 7)
    : published
  if (picked.length === 0) {
    return `I don't have assignments to show right now. Open Assignments to add or review work.`
  }
  const lines = picked.slice(0, LIST_CAP).map((a, i) => {
    const due = daysUntil(a.due_date) === 1 ? 'due tomorrow' : `due ${formatDueDate(a.due_date)}`
    return `${i + 1}. ${a.subject} · ${a.title} · ${a.className} · ${due}`
  })
  return [`Assignments that are due:`, '', ...lines, '', `Open Assignments for the full list.`].join('\n')
}

function missingSubmissionsReply(ctx: AssistantContext) {
  const { assignments, submissions, students } = ctx
  const published = assignments.filter((a) => a.status === 'published')
  const lines: string[] = []
  for (const a of published) {
    const missing = students.filter((s) => {
      const sub = submissions.find((x) => x.assignment_id === a.id && x.student_id === s.id)
      return !sub || sub.status === 'not_submitted'
    })
    if (missing.length === 0) continue
    lines.push(`${a.title}: ${missing.map((s) => s.name).join(', ')}`)
    if (lines.length >= LIST_CAP) break
  }
  if (lines.length === 0) {
    return `Every student I can see has submitted, or there is no published homework yet. Open Submissions to double check.`
  }
  return [
    `Students who have not submitted:`,
    '',
    ...lines.map((line, i) => `${i + 1}. ${line}`),
    '',
    `Open Submissions for the full list.`,
  ].join('\n')
}

function missingMarksReply(ctx: AssistantContext) {
  const { assignments, submissions } = ctx
  const waiting = submissions.filter((s) => s.status === 'submitted' || s.status === 'late')
  if (waiting.length === 0) {
    return `I don't have submissions waiting for marks right now. Open Submissions to review work.`
  }
  const lines = waiting.slice(0, LIST_CAP).map((s, i) => {
    const a = assignments.find((x) => x.id === s.assignment_id)
    return `${i + 1}. ${s.student_name} · ${a?.title ?? 'Assignment'} · ${s.status.replace('_', ' ')}`
  })
  return [`Submissions missing marks:`, '', ...lines, '', `Open Submissions to enter scores.`].join('\n')
}

function classPerformanceReply(ctx: AssistantContext) {
  const { assignments, submissions } = ctx
  const graded = submissions.filter((s) => s.status === 'graded' && s.score != null)
  if (graded.length === 0) {
    return `I don't have graded work yet, so I cannot show a class average.`
  }
  const percents = graded
    .map((s) => {
      const a = assignments.find((x) => x.id === s.assignment_id)
      if (!a) return null
      return percent(s.score ?? 0, a.max_marks)
    })
    .filter((n): n is number => n != null)
  if (percents.length === 0) {
    return `I don't have enough marked work to calculate a class average.`
  }
  const avg = Math.round(percents.reduce((sum, n) => sum + n, 0) / percents.length)
  return `The average on graded assignments I can see is ${avg} percent, from ${percents.length} marked ${percents.length === 1 ? 'paper' : 'papers'}. Open Assignment grades for the full breakdown.`
}

function gradesReply(ctx: AssistantContext) {
  const { user, assignments, submissions } = ctx
  const sid =
    user.role === 'teacher' || user.role === 'admin' ? null : viewerId(user)
  const graded = submissions
    .filter((s) => s.status === 'graded' && s.score != null)
    .filter((s) => (sid ? s.student_id === sid : true))
    .sort((a, b) => (b.graded_at ?? '').localeCompare(a.graded_at ?? ''))
  if (graded.length === 0) {
    const who = user.role === 'parent' ? user.childName || 'your child' : user.role === 'student' ? 'you' : 'this class'
    return `I don't have assignment grades for ${who} yet. Open Assignment grades if anything has been marked.`
  }
  const lines = graded.slice(0, LIST_CAP).map((s, i) => {
    const a = assignments.find((x) => x.id === s.assignment_id)
    const pct = a ? percent(s.score ?? 0, a.max_marks) : null
    const who = user.role === 'teacher' || user.role === 'admin' ? `${s.student_name} · ` : ''
    return `${i + 1}. ${who}${a?.subject ?? 'Subject'} · ${s.score}/${a?.max_marks ?? '?'} (${pct ?? '?'}%)`
  })
  const who =
    user.role === 'parent' ? `${user.childName || 'Your child'}'s latest assignment grades:` : 'Latest assignment grades:'
  return [who, '', ...lines, '', `Open Assignment grades for comments and the full list.`].join('\n')
}

function reportCardReply(ctx: AssistantContext) {
  const { user, reportCards } = ctx
  if (reportCards.length === 0) {
    const who = user.role === 'parent' ? user.childName || 'your child' : 'you'
    return `I don't have a report card to show for ${who} right now. Open Report Card from the main navigation.`
  }
  const card = reportCards[0]
  const lines = card.results.slice(0, LIST_CAP).map((r, i) => `${i + 1}. ${r.subject} · ${r.score} · ${r.grade}`)
  const who = user.role === 'parent' || user.role === 'student' ? card.student_name : card.student_name
  return [
    `Report Card for ${who} · ${card.term}`,
    `Average ${card.average} · Overall ${card.overall_grade} · Position ${card.position}`,
    '',
    ...lines,
    '',
    `Open Report Card for the full sheet.`,
  ].join('\n')
}

function examReply(q: string, ctx: AssistantContext) {
  const papers = ctx.exams
    .filter((e) => (has(q, 'class timetable', 'class time') ? (e.kind || 'class') === 'class' : true))
    .filter((e) => (has(q, 'exam') && !has(q, 'timetable', 'time table') ? (e.kind || 'class') === 'exam' : true))
    .filter((e) => daysUntil(e.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
  const examOnly = papers.filter((e) => (e.kind || 'class') === 'exam')
  const list = has(q, 'exam') && !has(q, 'timetable', 'time table') ? examOnly : papers
  if (list.length === 0) {
    return `I don't have upcoming timetable items to show. Open TimeTable from the main navigation.`
  }
  const next = list[0]
  if (has(q, 'next exam', 'when is my next', 'next paper')) {
    const exam = examOnly[0] ?? next
    const kind = (exam.kind || 'class') === 'exam' ? 'exam' : 'class'
    return `Next ${kind}: ${exam.subject} · ${formatDueDate(exam.date)} · ${exam.start_time} to ${exam.end_time} · ${exam.room}. Open TimeTable for the full schedule.`
  }
  const lines = list.slice(0, LIST_CAP).map((e, i) => {
    const kind = (e.kind || 'class') === 'exam' ? 'Exam' : 'Class'
    return `${i + 1}. ${kind} · ${e.subject} · ${formatDueDate(e.date)} · ${e.start_time}`
  })
  return [`Upcoming timetable:`, '', ...lines, '', `Open TimeTable for the full schedule.`].join('\n')
}

function eventsReply(ctx: AssistantContext) {
  const upcoming = [...ctx.events]
    .filter((e) => daysUntil(e.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
  if (upcoming.length === 0) {
    return `I don't have upcoming school events to show. Open School Events from the main navigation.`
  }
  const lines = upcoming.slice(0, LIST_CAP).map((e, i) => `${i + 1}. ${e.title} · ${formatDueDate(e.date)} · ${e.location}`)
  return [`Upcoming school events:`, '', ...lines, '', `Open School Events for details.`].join('\n')
}

function notificationsReply(ctx: AssistantContext) {
  const unread = ctx.notifications.filter((n) => !n.read)
  const rows = (unread.length > 0 ? unread : ctx.notifications).slice(0, LIST_CAP)
  if (rows.length === 0) {
    return `You have no notifications right now. Open Notifications if you want to check later.`
  }
  const heading =
    unread.length > 0
      ? `You have ${unread.length} unread notification${unread.length === 1 ? '' : 's'}:`
      : `Recent notifications:`
  const lines = rows.map((n, i) => `${i + 1}. ${n.title}`)
  return [heading, '', ...lines, '', `Open Notifications to read them.`].join('\n')
}

function classesReply(ctx: AssistantContext) {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'teacher') {
    return `Your class is ${ctx.user.className || 'not set'}.`
  }
  if (ctx.classes.length === 0) {
    return `I don't have classes to show. Open Classes from the main navigation.`
  }
  const lines = ctx.classes.slice(0, 12).map((c, i) => `${i + 1}. ${c.name} · ${c.student_count} students`)
  return [`Available classes:`, '', ...lines, '', `Open Classes to manage them.`].join('\n')
}

function countsReply(q: string, ctx: AssistantContext) {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'teacher') {
    return `I can only show you information that belongs to your account.`
  }
  if (has(q, 'student')) {
    return `${ctx.students.length} student${ctx.students.length === 1 ? '' : 's'} are on the platform from what I can see.`
  }
  if (has(q, 'teacher')) {
    return `${ctx.teachers.length} teacher${ctx.teachers.length === 1 ? '' : 's'} are on the platform from what I can see.`
  }
  if (has(q, 'parent')) {
    return `${ctx.parents.length} parent${ctx.parents.length === 1 ? '' : 's'} are on the platform from what I can see.`
  }
  return activityReply(ctx)
}

function dashboardReply(role: Role, child: string) {
  if (role === 'admin') {
    return `The administrator dashboard shows people, classes, assignments, the timetable, and school events. Use Students, Teachers, Parents, Classes, and Settings in the main navigation.`
  }
  if (role === 'teacher') {
    return `Your dashboard highlights work that needs grading, late submissions, and unread messages. Use Assignments, Submissions, and Assignment grades for day to day teaching.`
  }
  if (role === 'parent') {
    return `Your dashboard follows ${child}'s assignments, grades, timetable, and school events. Use Chat if you need to message a teacher.`
  }
  return `Your dashboard shows work that is due, the timetable, and school events. Open Assignments to start a task.`
}

function activityReply(ctx: AssistantContext) {
  const published = ctx.assignments.filter((a) => a.status === 'published').length
  const upcomingExams = ctx.exams.filter((e) => daysUntil(e.date) >= 0 && (e.kind || 'class') === 'exam').length
  return [
    `Platform activity I can see:`,
    '',
    `1. Students: ${ctx.students.length}`,
    `2. Teachers: ${ctx.teachers.length}`,
    `3. Parents: ${ctx.parents.length}`,
    `4. Classes: ${ctx.classes.length}`,
    `5. Published assignments: ${published}`,
    `6. Upcoming exams: ${upcomingExams}`,
    `7. Unread notifications: ${ctx.notifications.filter((n) => !n.read).length}`,
    '',
    `Open the Dashboard for the full overview.`,
  ].join('\n')
}
