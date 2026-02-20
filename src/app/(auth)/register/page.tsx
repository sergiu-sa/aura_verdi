'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const [state, action, isPending] = useActionState(signUp, null)

  // Email confirmation sent — show success message
  if (state?.message) {
    return (
      <div className="animate-fade-in text-center">
        <div className="surface p-10">
          {/* Animated checkmark ring */}
          <div className="flex justify-center mb-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-aura-safe animate-glow-teal" />
              <div className="absolute inset-0 flex items-center justify-center text-aura-safe text-2xl">
                ✓
              </div>
            </div>
          </div>
          <h2 className="font-display text-2xl text-aura-text mb-3">Check your inbox</h2>
          <p className="text-sm text-aura-text-secondary leading-relaxed">{state.message}</p>
          <p className="text-xs text-aura-text-dim mt-4">
            Once confirmed, you can{' '}
            <Link href="/login" className="text-aura-primary hover:underline">
              sign in here
            </Link>
            .
          </p>
        </div>
      </div>
    )
  }

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
        <h1 className="font-display text-2xl text-aura-text mb-1">Create your account</h1>
        <p className="text-sm text-aura-text-secondary">Your personal financial guardian awaits</p>
      </div>

      {/* ── Form card ── */}
      <div className="surface p-8">
        <form action={action} className="flex flex-col gap-5">
          {/* Display name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName">Your name</Label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              placeholder="Alex"
              autoComplete="name"
              autoFocus
              required
              disabled={isPending}
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={isPending}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">
              Password
              <span className="ml-1 text-xs text-aura-text-dim font-normal">(min. 8 characters)</span>
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={8}
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
                Creating account…
              </span>
            ) : (
              'Create account'
            )}
          </Button>
        </form>

        {/* Legal note */}
        <p className="text-xs text-aura-text-dim text-center mt-5 leading-relaxed">
          By creating an account you agree that Aura will store your data
          securely in the EU to provide financial guidance.
        </p>
      </div>

      {/* ── Sign in link ── */}
      <p className="text-center text-sm text-aura-text-secondary mt-6">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-aura-primary hover:text-aura-primary-light transition-colors font-medium"
        >
          Sign in
        </Link>
      </p>
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
