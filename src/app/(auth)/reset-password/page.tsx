'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import Link from 'next/link'
import { updatePassword } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const [state, action, isPending] = useActionState(updatePassword, null)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mismatch, setMismatch] = useState(false)

  const handleSubmit = (formData: FormData) => {
    const password = formData.get('password') as string
    if (password !== confirmPassword) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    action(formData)
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
        <h1 className="font-display text-2xl text-aura-text mb-1">Set new password</h1>
        <p className="text-sm text-aura-text-secondary">
          Choose a strong password for your account.
        </p>
      </div>

      {/* ── Form card ── */}
      <div className="surface p-8">
        <form action={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              autoFocus
              required
              minLength={8}
              disabled={isPending}
            />
            <p className="text-xs text-aura-text-dim">Minimum 8 characters</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={isPending}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setMismatch(false)
              }}
            />
          </div>

          {mismatch && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md bg-aura-danger-muted border border-aura-danger/30 px-4 py-3 text-sm text-aura-danger animate-fade-in"
            >
              <span className="mt-0.5">⚠</span>
              <span>Passwords don&apos;t match.</span>
            </div>
          )}

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
                Updating…
              </span>
            ) : (
              'Update password'
            )}
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-aura-text-secondary mt-6">
        <Link
          href="/login"
          className="text-aura-primary hover:text-aura-primary-light transition-colors font-medium"
        >
          Back to sign in
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
