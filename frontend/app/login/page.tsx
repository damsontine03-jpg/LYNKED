'use client'

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthScreen } from '@/components/auth/auth-screen'
import { useAppStore } from '@/lib/app-store'

function LoginGate() {
  const { currentUser, sessionReady } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    if (sessionReady && currentUser) router.replace('/dashboard')
  }, [currentUser, router, sessionReady])

  if (!sessionReady || currentUser) {
    return <div className="min-h-screen bg-primary" />
  }

  return <AuthScreen />
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-primary" />}>
      <LoginGate />
    </Suspense>
  )
}
