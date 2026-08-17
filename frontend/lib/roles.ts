import type { Role, User } from './types'

export function viewerStudentId(user: User) {
  return user.role === 'parent' ? user.childId || '' : user.id
}

export function canSubmitAssignments(role: Role) {
  return role === 'student'
}

export function canCreateAssignments(role: Role) {
  return role === 'teacher' || role === 'admin'
}

export function isParent(role: Role) {
  return role === 'parent'
}
