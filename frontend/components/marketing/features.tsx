import { BarChart3, Bell, LayoutDashboard } from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'

const features = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard overview',
    body: 'Record your homework and see it on your dashboard.',
  },
  {
    icon: Bell,
    title: 'Reminders',
    body: 'Get reminders when work is due.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    body: 'See your scores and progress on a chart.',
  },
]

export function Features() {
  return (
    <section id="features" className="relative z-10 -mt-14 pb-16 sm:-mt-20 sm:pb-20">
      <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 sm:grid-cols-3 sm:gap-5 sm:px-6">
        {features.map((feature, index) => (
          <Reveal key={feature.title} delay={index * 90}>
            <div className="group surface-card flex h-full flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_12px_40px_rgba(30,80,50,0.1)]">
              <span className="text-primary transition-transform duration-300 group-hover:scale-110 [&_svg]:size-8">
                <feature.icon strokeWidth={1.6} />
              </span>
              <h3 className="text-base font-bold uppercase tracking-wide">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
