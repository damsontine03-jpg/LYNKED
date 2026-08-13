import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'

export function CtaFooter() {
  return (
    <footer className="border-t border-border">
      <section className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
        <div className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-primary px-6 py-14 text-center text-primary-foreground">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            See every assignment in one list
          </h2>
          <p className="max-w-md text-pretty text-primary-foreground/80">
            Open Homework Tracker to manage homework for students and teachers.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/dashboard">
              Open the app
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <Link href="/" className="flex items-center">
            <BrandLogo size="md" />
          </Link>
          <p className="text-xs text-muted-foreground">
            A demo project · Built for students and teachers
          </p>
        </div>
      </div>
    </footer>
  )
}
