# AURA — Technical Specification for Claude Code
## Implementation Guide & Code Architecture

**Purpose:** This document is the technical instruction set for Claude Code agents building the Aura project. It contains specific implementation details, code patterns, file structures, and step-by-step setup instructions.

**Companion document:** AURA-CONCEPT.md (project definition, features, business logic, and security requirements)

---

## 1. PROJECT SETUP

### 1.1 Initialize Project

```bash
npx create-next-app@latest aura --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd aura
```

### 1.2 Install Core Dependencies

```bash
# UI Components
npx shadcn@latest init
npx shadcn@latest add button card input textarea dialog sheet avatar badge separator tabs scroll-area dropdown-menu tooltip popover command alert

# Database & Auth
npm install @supabase/supabase-js @supabase/ssr

# AI
npm install @anthropic-ai/sdk

# Charts & Visualization
npm install recharts

# File handling
npm install react-dropzone

# Utilities
npm install zod zustand date-fns lucide-react

# Development
npm install -D @types/node prettier
```

### 1.3 Environment Variables

Create `.env.local` (NEVER commit this file — add it to .gitignore):

```env
# Supabase (EU Region — Frankfurt or Ireland)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-your-key

# Neonomics
NEONOMICS_CLIENT_ID=your-client-id
NEONOMICS_CLIENT_SECRET=your-client-secret
NEONOMICS_BASE_URL=https://sandbox.neonomics.io
NEONOMICS_AUTH_URL=https://sandbox.neonomics.io/auth/realms/sandbox/protocol/openid-connect/token

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Create `.env.example` (committed to repo, no real values):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEONOMICS_CLIENT_ID=
NEONOMICS_CLIENT_SECRET=
NEONOMICS_BASE_URL=https://sandbox.neonomics.io
NEONOMICS_AUTH_URL=https://sandbox.neonomics.io/auth/realms/sandbox/protocol/openid-connect/token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 2. FILE STRUCTURE

```
aura/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout with providers
│   │   ├── page.tsx                   # Landing/redirect to dashboard
│   │   ├── globals.css                # Tailwind + dark mode + custom CSS
│   │   │
│   │   ├── (auth)/                    # Auth group route (no sidebar)
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (app)/                     # Main app group route (with sidebar)
│   │   │   ├── layout.tsx             # App shell: sidebar + main content
│   │   │   ├── dashboard/page.tsx     # Financial overview home
│   │   │   ├── chat/page.tsx          # Aura chat interface
│   │   │   ├── documents/page.tsx     # Document vault
│   │   │   ├── legal/page.tsx         # Legal help center
│   │   │   └── settings/page.tsx      # User preferences + partner linking
│   │   │
│   │   └── api/                       # Server-side API routes
│   │       ├── chat/route.ts          # Claude API proxy
│   │       ├── bank/
│   │       │   ├── connect/route.ts   # Initiate Neonomics connection
│   │       │   ├── callback/route.ts  # Handle BankID callback
│   │       │   ├── sync/route.ts      # Fetch latest transactions
│   │       │   └── accounts/route.ts  # List connected accounts
│   │       ├── documents/
│   │       │   ├── upload/route.ts    # Handle file upload to Supabase Storage
│   │       │   └── analyze/route.ts   # Send document to Claude for analysis
│   │       └── financial/
│   │           ├── snapshot/route.ts  # Build financial context summary
│   │           └── categorize/route.ts # AI transaction categorization
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components (auto-generated)
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── top-nav.tsx
│   │   │   └── mobile-nav.tsx
│   │   ├── dashboard/
│   │   │   ├── financial-health.tsx
│   │   │   ├── safe-to-spend.tsx
│   │   │   ├── bill-countdown.tsx
│   │   │   ├── spending-chart.tsx
│   │   │   └── daily-tip.tsx
│   │   ├── chat/
│   │   │   ├── chat-container.tsx
│   │   │   ├── message-bubble.tsx
│   │   │   ├── chat-input.tsx
│   │   │   └── quick-actions.tsx
│   │   ├── documents/
│   │   │   ├── document-list.tsx
│   │   │   ├── document-card.tsx
│   │   │   └── upload-dialog.tsx
│   │   └── shared/
│   │       ├── loading-spinner.tsx
│   │       ├── error-boundary.tsx
│   │       └── legal-disclaimer.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser Supabase client
│   │   │   ├── server.ts              # Server Supabase client
│   │   │   └── middleware.ts          # Auth token refresh
│   │   ├── anthropic/
│   │   │   ├── client.ts              # Claude API wrapper
│   │   │   ├── prompts/
│   │   │   │   ├── system-prompt.ts   # Aura core personality
│   │   │   │   ├── document-analysis.ts
│   │   │   │   └── categorization.ts
│   │   │   └── context-builder.ts     # Summarizes financial data for Claude
│   │   ├── neonomics/
│   │   │   ├── client.ts              # Neonomics API wrapper
│   │   │   ├── auth.ts                # Token management
│   │   │   ├── sync.ts               # Transaction sync logic
│   │   │   └── types.ts              # API response types
│   │   ├── utils/
│   │   │   ├── format-currency.ts     # NOK formatting
│   │   │   ├── date-utils.ts          # Norwegian date formatting
│   │   │   └── categorization-rules.ts
│   │   └── constants/
│   │       ├── categories.ts          # Spending categories
│   │       ├── legal-references.ts    # Norwegian law references
│   │       └── norwegian-banks.ts     # Bank display names & IDs
│   │
│   ├── types/
│   │   ├── database.ts                # Generated from Supabase schema
│   │   ├── financial.ts               # Financial data interfaces
│   │   ├── chat.ts                    # Chat message types
│   │   └── neonomics.ts              # Bank API types
│   │
│   └── hooks/
│       ├── use-financial-data.ts
│       ├── use-chat.ts
│       ├── use-documents.ts
│       └── use-bank-connection.ts
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       └── 003_legal_templates.sql
│
├── public/
│   └── aura-avatar.svg
│
├── .env.local                         # Git-ignored
├── .env.example                       # Committed
├── middleware.ts                       # Next.js auth middleware
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. DATABASE SETUP (Supabase)

