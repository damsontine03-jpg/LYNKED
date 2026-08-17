import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BookOpen, GraduationCap, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IMAGES } from '@/lib/images'

const roles = [
  { icon: BookOpen, label: 'Students' },
  { icon: GraduationCap, label: 'Teachers' },
  { icon: Users, label: 'Parents' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-primary">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="hero-mesh absolute inset-0" />
        <div className="hero-grid absolute inset-0 opacity-60" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-28 pt-10 sm:gap-12 sm:px-6 sm:pb-32 sm:pt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:pb-36 lg:pt-20">
        <div className="hero-rise flex min-w-0 flex-col items-start gap-6 sm:gap-7">
          <h1 className="max-w-[16ch] text-[2.1rem] font-semibold leading-[1.08] tracking-tight text-white text-balance sm:text-5xl lg:text-[3.4rem]">
            Boost your grades, not your stress.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            One place for homework, grades, exams, and class chat. Built for
            Primary, JSS, and SSS, so students, teachers, and parents stay
            aligned.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="h-12 w-full bg-white px-7 text-primary hover:bg-white/92 sm:w-auto"
            >
              <Link href="/login?mode=signup">
                Get started
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
            >
              <a href="#features">See how it works</a>
            </Button>
          </div>
          <ul className="flex flex-wrap gap-2 pt-1">
            {roles.map((role) => (
              <li
                key={role.label}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-sm text-white/90"
              >
                <role.icon className="size-3.5 opacity-80" strokeWidth={1.75} />
                {role.label}
              </li>
            ))}
            <li className="inline-flex items-center rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-sm text-white/90">
              Class 1 to SSS 3
            </li>
          </ul>
        </div>

        <div className="hero-art relative mx-auto w-full max-w-lg lg:max-w-none">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-6 rounded-[2rem] bg-white/8 blur-0 sm:-inset-8 sm:rounded-[2.25rem]"
            />
            <div className="relative overflow-hidden rounded-[1.6rem] border border-white/20 bg-gradient-to-b from-white to-[#e8f4ec] shadow-[0_28px_80px_rgba(0,0,0,0.28)] sm:rounded-[1.85rem]">
              <div className="hero-float p-5 sm:p-8">
                <Image
                  src={IMAGES.flyingPencil}
                  alt="Students moving forward with books in hand"
                  width={640}
                  height={480}
                  priority
                  className="mx-auto h-auto w-full max-w-md object-contain"
                />
              </div>
              <div className="grid grid-cols-3 divide-x divide-primary/10 border-t border-primary/10 bg-white/80 text-center">
                <Stat value="Homework" label="Assigned and tracked" />
                <Stat value="Grades" label="Visible to parents" />
                <Stat value="Exams" label="Dates in one view" />
              </div>
            </div>

            <aside className="absolute left-3 top-6 hidden w-40 rounded-2xl border border-white/50 bg-white/95 p-3 shadow-[0_16px_40px_rgba(20,50,35,0.18)] sm:block lg:-left-4 lg:top-8 lg:w-44">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Due tomorrow
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">Biology lab report</p>
              <p className="text-xs text-muted-foreground">SSS 1 Science</p>
            </aside>
            <aside className="absolute right-3 bottom-20 hidden w-36 rounded-2xl border border-white/50 bg-white/95 p-3 shadow-[0_16px_40px_rgba(20,50,35,0.18)] sm:block lg:-right-3 lg:bottom-24 lg:w-40">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Linked
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">Parent view</p>
              <p className="text-xs text-muted-foreground">Child ID STU-A7K2M9</p>
            </aside>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2 py-3 sm:px-3 sm:py-4">
      <p className="text-xs font-semibold text-primary sm:text-sm">{value}</p>
      <p className="mt-0.5 text-[0.65rem] leading-snug text-muted-foreground sm:text-xs">
        {label}
      </p>
    </div>
  )
}
