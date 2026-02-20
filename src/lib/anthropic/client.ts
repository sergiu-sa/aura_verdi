import Anthropic from '@anthropic-ai/sdk'

/**
 * Shared Anthropic client instance.
 * Initialized once and reused across API routes.
 *
 * IMPORTANT: This module is server-side only.
 * Never import it in Client Components — the API key would be exposed.
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})