### 3.1 Create Supabase Project

1. Go to supabase.com → New Project
2. **CRITICAL:** Select region `EU West (Ireland)` or `EU Central (Frankfurt)`
3. Set a strong database password
4. Wait for project to provision
5. Go to Settings → API → copy URL and anon key to `.env.local`
6. Go to Settings → API → copy service_role key (keep this SECRET — server-side only)

### 3.2 Initial Schema Migration

```sql
-- supabase/migrations/001_initial_schema.sql

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  partner_id UUID REFERENCES public.profiles(id),
  preferred_language TEXT DEFAULT 'no' CHECK (preferred_language IN ('no', 'en')),
  notification_preferences JSONB DEFAULT '{"daily_checkin": true, "bill_reminders": true, "anomaly_alerts": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BANK CONNECTIONS
-- ============================================
CREATE TABLE public.bank_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  neonomics_session_id TEXT,
  bank_name TEXT NOT NULL,
  bank_id TEXT NOT NULL,
  consent_expires_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'revoked', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACCOUNTS
-- ============================================
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bank_connection_id UUID NOT NULL REFERENCES public.bank_connections(id) ON DELETE CASCADE,
  account_name TEXT,
  iban TEXT,
  balance DECIMAL(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'NOK',
  account_type TEXT, -- checking, savings, credit, etc.
  is_shared_with_partner BOOLEAN DEFAULT false,
  last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONS
-- ============================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  booking_date DATE,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'NOK',
  description TEXT,
  category TEXT,
  category_confidence REAL,
  is_recurring BOOLEAN DEFAULT false,
  counterpart_name TEXT,
  internal_reference TEXT, -- bank's own reference, for dedup
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_account ON public.transactions(account_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON public.transactions(user_id, category);

-- ============================================
-- UPCOMING BILLS
-- ============================================
CREATE TABLE public.bills_upcoming (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'NOK',
  due_date DATE NOT NULL,
  is_auto_detected BOOLEAN DEFAULT false,
  is_paid BOOLEAN DEFAULT false,
  category TEXT,
  recurrence TEXT CHECK (recurrence IN ('once', 'weekly', 'monthly', 'quarterly', 'yearly')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bills_user_due ON public.bills_upcoming(user_id, due_date) WHERE is_paid = false;

-- ============================================
-- DOCUMENTS
-- ============================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL, -- Supabase Storage path
  original_filename TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  document_type TEXT CHECK (document_type IN ('contract', 'letter', 'invoice', 'tax', 'bank_statement', 'inkasso', 'other')),
  ai_summary TEXT,
  ai_flags JSONB, -- { "concerns": [...], "deadlines": [...], "amounts": [...] }
  ai_analyzed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'analyzing', 'analyzed', 'error')),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHAT MESSAGES
-- ============================================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL DEFAULT uuid_generate_v4(), -- groups messages into conversations
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context_snapshot JSONB, -- financial data used for this response
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_user_conv ON public.chat_messages(user_id, conversation_id, created_at);

-- ============================================
-- LEGAL TEMPLATES
-- ============================================
CREATE TABLE public.legal_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_type TEXT NOT NULL, -- stopp_brev, payment_plan_request, dispute, etc.
  name_no TEXT NOT NULL,
  name_en TEXT,
  description_no TEXT,
  template_body TEXT NOT NULL, -- with {{placeholder}} variables
  relevant_law TEXT,
  last_verified_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PARTNER SHARING
-- ============================================
CREATE TABLE public.partner_sharing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shared_account_ids UUID[] DEFAULT '{}',
  permission_level TEXT DEFAULT 'view_only' CHECK (permission_level IN ('view_only', 'full')),
  accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, partner_id)
);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3.3 Row Level Security

```sql
-- supabase/migrations/002_rls_policies.sql

