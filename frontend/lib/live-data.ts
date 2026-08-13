import type { Assignment, Homework, Submission } from './types'

export function homeworkToAssignment(h: Homework): Assignment {
  return {
    id: h.id,
    title: h.title,
    subject: h.subject,
    className: '',
    topic: h.subject,
    instructions: h.description ?? '',
    posted_at: h.created_at,
    due_date: h.due_date,
    max_marks: 20,
    teacher_id: h.teacher_id,
    teacher_name: h.assigned_by,
    status: 'published',
  }
}

export function homeworkToSubmission(h: Homework, studentName: string): Submission {
  const done = h.status === 'completed'
  return {
    id: `sub-${h.id}`,
    assignment_id: h.id,
    student_id: h.student_id,
    student_name: studentName,
    status: done ? 'submitted' : 'not_submitted',
    submitted_at: done ? h.created_at : undefined,
  }
}

export function mergeHomeworkIntoLiveData(
  assignments: Assignment[],
  submissions: Submission[],
  homework: Homework[],
  studentNameById: Record<string, string>,
) {
  const assignmentIds = new Set(assignments.map((a) => a.id))
  const extraAssignments = homework
    .filter((h) => !assignmentIds.has(h.id))
    .map(homeworkToAssignment)
  const subKeys = new Set(
    submissions.map((s) => `${s.assignment_id}:${s.student_id}`),
  )
  const extraSubs = homework
    .filter((h) => !subKeys.has(`${h.id}:${h.student_id}`))
    .map((h) =>
      homeworkToSubmission(h, studentNameById[h.student_id] || 'Student'),
    )
  return {
    assignments: [...assignments, ...extraAssignments],
    submissions: [...submissions, ...extraSubs],
  }
}
