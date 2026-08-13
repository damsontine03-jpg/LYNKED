'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, SendHorizontal } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ASSISTANT_CONV_ID } from '@/lib/assistant'
import { useAppStore } from '@/lib/app-store'
import { clockTime, relativeTime } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import type { User } from '@/lib/types'

export function ChatView({ user }: { user: User }) {
  const {
    conversations,
    messagesFor,
    sendMessage,
    markConversationRead,
  } = useAppStore()
  const [activeId, setActiveId] = useState<string | null>(ASSISTANT_CONV_ID)
  const [mobileThread, setMobileThread] = useState(false)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const active = conversations.find((c) => c.id === activeId) ?? null
  const messages = activeId ? messagesFor(activeId) : []

  useEffect(() => {
    if (!activeId && conversations[0]) setActiveId(conversations[0].id)
  }, [activeId, conversations])

  useEffect(() => {
    if (activeId) markConversationRead(activeId)
  }, [activeId, messages.length, markConversationRead])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length, activeId])

  const grouped = useMemo(() => conversations, [conversations])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!activeId || !draft.trim()) return
    sendMessage(activeId, draft)
    setDraft('')
  }

  function selectConversation(id: string) {
    setActiveId(id)
    setMobileThread(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">Chat</h1>
        <p className="text-sm text-muted-foreground">
          Teachers, classmates, and your class group. School chat only.
        </p>
      </div>
      <Card className="grid min-h-[min(32rem,calc(100dvh-14rem))] min-w-0 overflow-hidden lg:grid-cols-[18rem_1fr]">
        <div
          className={cn(
            'scroll-slim border-b border-border lg:block lg:border-b-0 lg:border-r',
            mobileThread ? 'hidden lg:block' : 'block',
          )}
        >
          {grouped.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No chats yet. Your teacher conversation will appear here once a teacher account exists.
            </p>
          ) : (
            grouped.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectConversation(c.id)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50',
                  activeId === c.id && 'bg-primary/10',
                )}
              >
                <span className="relative">
                  <span className="flex size-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                    {c.participant_name.charAt(0)}
                  </span>
                  {c.online ? (
                    <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-card bg-success" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{c.participant_name}</span>
                    {c.lastMessage ? (
                      <span className="text-[0.65rem] text-muted-foreground">
                        {relativeTime(c.lastMessage.created_at)}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-muted-foreground">
                      {c.kind === 'group' ? 'Class group · ' : ''}
                      {c.lastMessage?.body ?? 'No messages yet'}
                    </span>
                    {c.unread > 0 ? (
                      <span className="flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-semibold leading-5 text-primary-foreground">
                        {c.unread}
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
        <div
          className={cn(
            'min-h-0 flex-col',
            mobileThread ? 'flex min-h-[min(28rem,calc(100dvh-14rem))]' : 'hidden lg:flex',
          )}
        >
          {active ? (
            <>
              <div className="flex items-center gap-2 border-b border-border px-3 py-3 sm:px-4">
                <button
                  type="button"
                  onClick={() => setMobileThread(false)}
                  aria-label="Back to conversations"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted lg:hidden [&_svg]:size-4"
                >
                  <ChevronLeft />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{active.participant_name}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {active.kind === 'group' ? 'Class group' : active.participant_role}
                  </p>
                </div>
              </div>
              <div ref={scrollRef} className="scroll-slim flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4">
                {messages.length === 0 ? (
                  <p className="m-auto text-sm text-muted-foreground">No messages yet.</p>
                ) : (
                  messages.map((m) => {
                    const mine = m.sender_id === user.id
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          'flex max-w-[85%] flex-col gap-1 sm:max-w-[80%]',
                          mine ? 'items-end self-end' : 'items-start self-start',
                        )}
                      >
                        <div
                          className={cn(
                            'rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words',
                            mine
                              ? 'rounded-br-md bg-primary text-primary-foreground'
                              : 'rounded-bl-md bg-muted',
                          )}
                        >
                          {m.body}
                        </div>
                        <span className="px-1 text-[0.65rem] text-muted-foreground">
                          {mine ? 'You' : m.sender_name} · {clockTime(m.created_at)}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message"
                  className="h-11 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40 [&_svg]:size-5"
                  aria-label="Send"
                >
                  <SendHorizontal />
                </button>
              </form>
            </>
          ) : (
            <p className="m-auto px-4 text-center text-sm text-muted-foreground">
              Select a conversation
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
