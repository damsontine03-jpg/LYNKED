import { Check, GraduationCap, UserRound, Users } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const roles = [
  {
    icon: UserRound,
    label: 'For students',
    title: 'Remember every deadline',
    points: [
      'See pending and completed homework in one dashboard',
      'Know what is due next and what is overdue',
      'Mark assignments complete as you finish them',
    ],
  },
  {
    icon: GraduationCap,
    label: 'For teachers',
    title: 'Track class progress',
    points: [
      'Create and assign homework',
      'Edit or remove assignments any time',
      'See which work is done',
    ],
  },
  {
    icon: Users,
    label: 'For parents',
    title: 'Stay close to schoolwork',
    points: [
      'See your child\'s assignments, grades, and report cards',
      'Follow exams and school events',
      'Message teachers for your child\'s class',
    ],
  },
]

export function Roles() {
  return (
    <section id="roles" className="border-t border-border">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
        <div className="grid gap-4 md:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role.label}
              className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-8"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:size-6">
                <role.icon />
              </span>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-primary">
                  {role.label}
                </span>
                <h3 className="text-2xl font-semibold tracking-tight text-balance">
                  {role.title}
                </h3>
              </div>
              <ul className="flex flex-col gap-3">
                {role.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success [&_svg]:size-3.5">
                      <Check />
                    </span>
                    <span className="leading-relaxed text-muted-foreground">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">Try both views</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
