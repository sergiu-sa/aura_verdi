/**
 * Neonomics Open Banking API client.
 *
 * All credentials are server-side only (no NEXT_PUBLIC_ prefix).
 * This module is ONLY imported from API routes and Server Components.
 *
 * Auth: OAuth2 client_credentials flow — we get an access token that expires
 * in ~300 seconds. We cache it in memory and refresh it before it expires.
 *
 * Required headers on every call:
 *   - Authorization: Bearer <token>
 *   - x-device-id: stable UUID identifying the user's "device" (we use userId)
 *   - x-session-id: the Neonomics session ID (required for account/transaction calls)
 */

import type {
  NeonomicsAccount,
  NeonomicsBalance,
  NeonomicsConsentResponse,
  NeonomicsSession,
  NeonomicsTokenResponse,
  NeonomicsTransactionsResponse,
} from '@/types/neonomics'

// ── Token cache ─────────────────────────────────────────────────────────────
// Cached in-process. On Vercel, each serverless invocation starts fresh.
// A 60-second buffer means we refresh before the token actually expires.

interface CachedToken {
  access_token: string
  expires_in: number
  obtained_at: number // Date.now() when obtained
}

let cachedToken: CachedToken | null = null

async function getAccessToken(): Promise<string> {
  const now = Date.now()

  // Return cached token if still valid (with 60-second safety buffer)
  if (
    cachedToken &&
    now < cachedToken.obtained_at + (cachedToken.expires_in - 60) * 1000
  ) {
    return cachedToken.access_token
  }

  // Fetch a new token
  const authUrl = process.env.NEONOMICS_AUTH_URL
  const clientId = process.env.NEONOMICS_CLIENT_ID
  const clientSecret = process.env.NEONOMICS_CLIENT_SECRET

  if (!authUrl || !clientId || !clientSecret) {
    throw new Error('Missing Neonomics environment variables. Check NEONOMICS_AUTH_URL, NEONOMICS_CLIENT_ID, NEONOMICS_CLIENT_SECRET.')
  }

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Neonomics auth failed (${response.status}): ${body}`)
  }

  const data: NeonomicsTokenResponse = await response.json()
  cachedToken = {
    access_token: data.access_token,
    expires_in: data.expires_in,
    obtained_at: Date.now(),
  }

  return data.access_token
}

// ── Core request helper ─────────────────────────────────────────────────────

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  /** Required: stable UUID identifying the user/device */
  deviceId: string
  /** Required for account/transaction calls (the Neonomics session ID) */
  sessionId?: string
  body?: unknown
}

async function neonomicsRequest<T = unknown>(
  path: string,
  options: RequestOptions
): Promise<T> {
  const token = await getAccessToken()
  const baseUrl = process.env.NEONOMICS_BASE_URL

  if (!baseUrl) {
    throw new Error('Missing NEONOMICS_BASE_URL environment variable.')
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'x-device-id': options.deviceId,
  }

  if (options.sessionId) {
    headers['x-session-id'] = options.sessionId
  }

  if (options.body) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Neonomics API error ${response.status} on ${path}: ${body}`)
  }

  return response.json() as Promise<T>
}

// ── Public API ──────────────────────────────────────────────────────────────

export const neonomics = {
  /**
   * List all banks available in the Neonomics sandbox.
   * Returns an array of bank objects with id and name.
   */
  getBanks(deviceId: string) {
    return neonomicsRequest<unknown[]>('/ics/v3/banks', { deviceId })
  },

  /**
   * Create a new Neonomics session for a specific bank.
   * Returns a session object containing the sessionId.
   *
   * NOTE: The redirect URI is configured in the Neonomics developer portal,
   * not passed per-request. The body only needs { bankId }.
   *
   * @param bankId   - The Neonomics bank identifier (e.g., "dnb-no")
   * @param deviceId - Stable UUID for the user (we use user.id)
   */
  createSession(bankId: string, deviceId: string) {
    return neonomicsRequest<NeonomicsSession>('/ics/v3/sessions', {
      method: 'POST',
      deviceId,
      body: { bankId },
    })
  },

  /**
   * Get the consent redirect URL for a session.
   * The `scaRedirect` link is where we send the user to authenticate.
   *
   * @param redirectUri - Where Neonomics sends the user back after BankID auth.
   *   Built from NEXT_PUBLIC_APP_URL so it works in both dev and production
   *   without any code changes.
   */
  getConsent(sessionId: string, deviceId: string, redirectUri: string) {
    const path = `/ics/v3/consent/${sessionId}?redirect_uri=${encodeURIComponent(redirectUri)}`
    return neonomicsRequest<NeonomicsConsentResponse>(path, { deviceId, sessionId })
  },

  /**
   * List all accounts for an authenticated session.
   * Only works after the user has completed BankID authentication.
   */
  getAccounts(sessionId: string, deviceId: string) {
    return neonomicsRequest<NeonomicsAccount[]>('/ics/v3/accounts', {
      deviceId,
      sessionId,
    })
  },

  /**
   * Get balance(s) for a specific account.
   * Returns an array — we use 'closingBooked' as the main balance.
   */
  getBalances(accountId: string, sessionId: string, deviceId: string) {
    return neonomicsRequest<NeonomicsBalance[]>(
      `/ics/v3/accounts/${accountId}/balances`,
      { deviceId, sessionId }
    )
  },

  /**
   * Get transactions for a specific account.
   * Returns booked and pending transactions.
   */
  getTransactions(accountId: string, sessionId: string, deviceId: string) {
    return neonomicsRequest<NeonomicsTransactionsResponse>(
      `/ics/v3/accounts/${accountId}/transactions`,
      { deviceId, sessionId }
    )
  },
}
