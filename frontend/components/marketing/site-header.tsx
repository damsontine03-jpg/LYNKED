'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-transparent bg-white/80 backdrop-blur-md transition-all duration-300',
        scrolled && 'border-border/70 shadow-[0_8px_30px_rgba(30,80,50,0.08)]',
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-2 sm:gap-4 sm:px-6 sm:py-3">
        <Link href="/" className="min-w-0 shrink">
          <BrandLogo
            size="md"
            priority
            className="max-h-14 max-w-[8.5rem] sm:max-h-16 sm:max-w-[12rem] md:max-w-[14rem]"
          />
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <Link
            href="/about"
            className="nav-link hidden text-sm font-medium text-foreground/80 hover:text-foreground sm:inline"
          >
            About
          </Link>
          <Link
            href="/login"
            className="nav-link text-sm font-medium text-foreground/80 hover:text-foreground"
          >
            Login
          </Link>
          <Link
            href="/login?mode=signup"
            className={cn(buttonVariants(), 'uppercase')}
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  )
}
