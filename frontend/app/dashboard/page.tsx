'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { useAppStore } from '@/lib/app-store'

export default function DashboardPage() {
  const { currentUser, sessionReady } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    if (sessionReady && !currentUser) router.replace('/login')
  }, [currentUser, router, sessionReady])

  if (!sessionReady || !currentUser) {
    return <div className="min-h-screen bg-[#dceee3]" />
  }

  return <AppShell user={currentUser} />
}
