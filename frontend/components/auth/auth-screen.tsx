'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { MultiPick } from '@/components/ui/multi-pick'
import { CLASS_OPTIONS, SUBJECT_OPTIONS } from '@/lib/ui-helpers'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/app-store'
import type { Role, User } from '@/lib/types'

type Mode = 'login' | 'signup'
type Step = 'details' | 'code'

export function AuthScreen() {
  const { setSession } = useAppStore()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<Mode>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login',
  )
  const [step, setStep] = useState<Step>('details')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [className, setClassName] = useState('SSS 2')
  const [classNames, setClassNames] = useState<string[]>(['SSS 2'])
  const [subjects, setSubjects] = useState<string[]>([])
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [devCode, setDevCode] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  function switchMode(next: Mode) {
    setMode(next)
    setStep('details')
    setCode('')
    setError('')
    setDevCode('')
  }

  async function sendCode() {
    if (!email.trim()) {
      setError('Enter your email address.')
      return
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Enter your full name.')
      return
    }
    if (mode === 'signup' && role === 'teacher' && classNames.length === 0) {
      setError('Choose at least one class.')
      return
    }
    if (mode === 'signup' && role === 'teacher' && subjects.length === 0) {
      setError('Choose at least one subject.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await api<{ sent: boolean; devCode?: string }>(
        '/api/auth/request-otp',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            purpose: mode === 'signup' ? 'signup' : 'signin',
            name: name.trim(),
            role,
            className: role === 'teacher' ? classNames[0] : className,
            classNames: role === 'teacher' ? classNames : [className],
            subjects: role === 'teacher' ? subjects : [],
          }),
        },
      )
      setDevCode(result.devCode || '')
      setStep('code')
      setCooldown(45)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code.')
    } finally {
      setBusy(false)
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6 digit code from your email.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await api<{ token: string; user: User }>('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          purpose: mode === 'signup' ? 'signup' : 'signin',
        }),
      })
      setSession(result.user, result.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify the code.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-primary px-4 py-8 sm:py-10">
      <div className="hero-art w-full max-w-md rounded-3xl bg-white px-5 py-8 shadow-[0_16px_50px_rgba(0,0,0,0.18)] sm:px-10 sm:py-10">
        <div className="mb-8 flex flex-col items-center gap-4">
          <BrandLogo size="xl" priority />
          <h1 className="text-center text-xl font-bold uppercase tracking-wide sm:text-2xl">
            {step === 'code'
              ? 'Check your email'
              : mode === 'login'
                ? 'Welcome back'
                : 'Create account'}
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            {step === 'code'
              ? `Enter the 6 digit code sent to ${email}`
              : 'Sign in or sign up with an email code. No password needed.'}
          </p>
        </div>

        {step === 'details' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void sendCode()
            }}
            className="flex flex-col gap-5"
          >
            {mode === 'signup' ? (
              <>
                <Field label="Full name">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mariama Sesay"
                    autoComplete="name"
                  />
                </Field>
                <Field label="I am a">
                  <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">School admin</option>
                  </Select>
                </Field>
                {role === 'student' ? (
                  <Field label="Class">
                    <Select value={className} onChange={(e) => setClassName(e.target.value)}>
                      {CLASS_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}
                {role === 'teacher' ? (
                  <>
                    <MultiPick
                      label="Classes"
                      options={CLASS_OPTIONS}
                      selected={classNames}
                      onChange={setClassNames}
                      allowCustom
                      customPlaceholder="Type another class"
                    />
                    <MultiPick
                      label="Subjects"
                      options={SUBJECT_OPTIONS}
                      selected={subjects}
                      onChange={setSubjects}
                      allowCustom
                      customPlaceholder="Type another subject"
                    />
                  </>
                ) : null}
              </>
            ) : null}

            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                autoComplete="email"
                inputMode="email"
              />
            </Field>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" size="lg" className="mt-1 w-full uppercase" disabled={busy}>
              {busy ? 'Sending…' : 'Send code'}
            </Button>
            {mode === 'login' ? (
              <button
                type="button"
                className="text-sm text-primary"
                disabled={busy}
                onClick={() => {
                  if (!email.trim()) {
                    setError('Enter your email address.')
                    return
                  }
                  setError('')
                  setStep('code')
                }}
              >
                I already have a code
              </button>
            ) : null}
          </form>
        ) : (
          <form onSubmit={verifyCode} className="flex flex-col gap-5">
            <Field label="Email code">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="text-center text-2xl tracking-[0.4em]"
              />
            </Field>

            {devCode ? (
              <p className="rounded-xl bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
                Email is not configured yet. Dev code: <span className="font-semibold text-foreground">{devCode}</span>
              </p>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" size="lg" className="w-full uppercase" disabled={busy}>
              {busy ? 'Checking…' : mode === 'login' ? 'Log In' : 'Create account'}
            </Button>

            <button
              type="button"
              className="text-sm text-primary disabled:text-muted-foreground"
              disabled={busy || cooldown > 0}
              onClick={() => void sendCode()}
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
            <button
              type="button"
              className="text-sm text-muted-foreground"
              onClick={() => {
                setStep('details')
                setCode('')
                setError('')
              }}
            >
              Use a different email
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="font-semibold text-primary"
                onClick={() => switchMode('signup')}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="font-semibold text-primary"
                onClick={() => switchMode('login')}
              >
                Log in
              </button>
            </>
          )}
        </p>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link href="/" className="text-primary">
            Back home
          </Link>
        </p>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}
