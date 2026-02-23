/**
 * Unsubscribe Token System
 *
 * HMAC-signed tokens for one-click email unsubscribe links.
 * These links work without the user being logged in (GDPR requirement).
 *
 * Token rotates monthly — old unsubscribe links expire after ~30 days.
 */

import { createHmac } from 'crypto'

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-dev-secret'

export function createUnsubscribeToken(userId: string): string {
  // Token rotates monthly — old unsubscribe links expire after ~30 days
  const period = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 30))
  const payload = `unsub:${userId}:${period}`
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 16)
  return Buffer.from(`${userId}:${sig}`).toString('base64url')
}

export function verifyUnsubscribeToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const [userId, sig] = decoded.split(':')
    if (!userId || !sig) return null

    const period = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 30))
    const expected = createHmac('sha256', SECRET)
      .update(`unsub:${userId}:${period}`)
      .digest('hex')
      .slice(0, 16)

    return sig === expected ? userId : null
  } catch {
    return null
  }
}
