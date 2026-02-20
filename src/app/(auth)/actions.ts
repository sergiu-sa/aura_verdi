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
