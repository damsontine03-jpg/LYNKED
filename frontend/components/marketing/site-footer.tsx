import Link from 'next/link'
import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <Reveal>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
          <h2 className="max-w-2xl text-2xl font-bold uppercase tracking-tight text-balance sm:text-3xl">
            Keep homework in one place.
          </h2>
          <p className="max-w-xl text-sm text-white/85">
            Schoolwork should be easy to find, finish, and share.
          </p>
          <div>
            <Button
              asChild
              size="lg"
              className="bg-white text-primary uppercase hover:bg-white/90"
            >
              <Link href="/login?mode=signup">Start tracking free</Link>
            </Button>
          </div>
          <p className="border-t border-white/20 pt-6 text-xs text-white/70">
            © 2026 School Learning Platform. All rights reserved.
          </p>
        </div>
      </Reveal>
    </footer>
  )
}
