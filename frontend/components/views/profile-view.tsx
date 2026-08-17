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
          Your name, ID, classes, and role.
        </p>
      </div>
      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
          {user.name.charAt(0)}
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">{user.name}</h2>
          {user.publicId ? (
            <p className="font-mono text-sm font-semibold tracking-wide text-primary">
              {user.publicId}
            </p>
          ) : null}
          {user.role === 'student' ? (
            <p className="text-xs text-muted-foreground">
              Parents use this ID to link your account.
            </p>
          ) : null}
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
        <Field label="ID" value={user.publicId || 'Pending'} mono />
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
        {user.role === 'parent' ? (
          <>
            <Field label="Child" value={user.childName || 'Linked student'} />
            <Field label="Child student ID" value={user.childPublicId || 'None'} mono />
          </>
        ) : null}
      </Card>
    </div>
  )
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? 'font-mono tracking-wide' : 'capitalize'}`}>
        {value}
      </span>
    </div>
  )
}
