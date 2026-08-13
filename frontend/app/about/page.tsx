import type { Metadata } from 'next'
import Image from 'next/image'
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Gamepad2,
  GraduationCap,
  Inbox,
  MessageCircle,
} from 'lucide-react'
import { SiteFooter } from '@/components/marketing/site-footer'
import { SiteHeader } from '@/components/marketing/site-header'
import { Reveal } from '@/components/motion/reveal'
import { IMAGES } from '@/lib/images'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'A school site for homework, chat, exams, events, and games.',
}

const features = [
  {
    icon: BookOpen,
    title: 'Assignments',
    body: 'Teachers post work, files, and due dates in one place.',
  },
  {
    icon: Inbox,
    title: 'Submissions',
    body: 'Students download tasks and send completed files back.',
  },
  {
    icon: GraduationCap,
    title: 'Grades',
    body: 'Teachers mark work and send comments to students.',
  },
  {
    icon: MessageCircle,
    title: 'Chat',
    body: 'Class chat between students and teachers.',
  },
  {
    icon: CalendarDays,
    title: 'Events',
    body: 'School dates, trips, and notices on one page.',
  },
  {
    icon: ClipboardList,
    title: 'Exams',
    body: 'Subject, date, time, and room for each paper.',
  },
  {
    icon: Gamepad2,
    title: 'Games',
    body: 'Short games for free time. Scores never affect grades.',
  },
]

const team = [
  {
    name: 'Abdul Salim Gani',
    photo: IMAGES.abdul,
    role: 'Mentor and software lead',
    intro:
      'Software engineer and Project and Software Lead at KNS. First class graduate of Cyprus West University. He advises the team on how to build the site.',
    quote: 'Good software comes from knowing who will use it, then building with the team.',
  },
  {
    name: 'John Conteh',
    photo: IMAGES.john,
    role: 'Project lead',
    intro:
      'SS2 Science student at Prince of Wales School. He coordinates the team, does research, and presents the work. He wants to become an engineer and plays basketball.',
    quote: 'I like building things that help my school get work done.',
  },
  {
    name: 'Joshua Turay',
    photo: IMAGES.joshua,
    role: 'Developer',
    intro:
      'Student at Sierra Leone Grammar School. He writes code, tests features, and helps turn ideas into pages that work.',
    quote: 'Each project teaches me something new.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#dceee3]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <div className="flex flex-col gap-12 sm:gap-16">
          <Reveal>
            <section className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col gap-4 text-left">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  About us
                </p>
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-balance sm:text-3xl lg:text-4xl">
                  Help for students, teachers, and schools
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  We are students making a school website for homework, chat, exams,
                  events, and games. Teachers post work. Students send it back. The school
                  shares notices and dates in one place.
                </p>
              </div>
              <div className="group overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(30,80,50,0.12)] sm:rounded-3xl">
                <Image
                  src={IMAGES.classroom}
                  alt="Teacher and students working together in a classroom"
                  width={720}
                  height={540}
                  className="img-zoom aspect-[4/3] h-auto w-full object-cover"
                  priority
                />
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl bg-white p-5 text-left shadow-[0_8px_30px_rgba(30,80,50,0.08)] sm:p-7">
                <h2 className="text-lg font-bold tracking-tight sm:text-xl">Why we built this</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Homework still moves through messaging apps, paper notices, and separate
                  chats. Work gets lost, and teachers cannot see who has submitted.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  This site puts assignments, files, grades, chat, exams, and events on one
                  page for the school.
                </p>
              </article>
              <article className="rounded-2xl bg-primary p-5 text-left text-primary-foreground shadow-[0_8px_30px_rgba(30,80,50,0.08)] sm:p-7">
                <h2 className="text-lg font-bold tracking-tight sm:text-xl">What we want</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/90">
                  A simple school site that works on a phone, tablet, or computer. Students,
                  teachers, and admins each see the pages they need.
                </p>
              </article>
            </section>
          </Reveal>

          <Reveal>
            <section className="flex flex-col gap-6 text-left">
              <div>
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">What the site does</h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Seven tools for a normal school day.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => (
                  <article
                    key={feature.title}
                    className="flex flex-col gap-2 rounded-2xl bg-white p-5 text-left shadow-[0_8px_30px_rgba(30,80,50,0.08)]"
                  >
                    <span className="text-primary [&_svg]:size-6">
                      <feature.icon strokeWidth={1.6} />
                    </span>
                    <h3 className="text-sm font-bold tracking-wide">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.body}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section className="flex flex-col gap-6 text-left">
              <div>
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">The team</h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Three people: a mentor, a project lead, and a developer.
                </p>
              </div>
              <div className="flex flex-col gap-4">
                {team.map((member) => (
                  <article
                    key={member.name}
                    className="flex gap-4 rounded-2xl bg-white p-4 text-left shadow-[0_8px_30px_rgba(30,80,50,0.08)] sm:gap-6 sm:p-6"
                  >
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-[#dceee3] sm:size-32">
                      <Image
                        src={member.photo}
                        alt={member.name}
                        fill
                        className="object-cover object-top"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold tracking-tight sm:text-lg">
                        {member.name}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-primary">{member.role}</p>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {member.intro}
                      </p>
                      <blockquote className="mt-4 border-l-4 border-primary pl-3 text-sm italic leading-relaxed">
                        “{member.quote}”
                      </blockquote>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section className="rounded-2xl bg-white p-5 text-left shadow-[0_8px_30px_rgba(30,80,50,0.08)] sm:p-7">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Contact</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Questions about the site can go to the project team.
              </p>
              <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Project lead
                  </dt>
                  <dd className="mt-1 font-medium">John Conteh</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Mentor
                  </dt>
                  <dd className="mt-1 font-medium">Abdul Salim Gani</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Developer
                  </dt>
                  <dd className="mt-1 font-medium">Joshua Turay</dd>
                </div>
              </dl>
            </section>
          </Reveal>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
