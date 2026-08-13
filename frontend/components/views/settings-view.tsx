'use client'

import { Card } from '@/components/ui/card'
import type { User } from '@/lib/types'

export function SettingsView({ user }: { user: User }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          School details for this account.
        </p>
      </div>
      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-medium">School</h2>
        <p className="text-sm">Homework Tracker · {user.className}</p>
        <p className="text-xs text-muted-foreground">
          Roles, storage, and login keys will live here once they are connected.
        </p>
      </Card>
      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-medium">Signed in as</h2>
        <p className="text-sm">
          {user.name} ({user.email})
        </p>
      </Card>
    </div>
  )
}
