'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { User } from '@/lib/types'

export function ProfileView({ user }: { user: User }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your name, classes, subjects, and role.
        </p>
      </div>
      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
          {user.name.charAt(0)}
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">{user.name}</h2>
          <div className="flex flex-wrap gap-2">
            <Badge className="capitalize">{user.role}</Badge>
            {(user.classNames?.length ? user.classNames : [user.className])
              .filter(Boolean)
              .map((cls) => (
                <Badge key={cls} variant="secondary">
                  {cls}
                </Badge>
              ))}
            {(user.subjects?.length ? user.subjects : user.subject ? [user.subject] : []).map(
              (subject) => (
                <Badge key={subject} variant="outline">
                  {subject}
                </Badge>
              ),
            )}
          </div>
        </div>
      </Card>
      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Email" value={user.email} />
        <Field label="Phone" value={user.phone || 'None'} />
        <Field
          label="Classes"
          value={(user.classNames?.length ? user.classNames : [user.className])
            .filter(Boolean)
            .join(', ') || 'None'}
        />
        <Field
          label="Subjects"
          value={
            (user.subjects?.length ? user.subjects : user.subject ? [user.subject] : []).join(
              ', ',
            ) || 'None'
          }
        />
        <Field label="Role" value={user.role} />
      </Card>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium capitalize">{value}</span>
    </div>
  )
}
