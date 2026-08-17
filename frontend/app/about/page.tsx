import type { Metadata } from 'next'
import Image from 'next/image'
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  Gamepad2,
  GraduationCap,
  Heart,
  Inbox,
  MessageCircle,
  Users,
} from 'lucide-react'
import { SiteFooter } from '@/components/marketing/site-footer'
import { SiteHeader } from '@/components/marketing/site-header'
import { Reveal } from '@/components/motion/reveal'
import { IMAGES } from '@/lib/images'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'LynkED is a school site for homework, grades, chat, timetable, and events.',
}

const audience = [
  {
    icon: GraduationCap,
    title: 'Students',
    body: 'See work, send files, check grades, and chat with teachers.',
  },
  {
    icon: BookOpen,
    title: 'Teachers',
    body: 'Post assignments, mark work, fill report cards, and message class.',
  },
  {
    icon: Heart,
    title: 'Parents',
    body: 'Follow your child’s assignments, grades, exams, and school dates.',
  },
  {
    icon: Users,
    title: 'Admins',
    body: 'Add people, classes, subjects, events, and school notices.',
  },
]

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
    title: 'Assignment grades',
    body: 'Teachers mark work and send comments to students.',
  },
  {
    icon: FileText,
    title: 'Report cards',
    body: 'Term results, remarks, and a published report for home.',
  },
  {
    icon: MessageCircle,
    title: 'Chat',
    body: 'Messages between students, teachers, and parents.',
  },
  {
    icon: CalendarDays,
    title: 'School Events',
    body: 'School dates, trips, and notices on one page.',
  },
  {
    icon: ClipboardList,
    title: 'TimeTable',
    body: 'Class times and exam papers, with date, time, and room.',
  },
  {
    icon: Gamepad2,
    title: 'Games',
    body: 'Short games for free time.',
  },
]

const team = [
  {
    name: 'Abdul Salim Gani',
    photo: IMAGES.abdul,
    role: 'Group mentor and software lead',
    intro:
      'Abdul Salim Gani is the group mentor and a software engineer who gives technical guidance and leadership throughout the project. He is a first class graduate of Cyprus West University and has been recognized as an outstanding international graduate. He currently serves as a Project and Software Lead at KNS, where he brings experience in software engineering, project development, and technical leadership. He reviews technical decisions, supports software design, and helps the team solve development challenges.',
    quote:
      'Great software is built by combining technology, teamwork, and a clear understanding of the people it serves.',
  },
  {
    name: 'John Conteh',
    photo: IMAGES.john,
    role: 'Group project lead, researcher, and presenter',
    intro:
      'John Conteh is the group project lead, researcher, and presenter. He is a student at Prince of Wales School, studying in SS2 Science. He coordinates the team, does product research, gathers requirements, helps shape the product, writes project notes, and presents the team’s work. He is interested in technology and engineering and wants to become an engineer. Outside school and technology, he enjoys playing basketball.',
    quote:
      'I believe technology can turn everyday challenges into opportunities to create something better.',
  },
  {
    name: 'Joshua Turay',
    photo: IMAGES.joshua,
    role: 'Project assistant and developer',
    intro:
      'Joshua Turay is a member of the development team and serves as the project assistant and developer. He is a student at Sierra Leone Grammar School. He helps build features, supports the interface, tests the site, reports issues, and works with the team to turn ideas into practical pages. He is interested in software development, technology, problem solving, and learning.',
    quote:
      'Building technology is a continuous learning process, and every project is an opportunity to grow.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#dceee3]">
      <SiteHeader className="bg-[#dceee3]/90" />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <div className="flex flex-col gap-12 sm:gap-16">
          <Reveal>
            <section className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col items-start gap-4 text-left">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  About us
                </p>
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-balance sm:text-3xl lg:text-4xl">
                  LynkED brings schoolwork into one place
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Linked Education is a school site for students, teachers, parents, and
                  admins. Teachers post work. Students send it back. Families see grades,
                  timetable, and school dates without chasing separate chats.
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
                  LynkED puts assignments, files, grades, chat, exams, and events on one
                  page for the school.
                </p>
              </article>
              <article className="rounded-2xl bg-primary p-5 text-left text-primary-foreground shadow-[0_8px_30px_rgba(30,80,50,0.08)] sm:p-7">
                <h2 className="text-lg font-bold tracking-tight sm:text-xl">What we want</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/90">
                  A simple school site that works on a phone, tablet, or computer. Each
                  person sees the pages they need, from class work to report cards.
                </p>
              </article>
            </section>
          </Reveal>

          <Reveal>
            <section className="flex flex-col gap-6 text-left">
              <div>
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Who it is for</h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Four roles, one school site.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {audience.map((item) => (
                  <article
                    key={item.title}
                    className="flex gap-3 rounded-2xl bg-white p-5 text-left shadow-[0_8px_30px_rgba(30,80,50,0.08)]"
                  >
                    <span className="mt-0.5 text-primary [&_svg]:size-6">
                      <item.icon strokeWidth={1.6} />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold tracking-wide">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section className="flex flex-col gap-6 text-left">
              <div>
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">What the site does</h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Tools for a normal school day.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                  Mentorship, project leadership, research, and development.
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
                Questions about LynkED can go to the team by email or phone.
              </p>
              <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Email
                  </dt>
                  <dd className="mt-1 font-medium">
                    <a href="mailto:lynked@info.com" className="hover:text-primary">
                      lynked@info.com
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Phone
                  </dt>
                  <dd className="mt-1 font-medium">
                    <a href="tel:+23299907475" className="hover:text-primary">
                      +23299907475
                    </a>
                    <span className="text-muted-foreground"> or </span>
                    <a href="tel:+23231903876" className="hover:text-primary">
                      +23231903876
                    </a>
                  </dd>
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