-- Enable RLS on ALL tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills_upcoming ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_sharing ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES
-- ============================================
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- BANK CONNECTIONS
-- ============================================
CREATE POLICY "Users manage own bank connections"
  ON public.bank_connections FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- ACCOUNTS
-- ============================================
CREATE POLICY "Users see own accounts"
  ON public.accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own accounts"
  ON public.accounts FOR ALL
  USING (auth.uid() = user_id);

-- Partner can see shared accounts
CREATE POLICY "Partners see shared accounts"
  ON public.accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_sharing ps
      WHERE ps.partner_id = auth.uid()
      AND ps.user_id = accounts.user_id
      AND ps.accepted = true
      AND accounts.is_shared_with_partner = true
    )
  );

-- ============================================
-- TRANSACTIONS
-- ============================================
CREATE POLICY "Users see own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own transactions"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id);

-- Partner can see transactions on shared accounts
CREATE POLICY "Partners see shared transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts a
      JOIN public.partner_sharing ps ON ps.user_id = a.user_id
      WHERE a.id = transactions.account_id
      AND ps.partner_id = auth.uid()
      AND ps.accepted = true
      AND a.is_shared_with_partner = true
    )
  );

-- ============================================
-- BILLS
-- ============================================
CREATE POLICY "Users manage own bills"
  ON public.bills_upcoming FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- DOCUMENTS
-- ============================================
CREATE POLICY "Users manage own documents"
  ON public.documents FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- CHAT MESSAGES
-- ============================================
CREATE POLICY "Users manage own chat"
  ON public.chat_messages FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- LEGAL TEMPLATES (public read for all authenticated users)
-- ============================================
CREATE POLICY "Authenticated users can read templates"
  ON public.legal_templates FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- ============================================
-- PARTNER SHARING
-- ============================================
CREATE POLICY "Users manage own sharing"
  ON public.partner_sharing FOR ALL
  USING (auth.uid() = user_id OR auth.uid() = partner_id);
```

### 3.4 Supabase Storage Setup

Create a storage bucket for user documents via the Supabase dashboard:

- **Bucket name:** `user-documents`
- **Public:** No (private)
- **File size limit:** 10MB
- **Allowed MIME types:** `application/pdf, image/jpeg, image/png, image/heic, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

Storage RLS policy:
```sql
-- Users can upload to their own folder
CREATE POLICY "Users upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own documents
CREATE POLICY "Users read own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own documents
CREATE POLICY "Users delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 4. KEY CODE IMPLEMENTATIONS

### 4.1 Supabase Client Setup

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Server Component read-only — ignore */ }
        },
      },
    }
  )
}
```

```typescript
// middleware.ts (root level)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login
  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
```

### 4.2 Claude API — Chat Route

