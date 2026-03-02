/**
 * Unsubscribe Token System
 *
 * HMAC-signed tokens for one-click email unsubscribe links.
 * These links work without the user being logged in (GDPR requirement).
 *
 * Token rotates monthly — old unsubscribe links expire after ~30 days.
 */

import { createHmac, timingSafeEqual } from 'crypto'

function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret) {
    throw new Error(
      'UNSUBSCRIBE_SECRET environment variable is required. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
  }
  return secret
}

export function createUnsubscribeToken(userId: string): string {
  // Token rotates monthly — old unsubscribe links expire after ~30 days
  const period = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 30))
  const payload = `unsub:${userId}:${period}`
  const sig = createHmac('sha256', getSecret()).update(payload).digest('hex').slice(0, 16)
  return Buffer.from(`${userId}:${sig}`).toString('base64url')
}

export function verifyUnsubscribeToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const [userId, sig] = decoded.split(':')
    if (!userId || !sig) return null

    const period = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 30))
    const expected = createHmac('sha256', getSecret())
      .update(`unsub:${userId}:${period}`)
      .digest('hex')
      .slice(0, 16)

    // Timing-safe comparison to prevent signature forgery via timing attacks
    const sigBuf = Buffer.from(sig, 'utf-8')
    const expectedBuf = Buffer.from(expected, 'utf-8')
    if (sigBuf.length !== expectedBuf.length) return null

    return timingSafeEqual(sigBuf, expectedBuf) ? userId : null
  } catch {
    return null
  }
}
