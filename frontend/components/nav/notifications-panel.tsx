'use client'

import { useEffect, useRef } from 'react'
import { CheckCheck, Inbox } from 'lucide-react'
import { LucideIcon } from '@/components/lucide-icon'
import { useAppStore } from '@/lib/app-store'
import { relativeTime } from '@/lib/date-utils'
import { NOTIFICATION_META } from '@/lib/ui-helpers'
import { cn } from '@/lib/utils'

export function NotificationsPanel({
  onClose,
  onOpenAll,
}: {
  onClose: () => void
  onOpenAll?: () => void
}) {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    unreadNotifications,
  } = useAppStore()
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click / Escape.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const target = e.target as Node
      if (ref.current && ref.current.contains(target)) return
      if ((e.target as HTMLElement).closest('[data-notifications-toggle]')) return
      onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Notifications"
      className="absolute left-3 right-3 top-full z-50 mt-2 origin-top overflow-hidden rounded-3xl border border-border bg-popover shadow-2xl duration-200 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 sm:left-auto sm:right-3 sm:w-[min(22rem,calc(100vw-1.5rem))]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadNotifications > 0 ? (
            <span className="rounded-full bg-primary px-1.5 text-xs font-semibold tabular-nums text-primary-foreground">
              {unreadNotifications}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          {onOpenAll ? (
            <button
              type="button"
              onClick={onOpenAll}
              className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              View all
            </button>
          ) : null}
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-3.5"
          >
            <CheckCheck />
            Mark all read
          </button>
        </div>
      </div>

      <div className="scroll-slim flex max-h-[24rem] flex-col overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
            <Inbox className="size-6" />
            You&apos;re all caught up.
          </div>
        ) : (
          notifications.map((n) => {
            const meta = NOTIFICATION_META[n.type]
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => markNotificationRead(n.id)}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/50',
                  !n.read && 'bg-primary/5',
                )}
              >
                <span
                  className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl [&_svg]:size-4"
                  style={{ backgroundColor: `${meta.tone}1f`, color: meta.tone }}
                >
                  <LucideIcon name={meta.icon} />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {n.title}
                    </span>
                    {!n.read ? (
                      <span
                        aria-hidden
                        className="size-2 shrink-0 rounded-full bg-primary"
                      />
                    ) : null}
                  </span>
                  <span className="text-xs leading-relaxed text-muted-foreground text-pretty">
                    {n.body}
                  </span>
                  <span className="mt-0.5 text-[0.7rem] uppercase tracking-wide text-muted-foreground/70">
                    {relativeTime(n.created_at)}
                  </span>
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