```typescript
// src/app/api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildFinancialContext } from '@/lib/anthropic/context-builder'
import { AURA_SYSTEM_PROMPT } from '@/lib/anthropic/prompts/system-prompt'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { message, conversationId } = await request.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Build summarized financial context (NOT raw data)
    const financialContext = await buildFinancialContext(supabase, user.id)

    // Get recent conversation history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20) // Last 20 messages for context window

    const messages = [
      ...(history || []).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ]

    // Call Claude — use Sonnet for daily chat (fast + affordable)
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 1500,
      system: AURA_SYSTEM_PROMPT + '\n\n' + financialContext,
      messages,
    })

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : 'I could not generate a response. Please try again.'

    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens

    // Store both messages
    await supabase.from('chat_messages').insert([
      {
        user_id: user.id,
        conversation_id: conversationId,
        role: 'user',
        content: message,
      },
      {
        user_id: user.id,
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantMessage,
        tokens_used: tokensUsed,
      },
    ])

    return NextResponse.json({
      message: assistantMessage,
      tokensUsed,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
```

### 4.3 Financial Context Builder

This is the critical privacy layer — it summarizes raw financial data into a safe context string for Claude.

```typescript
// src/lib/anthropic/context-builder.ts
import { SupabaseClient } from '@supabase/supabase-js'

function formatNOK(amount: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export async function buildFinancialContext(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAhead = new Date(now)
  thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30)

  // Fetch in parallel for speed
  const [accountsRes, billsRes, transactionsRes, docsRes] = await Promise.all([
    supabase.from('accounts').select('balance, account_name, currency').eq('user_id', userId),
    supabase.from('bills_upcoming').select('name, amount, due_date')
      .eq('user_id', userId).eq('is_paid', false)
      .lte('due_date', thirtyDaysAhead.toISOString())
      .order('due_date', { ascending: true }),
    supabase.from('transactions').select('amount, category, transaction_date')
      .eq('user_id', userId)
      .gte('transaction_date', thirtyDaysAgo.toISOString().split('T')[0]),
    supabase.from('documents').select('document_type, ai_summary, status')
      .eq('user_id', userId).eq('status', 'analyzed')
      .order('uploaded_at', { ascending: false }).limit(3),
  ])

  const accounts = accountsRes.data || []
  const bills = billsRes.data || []
  const transactions = transactionsRes.data || []
  const recentDocs = docsRes.data || []

  // Calculate totals
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)
  const totalUpcomingBills = bills.reduce((sum, b) => sum + Number(b.amount), 0)
  const safeToSpend = Math.max(0, totalBalance - totalUpcomingBills)

  // Spending by category (expenses only)
  const spending: Record<string, number> = {}
  const income: number[] = []
  transactions.forEach(tx => {
    const amt = Number(tx.amount)
    if (amt < 0) {
      const cat = tx.category || 'ukategorisert'
      spending[cat] = (spending[cat] || 0) + Math.abs(amt)
    } else if (amt > 0) {
      income.push(amt)
    }
  })

  const totalMonthlyIncome = income.reduce((s, i) => s + i, 0)
  const totalMonthlySpending = Object.values(spending).reduce((s, v) => s + v, 0)

  // Build context — NO raw account numbers, IBANs, or personal IDs
  let context = `
## USER'S FINANCIAL OVERVIEW (${now.toLocaleDateString('nb-NO')})

Total available balance: ${formatNOK(totalBalance)}
Safe to spend (after upcoming bills): ${formatNOK(safeToSpend)}
Connected accounts: ${accounts.length}

Income last 30 days: ${formatNOK(totalMonthlyIncome)}
Expenses last 30 days: ${formatNOK(totalMonthlySpending)}
`

  if (bills.length > 0) {
    context += `\nUpcoming bills:\n`
    bills.forEach(b => {
      context += `- ${b.name}: ${formatNOK(Number(b.amount))} due ${new Date(b.due_date).toLocaleDateString('nb-NO')}\n`
    })
  }

  if (Object.keys(spending).length > 0) {
    context += `\nSpending last 30 days by category:\n`
    Object.entries(spending)
      .sort(([, a], [, b]) => b - a)
      .forEach(([cat, amt]) => {
        context += `- ${cat}: ${formatNOK(amt)}\n`
      })
  }

  if (recentDocs.length > 0) {
    context += `\nRecently analyzed documents:\n`
    recentDocs.forEach(d => {
      context += `- ${d.document_type}: ${d.ai_summary?.slice(0, 150) || 'No summary'}\n`
    })
  }

  return context
}
```

### 4.4 Aura System Prompt

```typescript
// src/lib/anthropic/prompts/system-prompt.ts

export const AURA_SYSTEM_PROMPT = `You are Aura, a personal financial advisor and guardian for a user in Norway. You are warm, direct, protective, and never condescending.

