'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, LogOut, Settings } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { LucideIcon } from '@/components/lucide-icon'
import { NotificationsPanel } from '@/components/nav/notifications-panel'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/app-store'
import { NAV_ITEMS, type AppView } from '@/lib/nav'
import { cn } from '@/lib/utils'
import type { User } from '@/lib/types'

export function TopNav({
  user,
  activeView,
  onNavigate,
}: {
  user: User
  activeView: AppView
  onNavigate: (view: AppView) => void
}) {
  const { logout, unreadNotifications } = useAppStore()
  const router = useRouter()
  const [notifOpen, setNotifOpen] = useState(false)
  const initial = user.name.charAt(0).toUpperCase()
  const items = NAV_ITEMS.filter(
    (i) =>
      i.roles.includes(user.role) &&
      i.view !== 'notifications' &&
      i.view !== 'profile' &&
      i.view !== 'settings',
  )
  const compact = items.length >= 8

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('overview')}
          className="flex min-w-0 shrink items-center"
          aria-label="LynkED home"
        >
          <BrandLogo
            size="md"
            className="max-h-10 max-w-[6.5rem] sm:max-h-12 sm:max-w-[10rem]"
          />
        </button>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setNotifOpen((o) => !o)}
            aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ''}`}
            aria-expanded={notifOpen}
            data-notifications-toggle
            className={cn(
              'relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:size-10 [&_svg]:size-5',
              (notifOpen || activeView === 'notifications') && 'text-foreground',
            )}
          >
            <Bell />
            {unreadNotifications > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-semibold leading-4 text-primary-foreground">
                {unreadNotifications}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-2"
            aria-label="Profile"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:scale-105">
              {initial}
            </span>
          </button>

          {user.role === 'admin' ? (
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              aria-label="Settings"
              aria-current={activeView === 'settings' ? 'page' : undefined}
              className={cn(
                'flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:size-10 [&_svg]:size-5',
                activeView === 'settings' && 'text-foreground',
              )}
            >
              <Settings />
            </button>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            className="px-2 sm:px-4"
            onClick={() => {
              logout()
              router.push('/')
            }}
          >
            <LogOut />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </div>

      <nav className="border-t border-border/70 bg-white/80">
        <div
          className={cn(
            'mx-auto flex w-full max-w-7xl flex-wrap items-center px-3 py-2 sm:px-6',
            compact ? 'gap-1 sm:gap-1.5' : 'gap-1.5',
          )}
        >
          {items.map((item) => {
            const active = activeView === item.view
            return (
              <button
                key={`${item.view}-${item.label}`}
                type="button"
                onClick={() => onNavigate(item.view)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center rounded-full font-medium transition-all duration-300',
                  compact
                    ? 'gap-1 px-2 py-1.5 text-[0.7rem] sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm [&_svg]:size-3.5 sm:[&_svg]:size-4'
                    : 'gap-1 px-2.5 py-1.5 text-xs sm:gap-1.5 sm:px-3 sm:text-sm [&_svg]:size-3.5 sm:[&_svg]:size-4',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/70 hover:bg-muted hover:text-foreground',
                )}
              >
                <LucideIcon name={item.icon} />
                {item.shortLabel ? (
                  <>
                    <span className="whitespace-nowrap sm:hidden">{item.shortLabel}</span>
                    <span className="hidden whitespace-nowrap sm:inline">{item.label}</span>
                  </>
                ) : (
                  <span className="whitespace-nowrap">{item.label}</span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {notifOpen ? (
        <NotificationsPanel
          onClose={() => setNotifOpen(false)}
          onOpenAll={() => {
            setNotifOpen(false)
            onNavigate('notifications')
          }}
        />
      ) : null}
    </header>
  )
}
