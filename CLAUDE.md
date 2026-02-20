# CLAUDE.md — Instructions for Claude Code Agents

## Project: Aura
**A personal finance AI guardian for the Norwegian market.**

Read this file FIRST before doing anything. Then read `AURA-TECHNICAL-SPEC.md` for implementation details and `AURA-CONCEPT.md` for product context.

---

## WHAT IS AURA

Aura is a personal finance app that connects to Norwegian bank accounts via Neonomics (open banking), analyzes spending, provides emotional support and financial guidance through Claude AI, helps users understand their legal rights, and processes uploaded financial documents. It is for all ages and life situations — not targeted at any specific demographic.

The user is a solo developer building this with your help. They are not a professional developer, so write clean, well-commented code and explain important decisions.

---

## GOLDEN RULES

These rules apply to EVERY file you create, EVERY function you write, EVERY decision you make:

### 1. Security First
- **Never expose secrets to the browser.** Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` may have the `NEXT_PUBLIC_` prefix. ALL other keys (Anthropic, Neonomics, Supabase service role) are server-side only.
- **Always verify authentication** as the first action in every API route. Use `supabase.auth.getUser()` — never trust the session alone.
- **Never trust client input.** Validate everything with Zod schemas before processing.
- **Never send raw PII to Claude API.** Use the context-builder to create summarized financial snapshots. Never include: account numbers, IBANs, personnummer, full names, or addresses in Claude API calls.
- **Never log sensitive data.** No amounts, account numbers, or personal identifiers in console.log or error messages. Log only: user ID (UUID), action type, timestamp, and error category.
- **Never expose stack traces** in API error responses. Always return generic error messages to the client. Log the real error server-side.

### 2. Data Stays in EU
- Supabase must be in EU region (Frankfurt or Ireland). Verify this on setup.
- All user financial data lives in Supabase. Claude API only receives summarized context.
- Files are stored in Supabase Storage, never on Vercel's filesystem.

### 3. Norwegian Context
- Aura speaks English by default, but responds in whatever language the user writes.
- Use Norwegian financial terms naturally: BSU, Lånekassen, Skattemelding, inkasso, namsmann, husleie, formueskatt, etc.
- Currency is always NOK. Use `nb-NO` locale for formatting.
- Dates use Norwegian format: `dd.mm.yyyy` for display, ISO for storage.

### 4. User Respect
- Never judge spending habits. Frame everything as strategy, not criticism.
- Financial data is deeply personal — treat it with the gravity it deserves.
- Legal disclaimers are mandatory: Aura is not a lawyer or licensed financial advisor.

---

## TECH STACK

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 15+ (App Router) | TypeScript strict mode |
| Styling | Tailwind CSS + shadcn/ui | Dark mode default |
| Database | Supabase (PostgreSQL) | EU region ONLY |
| Auth | Supabase Auth | Email/password for now |
| Storage | Supabase Storage | User documents (private bucket) |
| AI | Anthropic Claude API | Sonnet for chat, evaluate Opus for complex analysis |
| Banking | Neonomics API | Sandbox first, live later |
| Hosting | Vercel | Zero-config Next.js deploy |
| Validation | Zod | All API inputs |
| State | Zustand | Client-side state |
| Charts | Recharts | Spending visualization |
| File upload | react-dropzone | Drag and drop |

---

## FILE STRUCTURE CONVENTIONS

```
src/
├── app/              # Next.js App Router pages and API routes
│   ├── (auth)/       # Public auth pages (no sidebar)
│   ├── (app)/        # Authenticated app pages (with sidebar)
│   └── api/          # Server-side API routes only
├── components/       # React components
│   ├── ui/           # shadcn/ui (auto-generated, don't edit manually)
│   ├── layout/       # Shell, sidebar, nav
│   ├── dashboard/    # Dashboard-specific components
│   ├── chat/         # Chat interface components
│   ├── documents/    # Document management components
│   └── shared/       # Reusable across features
├── lib/              # Business logic and external service clients
│   ├── supabase/     # Supabase client setup
│   ├── anthropic/    # Claude API client and prompts
│   ├── neonomics/    # Bank API client
│   ├── utils/        # Pure utility functions
│   └── constants/    # Static data and configuration
├── types/            # TypeScript type definitions
└── hooks/            # Custom React hooks
```

### Naming Conventions
- Files: `kebab-case.ts` (e.g., `format-currency.ts`)
- Components: `kebab-case.tsx` file, `PascalCase` export (e.g., `chat-input.tsx` → `export function ChatInput()`)
- Types: `PascalCase` (e.g., `Transaction`, `ChatMessage`)
- Database columns: `snake_case` (e.g., `user_id`, `created_at`)
- API routes: `kebab-case` directories (e.g., `/api/bank/connect/route.ts`)
- Constants: `UPPER_SNAKE_CASE` for values, `camelCase` for objects

---

## CODE PATTERNS

### API Route Template

Every API route must follow this pattern:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Define input schema
const RequestSchema = z.object({
  // ... fields
})

export async function POST(request: Request) {
  // 1. AUTHENTICATE
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 2. VALIDATE INPUT
    const body = await request.json()
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // 3. BUSINESS LOGIC (always scoped to user.id)
    // ...

    // 4. RETURN RESPONSE
    return NextResponse.json({ data: result })
  } catch (error) {
    // 5. ERROR HANDLING — never expose internals
    console.error(`[API_NAME] Error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Supabase Queries — Always Scope to User

