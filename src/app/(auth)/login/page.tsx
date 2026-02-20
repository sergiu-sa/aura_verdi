'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// Note: 'use client' pages can't export metadata.
// Title is handled by layout.tsx metadata template.

export default function LoginPage() {
  const [state, action, isPending] = useActionState(signIn, null)

  return (
    <div className="animate-fade-in">
      {/* ── Aura wordmark ── */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-3 mb-6">
          {/* Minimal teal ring logo */}
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border border-aura-primary/60" />
            <div className="absolute inset-[3px] rounded-full border border-aura-primary/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-aura-primary text-lg leading-none">A</span>
            </div>
          </div>
          <span className="font-display text-3xl text-aura-text tracking-tight">Aura</span>
        </div>
        <h1 className="font-display text-2xl text-aura-text mb-1">Welcome back</h1>
        <p className="text-sm text-aura-text-secondary">Sign in to your financial guardian</p>
      </div>

      {/* ── Form card ── */}
      <div className="surface p-8">
        <form action={action} className="flex flex-col gap-5">
          {/* Email */}
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

          {/* Password */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={isPending}
            />
          </div>

          {/* Error message */}
          {state?.error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md bg-aura-danger-muted border border-aura-danger/30 px-4 py-3 text-sm text-aura-danger animate-fade-in"
            >
              <span className="mt-0.5">⚠</span>
              <span>{state.error}</span>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full mt-1 h-11 text-base"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <LoadingDots />
                Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </div>

      {/* ── Register link ── */}
      <p className="text-center text-sm text-aura-text-secondary mt-6">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="text-aura-primary hover:text-aura-primary-light transition-colors font-medium"
        >
          Create one
        </Link>
      </p>
    </div>
  )
}

/** Three-dot loading animation */
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