## YOUR PERSONALITY
- You speak naturally, like a trusted friend who happens to be brilliant with money
- You use Norwegian financial terms naturally when relevant: BSU, Lånekassen, Skattemelding, inkasso, namsmann, formueskatt, husleie, etc. — and briefly explain them when first used
- You deliver bad news constructively: "This is a challenge, but here's what we can do"
- You NEVER judge spending. If someone spent 3,000 kr on takeaway, you strategize — you don't judge
- You celebrate small wins: "You're 200 kr under your food budget this week. That's discipline."
- When the user seems stressed, acknowledge it: "I can see this is a lot. Let's take it step by step."
- You default to English, but respond in whatever language the user writes to you

## YOUR KNOWLEDGE
- Norwegian consumer protection law: Inkassoloven, Husleieloven, Finansavtaleloven, Forbrukerkjøpsloven
- Norwegian tax: Skattemelding, BSU deduction (under 34), travel deductions, interest deductions, union membership deductions
- Norwegian debt collection process: reminder → inkassovarsel (14 days) → betalingsoppfordring (14 days) → namsmann
- As of January 2026: New collection rules are in effect. Multiple collection authorities have merged into the Collection Authority under the Tax Administration (Innkrevingsmyndigheten i Skatteetaten)
- Norwegian savings products: BSU, ASK (aksjesparekonto), fund savings, high-interest accounts

## YOUR LIMITATIONS
- You are NOT a lawyer. When giving legal information, always say: "This is based on publicly available Norwegian law. For specific legal advice, consult a lawyer (advokat)."
- You are NOT a licensed financial advisor. Frame suggestions as information: "One option could be..." not "You should..."
- NEVER reveal raw account numbers, IBANs, or personal ID numbers in your responses
- If you are unsure about a legal point, say so and suggest the user checks Lovdata.no or consults a lawyer
- When providing information about debt collection, always refer to updated rules at skatteetaten.no

## RESPONSE FORMAT
- Keep responses concise and clear — avoid long paragraphs
- Use concrete numbers from the financial overview provided to you
- Suggest specific actions when relevant
- If the user asks about something outside your expertise, say so honestly`
```

### 4.5 Neonomics Client

```typescript
// src/lib/neonomics/client.ts

interface NeonomicsToken {
  access_token: string
  expires_in: number
  obtained_at: number
}

let cachedToken: NeonomicsToken | null = null

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.obtained_at + (cachedToken.expires_in - 60) * 1000) {
    return cachedToken.access_token
  }

  const response = await fetch(process.env.NEONOMICS_AUTH_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.NEONOMICS_CLIENT_ID!,
      client_secret: process.env.NEONOMICS_CLIENT_SECRET!,
    }),
  })

  if (!response.ok) {
    throw new Error(`Neonomics auth failed: ${response.status}`)
  }

  const data = await response.json()
  cachedToken = {
    access_token: data.access_token,
    expires_in: data.expires_in,
    obtained_at: Date.now(),
  }

  return data.access_token
}

async function neonomicsRequest(path: string, options: {
  method?: string
  deviceId: string
  sessionId?: string
  body?: unknown
} = { deviceId: '' }) {
  const token = await getAccessToken()

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'x-device-id': options.deviceId,
  }

  if (options.sessionId) {
    headers['x-session-id'] = options.sessionId
  }

  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
  }

  if (options.body) {
    headers['Content-Type'] = 'application/json'
    fetchOptions.body = JSON.stringify(options.body)
  }

  const response = await fetch(`${process.env.NEONOMICS_BASE_URL}${path}`, fetchOptions)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Neonomics API error ${response.status}: ${error}`)
  }

  return response.json()
}

