'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [state, action, isPending] = useActionState(requestPasswordReset, null)

  return (
    <div className="animate-fade-in">
      {/* ── Aura wordmark ── */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border border-aura-primary/60" />
            <div className="absolute inset-[3px] rounded-full border border-aura-primary/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-aura-primary text-lg leading-none">A</span>
            </div>
          </div>
          <span className="font-display text-3xl text-aura-text tracking-tight">Aura</span>
        </div>
        <h1 className="font-display text-2xl text-aura-text mb-1">Reset your password</h1>
        <p className="text-sm text-aura-text-secondary">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {/* ── Success state ── */}
      {state?.message ? (
        <div className="surface p-8 text-center animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-aura-primary/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-aura-primary text-xl">✉</span>
          </div>
          <p className="text-sm text-aura-text-secondary leading-relaxed mb-6">
            {state.message}
          </p>
          <Link
            href="/login"
            className="text-aura-primary hover:text-aura-primary-light transition-colors font-medium text-sm"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          {/* ── Form card ── */}
          <div className="surface p-8">
            <form action={action} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  required
                  disabled={isPending}
                />
              </div>

              {state?.error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md bg-aura-danger-muted border border-aura-danger/30 px-4 py-3 text-sm text-aura-danger animate-fade-in"
                >
                  <span className="mt-0.5">⚠</span>
                  <span>{state.error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isPending}
                className="w-full mt-1 h-11 text-base"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <LoadingDots />
                    Sending…
                  </span>
                ) : (
                  'Send reset link'
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-aura-text-secondary mt-6">
            Remember your password?{' '}
            <Link
              href="/login"
              className="text-aura-primary hover:text-aura-primary-light transition-colors font-medium"
            >
              Sign in
            </Link>
          </p>
        </>
      )}
    </div>
  )
}

function LoadingDots() {
  return (
    <span className="flex gap-1 items-center" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-gentle"
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}
    </span>
  )
}
