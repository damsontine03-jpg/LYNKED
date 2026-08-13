import Image from 'next/image'
import { Reveal } from '@/components/motion/reveal'
import { IMAGES } from '@/lib/images'

const scenes = [
  {
    src: IMAGES.homework,
    alt: 'A student writing homework at a desk',
    label: 'Keep up with homework',
  },
  {
    src: IMAGES.classroom,
    alt: 'A teacher and students in a bright classroom',
    label: 'Learn together in class',
  },
  {
    src: IMAGES.playground,
    alt: 'Children playing games outdoors',
    label: 'Play, then get back to work',
  },
  {
    src: IMAGES.zoo,
    alt: 'Students on a school trip to the zoo',
    label: 'Field trips and events',
  },
  {
    src: IMAGES.backToSchool,
    alt: 'A classroom door decorated for back to school',
    label: 'Welcome back to school',
  },
  {
    src: IMAGES.crosswalk,
    alt: 'A student waiting at a crosswalk on the way to school',
    label: 'Safe on the way to school',
  },
]

export function SchoolLife() {
  return (
    <section className="bg-white pb-20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6">
        <Reveal>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold uppercase tracking-tight">School life</h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Track assignments, exams, and events. There is also a games page.
            </p>
          </div>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {scenes.map((scene, index) => (
            <Reveal key={scene.src} delay={index * 70}>
              <figure className="group flex flex-col gap-3">
                <div className="overflow-hidden rounded-2xl bg-muted shadow-[0_12px_40px_rgba(30,80,50,0.1)]">
                  <Image
                    src={scene.src}
                    alt={scene.alt}
                    width={480}
                    height={360}
                    className="img-zoom aspect-[4/3] h-auto w-full object-cover"
                  />
                </div>
                <figcaption className="text-sm font-semibold uppercase tracking-wide">
                  {scene.label}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
