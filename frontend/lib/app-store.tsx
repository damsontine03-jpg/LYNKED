'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { GAMES } from './games'
import { mergeHomeworkIntoLiveData } from './live-data'
import {
  ASSISTANT_CONVERSATION,
  ASSISTANT_CONV_ID,
  ASSISTANT_ID,
  assistantReply,
  assistantGreeting,
  loadAssistantMessages,
  saveAssistantMessages,
  clearAssistantMessages,
  type AssistantContext,
} from './assistant'
import { Toaster } from '@/components/ui/toaster'
import type {
  Announcement,
  AnnouncementPriority,
  AppNotification,
  Assignment,
  AssignmentInput,
  AuthInput,
  ChatMessage,
  Conversation,
  Exam,
  GameScore,
  Homework,
  HomeworkInput,
  ReportCard,
  Role,
  SchoolClass,
  SchoolEvent,
  SubjectRecord,
  Submission,
  User,
} from './types'
import { api, getStoredToken, storeToken } from './api'
import { showToast } from './toast'

export interface ConversationSummary extends Conversation {
  lastMessage?: ChatMessage
  unread: number
}

interface BootstrapPayload {
  user: User
  students: User[]
  teachers?: User[]
  parents?: User[]
  classes?: SchoolClass[]
  subjects?: SubjectRecord[]
  homework: Homework[]
  assignments?: Assignment[]
  submissions?: Submission[]
  reportCards: ReportCard[]
  notifications: AppNotification[]
  conversations: ConversationSummary[]
  messages: ChatMessage[]
  events?: SchoolEvent[]
  exams?: Exam[]
  announcements?: Announcement[]
  gameScores?: GameScore[]
}

interface AppStore {
  currentUser: User | null
  sessionReady: boolean
  loginAs: (role: Role) => void
  login: (input: AuthInput) => void
  signup: (input: AuthInput) => void
  setSession: (user: User, token: string) => void
  logout: () => void

  students: User[]
  teachers: User[]
  parents: User[]
  classes: SchoolClass[]
  subjects: SubjectRecord[]
  addUser: (input: {
    name: string
    email: string
    role: Role
    className?: string
    classNames?: string[]
    subjects?: string[]
    childPublicId?: string
  }) => Promise<{ emailSent: boolean; publicId?: string }>
  addClass: (input: Omit<SchoolClass, 'id' | 'student_count'> & { student_count?: number }) => void
  addSubject: (input: Omit<SubjectRecord, 'id'>) => void
  deleteSubject: (id: string) => void

  assignments: Assignment[]
  visibleHomework: Homework[]
  createHomework: (input: HomeworkInput) => void
  updateHomework: (id: string, patch: Partial<HomeworkInput>) => void
  deleteHomework: (id: string) => void
  toggleStatus: (id: string) => void
  createAssignment: (input: AssignmentInput) => void
  updateAssignment: (id: string, patch: Partial<AssignmentInput>) => void
  deleteAssignment: (id: string) => void

  submissions: Submission[]
  submitAssignment: (assignmentId: string, fileName: string, comment?: string) => void
  gradeSubmission: (id: string, score: number, feedback: string) => void

  visibleReportCards: ReportCard[]
  createReportCard: (input: {
    student_id: string
    term: string
    results: ReportCard['results']
    teacher_remark: string
    published?: boolean
  }) => void
  updateReportCard: (id: string, patch: Partial<ReportCard>) => void
  toggleReportCardPublished: (id: string) => void

  notifications: AppNotification[]
  unreadNotifications: number
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  sendAnnouncement: (title: string, body: string, priority?: AnnouncementPriority) => void

  conversations: ConversationSummary[]
  messagesFor: (conversationId: string) => ChatMessage[]
  sendMessage: (conversationId: string, body: string) => void
  markConversationRead: (conversationId: string) => void
  endAssistantChat: () => void
  totalUnreadMessages: number

  events: SchoolEvent[]
  upsertEvent: (event: Omit<SchoolEvent, 'id'> & { id?: string }) => void
  deleteEvent: (id: string) => void