```typescript
// CORRECT — explicitly filter by user_id
const { data } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', user.id)

// WRONG — relying only on RLS
const { data } = await supabase
  .from('transactions')
  .select('*')
// RLS is a safety net, not the primary access control
```

### Error Handling in Components

```typescript
// Use error boundaries and loading states for every data-fetching component
// Never show raw error messages to the user
// Always provide a helpful fallback message in Norwegian
```

---

## SECURITY IMPLEMENTATION DETAILS

### Rate Limiting

Add rate limiting to all API routes, especially:
- `/api/chat` — max 60 requests per hour per user (prevents Claude API bill abuse)
- `/api/documents/upload` — max 20 uploads per hour per user
- `/api/documents/analyze` — max 20 analyses per hour per user
- `/api/bank/sync` — max 6 syncs per hour per user (every 4 hours is normal)

Implementation: Use an in-memory store (Map) for personal use. For production with multiple users, use Supabase or Vercel KV.

```typescript
// src/lib/utils/rate-limiter.ts
const rateLimits = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimits.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs })
    return true // allowed
  }

  if (entry.count >= maxRequests) {
    return false // blocked
  }

  entry.count++
  return true // allowed
}
```

Usage in API routes:
```typescript
if (!checkRateLimit(`chat:${user.id}`, 60, 60 * 60 * 1000)) {
  return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
}
```

### Security Headers

Add to `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://sandbox.neonomics.io",
              "frame-ancestors 'none'",
            ].join('; ')
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
    ]
  },
}
```

### File Upload Validation

Never trust the MIME type reported by the browser. Validate magic bytes:

```typescript
// src/lib/utils/file-validation.ts
const MAGIC_BYTES: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]], // .PNG
}

export async function validateFileType(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 8).arrayBuffer()
  const bytes = new Uint8Array(buffer)

  const allowedTypes = Object.entries(MAGIC_BYTES)
  return allowedTypes.some(([, signatures]) =>
    signatures.some(sig =>
      sig.every((byte, i) => bytes[i] === byte)
    )
  )
}
```

### Input Sanitization

For any user-provided text that will be stored or displayed:

```typescript
// src/lib/utils/sanitize.ts
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Strip HTML angle brackets
    .trim()
    .slice(0, 10000) // Enforce max length
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9æøåÆØÅ._-]/g, '_') // Allow Norwegian characters
    .replace(/\.{2,}/g, '.') // Prevent path traversal
    .slice(0, 255)
}
```

---

## CLAUDE API USAGE RULES

### Context Windowing (CRITICAL)

NEVER send raw transaction data to Claude. Always use the context-builder pattern:

**What gets sent to Claude:**
```
Total tilgjengelig saldo: 28 400 kr
Trygt å bruke: 4 300 kr
Inntekt siste 30 dager: 28 000 kr
Utgifter siste 30 dager: 23 700 kr
Kommende regninger:
- Telenor: 649 kr forfaller 23.02.2026
- Husleie: 8 500 kr forfaller 01.03.2026
```

**What NEVER gets sent to Claude:**
- Account numbers or IBANs
- Personnummer / fødselsnummer
- Full counterpart names from transactions
- Raw bank API response data
- Partner's data (unless explicitly shared)

### Model Selection

| Task | Model | Max Tokens | Reasoning |
|------|-------|------------|-----------|
| Daily chat | claude-sonnet-4-5-20250514 | 1500 | Fast responses, good quality, affordable |
| Document analysis | claude-sonnet-4-5-20250514 | 2000 | Start with Sonnet, upgrade to Opus only if quality is insufficient |
| Transaction categorization | claude-sonnet-4-5-20250514 | 1000 | Batch multiple transactions per call |
| Legal letter drafting | claude-sonnet-4-5-20250514 | 2000 | Needs careful Norwegian legal language |
| Complex financial analysis | claude-sonnet-4-5-20250514 | 2500 | Evaluate if Opus is needed case by case |

Start everything with Sonnet. Only upgrade to Opus if you can demonstrate Sonnet gives inadequate results for a specific task.

### Cost Monitoring

Track every Claude API call:
- Store `tokens_used` on every `chat_messages` record
- Create a simple dashboard query: `SELECT SUM(tokens_used) FROM chat_messages WHERE created_at > NOW() - INTERVAL '30 days'`
- Alert if daily token usage exceeds 100,000 tokens (roughly 50-100 kr/day)

---

## UI/UX PRINCIPLES

### Dark Mode
- Dark mode is the DEFAULT and PRIMARY design. Light mode is optional/secondary.
- Background: near-black (`#121218`), not pure black
- Surfaces: subtle elevation (`#1C1C28`)
- Text: off-white (`#E8E8EC`), never pure white
- Green for positive/safe states, amber for warnings, red for danger

