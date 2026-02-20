/**
 * Simple in-memory rate limiter for API routes.
 *
 * Protects against accidental overuse of expensive APIs (Claude, Neonomics).
 * For personal use, in-memory is sufficient.
 * For multi-user production, replace with Supabase or Vercel KV.
 *
 * IMPORTANT: This Map is per-instance (per Vercel serverless function).
 * In a scaled-out deployment, use Redis/KV for shared state.
 */
const rateLimits = new Map<string, { count: number; resetAt: number }>()

/**
 * Checks whether a request is within the rate limit.
 *
 * @param key - Unique key for the rate limit bucket (e.g., "chat:user-uuid")
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds (e.g., 60 * 60 * 1000 for 1 hour)
 * @returns true if allowed, false if rate limit exceeded
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now()
  const entry = rateLimits.get(key)

  // No entry, or the window has expired — start a fresh counter
  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs })
    return true // Allowed
  }

  // Within the window — check if limit is reached
  if (entry.count >= maxRequests) {
    return false // Blocked
  }

  // Under the limit — increment
  entry.count++
  return true // Allowed
}

/**
 * Pre-defined rate limits for Aura's API routes.
 * Import these constants when calling checkRateLimit.
 */
export const RATE_LIMITS = {
  // Claude API chat — 60 requests per hour per user
  chat: { max: 60, windowMs: 60 * 60 * 1000 },
  // Document upload — 20 per hour per user
  documentUpload: { max: 20, windowMs: 60 * 60 * 1000 },
  // Document analysis (Claude) — 20 per hour per user
  documentAnalyze: { max: 20, windowMs: 60 * 60 * 1000 },
  // Bank sync (Neonomics) — 6 per hour per user (every ~10 min)
  bankSync: { max: 6, windowMs: 60 * 60 * 1000 },
} as const
