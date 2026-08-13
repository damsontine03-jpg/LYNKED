import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { IMAGES } from '@/lib/images'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-primary">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob-soft absolute -left-16 top-8 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="blob-soft absolute -right-10 bottom-0 size-96 rounded-full bg-black/15 blur-3xl [animation-delay:1.4s]" />
      </div>
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 px-4 pb-20 pt-10 sm:gap-10 sm:px-6 sm:pb-28 sm:pt-16 md:grid-cols-2 md:pt-24">
        <div className="hero-rise flex flex-col items-start gap-5 sm:gap-6">
          <h1 className="max-w-3xl text-3xl font-bold uppercase leading-[1.1] tracking-tight text-white text-balance sm:text-5xl md:text-6xl">
            Boost your grades, not your stress.
          </h1>
          <p className="text-lg text-white/90 sm:text-xl">The Smart Homework Tracker.</p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              asChild
              size="lg"
              className="w-full bg-white text-primary uppercase hover:bg-white/90 sm:w-auto"
            >
              <Link href="/login?mode=signup">Start tracking free</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-white bg-transparent text-white uppercase hover:bg-white/10 hover:text-white sm:w-auto"
            >
              <a href="#features">Learn more</a>
            </Button>
          </div>
        </div>

        <div className="hero-art relative mx-auto w-full max-w-md">
          <div className="hero-float">
            <Image
              src={IMAGES.flyingPencil}
              alt="Students flying on a giant pencil with books in hand"
              width={640}
              height={480}
              priority
              className="h-auto w-full rounded-3xl bg-white object-contain p-4 shadow-[0_16px_50px_rgba(0,0,0,0.18)]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
