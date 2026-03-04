'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// ── Input validation schemas ───────────────────────────────────────────────

const SignInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

const SignUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long'),
  displayName: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name is too long')
    .trim(),
})

// ── Action return type ─────────────────────────────────────────────────────

export type AuthActionState = {
  error?: string
  message?: string
} | null

// ── Sign In ────────────────────────────────────────────────────────────────

/**
 * Server Action: Sign in with email and password.
 * On success → redirect to /dashboard.
 * On failure → return { error: string }.
 *
 * Used with React 19's useActionState hook in the login page.
 */
export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  // 1. Validate input
  const parsed = SignInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  // 2. Attempt sign in
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // Return user-friendly messages — never expose raw Supabase error details
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Incorrect email or password. Please try again.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Please confirm your email address before signing in.' }
    }
    // Generic fallback
    return { error: 'Sign in failed. Please try again.' }
  }

  // 3. Redirect on success (redirect() throws, so no return needed)
  redirect('/dashboard')
}

// ── Sign Up ────────────────────────────────────────────────────────────────

/**
 * Server Action: Register a new account.
 * On immediate sign-in → redirect to /dashboard.
 * On email confirmation required → return { message: string }.
 * On failure → return { error: string }.
 */
export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  // 1. Validate input
  const parsed = SignUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  // 2. Attempt sign up
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Pass display name so the auto-create trigger can use it
      data: { display_name: parsed.data.displayName },
    },
  })

  if (error) {
    if (error.message.includes('User already registered')) {
      return { error: 'An account with this email already exists. Try signing in instead.' }
    }
    return { error: 'Registration failed. Please try again.' }
  }

  // 3a. Email confirmation required (Supabase default)
  // data.session is null when email confirmation is pending
  if (data.user && !data.session) {
    return {
      message: `Check your inbox at ${parsed.data.email} — we've sent a confirmation link.`,
    }
  }

  // 3b. Immediately signed in (email confirmation disabled in Supabase settings)
  redirect('/dashboard')
}

// ── Resend Confirmation Email ──────────────────────────────────────────────

/**
 * Server Action: Resend the signup confirmation email.
 * Always returns success to prevent email enumeration.
 */
export async function resendConfirmation(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = formData.get('email')
  if (!email || typeof email !== 'string') {
    return { error: 'Email is required.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })

  if (error) {
    console.error(`[AUTH] Resend confirmation error: ${error.message}`)
  }

  return { message: `Confirmation email sent to ${email}. Check your inbox.` }
}

// ── Request Password Reset ─────────────────────────────────────────────────

const ResetRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

/**
 * Server Action: Send a password reset email.
 * Always returns a success message (even if email doesn't exist — prevents enumeration).
 */
export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = ResetRequestSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/reset-password`,
  })

  if (error) {
    console.error(`[AUTH] Password reset error: ${error.message}`)
  }

  // Always show success — don't reveal whether email exists
  return {
    message: `If an account exists for ${parsed.data.email}, you'll receive a reset link shortly.`,
  }
}

// ── Update Password ───────────────────────────────────────────────────────

const UpdatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long'),
})

/**
 * Server Action: Set a new password after clicking the reset email link.
 * The user arrives at /reset-password with a valid Supabase session from the token.
 */
export async function updatePassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = UpdatePasswordSchema.safeParse({
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    if (error.message.includes('same_password')) {
      return { error: 'New password must be different from your current password.' }
    }
    return { error: 'Failed to update password. The reset link may have expired — try again.' }
  }

  redirect('/dashboard')
}

// ── Sign Out ───────────────────────────────────────────────────────────────

/**
 * Server Action: Sign out the current user.
 * Clears the Supabase session and redirects to /login.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
