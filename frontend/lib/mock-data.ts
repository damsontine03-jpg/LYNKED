import type {
  Announcement,
  AppNotification,
  Assignment,
  ChatMessage,
  Conversation,
  GameInfo,
  GameScore,
  ReportCard,
  SchoolClass,
  SchoolEvent,
  SubjectRecord,
  Submission,
  User,
} from './types'

function isoDateOffset(days: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function isoTimeOffset(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString()
}

export const ADMIN: User = {
  id: 'user-admin-1',
  name: 'Mrs. Bangura',
  email: 'bangura@school.edu',
  phone: '+232 76 000001',
  role: 'admin',
  className: 'Whole school',
}

export const TEACHER: User = {
  id: 'user-teacher-1',
  name: 'Mr. Kamara',
  email: 'kamara@school.edu',
  phone: '+232 76 000002',
  role: 'teacher',
  className: 'SSS 2',
  subject: 'Science',
}

export const TEACHER_2: User = {
  id: 'user-teacher-2',
  name: 'Ms. Sesay',
  email: 'sesay@school.edu',
  phone: '+232 76 000003',
  role: 'teacher',
  className: 'SSS 2',
  subject: 'Mathematics',
}

export const STUDENT: User = {
  id: 'user-student-1',
  name: 'Mariama',
  email: 'mariama@school.edu',
  phone: '+232 76 100001',
  role: 'student',
  className: 'SSS 2',
}

export const STUDENTS: User[] = [
  STUDENT,
  {
    id: 'user-student-2',
    name: 'Ibrahim',
    email: 'ibrahim@school.edu',
    phone: '+232 76 100002',
    role: 'student',
    className: 'SSS 2',
  },
  {
    id: 'user-student-3',
    name: 'Fatmata',
    email: 'fatmata@school.edu',
    phone: '+232 76 100003',
    role: 'student',
    className: 'SSS 2',
  },
  {
    id: 'user-student-4',
    name: 'Sahr',
    email: 'sahr@school.edu',
    phone: '+232 76 100004',
    role: 'student',
    className: 'SSS 2',
  },
]

export const TEACHERS: User[] = [TEACHER, TEACHER_2]
export const MOCK_USERS: User[] = [ADMIN, ...TEACHERS, ...STUDENTS]

export const CLASSES: SchoolClass[] = [
  {
    id: 'class-sss1',
    name: 'SSS 1',
    level: 'Senior Secondary',
    teacher_id: TEACHER_2.id,
    teacher_name: TEACHER_2.name,
    student_count: 28,
  },
  {
    id: 'class-sss2',
    name: 'SSS 2',
    level: 'Senior Secondary',
    teacher_id: TEACHER.id,
    teacher_name: TEACHER.name,
    student_count: 4,
  },
  {
    id: 'class-sss3',
    name: 'SSS 3',
    level: 'Senior Secondary',
    teacher_id: TEACHER.id,
    teacher_name: TEACHER.name,
    student_count: 31,
  },
]

export const SUBJECTS: SubjectRecord[] = [
  { id: 'sub-bio', name: 'Biology', code: 'BIO', teacher_id: TEACHER.id, teacher_name: TEACHER.name, className: 'SSS 2' },
  { id: 'sub-che', name: 'Chemistry', code: 'CHE', teacher_id: TEACHER.id, teacher_name: TEACHER.name, className: 'SSS 2' },
  { id: 'sub-phy', name: 'Physics', code: 'PHY', teacher_id: TEACHER.id, teacher_name: TEACHER.name, className: 'SSS 2' },
  { id: 'sub-mat', name: 'Mathematics', code: 'MAT', teacher_id: TEACHER_2.id, teacher_name: TEACHER_2.name, className: 'SSS 2' },
  { id: 'sub-eng', name: 'English', code: 'ENG', teacher_id: TEACHER_2.id, teacher_name: TEACHER_2.name, className: 'SSS 2' },
]

export function buildAssignments(): Assignment[] {
  return [
    {
      id: 'asg-hw12',
      title: 'HW 12',
      subject: 'Mathematics',
      className: 'SSS 2',
      topic: 'Homework',
      instructions: 'Complete homework 12 from the textbook. Show your working.',
      posted_at: '2026-10-01',
      due_date: '2026-10-15',
      max_marks: 20,
      teacher_id: TEACHER_2.id,
      teacher_name: TEACHER_2.name,
      status: 'published',
    },
    {
      id: 'asg-essay',
      title: 'Essay',
      subject: 'History',
      className: 'SSS 2',
      topic: 'Essay',
      instructions: 'Write a short essay on the assigned history topic.',
      posted_at: '2026-10-02',
      due_date: '2026-10-18',
      max_marks: 25,
      teacher_id: TEACHER_2.id,
      teacher_name: TEACHER_2.name,
      status: 'published',
    },
    {
      id: 'asg-quiz',
      title: 'Quiz',
      subject: 'Science',
      className: 'SSS 2',
      topic: 'Quiz',
      instructions: 'Revise for the science quiz covering this week’s lessons.',
      posted_at: '2026-10-04',
      due_date: '2026-10-20',
      max_marks: 15,
      teacher_id: TEACHER.id,
      teacher_name: TEACHER.name,
      status: 'published',
    },
    {
      id: 'asg-1',
      title: 'Photosynthesis lab report',
      subject: 'Biology',
      className: 'SSS 2',
      topic: 'Photosynthesis',
      instructions:
        'Write up the results of the leaf starch experiment. Include a labelled diagram and a short conclusion.',
      attachment: { name: 'photosynthesis brief.pdf', sizeLabel: '240 KB' },
      posted_at: isoDateOffset(-2),
      due_date: isoDateOffset(1),
      max_marks: 20,
      teacher_id: TEACHER.id,
      teacher_name: TEACHER.name,
      status: 'published',
    },
    {
      id: 'asg-2',
      title: 'Balancing chemical equations',
      subject: 'Chemistry',
      className: 'SSS 2',
      topic: 'Stoichiometry',
      instructions: 'Complete questions 1-15 on page 84 of the workbook.',
      attachment: { name: 'equations worksheet.pdf', sizeLabel: '180 KB' },
      posted_at: isoDateOffset(-1),
      due_date: isoDateOffset(3),
      max_marks: 15,
      teacher_id: TEACHER.id,
      teacher_name: TEACHER.name,
      status: 'published',
    },
    {
      id: 'asg-3',
      title: "Newton's laws worksheet",
      subject: 'Physics',
      className: 'SSS 2',
      topic: 'Forces and motion',
      instructions: 'Answer all short-response questions and show your working.',
      attachment: { name: 'newton laws.pdf', sizeLabel: '210 KB' },
      posted_at: isoDateOffset(-4),
      due_date: isoDateOffset(6),
      max_marks: 25,
      teacher_id: TEACHER.id,
      teacher_name: TEACHER.name,
      status: 'published',
    },
    {
      id: 'asg-4',
      title: 'Cell structure flashcards',
      subject: 'Biology',
      className: 'SSS 2',
      topic: 'Cell biology',
      instructions: 'Create flashcards for each organelle and its function.',
      posted_at: isoDateOffset(-8),
      due_date: isoDateOffset(-1),
      max_marks: 20,
      teacher_id: TEACHER.id,
      teacher_name: TEACHER.name,
      status: 'published',
    },
    {
      id: 'asg-5',
      title: 'Periodic table quiz prep',
      subject: 'Chemistry',
      className: 'SSS 2',
      topic: 'The periodic table',
      instructions: 'Revise the first 20 elements and their symbols.',
      attachment: { name: 'periodic table notes.pdf', sizeLabel: '95 KB' },
      posted_at: isoDateOffset(-3),
      due_date: isoDateOffset(9),
      max_marks: 10,
      teacher_id: TEACHER.id,
      teacher_name: TEACHER.name,
      status: 'published',
    },
    {
      id: 'asg-6',
      title: 'Ecosystem field notes',
      subject: 'Biology',
      className: 'SSS 2',
      topic: 'Ecology',
      instructions: 'Summarise the food web observed during the school garden visit.',
      posted_at: isoDateOffset(-10),
      due_date: isoDateOffset(-3),
      max_marks: 20,
      teacher_id: TEACHER.id,
      teacher_name: TEACHER.name,
      status: 'published',
    },
    {
      id: 'asg-7',
      title: 'Mid term algebra set',
      subject: 'Mathematics',
      className: 'SSS 2',
      topic: 'Quadratic equations',
      instructions: 'Solve the attached problem set. Show all working.',
      attachment: { name: 'algebra set.pdf', sizeLabel: '160 KB' },
      posted_at: isoDateOffset(0),
      due_date: isoDateOffset(5),
      max_marks: 30,
      teacher_id: TEACHER_2.id,
      teacher_name: TEACHER_2.name,
      status: 'draft',
    },
  ]
}

type SubSeed = {
  assignment_id: string
  student_id: string
  status: Submission['status']
  score?: number
  feedback?: string
  file?: boolean
  comment?: string
  submitted_offset?: number
}

const SUB_SEEDS: SubSeed[] = [
  { assignment_id: 'asg-hw12', student_id: 'user-student-1', status: 'not_submitted' },
  { assignment_id: 'asg-hw12', student_id: 'user-student-2', status: 'not_submitted' },
  { assignment_id: 'asg-essay', student_id: 'user-student-1', status: 'submitted', file: true, submitted_offset: -60 * 8 },
  { assignment_id: 'asg-essay', student_id: 'user-student-2', status: 'not_submitted' },
  { assignment_id: 'asg-quiz', student_id: 'user-student-1', status: 'not_submitted' },
  { assignment_id: 'asg-quiz', student_id: 'user-student-3', status: 'not_submitted' },
  { assignment_id: 'asg-1', student_id: 'user-student-1', status: 'not_submitted' },
  { assignment_id: 'asg-1', student_id: 'user-student-2', status: 'submitted', file: true, submitted_offset: -40 },
  { assignment_id: 'asg-1', student_id: 'user-student-3', status: 'not_submitted' },
  { assignment_id: 'asg-1', student_id: 'user-student-4', status: 'not_submitted' },

  { assignment_id: 'asg-2', student_id: 'user-student-1', status: 'not_submitted' },
  { assignment_id: 'asg-2', student_id: 'user-student-2', status: 'not_submitted' },
  { assignment_id: 'asg-2', student_id: 'user-student-3', status: 'submitted', file: true, submitted_offset: -20 },
  { assignment_id: 'asg-2', student_id: 'user-student-4', status: 'not_submitted' },

  { assignment_id: 'asg-3', student_id: 'user-student-1', status: 'not_submitted' },
  { assignment_id: 'asg-3', student_id: 'user-student-4', status: 'not_submitted' },

  { assignment_id: 'asg-4', student_id: 'user-student-1', status: 'graded', score: 18, feedback: 'Clear cards and accurate labels. Well done.', file: true, submitted_offset: -60 * 30 },
  { assignment_id: 'asg-4', student_id: 'user-student-2', status: 'graded', score: 16, feedback: 'Good coverage. Add the nucleolus next time.', file: true, submitted_offset: -60 * 28 },
  { assignment_id: 'asg-4', student_id: 'user-student-3', status: 'late', file: true, submitted_offset: -30 },

  { assignment_id: 'asg-5', student_id: 'user-student-1', status: 'not_submitted' },
  { assignment_id: 'asg-5', student_id: 'user-student-2', status: 'not_submitted' },

  { assignment_id: 'asg-6', student_id: 'user-student-1', status: 'graded', score: 15, feedback: 'Solid food web summary. Mention decomposers.', file: true, submitted_offset: -60 * 50 },
  { assignment_id: 'asg-6', student_id: 'user-student-4', status: 'graded', score: 12, feedback: 'Keep going. Add one more trophic level.', file: true, submitted_offset: -60 * 48 },
]

const NAME_BY_ID = Object.fromEntries(STUDENTS.map((s) => [s.id, s.name]))

export function buildSubmissions(): Submission[] {
  return SUB_SEEDS.map((s, i) => {
    const submitted_at =
      s.status === 'not_submitted' ? undefined : isoTimeOffset(s.submitted_offset ?? -60)
    return {
      id: `sub-${i + 1}`,
      assignment_id: s.assignment_id,
      student_id: s.student_id,
      student_name: NAME_BY_ID[s.student_id],
      status: s.status,
      score: s.score,
      feedback: s.feedback,
      file: s.file
        ? { name: `${NAME_BY_ID[s.student_id].toLowerCase()}-work.pdf`, sizeLabel: '1.2 MB' }
        : undefined,
      comment: s.comment,
      submitted_at,
      graded_at: s.status === 'graded' ? isoTimeOffset(-60 * 12) : undefined,
    }
  })
}

function gradeFor(score: number): string {
  if (score >= 80) return 'A1'
  if (score >= 70) return 'B2'
  if (score >= 65) return 'B3'
  if (score >= 60) return 'C4'
  if (score >= 55) return 'C5'
  if (score >= 50) return 'C6'
  if (score >= 45) return 'D7'
  if (score >= 40) return 'E8'
  return 'F9'
}

function buildCard(
  id: string,
  student: User,
  scores: Record<string, number>,
  position: number,
  teacher_remark: string,
  published: boolean,
): ReportCard {
  const results = Object.entries(scores).map(([subject, score]) => ({
    subject,
    score,
    grade: gradeFor(score),
    remark:
      score >= 70 ? 'Excellent' : score >= 55 ? 'Good' : score >= 45 ? 'Fair' : 'Needs work',
  }))
  const average =
    Math.round((results.reduce((sum, r) => sum + r.score, 0) / results.length) * 10) / 10
  return {
    id,
    student_id: student.id,
    student_name: student.name,
    className: student.className,
    term: 'First Term',
    results,
    average,
    overall_grade: gradeFor(average),
    position,
    teacher_remark,
    published,
    updated_at: isoTimeOffset(-60 * 24 * 3),
  }
}

export function buildReportCards(): ReportCard[] {
  return [
    buildCard('rc-1', STUDENTS[0], { Biology: 84, Chemistry: 76, Physics: 71, Mathematics: 68, English: 79 }, 2, 'A strong, consistent term. Keep pushing in Mathematics.', true),
    buildCard('rc-2', STUDENTS[1], { Biology: 72, Chemistry: 81, Physics: 66, Mathematics: 74, English: 70 }, 1, 'Excellent results across the board. Well done, Ibrahim.', true),
    buildCard('rc-3', STUDENTS[2], { Biology: 65, Chemistry: 60, Physics: 58, Mathematics: 62, English: 68 }, 3, 'Good progress. More lab practice will lift your science grades.', false),
    buildCard('rc-4', STUDENTS[3], { Biology: 58, Chemistry: 54, Physics: 61, Mathematics: 49, English: 63 }, 4, 'Steady effort. Focus on Mathematics next term.', false),
  ]
}

export function buildNotifications(): AppNotification[] {
  return [
    { id: 'n-1', user_id: STUDENT.id, type: 'assignment', title: 'New assignment: Photosynthesis lab report', body: 'Mr. Kamara assigned a Biology task due tomorrow.', created_at: isoTimeOffset(-35), read: false },
    { id: 'n-2', user_id: STUDENT.id, type: 'deadline', title: 'Deadline approaching', body: 'Balancing chemical equations is due in 3 days.', created_at: isoTimeOffset(-190), read: false },
    { id: 'n-3', user_id: STUDENT.id, type: 'message', title: 'Message from Mr. Kamara', body: 'Remember to include a labelled diagram in your report.', created_at: isoTimeOffset(-320), read: false },
    { id: 'n-4', user_id: 'all', type: 'announcement', title: 'Mid term break', body: 'School closes for mid term on Friday. Submit pending work before then.', created_at: isoTimeOffset(-60 * 20), read: true },
    { id: 'n-5', user_id: STUDENT.id, type: 'grade', title: 'Grade posted', body: 'Cell structure flashcards scored 18/20. Feedback is ready.', created_at: isoTimeOffset(-60 * 12), read: false },
    { id: 'n-6', user_id: 'all', type: 'event', title: 'Science Fair next week', body: 'The Science Fair is on Wednesday in the main hall.', created_at: isoTimeOffset(-60 * 8), read: true },
    { id: 'n-8', user_id: TEACHER.id, type: 'submission', title: 'New submission', body: 'Ibrahim submitted Photosynthesis lab report.', created_at: isoTimeOffset(-40), read: false },
  ]
}

export const CLASS_GROUP_ID = 'conv-class-sss2'

export function buildConversations(): Conversation[] {
  return [
    { id: `conv-${TEACHER.id}-${STUDENT.id}`, kind: 'dm', participant_id: TEACHER.id, participant_name: TEACHER.name, participant_role: 'teacher', online: true },
    { id: `conv-${STUDENT.id}-user-student-2`, kind: 'dm', participant_id: 'user-student-2', participant_name: 'Ibrahim', participant_role: 'student', online: false },
    { id: CLASS_GROUP_ID, kind: 'group', participant_id: 'class-sss2', participant_name: 'SSS 2 Science', participant_role: 'teacher', online: true },
  ]
}

export function buildMessages(): ChatMessage[] {
  const teacherConv = `conv-${TEACHER.id}-${STUDENT.id}`
  const peerConv = `conv-${STUDENT.id}-user-student-2`
  return [
    { id: 'm-1', conversation_id: teacherConv, sender_id: TEACHER.id, sender_role: 'teacher', sender_name: TEACHER.name, body: 'Hi Mariama, how is the photosynthesis report coming along?', created_at: isoTimeOffset(-90) },
    { id: 'm-2', conversation_id: teacherConv, sender_id: STUDENT.id, sender_role: 'student', sender_name: STUDENT.name, body: 'Almost done sir! Just finishing the diagram.', created_at: isoTimeOffset(-84) },
    { id: 'm-3', conversation_id: teacherConv, sender_id: TEACHER.id, sender_role: 'teacher', sender_name: TEACHER.name, body: 'Great. Remember to label each part clearly.', created_at: isoTimeOffset(-80) },
    { id: 'm-4', conversation_id: peerConv, sender_id: 'user-student-2', sender_role: 'student', sender_name: 'Ibrahim', body: 'Did you finish the chemistry questions?', created_at: isoTimeOffset(-50) },
    { id: 'm-5', conversation_id: peerConv, sender_id: STUDENT.id, sender_role: 'student', sender_name: STUDENT.name, body: 'Working on them after Biology.', created_at: isoTimeOffset(-46) },
    { id: 'm-6', conversation_id: CLASS_GROUP_ID, sender_id: TEACHER.id, sender_role: 'teacher', sender_name: TEACHER.name, body: 'Lab coats tomorrow. We are finishing the starch test.', created_at: isoTimeOffset(-200) },
    { id: 'm-7', conversation_id: CLASS_GROUP_ID, sender_id: 'user-student-3', sender_role: 'student', sender_name: 'Fatmata', body: 'Yes sir, noted.', created_at: isoTimeOffset(-190) },
  ]
}

export function buildEvents(): SchoolEvent[] {
  return [
    { id: 'ev-1', title: 'Science Fair', date: isoDateOffset(6), start_time: '09:00', end_time: '14:00', location: 'Main Hall', description: 'Students present experiments and posters to staff and families.', organizer: 'Science Department', published: true },
    { id: 'ev-2', title: 'Sports Day', date: isoDateOffset(12), start_time: '08:00', end_time: '16:00', location: 'School Field', description: 'Track, field and house competitions.', organizer: 'PE Department', published: true },
    { id: 'ev-3', title: 'Parent Meeting', date: isoDateOffset(3), start_time: '16:00', end_time: '18:00', location: 'Library', description: 'First term progress meeting for SSS 2 families.', organizer: ADMIN.name, published: true },
    { id: 'ev-4', title: 'Cultural Day', date: isoDateOffset(20), start_time: '10:00', end_time: '15:00', location: 'Courtyard', description: 'Music, food and dress from across the region.', organizer: 'Student Council', published: true },
    { id: 'ev-5', title: 'Debate Competition', date: isoDateOffset(9), start_time: '13:00', end_time: '16:00', location: 'Room A1', description: 'Inter class debate on science and society.', organizer: TEACHER_2.name, published: true },
    { id: 'ev-6', title: 'School Trip', date: isoDateOffset(28), start_time: '07:30', end_time: '17:00', location: 'National Museum', description: 'Guided visit and worksheet for SSS 2.', organizer: TEACHER.name, published: false },
  ]
}

export function buildAnnouncements(): Announcement[] {
  return [
    { id: 'an-1', title: 'Mid term break', body: 'School closes for mid term on Friday. Submit pending work before then.', date: isoDateOffset(-1), priority: 'important', author: ADMIN.name, published: true },
    { id: 'an-2', title: 'Library hours', body: 'The library stays open until 17:30 this week for exam revision.', date: isoDateOffset(0), priority: 'normal', author: ADMIN.name, published: true },
    { id: 'an-3', title: 'Lab safety', body: 'Tie hair back and wear coats in every science practical.', date: isoDateOffset(-4), priority: 'normal', author: TEACHER.name, published: true },
  ]
}

export const GAMES: GameInfo[] = [
  { id: 'g-switch', title: 'G Switch', description: 'Flip gravity and keep running. A short break for focus.', category: 'Arcade', accent: 'var(--chart-1)' },
  { id: 'block-blast', title: 'Block Blast', description: 'Clear lines of blocks. Calm, quick rounds.', category: 'Puzzle', accent: 'var(--chart-5)' },
  { id: 'tanker', title: 'Tanker', description: 'Aim, tap, score. Reflexes only. Not on your report.', category: 'Action', accent: 'var(--chart-4)' },
  { id: 'tetris', title: 'Tetris', description: 'Stack falling shapes. One more round, then back to work.', category: 'Puzzle', accent: 'var(--chart-2)' },
  { id: 'puzzle', title: 'Puzzle', description: 'Match pairs of school icons. Memory, not marks.', category: 'Brain', accent: 'var(--chart-3)' },
]

export function buildGameScores(): GameScore[] {
  return GAMES.map((g, i) => ({
    game_id: g.id,
    high_score: [120, 80, 45, 200, 6][i] ?? 0,
    last_played: i < 2 ? isoTimeOffset(-60 * (i + 1) * 12) : undefined,
    favorite: g.id === 'puzzle' || g.id === 'block-blast',
  }))
}

export { NAME_BY_ID }