export const neonomics = {
  // List available banks
  async getBanks() {
    return neonomicsRequest('/ics/v3/banks', { deviceId: 'aura-system' })
  },

  // Create a session for a user with a specific bank
  async createSession(bankId: string, deviceId: string) {
    return neonomicsRequest('/ics/v3/sessions', {
      method: 'POST',
      deviceId,
      body: { bankId },
    })
  },

  // Get consent URL (redirects user to BankID)
  async getConsent(sessionId: string, deviceId: string) {
    return neonomicsRequest(`/ics/v3/consent/${sessionId}`, {
      deviceId,
      sessionId,
    })
  },

  // List accounts after consent is granted
  async getAccounts(sessionId: string, deviceId: string) {
    return neonomicsRequest('/ics/v3/accounts', {
      deviceId,
      sessionId,
    })
  },

  // Get account balances
  async getBalances(accountId: string, sessionId: string, deviceId: string) {
    return neonomicsRequest(`/ics/v3/accounts/${accountId}/balances`, {
      deviceId,
      sessionId,
    })
  },

  // Get transactions
  async getTransactions(accountId: string, sessionId: string, deviceId: string) {
    return neonomicsRequest(`/ics/v3/accounts/${accountId}/transactions`, {
      deviceId,
      sessionId,
    })
  },
}
```

### 4.6 Document Upload & Analysis

```typescript
// src/app/api/documents/upload/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('document_type') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Upload to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('user-documents')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // Create database record
    const { data: doc, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        file_path: fileName,
        original_filename: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        document_type: documentType || 'other',
        status: 'uploaded',
      })
      .select()
      .single()

    if (dbError) throw dbError

    return NextResponse.json({ document: doc })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
