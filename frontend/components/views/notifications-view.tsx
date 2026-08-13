'use client'

import { LucideIcon } from '@/components/lucide-icon'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAppStore } from '@/lib/app-store'
import { relativeTime } from '@/lib/date-utils'
import { NOTIFICATION_META } from '@/lib/ui-helpers'
import { cn } from '@/lib/utils'
import type { User } from '@/lib/types'

export function NotificationsView({ user: _user }: { user: User }) {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    unreadNotifications,
  } = useAppStore()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Assignments, grades, messages, events, and school notices.
          </p>
        </div>
        {unreadNotifications > 0 ? (
          <Button variant="secondary" size="sm" onClick={markAllNotificationsRead}>
            Mark all read
          </Button>
        ) : null}
      </div>
      <Card className="overflow-hidden">
        {notifications.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">You are all caught up.</p>
        ) : (
          notifications.map((n) => {
            const meta = NOTIFICATION_META[n.type]
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => markNotificationRead(n.id)}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-border/60 px-4 py-4 text-left last:border-0 hover:bg-muted/50',
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
                  <span className="flex items-start gap-2">
                    <span className="min-w-0 text-sm font-medium">{n.title}</span>
                    {!n.read ? (
                      <span className="size-2 rounded-full bg-primary" />
                    ) : null}
                  </span>
                  <span className="text-sm text-muted-foreground">{n.body}</span>
                  <span className="text-[0.7rem] uppercase tracking-wide text-muted-foreground/70">
                    {meta.label} · {relativeTime(n.created_at)}
                  </span>
                </span>
              </button>
            )
          })
        )}
      </Card>
    </div>
  )
}