  exams: Exam[]
  upsertExam: (exam: Omit<Exam, 'id'> & { id?: string }) => void
  deleteExam: (id: string) => void

  announcements: Announcement[]

  games: typeof GAMES
  gameScores: GameScore[]
  recordGameScore: (gameId: string, score: number) => void
  toggleGameFavorite: (gameId: string) => void
}

const AppStoreContext = createContext<AppStore | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [students, setStudents] = useState<User[]>([])
  const [teachers, setTeachers] = useState<User[]>([])
  const [parents, setParents] = useState<User[]>([])
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [subjects, setSubjects] = useState<SubjectRecord[]>([])
  const [homeworkRows, setHomeworkRows] = useState<Homework[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [assistantMessages, setAssistantMessages] = useState<ChatMessage[]>([])
  const assistantTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const assistantContextRef = useRef<AssistantContext | null>(null)
  const [liveConversations, setLiveConversations] = useState<Conversation[]>([])
  const [lastRead, setLastRead] = useState<Record<string, string>>({})
  const [events, setEvents] = useState<SchoolEvent[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [gameScores, setGameScores] = useState<GameScore[]>([])

  const applyBootstrap = useCallback((data: BootstrapPayload) => {
    const nextUser = data.user
    const nextStudents = data.students ?? []
    const nextTeachers = data.teachers ?? []
    const nameById = Object.fromEntries(
      [...nextStudents, ...nextTeachers, nextUser].map((u) => [u.id, u.name]),
    )
    const merged = mergeHomeworkIntoLiveData(
      data.assignments ?? [],
      data.submissions ?? [],
      data.homework ?? [],
      nameById,
    )
    setCurrentUser(nextUser)
    setStudents(nextStudents)
    setTeachers(nextTeachers)
    setParents(data.parents ?? [])
    setClasses(data.classes ?? [])
    setSubjects(data.subjects ?? [])
    setHomeworkRows(data.homework ?? [])
    setAssignments(merged.assignments)
    setSubmissions(merged.submissions)
    setReportCards(data.reportCards ?? [])
    setNotifications(data.notifications ?? [])
    setMessages(data.messages ?? [])
    setLiveConversations(
      (data.conversations ?? []).map(({ lastMessage: _last, unread: _unread, ...conv }) => conv),
    )
    setEvents(data.events ?? [])
    setExams(data.exams ?? [])
    setAnnouncements(data.announcements ?? [])
    setGameScores(data.gameScores ?? [])
  }, [])

  const runMutation = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = getStoredToken()
      if (!token) return undefined
      const data = await api<BootstrapPayload>(path, { ...options, token })
      applyBootstrap(data)
      return data
    },
    [applyBootstrap],
  )

  const toastMutation = useCallback(
    (promise: Promise<unknown>, success: string, failure: string) => {
      void promise
        .then(() => showToast(success))
        .catch(() => showToast(failure, 'error'))
    },
    [],
  )

  const setSession = useCallback(
    (user: User, token: string) => {
      storeToken(token)
      setCurrentUser(user)
      setLastRead({})
      void api<BootstrapPayload>('/api/bootstrap', { token })
        .then(applyBootstrap)
        .catch(() => {})
    },
    [applyBootstrap],
  )

  const loginAs = useCallback((_role: Role) => {}, [])

  const login = useCallback((_input: AuthInput) => {}, [])

  const signup = useCallback((_input: AuthInput) => {}, [])

  const logout = useCallback(() => {
    const token = getStoredToken()
    if (token) {
      void api('/api/auth/logout', { method: 'POST', token }).catch(() => {})
    }
    storeToken(null)
    setCurrentUser(null)
  }, [])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setSessionReady(true)
      return
    }
    api<BootstrapPayload>('/api/bootstrap', { token })
      .then((data) => applyBootstrap(data))
      .catch(() => storeToken(null))
      .finally(() => setSessionReady(true))
  }, [applyBootstrap])

  useEffect(() => {
    if (!currentUser) {
      setAssistantMessages([])
      return
    }
    setAssistantMessages(loadAssistantMessages(currentUser.id))
  }, [currentUser?.id])

  const addUser = useCallback(
    async (input: {
      name: string
      email: string
      role: Role
      className?: string
      classNames?: string[]
      subjects?: string[]
      childPublicId?: string
    }) => {
      try {
        const data = (await runMutation('/api/users', {
          method: 'POST',
          body: JSON.stringify({
            name: input.name,
            email: input.email,
            role: input.role,
            className: input.className,
            classNames: input.classNames,
            subjects: input.subjects,
            childPublicId: input.childPublicId,
          }),
        })) as BootstrapPayload & { emailSent?: boolean; publicId?: string }
        const label =
          input.role === 'student'
            ? 'Student'
            : input.role === 'teacher'
              ? 'Teacher'
              : input.role === 'parent'
                ? 'Parent'
                : 'Account'
        showToast(`${label} created`)
        return { emailSent: Boolean(data?.emailSent), publicId: data?.publicId }
      } catch (error) {
        showToast('Could not create this account', 'error')
        throw error
      }
    },
    [runMutation],
  )

  const addClass = useCallback(
    (input: Omit<SchoolClass, 'id' | 'student_count'> & { student_count?: number }) => {
      toastMutation(
        runMutation('/api/classes', {
          method: 'POST',
          body: JSON.stringify({
            name: input.name,
            teacher_id: input.teacher_id,
          }),
        }),
        'Class created',
        'Could not create the class',
      )
    },
    [runMutation, toastMutation],
  )

  const addSubject = useCallback(
    (input: Omit<SubjectRecord, 'id'>) => {
      toastMutation(
        runMutation('/api/subjects', {
          method: 'POST',
          body: JSON.stringify({
            name: input.name,
            code: input.code,
            className: input.className,
            teacher_id: input.teacher_id,
          }),
        }),
        'Subject created',
        'Could not create the subject',
      )
    },
    [runMutation, toastMutation],
  )

  const deleteSubject = useCallback((id: string) => {
    toastMutation(
      runMutation(`/api/subjects/${id}`, { method: 'DELETE' }),
      'Subject deleted',
      'Could not delete the subject',
    )
  }, [runMutation, toastMutation])

  const visibleAssignments = useMemo(() => {
    const published = assignments.filter((a) => a.status === 'published')
    if (!currentUser) return []
    if (currentUser.role === 'admin') return assignments
    if (currentUser.role === 'teacher') {
      return assignments.filter(
        (a) =>
          a.teacher_id === currentUser.id ||
          a.className === currentUser.className ||
          Boolean(currentUser.classNames?.includes(a.className)),
      )
    }
    return published.filter(
      (a) => !a.className || a.className === currentUser.className,
    )
  }, [assignments, currentUser])

  const visibleHomework = useMemo<Homework[]>(() => {
    if (!currentUser) return []
    if (homeworkRows.length > 0) {
      return [...homeworkRows].sort(
        (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
      )
    }
    const rows: Homework[] = []
    for (const a of visibleAssignments.filter((x) => x.status === 'published')) {
      const subs = submissions.filter((s) => s.assignment_id === a.id)
      if (currentUser.role === 'student' || currentUser.role === 'parent') {
        const sid =
          currentUser.role === 'parent' ? currentUser.childId : currentUser.id
        const mine = subs.find((s) => s.student_id === sid)
        if (mine) {
          const done =
            mine.status === 'submitted' ||
            mine.status === 'graded' ||
            mine.status === 'late'
          rows.push({
            id: mine.id,
            title: a.title,
            description: a.instructions,
            subject: a.subject,
            due_date: a.due_date,
            status: done ? 'completed' : 'pending',
            assigned_by: a.teacher_name,
            teacher_id: a.teacher_id,
            student_id: mine.student_id,
            created_at: a.posted_at,
          })
        }
      } else {
        for (const s of subs) {
          const done =
            s.status === 'submitted' || s.status === 'graded' || s.status === 'late'
          rows.push({
            id: s.id,
            title: a.title,
            description: a.instructions,
            subject: a.subject,
            due_date: a.due_date,
            status: done ? 'completed' : 'pending',
            assigned_by: a.teacher_name,
            teacher_id: a.teacher_id,
            student_id: s.student_id,
            created_at: a.posted_at,
          })
        }
      }
    }
    return rows.sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
    )
  }, [visibleAssignments, submissions, currentUser, homeworkRows])

  const createAssignment = useCallback(
    (input: AssignmentInput) => {
      toastMutation(
        runMutation('/api/assignments', {
          method: 'POST',
          body: JSON.stringify(input),
        }),
        'Assignment created',
        'Could not create the assignment',
      )
    },
    [runMutation, toastMutation],
  )

  const updateAssignment = useCallback((id: string, patch: Partial<AssignmentInput>) => {
    void runMutation(`/api/assignments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
      .then(() => showToast('Assignment updated'))
      .catch(() => showToast('Could not update the assignment', 'error'))
  }, [runMutation])

  const deleteAssignment = useCallback((id: string) => {
    const homeworkId = homeworkRows.some((row) => row.id === id) ? id : null
    const path = homeworkId ? `/api/homework/${homeworkId}` : `/api/assignments/${id}`
    toastMutation(
      runMutation(path, { method: 'DELETE' }),
      'Assignment deleted',
      'Could not delete the assignment',
    )
  }, [homeworkRows, runMutation, toastMutation])

  const createHomework = useCallback(
    (input: HomeworkInput) => {
      if (!currentUser) return
      toastMutation(
        runMutation('/api/homework', {
          method: 'POST',
          body: JSON.stringify({
            ...input,
            className: currentUser.className,
            student_id:
              currentUser.role === 'student'
                ? currentUser.id
                : input.student_id || 'all',
          }),
        }),
        'Homework created',
        'Could not create the homework',
      )
    },
    [currentUser, runMutation, toastMutation],
  )

  const homeworkIdFor = useCallback(
    (id: string) => {
      if (homeworkRows.some((h) => h.id === id)) return id
      if (id.startsWith('sub-') && homeworkRows.some((h) => h.id === id.slice(4))) {
        return id.slice(4)
      }
      const sub = submissions.find((s) => s.id === id)
      if (sub && homeworkRows.some((h) => h.id === sub.assignment_id)) {
        return sub.assignment_id
      }
      return null
    },
    [homeworkRows, submissions],
  )

  const updateHomework = useCallback(
    (id: string, patch: Partial<HomeworkInput>) => {
      const homeworkId = homeworkIdFor(id)
      if (homeworkId) {
        void runMutation(`/api/homework/${homeworkId}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        }).catch(() => {})
        return
      }
      const sub = submissions.find((s) => s.id === id)
      if (!sub) return
      updateAssignment(sub.assignment_id, {
        title: patch.title,
        subject: patch.subject,
        instructions: patch.description,
        due_date: patch.due_date,
      })
    },
    [homeworkIdFor, runMutation, submissions, updateAssignment],
  )

  const deleteHomework = useCallback(
    (id: string) => {
      const homeworkId = homeworkIdFor(id)
      if (homeworkId) {
        toastMutation(
          runMutation(`/api/homework/${homeworkId}`, { method: 'DELETE' }),
          'Homework deleted',
          'Could not delete the homework',
        )
        return
      }
      const sub = submissions.find((s) => s.id === id)
      if (sub) deleteAssignment(sub.assignment_id)
    },
    [deleteAssignment, homeworkIdFor, runMutation, submissions, toastMutation],
  )

  const toggleStatus = useCallback(
    (id: string) => {
      const homeworkId = homeworkIdFor(id)
      if (homeworkId) {
        void runMutation(`/api/homework/${homeworkId}/toggle-status`, {
          method: 'POST',
        }).catch(() => showToast('Could not update the homework', 'error'))
        return
      }
      void runMutation(`/api/submissions/${id}/toggle`, { method: 'POST' }).catch(() =>
        showToast('Could not update the submission', 'error'),
      )
    },
    [homeworkIdFor, runMutation],
  )

  const submitAssignment = useCallback(
    (assignmentId: string, fileName: string, comment?: string) => {
      if (!currentUser || currentUser.role === 'parent') return
      if (homeworkRows.some((h) => h.id === assignmentId)) {
        toastMutation(
          runMutation(`/api/homework/${assignmentId}/toggle-status`, {
            method: 'POST',
          }),
          'Assignment submitted',
          'Could not submit the assignment',
        )
        return
      }
      toastMutation(
        runMutation(`/api/assignments/${assignmentId}/submit`, {
          method: 'POST',
          body: JSON.stringify({ fileName, comment }),
        }),
        'Assignment submitted',
        'Could not submit the assignment',
      )
    },
    [currentUser, homeworkRows, runMutation, toastMutation],
  )

  const gradeSubmission = useCallback(
    (id: string, score: number, feedback: string) => {
      toastMutation(
        runMutation(`/api/submissions/${id}/grade`, {
          method: 'POST',
          body: JSON.stringify({ score, feedback }),
        }),
        'Grade saved',
        'Could not save the grade',
      )
    },
    [runMutation, toastMutation],
  )

  const visibleReportCards = useMemo(() => {
    if (!currentUser) return []
    if (currentUser.role === 'teacher' || currentUser.role === 'admin') return reportCards
    return reportCards.filter(
      (c) =>
        c.published &&
        c.student_id ===
          (currentUser.role === 'parent' ? currentUser.childId : currentUser.id),
    )
  }, [reportCards, currentUser])

  const createReportCard = useCallback(
    (input: {
      student_id: string
      term: string
      results: ReportCard['results']
      teacher_remark: string
      published?: boolean
    }) => {
      toastMutation(
        runMutation('/api/report-cards', {
          method: 'POST',
          body: JSON.stringify(input),
        }),
        input.published ? 'Report card published' : 'Report card created',
        'Could not save the report card',
      )
    },
    [runMutation, toastMutation],
  )

  const updateReportCard = useCallback((id: string, patch: Partial<ReportCard>) => {
    void runMutation(`/api/report-cards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        term: patch.term,
        results: patch.results,
        teacher_remark: patch.teacher_remark,
        published: patch.published,
      }),
    }).catch(() => {})
  }, [runMutation])

  const toggleReportCardPublished = useCallback((id: string) => {
    void runMutation(`/api/report-cards/${id}/toggle-published`, { method: 'POST' }).catch(
      () => {},
    )
  }, [runMutation])

  const myNotifications = useMemo(() => {
    if (!currentUser) return []
    return notifications
      .filter(
        (n) =>
          n.user_id === currentUser.id ||
          n.user_id === 'all' ||
          (currentUser.role === 'admin' && n.type === 'announcement'),
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
  }, [notifications, currentUser])

  const unreadNotifications = useMemo(
    () => myNotifications.filter((n) => !n.read).length,
    [myNotifications],
  )

  const markNotificationRead = useCallback((id: string) => {
    void runMutation(`/api/notifications/${id}/read`, { method: 'POST' }).catch(() => {})
  }, [runMutation])

  const markAllNotificationsRead = useCallback(() => {
    void runMutation('/api/notifications/read-all', { method: 'POST' }).catch(() => {})
  }, [runMutation])

  const sendAnnouncement = useCallback(
    (title: string, body: string, _priority: AnnouncementPriority = 'normal') => {
      toastMutation(
        runMutation('/api/announcements', {
          method: 'POST',
          body: JSON.stringify({ title, body }),
        }),
        'Announcement created',
        'Could not create the announcement',
      )
    },
    [runMutation, toastMutation],
  )

  const baseConversations = useMemo(() => {
    if (!currentUser) return [] as Conversation[]
    return [ASSISTANT_CONVERSATION, ...liveConversations]
  }, [currentUser, liveConversations])

  const allMessages = useMemo(
    () => [...messages, ...assistantMessages],
    [messages, assistantMessages],
  )

  const conversations = useMemo<ConversationSummary[]>(() => {
    if (!currentUser) return []
    return baseConversations.map((c) => {
      const convMessages = allMessages
        .filter((m) => m.conversation_id === c.id)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        )
      const lastMessage = convMessages[convMessages.length - 1]
      const readAt = lastRead[c.id]
      const unread = convMessages.filter(
        (m) =>
          m.sender_id !== currentUser.id &&
          (!readAt || new Date(m.created_at).getTime() > new Date(readAt).getTime()),
      ).length
      return { ...c, lastMessage, unread }
    })
  }, [baseConversations, allMessages, currentUser, lastRead])

  const messagesFor = useCallback(
    (convId: string) =>
      allMessages
        .filter((m) => m.conversation_id === convId)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
    [allMessages],
  )

  assistantContextRef.current = currentUser
    ? {
        user: currentUser,
        assignments: visibleAssignments,
        submissions,
        homework: visibleHomework,
        exams:
          currentUser.role === 'admin'
            ? exams
            : exams.filter(
                (e) =>
                  e.published &&
                  ((currentUser.role !== 'student' && currentUser.role !== 'parent') ||
                    e.className === currentUser.className),
              ),
        events: currentUser.role === 'admin' ? events : events.filter((e) => e.published),
        notifications: myNotifications,
        reportCards: visibleReportCards,
        students,
        teachers,
        parents,
        classes,
        subjects,
        announcements: announcements.filter((a) => a.published || currentUser.role === 'admin'),
      }
    : null

  const sendMessage = useCallback(
    (convId: string, body: string) => {
      const text = body.trim()
      if (!text || !currentUser) return
      if (convId === ASSISTANT_CONV_ID) {
        const created = new Date().toISOString()
        const userMsg: ChatMessage = {
          id: `m-${crypto.randomUUID()}`,
          conversation_id: ASSISTANT_CONV_ID,
          sender_id: currentUser.id,
          sender_role: currentUser.role,
          sender_name: currentUser.name,
          body: text,
          created_at: created,
        }
        setAssistantMessages((prev) => {
          const next = [...prev, userMsg]
          saveAssistantMessages(currentUser.id, next)
          return next
        })
        const ctx = assistantContextRef.current
        const reply: ChatMessage = {
          id: `m-${crypto.randomUUID()}`,
          conversation_id: ASSISTANT_CONV_ID,
          sender_id: ASSISTANT_ID,
          sender_role: 'teacher',
          sender_name: 'LynkED Assistant',
          body: ctx ? assistantReply(text, ctx) : assistantGreeting(currentUser.name),
          created_at: new Date(Date.now() + 400).toISOString(),
        }
        if (assistantTimer.current) window.clearTimeout(assistantTimer.current)
        assistantTimer.current = window.setTimeout(() => {
          assistantTimer.current = null
          setAssistantMessages((prev) => {
            const next = [...prev, reply]
            saveAssistantMessages(currentUser.id, next)
            return next
          })
        }, 400)
        return
      }
      void runMutation(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: text }),
      }).catch(() => {})
    },
    [currentUser, runMutation],
  )

  const markConversationRead = useCallback((convId: string) => {
    setLastRead((prev) => ({ ...prev, [convId]: new Date().toISOString() }))
    if (convId === ASSISTANT_CONV_ID) return
    void runMutation(`/api/conversations/${convId}/read`, { method: 'POST' }).catch(() => {})
  }, [runMutation])

  const endAssistantChat = useCallback(() => {
    if (assistantTimer.current) {
      window.clearTimeout(assistantTimer.current)
      assistantTimer.current = null
    }
    setAssistantMessages([])
    if (currentUser) clearAssistantMessages(currentUser.id)
  }, [currentUser])

  const totalUnreadMessages = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unread, 0),
    [conversations],
  )

  const upsertEvent = useCallback(
    (event: Omit<SchoolEvent, 'id'> & { id?: string }) => {
      toastMutation(
        runMutation('/api/events', {
          method: 'POST',
          body: JSON.stringify(event),
        }),
        event.id ? 'Event saved' : 'Event created',
        'Could not save the event',
      )
    },
    [runMutation, toastMutation],
  )

  const deleteEvent = useCallback((id: string) => {
    toastMutation(
      runMutation(`/api/events/${id}`, { method: 'DELETE' }),
      'Event deleted',
      'Could not delete the event',
    )
  }, [runMutation, toastMutation])

  const upsertExam = useCallback((exam: Omit<Exam, 'id'> & { id?: string }) => {
    toastMutation(
      runMutation('/api/exams', {
        method: 'POST',
        body: JSON.stringify(exam),
      }),
      exam.id ? 'TimeTable item saved' : 'TimeTable item created',
      'Could not save the timetable item',
    )
  }, [runMutation, toastMutation])

  const deleteExam = useCallback((id: string) => {
    toastMutation(
      runMutation(`/api/exams/${id}`, { method: 'DELETE' }),
      'TimeTable item deleted',
      'Could not delete the timetable item',
    )
  }, [runMutation, toastMutation])

  const recordGameScore = useCallback((gameId: string, score: number) => {
    void runMutation(`/api/games/${gameId}/score`, {
      method: 'POST',
      body: JSON.stringify({ score }),
    }).catch(() => {})
  }, [runMutation])

  const toggleGameFavorite = useCallback((gameId: string) => {
    void runMutation(`/api/games/${gameId}/favorite`, { method: 'POST' }).catch(() => {})
  }, [runMutation])

  const value = useMemo<AppStore>(
    () => ({
      currentUser,
      sessionReady,
      loginAs,
      login,
      signup,
      setSession,
      logout,
      students,
      teachers,
      parents,
      classes,
      subjects,
      addUser,
      addClass,
      addSubject,
      deleteSubject,
      assignments: visibleAssignments,
      visibleHomework,
      createHomework,
      updateHomework,
      deleteHomework,
      toggleStatus,
      createAssignment,
      updateAssignment,
      deleteAssignment,
      submissions,
      submitAssignment,
      gradeSubmission,
      visibleReportCards,
      createReportCard,
      updateReportCard,
      toggleReportCardPublished,
      notifications: myNotifications,
      unreadNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      sendAnnouncement,
      conversations,
      messagesFor,
      sendMessage,
      markConversationRead,
      endAssistantChat,
      totalUnreadMessages,
      events: currentUser?.role === 'admin' ? events : events.filter((e) => e.published),
      upsertEvent,
      deleteEvent,
      exams:
        currentUser?.role === 'admin'
          ? exams
          : exams.filter(
              (e) =>
                e.published &&
                ((currentUser?.role !== 'student' && currentUser?.role !== 'parent') ||
                  e.className === currentUser.className),
            ),
      upsertExam,
      deleteExam,
      announcements: announcements.filter((a) => a.published || currentUser?.role === 'admin'),
      games: GAMES,
      gameScores,
      recordGameScore,
      toggleGameFavorite,
    }),
    [
      currentUser,
      sessionReady,
      loginAs,
      login,
      signup,
      setSession,
      logout,
      students,
      teachers,
      parents,
      classes,
      subjects,
      addUser,
      addClass,
      addSubject,
      deleteSubject,
      visibleAssignments,
      visibleHomework,
      createHomework,
      updateHomework,
      deleteHomework,
      toggleStatus,
      createAssignment,
      updateAssignment,
      deleteAssignment,
      submissions,
      submitAssignment,
      gradeSubmission,
      visibleReportCards,
      createReportCard,
      updateReportCard,
      toggleReportCardPublished,
      myNotifications,
      unreadNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      sendAnnouncement,
      conversations,
      messagesFor,
      sendMessage,
      markConversationRead,
      endAssistantChat,
      totalUnreadMessages,
      events,
      upsertEvent,
      deleteEvent,
      exams,
      upsertExam,
      deleteExam,
      announcements,
      gameScores,
      recordGameScore,
      toggleGameFavorite,
    ],
  )

  return (
    <AppStoreContext.Provider value={value}>
      {children}
      <Toaster />
    </AppStoreContext.Provider>
  )
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore must be used within an AppProvider')
  return ctx
}