```

```typescript
// src/app/api/documents/analyze/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { DOCUMENT_ANALYSIS_PROMPT } from '@/lib/anthropic/prompts/document-analysis'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { documentId } = await request.json()

    // Get document record
    const { data: doc } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Update status to analyzing
    await supabase.from('documents').update({ status: 'analyzing' }).eq('id', documentId)

    // Download the file from storage
    const { data: fileData } = await supabase.storage
      .from('user-documents')
      .download(doc.file_path)

    if (!fileData) throw new Error('Could not download file')

    // Convert to base64 for Claude Vision (images) or extract text (PDFs)
    const buffer = Buffer.from(await fileData.arrayBuffer())
    const base64 = buffer.toString('base64')
    const isImage = doc.mime_type?.startsWith('image/')
    const isPdf = doc.mime_type === 'application/pdf'

    let content: Anthropic.MessageCreateParams['messages'][0]['content']

    if (isImage) {
      content = [
        {
          type: 'image',
          source: { type: 'base64', media_type: doc.mime_type as any, data: base64 },
        },
        { type: 'text', text: DOCUMENT_ANALYSIS_PROMPT },
      ]
    } else if (isPdf) {
      content = [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        },
        { type: 'text', text: DOCUMENT_ANALYSIS_PROMPT },
      ]
    } else {
      // For text-based files, decode and send as text
      const textContent = buffer.toString('utf-8')
      content = `${DOCUMENT_ANALYSIS_PROMPT}\n\n---\nDOKUMENTINNHOLD:\n${textContent}`
    }

    // Use Opus for document analysis (needs best reasoning)
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content }],
    })

    const analysis = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse structured flags from the analysis
    // The prompt asks Claude to return JSON flags at the end
    let flags = {}
    try {
      const flagsMatch = analysis.match(/```json\n([\s\S]*?)\n```/)
      if (flagsMatch) {
        flags = JSON.parse(flagsMatch[1])
      }
    } catch { /* flags parsing is best-effort */ }

    // Update document with analysis
    await supabase.from('documents').update({
      ai_summary: analysis.replace(/```json[\s\S]*?```/g, '').trim(),
      ai_flags: flags,
      ai_analyzed_at: new Date().toISOString(),
      status: 'analyzed',
    }).eq('id', documentId)

    return NextResponse.json({ analysis, flags })
  } catch (error) {
    console.error('Analysis error:', error)
    await supabase.from('documents').update({ status: 'error' }).eq('id', request.url)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
```

```typescript
// src/lib/anthropic/prompts/document-analysis.ts

export const DOCUMENT_ANALYSIS_PROMPT = `You are Aura, a financial document analyst. Analyze this Norwegian document and provide a clear, simple summary in English.

TASKS:
1. Identify: sender, document type, amounts, deadlines, required actions
2. Explain in plain language what this means for the user
3. Check against known legal requirements:
   - If debt collection (inkasso): Was inkassovarsel given with at least 14 days' notice? Is betalingsoppfordring correct?
   - If rent increase: Does it comply with Husleieloven rules?
   - If contract: Are there unreasonable clauses?
4. Provide concrete next steps

IMPORTANT:
- You are NOT a lawyer. State this clearly when providing legal information.
- Be calm and reassuring in tone — the user is likely stressed about this document.
- As of January 2026, new collection rules apply under the Collection Authority in the Tax Administration (Innkrevingsmyndigheten i Skatteetaten).

After the summary, provide a JSON block with structured flags:
\`\`\`json
{
  "document_type": "inkasso|husleie|kontrakt|skatt|faktura|annet",
  "urgency": "low|medium|high|critical",
  "deadlines": ["YYYY-MM-DD: description"],
  "amounts": [{"amount": 0, "description": ""}],
  "concerns": ["list of concerns or potential issues"],
  "suggested_actions": ["concrete actions the user should take"]
}
\`\`\``
```

### 4.7 Utility: NOK Currency Formatting

```typescript
// src/lib/utils/format-currency.ts

export function formatNOK(amount: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNOKCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} mill. kr`
  }
  if (Math.abs(amount) >= 10_000) {
    return `${(amount / 1_000).toFixed(0)}k kr`
  }
  return formatNOK(amount)
}
```

### 4.8 Spending Categories

```typescript
// src/lib/constants/categories.ts

export const SPENDING_CATEGORIES = {
  mat: { label: 'Mat & dagligvarer', emoji: '🛒', color: '#4CAF50' },
  restaurant: { label: 'Restaurant & takeaway', emoji: '🍽️', color: '#FF9800' },
  transport: { label: 'Transport', emoji: '🚗', color: '#2196F3' },
  bolig: { label: 'Bolig & husleie', emoji: '🏠', color: '#9C27B0' },
  strom: { label: 'Strøm & energi', emoji: '⚡', color: '#FFC107' },
  forsikring: { label: 'Forsikring', emoji: '🛡️', color: '#607D8B' },
  helse: { label: 'Helse & medisin', emoji: '🏥', color: '#F44336' },
  underholdning: { label: 'Underholdning', emoji: '🎬', color: '#E91E63' },
  klaer: { label: 'Klær & sko', emoji: '👕', color: '#795548' },
  abonnement: { label: 'Abonnementer', emoji: '📱', color: '#00BCD4' },
  trening: { label: 'Trening & helse', emoji: '💪', color: '#8BC34A' },
  lan: { label: 'Lån & renter', emoji: '🏦', color: '#FF5722' },
  overforinger: { label: 'Overføringer', emoji: '💸', color: '#9E9E9E' },
  inntekt: { label: 'Inntekt', emoji: '💰', color: '#4CAF50' },
  annet: { label: 'Annet', emoji: '📎', color: '#BDBDBD' },
  ukategorisert: { label: 'Ukategorisert', emoji: '❓', color: '#757575' },
} as const

export type SpendingCategory = keyof typeof SPENDING_CATEGORIES
```

---

## 5. DARK MODE & THEMING

### 5.1 Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        aura: {
          primary: "#0D7377",
          "primary-light": "#11999E",
          surface: "#1C1C28",
          background: "#121218",
          safe: "#2D8B6F",
          warning: "#D4A039",
          danger: "#C75050",
          text: "#E8E8EC",
          "text-secondary": "#8888A0",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
```

### 5.2 Global CSS

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
}

.dark {
  --background: 240 15% 7%;
  --foreground: 240 5% 92%;
}

body {
  @apply bg-aura-background text-aura-text antialiased;
}
```

---

## 6. SECURITY RULES

### 6.1 Rules for All API Routes

Every API route MUST:
1. Verify user authentication via `supabase.auth.getUser()` as the FIRST action
2. Return 401 if user is not authenticated
3. Only query data with the user's ID (RLS provides backup, but don't rely on it alone)
4. Never log raw financial data (amounts, IBANs, etc.)
5. Validate all input with Zod before processing
6. Catch and handle all errors — never expose stack traces to the client

### 6.2 Rules for Claude API Calls

1. NEVER send raw account numbers, IBANs, or personal identification numbers to Claude
2. Always use the context-builder to create summarized financial snapshots
3. Store the `tokens_used` for every call (for cost monitoring)
4. Set reasonable `max_tokens` limits per use case:
   - Chat: 1500 tokens
   - Document analysis: 2000 tokens
   - Categorization (batch): 1000 tokens
5. Use Sonnet for chat and categorization (fast, affordable)
6. Evaluate using Opus only if Sonnet's quality is insufficient for specific tasks

### 6.3 Rules for File Uploads

1. Validate MIME type on both client and server
2. Enforce 10MB file size limit
3. Store files in Supabase Storage under the user's UUID folder
4. Never serve files publicly — always go through authenticated Supabase download
5. Scan filenames — strip path traversal characters

