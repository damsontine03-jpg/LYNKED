'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, MessageCircle, Minus, SendHorizontal, X } from 'lucide-react'
import { ASSISTANT_CONV_ID } from '@/lib/assistant'
import { useAppStore } from '@/lib/app-store'
import { clockTime, relativeTime } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import type { User } from '@/lib/types'

export function FloatingChat({ user }: { user: User }) {
  const {
    conversations,
    messagesFor,
    sendMessage,
    markConversationRead,
    endAssistantChat,
    totalUnreadMessages,
  } = useAppStore()

  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(ASSISTANT_CONV_ID)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!activeId && conversations[0]) setActiveId(conversations[0].id)
  }, [activeId, conversations])

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  )
  const messages = activeId ? messagesFor(activeId) : []

  useEffect(() => {
    if (open && activeId) markConversationRead(activeId)
  }, [open, activeId, messages.length, markConversationRead])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length, activeId, open])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (panelRef.current?.contains(target)) return
      if (launcherRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  function openConversation(id: string) {
    setActiveId(id)
    markConversationRead(id)
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!activeId || !draft.trim()) return
    sendMessage(activeId, draft)
    setDraft('')
  }

  function minimizeChat() {
    setOpen(false)
  }

  function closeChat() {
    endAssistantChat()
    setDraft('')
    setActiveId(ASSISTANT_CONV_ID)
    setOpen(false)
  }

  const showList = !activeConversation
  const showBack = conversations.length > 1 && Boolean(activeConversation)

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={open ? 'Chat is open' : 'Open chat'}
        className={cn(
          'fixed z-50 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 sm:size-14 [&_svg]:size-5 sm:[&_svg]:size-6',
          'bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]',
          open && 'max-sm:hidden',
        )}
      >
        <MessageCircle />
        {!open && totalUnreadMessages > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold leading-5 text-destructive-foreground">
            {totalUnreadMessages}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
        <button
          type="button"
          aria-label="Minimize chat"
          className="fixed inset-0 z-40 bg-black/20 sm:bg-black/10"
          onClick={minimizeChat}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Messages"
          aria-modal="true"
          className={cn(
            'fixed z-50 flex flex-col overflow-hidden border border-border bg-popover shadow-2xl',
            'inset-[max(0.5rem,env(safe-area-inset-top))_max(0.5rem,env(safe-area-inset-right))_max(0.5rem,env(safe-area-inset-bottom))_max(0.5rem,env(safe-area-inset-left))] rounded-2xl',
            'sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[min(36rem,calc(100dvh-8rem))] sm:w-[min(24rem,calc(100vw-2.5rem))] sm:rounded-3xl',
            'md:w-[26rem]',
          )}
          style={{ animation: 'chat-pop 0.24s cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          <div className="flex items-center gap-2 border-b border-border bg-gradient-to-r from-primary/15 to-transparent px-3 py-3 sm:gap-3 sm:px-4">
            {showBack ? (
              <button
                type="button"
                onClick={() => setActiveId(null)}
                aria-label="Back to conversations"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-4"
              >
                <ChevronLeft />
              </button>
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold sm:text-base">
                {activeConversation
                  ? activeConversation.participant_name
                  : 'Messages'}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {activeConversation ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={cn(
                        'size-1.5 rounded-full',
                        activeConversation.online
                          ? 'bg-success'
                          : 'bg-muted-foreground/50',
                      )}
                    />
                    {activeConversation.online ? 'Online' : 'Offline'}
                    {' · '}
                    {activeConversation.participant_role}
                  </span>
                ) : (
                  `${conversations.length} conversation${conversations.length === 1 ? '' : 's'}`
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={minimizeChat}
              aria-label="Minimize chat"
              title="Minimize"
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-4"
            >
              <Minus />
            </button>
            <button
              type="button"
              onClick={closeChat}
              aria-label="Close chat"
              title="Close"
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-4"
            >
              <X />
            </button>
          </div>

          {showList ? (
            <ConversationList
              conversations={conversations}
              onSelect={openConversation}
            />
          ) : (
            <>
              <div
                ref={scrollRef}
                className="scroll-slim flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4"
              >
                {messages.length === 0 ? (
                  <p className="m-auto px-4 text-center text-sm text-muted-foreground">
                    No messages yet. Say hello!
                  </p>
                ) : (
                  messages.map((m) => {
                    const mine = m.sender_id === user.id
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          'flex max-w-[85%] flex-col gap-1 duration-200 animate-in fade-in-0 slide-in-from-bottom-1 sm:max-w-[80%]',
                          mine ? 'items-end self-end' : 'items-start self-start',
                        )}
                      >
                        <div
                          className={cn(
                            'rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words',
                            mine
                              ? 'rounded-br-md bg-primary text-primary-foreground'
                              : 'rounded-bl-md bg-muted text-foreground',
                          )}
                        >
                          {m.body}
                        </div>
                        <span className="px-1 text-[0.65rem] text-muted-foreground">
                          {mine ? 'You' : m.sender_name || m.sender_role} · {clockTime(m.created_at)}
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
                  aria-label="Message"
                  className="h-11 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  aria-label="Send message"
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 [&_svg]:size-5"
                >
                  <SendHorizontal />
                </button>
              </form>
            </>
          )}
        </div>
        </>
      ) : null}
    </>
  )
}

function ConversationList({
  conversations,
  onSelect,
}: {
  conversations: ReturnType<typeof useAppStore>['conversations']
  onSelect: (id: string) => void
}) {
  if (conversations.length === 0) {
    return (
      <p className="m-auto px-6 py-10 text-center text-sm text-muted-foreground">
        No chats yet. Your teacher conversation will appear here once a teacher account exists.
      </p>
    )
  }

  return (
    <div className="scroll-slim flex min-h-0 flex-1 flex-col overflow-y-auto">
      {conversations.map((c) => {
        const initial = c.participant_name.charAt(0).toUpperCase()
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className="flex items-center gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/50"
          >
            <span className="relative">
              <span className="flex size-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                {initial}
              </span>
              {c.online ? (
                <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-popover bg-success" />
              ) : null}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">
                  {c.participant_name}
                </span>
                {c.lastMessage ? (
                  <span className="shrink-0 text-[0.65rem] text-muted-foreground">
                    {relativeTime(c.lastMessage.created_at)}
                  </span>
                ) : null}
              </span>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-muted-foreground">
                  {c.lastMessage?.body ?? 'Start the conversation'}
                </span>
                {c.unread > 0 ? (
                  <span className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-semibold leading-5 text-primary-foreground">
                    {c.unread}
                  </span>
                ) : null}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
