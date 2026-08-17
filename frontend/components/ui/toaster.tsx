'use client'

import { useEffect, useState } from 'react'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { dismissToast, subscribeToasts, type ToastItem } from '@/lib/toast'
import { cn } from '@/lib/utils'

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => subscribeToasts(setToasts), [])

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[80] flex flex-col items-center gap-2 px-3 sm:items-end sm:px-4"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-card px-4 py-3 text-sm shadow-[0_12px_40px_rgba(30,80,50,0.16)]',
            'animate-in fade-in-0 slide-in-from-top-2',
            toast.tone === 'error'
              ? 'border-destructive/30 text-destructive'
              : 'border-border text-foreground',
          )}
          role="status"
        >
          {toast.tone === 'error' ? (
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
          ) : (
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          )}
          <p className="min-w-0 flex-1 leading-relaxed">{toast.message}</p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismissToast(toast.id)}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