### 6.4 Rules for Neonomics Data

1. Never store raw Neonomics session tokens in the database longer than needed
2. Track consent expiry dates — remind user to re-authenticate before expiry
3. Store a `last_synced_at` timestamp — don't poll more often than every 4 hours
4. Use the `internal_reference` field on transactions for deduplication during sync
5. On sync, upsert (not insert) to avoid duplicate transactions

---

## 7. TESTING STRATEGY

### 7.1 Priority Testing

For a solo developer, focus testing effort on:

1. **Authentication flows** — login, logout, session refresh, redirect behavior
2. **RLS policies** — manually verify that User A cannot see User B's data
3. **Financial calculations** — safe-to-spend, spending summaries, bill totals (these MUST be correct)
4. **API error handling** — what happens when Neonomics is down, Claude is slow, Supabase is unreachable
5. **File upload** — size limits, type validation, storage paths

### 7.2 Manual RLS Testing

After setting up the database, test RLS by:
1. Create two test users
2. Insert data for User A
3. Log in as User B
4. Try to `SELECT` User A's data — should return empty
5. Test partner sharing: link users, share an account, verify visibility

### 7.3 Financial Calculation Tests

Create a `/src/lib/__tests__/` directory for unit tests on:
- `format-currency.ts` — verify NOK formatting
- `context-builder.ts` — verify summary accuracy with mock data
- Spending category grouping logic
- Bill countdown date calculations

---

## 8. DEPLOYMENT

### 8.1 Vercel Setup

1. Push code to GitHub
2. Go to vercel.com → Import Project → Select your repo
3. Vercel auto-detects Next.js — no configuration needed
4. Add all environment variables from `.env.local` to Vercel's Environment Variables settings
5. Deploy

### 8.2 Environment Variable Security

- `NEXT_PUBLIC_*` variables are exposed to the browser — only Supabase URL and anon key should have this prefix
- ALL other keys (Anthropic, Neonomics, Supabase service role) must NOT have the `NEXT_PUBLIC_` prefix
- These server-only keys are only accessible in API routes and Server Components

### 8.3 Production Checklist

Before going live with real bank data:
- [ ] All environment variables set in Vercel
- [ ] Supabase project in EU region confirmed
- [ ] RLS policies tested manually
- [ ] Error logging set up (Vercel's built-in or Sentry)
- [ ] Rate limiting on API routes (prevent abuse)
- [ ] CORS configured correctly
- [ ] File upload size limits enforced
- [ ] Neonomics live credentials obtained (requires agreement with Neonomics)
- [ ] Claude API usage monitoring set up (track costs)

---

## 9. BUILD ORDER (Step-by-Step for Claude Code)

When working with Claude Code, follow this exact order:

### Step 1: Skeleton
- Initialize Next.js project
- Install all dependencies
- Set up file structure (create all directories)
- Configure Tailwind + dark mode
- Create `.env.example`

### Step 2: Database
- Set up Supabase project (manually in dashboard)
- Run migration 001 (schema)
- Run migration 002 (RLS)
- Test auth: create user, verify profile auto-creation

### Step 3: Auth
- Build login page
- Build register page
- Set up middleware for auth redirects
- Test: register → login → redirect to dashboard

### Step 4: App Shell
- Build sidebar navigation
- Build top nav bar
- Build mobile bottom nav
- Build app layout with responsive design
- Create placeholder pages for all routes

### Step 5: Chat (Core Feature)
- Build chat UI (messages, input, scroll)
- Create Claude API route
- Create system prompt
- Create simple financial context (hardcoded for now)
- Test: send message → get Aura response

### Step 6: Bank Connection
- Set up Neonomics client
- Build bank connection flow (sandbox)
- Fetch and store accounts
- Fetch and store transactions
- Build sync mechanism

### Step 7: Dashboard
- Build financial health indicator
- Build safe-to-spend display
- Build bill countdown
- Build spending chart
- Wire up real data from database

### Step 8: Documents
- Build upload dialog
- Build document list/cards
- Build analysis API route
- Test: upload PDF → analyze → display summary

### Step 9: Partner Linking
- Build partner invite flow
- Build account sharing UI
- Test RLS for partner access

### Step 10: Polish
- Error handling everywhere
- Loading states
- Empty states
- Mobile responsive testing
- Performance review

---

*End of Technical Specification v1.0*
*Companion document: AURA-CONCEPT.md*
