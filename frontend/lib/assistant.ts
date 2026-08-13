import type { ChatMessage, Conversation } from './types'

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

export function isGreeting(text: string) {
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return /^(hi|hello|hey)(\s|$)/.test(normalized)
}

export function assistantGreeting(name: string) {
  const first = name.trim().split(/\s+/)[0] || 'there'
  return `Hello, ${first}! I am your assistant. How can I help you today?`
}

export function assistantReply(text: string, name: string) {
  if (isGreeting(text)) return assistantGreeting(name)
  return `Hello, ${name.trim().split(/\s+/)[0] || 'there'}! I am your assistant. How can I help you today?`
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
