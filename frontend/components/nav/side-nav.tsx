'use client'

import { BrandLogo } from '@/components/brand-logo'
import { LucideIcon } from '@/components/lucide-icon'
import { NAV_GROUPS, NAV_ITEMS, type AppView } from '@/lib/nav'
import { cn } from '@/lib/utils'
import type { User } from '@/lib/types'

export function SideNav({
  user,
  activeView,
  onNavigate,
}: {
  user: User
  activeView: AppView
  onNavigate: (view: AppView) => void
}) {
  const items = NAV_ITEMS.filter((i) => i.roles.includes(user.role))

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <button
        type="button"
        onClick={() => onNavigate('overview')}
        className="flex flex-col items-start gap-1 px-4 py-5 text-left"
        aria-label="LynkED home"
      >
        <BrandLogo size="lg" className="h-16 sm:h-[4.5rem]" />
        <span className="text-[0.7rem] text-muted-foreground">{user.className}</span>
      </button>

      <nav className="scroll-slim flex flex-1 flex-col gap-4 overflow-y-auto px-3 pb-6">
        {NAV_GROUPS.map((group) => {
          const groupItems = items.filter((i) => i.group === group.id)
          if (groupItems.length === 0) return null
          return (
            <div key={group.id} className="flex flex-col gap-1">
              <p className="px-3 pb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              {groupItems.map((item) => {
                const active = activeView === item.view
                return (
                  <button
                    key={`${item.view}-${item.label}`}
                    type="button"
                    onClick={() => onNavigate(item.view)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium transition-all [&_svg]:size-4',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <LucideIcon name={item.icon} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