### Design Philosophy
- **Mobile-first.** Design for phone screens first, desktop is a bonus.
- **One number that matters.** Each screen should have ONE primary number/metric.
- **Progressive disclosure.** Summary first, details on tap/click.
- **No gamification.** This is serious money. No confetti, no streaks, no badges.
- **Calm UI.** Reduce financial anxiety, don't add to it. Use soft transitions, muted colors, breathing room.

### Component Guidelines
- Use shadcn/ui components as the base — don't reinvent buttons, dialogs, inputs
- Add Aura's color palette on top via Tailwind classes
- All interactive elements need loading states
- All data displays need empty states (with helpful messages in Norwegian)
- All error states need user-friendly messages (never technical jargon)

### Language
- UI labels and navigation: English by default (Norwegian localization can be added later)
- Aura's chat: English by default, responds in whatever language the user writes
- Error messages: English
- Legal disclaimers: English (with Norwegian legal terms where needed)
- Code comments: English

---

## DATABASE RULES

### Row Level Security
RLS is enabled on ALL tables. But treat it as a safety net — always explicitly filter by `user_id` in queries. Belt and suspenders.

### Migrations
- All schema changes go in `supabase/migrations/` as numbered SQL files
- Never modify the database schema directly in the dashboard for production
- Test migrations locally first using Supabase CLI if available

### Data Integrity
- Use foreign key constraints everywhere
- Use CHECK constraints for enum-like fields (status, role, etc.)
- Always set `ON DELETE CASCADE` for user-owned data
- Use `TIMESTAMPTZ` (not `TIMESTAMP`) for all date-time columns
- Default `created_at` to `NOW()` on all tables

### Transaction Deduplication
When syncing from Neonomics, use `internal_reference` + `account_id` to detect duplicates. Upsert, don't blind insert.

---

## NEONOMICS INTEGRATION

### Sandbox vs Live
- Start with sandbox: `https://sandbox.neonomics.io`
- Sandbox uses test data — no real bank connections
- Going live requires a signed agreement with Neonomics (~4 week onboarding)
- When switching to live, only change the base URL and credentials in `.env`

### Consent Flow
1. User selects bank → Create Neonomics session
2. Redirect user to BankID (Neonomics provides the URL)
3. User authenticates with BankID → Callback to our app
4. Store consent expiry date (up to 180 days)
5. Sync accounts and transactions
6. Set up periodic re-sync (every 4-8 hours)

### Error Handling
- If Neonomics returns 401: token expired → refresh
- If Neonomics returns 403: consent expired → prompt user to re-authenticate
- If Neonomics is down: show last-synced data with a "Sist oppdatert: [timestamp]" notice
- Never block the entire app if banking is unavailable — chat and documents should still work

---

## BUILD ORDER

Follow this order strictly. Complete and test each step before moving to the next.

1. **Skeleton** — Project init, dependencies, file structure, Tailwind config, env setup
2. **Database** — Supabase project, run migrations, verify RLS
3. **Auth** — Login/register pages, middleware redirects, profile auto-creation
4. **App Shell** — Sidebar, nav, layout, responsive design, placeholder pages
5. **Chat** — Chat UI, Claude API route, system prompt, hardcoded context for testing
6. **Bank Connection** — Neonomics client, connection flow (sandbox), account/transaction sync
7. **Dashboard** — Financial health card, safe-to-spend, bill countdown, spending chart
8. **Documents** — Upload dialog, file validation, document list, AI analysis
9. **Partner Linking** — Invite flow, account sharing, RLS partner policies
10. **Polish** — Error handling, loading states, empty states, mobile testing, security review

---

## WHAT TO DO WHEN STUCK

- **Build error:** Read the error message carefully. Check if it's a missing import, type mismatch, or configuration issue. Fix the root cause, don't just suppress warnings.
- **Supabase RLS blocking queries:** Check that the user is authenticated and that the RLS policy matches the query pattern. Test in the Supabase SQL editor with `SET request.jwt.claim.sub = 'user-uuid';`
- **Claude API returning poor results:** Review the system prompt and context being sent. Add more specific instructions. Check that the financial context is being built correctly.
- **Neonomics returning errors:** Check the sandbox documentation. Verify token is fresh. Check that required headers (x-device-id, x-session-id) are included.
- **Something feels wrong security-wise:** Stop and ask. Don't ship something you're unsure about. The user relies on you to flag security concerns.

---

## REMINDERS

- This is a personal finance app handling REAL money data. Take security seriously.
- The user is not a professional developer. Write clean, readable code with helpful comments.
- Norwegian is the primary language for all user-facing content.
- Every feature should work on mobile. Test responsive design.
- When in doubt, refer back to AURA-CONCEPT.md for product decisions and AURA-TECHNICAL-SPEC.md for implementation patterns.
- Be proactive about security concerns — if you see a potential vulnerability, flag it and fix it.
