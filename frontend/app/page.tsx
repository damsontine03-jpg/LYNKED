import type { Metadata } from 'next'
import { Features } from '@/components/marketing/features'
import { Hero } from '@/components/marketing/hero'
import { SchoolLife } from '@/components/marketing/school-life'
import { SiteFooter } from '@/components/marketing/site-footer'
import { SiteHeader } from '@/components/marketing/site-header'

export const metadata: Metadata = {
  title: 'The Smart Homework Tracker',
  description: 'Boost your grades, not your stress.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <SchoolLife />
      </main>
      <SiteFooter />
    </div>
  )
}
