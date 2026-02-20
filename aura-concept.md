# AURA — Complete Project Definition
## Your AI-Powered Personal Finance Guardian (Norwegian Market)

**Version:** 1.0 — Concept & Architecture  
**Date:** February 2026  
**Status:** Pre-build — Ready for implementation  

---

## 1. VISION & IDENTITY

### 1.1 What Aura Is
Aura is a personal AI financial advisor, built specifically for the Norwegian economic landscape. She functions as a "Digital Twin" focused on your economic survival and prosperity — part accountant, part legal guide, part emotional support companion.

### 1.2 The Problem Aura Solves
People across all ages and life situations in Norway face:
- No real visibility into where money goes each month
- Fear and avoidance when scary letters arrive (inkasso, Skatteetaten, etc.)
- No understanding of their legal rights as consumers and debtors
- Emotional stress that compounds financial problems
- Inability to afford the accountants and advisors that wealthy people use

Aura is not targeted at any specific age group or demographic. Whether you're a student, a parent, a retiree, or mid-career — if you need economic control and guidance, Aura is for you.

### 1.3 Aura's Personality & Tone
Aura is NOT a cold dashboard. She is:
- **Warm but direct** — "Hey, you got paid today. But before you celebrate — your Telenor bill hits in 3 days. Let's move 649 kr to your buffer now."
- **Protective** — "That collection letter looks scary, but they actually violated the 14-day notice requirement. I've drafted a response."
- **Non-judgmental** — Never shame about spending. Frame everything as strategy.
- **Norwegian-context-aware** — References BSU, Skattefunn, Lånekassen, Husleieloven naturally.

### 1.4 Core Design Principle: Automation First, Manual Always Available
Aura's primary goal is to **automate** the retrieval of banking data, transaction history, and financial documents — pulling information directly from bank APIs so the user doesn't have to think about it. However, automation is not always possible or complete. Therefore:
- **Automated retrieval** via Neonomics (bank accounts, balances, transactions) is the default
- **Manual file upload** is always available as a complement — users can upload bank statements (PDF/CSV), contracts, letters, invoices, tax documents, or any financial paperwork
- **Both paths converge** — whether data comes from an API or a manual upload, Aura processes and integrates it into the same financial picture

This dual approach ensures Aura works even when API access is limited, and allows users to include documents and data that banks don't expose through open banking (e.g., loan contracts, rental agreements, collection letters, tax returns).

### 1.5 Users
- **Primary user:** You — the project owner
- **Secondary user:** Your partner (shared economy view)
- **Future:** Potential public launch for Norwegian users

---

## 2. FEATURE SPECIFICATION (Prioritized by Build Phase)

### PHASE 1 — "The Companion" (MVP — Build First)
**Goal:** A working chat interface that knows your financial situation and provides daily guidance.

| Feature | Description | Data Source |
|---------|-------------|-------------|
| Daily Check-in | Aura greets you with a financial snapshot: balance, upcoming bills, spending since last check-in | Bank API (Neonomics) |
| Chat Interface | Natural conversation about your finances — ask questions, get advice | Claude API (Anthropic) |
| Emotional Framing | Responses framed to reduce anxiety — "You're safe for now" vs. raw numbers | AI prompt engineering |
| Spending Categorization | Auto-categorize transactions (food, transport, subscriptions, etc.) | Bank transaction data + AI |
| Bill Countdown | Visual countdown to upcoming known expenses (rent, subscriptions, etc.) | Transaction pattern analysis |
| Partner View | Your partner can connect their bank, see combined overview | Separate Neonomics session |
| Survival Gap Calculator | Income minus mandatory expenses = what you can actually use | Calculated from data |
| Manual File Upload | Upload bank statements (PDF/CSV), contracts, letters, or any financial documents | User-uploaded files |
| Document Processing | Aura reads uploaded files, extracts key info, and integrates it into your financial picture | AI analysis + OCR |

### PHASE 2 — "The Analyst" (Bank Data Intelligence)
**Goal:** Deep understanding of spending patterns and proactive alerts.

| Feature | Description |
|---------|-------------|
| Spending Trends | Weekly/monthly charts showing where money goes |
| Subscription Detector | Find recurring charges you may have forgotten |
| Safe-to-Spend | Real-time "you can safely spend X kr today" number |
| Anomaly Alerts | "You spent 2,400 kr on food this week — that's 60% more than usual" |
| Income Tracker | Track salary, Lånekassen payments, freelance income |
| Savings Suggestions | "If you cut Uber Eats by 50%, you'd save 1,800 kr/month" |
| Gold/Silver Tracker | Track Norwegian dealer prices (Tavex, Gullsentralen) for physical asset purchases |

### PHASE 3 — "The Lawyer" (Legal Defense)
**Goal:** Help users understand and exercise their rights under Norwegian law.

| Feature | Description | Key Laws |
|---------|-------------|----------|
| Document Scanner | Upload a scary letter → Aura reads and explains it in plain language | — |
| Inkasso Defense | Check if collection notice followed proper procedure (14-day inkassovarsel, valid betalingsoppfordring) | Inkassoloven |
| Letter Drafter | Generate template response letters (payment plan requests, dispute letters, stop letters) | Inkassoloven |
| Rent Monitor | Track if landlord's rent increases comply with Husleieloven | Husleieloven |
| Contract Vault | Upload and store contracts — Aura flags concerning clauses | Finansavtaleloven |
| Rights Database | Searchable database of consumer rights in plain Norwegian | Lovdata (public law) |

**CRITICAL LEGAL DISCLAIMER:** Aura provides legal INFORMATION, not legal ADVICE. Every legal feature must include a clear disclaimer: "Aura is not a lawyer. This information is based on publicly available Norwegian law. For legal advice, consult an advokat."

**NOTE:** As of January 1, 2026, new debt collection rules took effect in Norway. Several collection authorities have been merged into one: the Collection Authority in the Tax Administration (Skattetaten). The legal database must reflect this change.

### PHASE 4 — "The Optimizer" (Tax & Growth)
**Goal:** Maximize what you keep and start building wealth.

| Feature | Description |
|---------|-------------|
| Tax Deduction Scanner | Identify commonly missed deductions: travel to work, student loan interest, union fees |
| BSU Optimizer | Track BSU contributions, remind about annual limits, calculate tax benefit |
| Skattemelding Preview | Estimate tax return based on known income and deductions |
| Investment Basics | Educational content about Norwegian savings options (ASK, BSU, fond) |
| Formueskatt Tracker | If gold/physical assets approach declaration thresholds, remind user |

---

## 3. TECH STACK (Decided)

### 3.1 The Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 15+ (App Router) | Full-stack React framework, excellent for solo devs, great AI tooling support |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid, consistent UI — AI code generators work extremely well with Tailwind |
| **Database** | Supabase (PostgreSQL) | Auth, database, storage, real-time — all in one. Free tier to start. Row Level Security (RLS) for multi-user data isolation |
| **Hosting** | Vercel | Zero-config Next.js deployment, native framework support, generous free tier, edge functions |
| **Banking API** | Neonomics | Norwegian-headquartered, PSD2-licensed AISP/PISP, sandbox available, covers DNB and all major Norwegian banks |
| **AI Engine** | Anthropic Claude API | Best reasoning for complex financial/legal analysis, DPA available, API data not used for training |
| **Language** | TypeScript | End-to-end type safety, catches bugs early, essential for financial data |
| **Validation** | Zod | Runtime type checking for all API responses and form data |
| **ORM** | Prisma or Drizzle | Type-safe database queries (evaluate during build) |
| **State Management** | Zustand (if needed) | Lightweight, only if React state becomes insufficient |

### 3.2 Why This Stack

**For a solo developer using Claude Code:**
- Next.js + Supabase is the most well-documented, AI-assisted stack available in 2025-2026
- Claude Code generates excellent Next.js/TypeScript/Tailwind code
- Supabase eliminates the need to build auth, database management, and file storage separately
- Vercel deployment is zero-config for Next.js — push to main and it deploys automatically
- As the creators of Next.js, Vercel provides day-one support for new framework features
- Total cost at personal use: $0-$25/month (Supabase free tier + Vercel free tier + Claude API usage)

### 3.3 Supabase Configuration (CRITICAL)

**Region:** Deploy to `eu-west-1` (Ireland) or `eu-central-1` (Frankfurt)  
**Reason:** GDPR requires EU/EEA data residency for Norwegian user financial data.

**Supabase provides:**
- PostgreSQL database (where all financial data lives)
- Authentication (email/password + potential BankID integration later)
- Row Level Security (each user only sees their own data)
- Storage (for uploaded documents like contracts, letters)
- Edge Functions (for server-side API calls to Neonomics/Claude)
- Real-time subscriptions (for live dashboard updates)

**You MUST:**
- Sign Supabase's Data Processing Addendum (DPA) — available in dashboard
- Configure the project in an EU region at creation time
- Enable Row Level Security on EVERY table
- Never store raw bank credentials (Neonomics handles auth via BankID)

---

## 4. DATA ARCHITECTURE

### 4.1 Database Schema (Core Tables)

```
users
├── id (uuid, PK)
├── email
├── display_name
├── created_at
├── partner_id (uuid, FK → users, nullable) -- for shared economy
└── preferences (jsonb) -- notification settings, display currency, etc.

bank_connections
├── id (uuid, PK)
├── user_id (uuid, FK → users)
├── neonomics_session_id
├── bank_name
├── bank_id (Neonomics bank identifier)
├── consent_expires_at (timestamp) -- PSD2 consent valid up to 180 days
├── last_synced_at
└── status (active/expired/revoked)

accounts
├── id (uuid, PK)
├── user_id (uuid, FK → users)
├── bank_connection_id (uuid, FK → bank_connections)
├── account_name
├── iban
├── balance (decimal)
├── currency (default 'NOK')
└── last_updated_at

transactions
├── id (uuid, PK)
├── account_id (uuid, FK → accounts)
├── user_id (uuid, FK → users) -- denormalized for RLS performance
├── date
├── amount (decimal)
├── description (original bank description)
├── category (enum: food, transport, housing, subscriptions, income, etc.)
├── category_confidence (float) -- AI categorization confidence
├── is_recurring (boolean)
├── counterpart_name
└── raw_data (jsonb) -- original Neonomics response

bills_upcoming
├── id (uuid, PK)
├── user_id (uuid, FK → users)
├── name
├── amount (decimal)
├── due_date
├── is_auto_detected (boolean) -- from recurring transaction patterns
├── is_paid (boolean)
└── category

documents
├── id (uuid, PK)
├── user_id (uuid, FK → users)
├── file_path (Supabase Storage path)
├── document_type (contract/letter/tax/invoice/other)
├── ai_summary (text) -- Claude's plain-language summary
├── ai_flags (jsonb) -- any concerning clauses or issues found
├── uploaded_at
└── original_filename

chat_messages
├── id (uuid, PK)
├── user_id (uuid, FK → users)
├── role (user/assistant)
├── content (text)
├── context_data (jsonb) -- financial data snapshot used for this message
├── created_at
└── tokens_used (integer) -- for cost tracking

legal_templates
├── id (uuid, PK)
├── template_type (stopp_brev/payment_plan_request/dispute/etc.)
├── name_no (Norwegian name)
├── name_en (English name)
├── template_body (text) -- with {{placeholder}} variables
├── relevant_law (text) -- e.g., "Inkassoloven § 9"
├── last_verified_date -- when the legal basis was last checked
└── is_active (boolean)

partner_shared_view
├── id (uuid, PK)
├── user_id (uuid, FK → users)
├── partner_id (uuid, FK → users)
├── shared_accounts (uuid[]) -- which accounts are visible to partner
├── permission_level (view_only/full)
└── created_at
```

### 4.2 Row Level Security (RLS) Policies

Every table MUST have RLS enabled. Core policy pattern:

```sql
-- Users can only see their own data
CREATE POLICY "Users see own data" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Partner access for shared economy
CREATE POLICY "Partners see shared data" ON transactions
  FOR SELECT USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM partner_shared_view
      WHERE partner_id = auth.uid()
      AND user_id = transactions.user_id
      AND transactions.account_id = ANY(shared_accounts)
    )
  );
```

---

## 5. SECURITY & PRIVACY (CRITICAL)

### 5.1 Data Classification

| Data Type | Sensitivity | Handling |
|-----------|------------|----------|
| Bank balances & transactions | **HIGH** | Encrypted at rest (Supabase default), never logged in plaintext, never sent to AI without anonymization strategy |
| Personal identification (name, email) | **HIGH** | Minimal collection, encrypted |
| Uploaded documents (contracts, letters) | **HIGH** | Supabase Storage with RLS, encrypted at rest |
| Chat history | **MEDIUM** | Stored for user convenience, deletable on request |
| AI-generated summaries | **LOW** | Derived data, no raw PII |
| Application preferences | **LOW** | Standard handling |

### 5.2 What Gets Sent to Claude API

**CRITICAL DESIGN DECISION:** You must minimize what financial data you send to Claude's API.

**Strategy: Context Windowing**

Instead of sending raw transaction data to Claude, pre-process it locally (in your Supabase Edge Functions or Next.js API routes) and send SUMMARIZED data:

```
❌ WRONG: "Here are all 847 of my transactions from the last 3 months..."

✅ RIGHT: "User's financial snapshot:
- Monthly income: ~28,000 NOK
- Fixed expenses: 14,200 NOK (rent 8,500, loans 3,200, insurance 1,500, phone 999)
- Average weekly food spend: 1,800 NOK (22% above their historical average)
- Current buffer: 4,300 NOK
- Next bill: Telenor 649 NOK in 3 days
- Concern: User uploaded a collection notice. Summary: [pre-extracted key info]
User's question: 'Am I going to be okay this month?'"
```

This approach:
- Reduces tokens (saves money)
- Minimizes PII exposure to external API
- Keeps raw financial data within your EU-hosted Supabase
- Claude gets enough context to give meaningful advice

### 5.3 Anthropic Claude API — Privacy Position

For the API (which you'll use), key facts:
- API data is NOT used for model training
- API logs are retained for 7 days (as of September 2025), then auto-deleted
- Anthropic offers a Data Processing Addendum (DPA) with Standard Contractual Clauses (SCCs) — automatically incorporated into Commercial Terms of Service
- Zero-Data-Retention (ZDR) mode is available as an optional addendum for maximum privacy
- Data may be processed in the US — this is why the "Context Windowing" strategy above is essential: minimize what crosses the Atlantic

**Recommendation for personal use:** Standard API with DPA is sufficient. If you go public, evaluate ZDR mode.

### 5.4 Neonomics — Security Model

- All bank authentication happens through BankID (Norway's national eID) — you NEVER see or store bank passwords
- Neonomics is licensed by Finanstilsynet as AISP/PISP
- PSD2 Strong Customer Authentication (SCA) is required for every bank connection
- User consent is valid up to 180 days, then must be refreshed
- User can revoke consent at any time
- Data is transmitted over encrypted channels (TLS)
- You receive read-only access (Account Information Service) — you cannot move money

### 5.5 GDPR Compliance Checklist (For Personal Tool → Future Public)

Even for personal use, building these in from the start:

- [ ] **Supabase in EU region** (Frankfurt or Ireland)
- [ ] **Supabase DPA signed**
- [ ] **Anthropic API DPA** (automatic with commercial terms)
- [ ] **Data minimization** — only collect what you actually need
- [ ] **Purpose limitation** — financial analysis and guidance only
- [ ] **Encryption at rest** — Supabase default
- [ ] **Encryption in transit** — HTTPS everywhere (Vercel default)
- [ ] **Right to deletion** — user can delete all their data (build the API endpoint)
- [ ] **Right to access** — user can export all their data (build the export function)
- [ ] **Consent management** — clear explanation of what data is accessed and why
- [ ] **Data retention policy** — auto-delete old transaction data after X months (user configurable)
- [ ] **No third-party analytics** — no Google Analytics, no tracking pixels (for privacy-first positioning)

For public launch, additionally:
- [ ] **Privacy Policy** (Norwegian + English)
- [ ] **Terms of Service**
- [ ] **Data Protection Impact Assessment (DPIA)** — required by Datatilsynet for high-risk processing
- [ ] **Cookie consent** (if any cookies beyond strictly necessary)
- [ ] **DPO consideration** — may need a Data Protection Officer if processing data at scale

---

## 6. AI SYSTEM DESIGN

### 6.1 The Aura System Prompt (Core Personality)

The Claude API will be called with a carefully crafted system prompt that defines Aura's personality and knowledge. This is the MOST IMPORTANT piece of the project — it determines how Aura feels to interact with.

**System prompt structure:**

```
1. IDENTITY
   "You are Aura, a personal financial guardian for a Norwegian user..."

2. PERSONALITY RULES
   - Warm, direct, never condescending
   - Use Norwegian financial terms naturally (BSU, Lånekassen, Skattemelding, etc.)
   - Frame bad news constructively
   - Never shame spending
   - Celebrate small wins

3. KNOWLEDGE BASE
   - Norwegian consumer protection laws (injected as reference)
   - Current tax rules and deduction categories
   - Common financial products (BSU, ASK, fondssparing)
   - Debt collection procedure (Inkassoloven)
   - Tenancy rights (Husleieloven)
   
4. FINANCIAL CONTEXT (Dynamic — injected per message)
   - User's current financial snapshot
   - Recent transactions summary
   - Upcoming bills
   - Active concerns or issues

5. CONSTRAINTS
   - "You are NOT a lawyer. Always state this when giving legal information."
   - "You are NOT a licensed financial advisor. Frame suggestions as information, not recommendations."
   - "Never reveal raw account numbers or sensitive identifiers in responses."
   - "If you're unsure about a legal point, say so and suggest the user verify on Lovdata.no or consult an advokat."
```

### 6.2 Conversation Architecture

```
User sends message
        ↓
Next.js API route receives it
        ↓
Fetch user's current financial context from Supabase
(balance, recent transactions summary, upcoming bills, active issues)
        ↓
Build Claude API request:
  - System prompt (Aura personality + Norwegian law reference)
  - Financial context (summarized, not raw)
  - Last N messages of conversation history
  - User's new message
        ↓
Claude API responds
        ↓
Store message + response in chat_messages table
        ↓
Return response to user
        ↓
If response contains actionable items (e.g., "move 649 kr"),
create a suggested_action record for the dashboard
```

### 6.3 Document Analysis Flow

```
User uploads a document (photo/PDF of a letter)
        ↓
Store in Supabase Storage (encrypted at rest)
        ↓
Extract text (OCR if image — use Tesseract or Claude Vision)
        ↓
Send extracted text to Claude with specialized prompt:
  "Analyze this Norwegian financial/legal document.
   Identify: sender, type, amounts, deadlines, required actions.
   Check against known legal requirements (inkasso procedure, etc.)
   Explain in plain language what this means for the user.
   If any legal violations are detected, explain them clearly
   with reference to the specific law section."
        ↓
Store AI summary and flags in documents table
        ↓
Present to user with clear next steps
```

---

## 7. UI/UX DESIGN

### 7.1 Layout Structure

```
┌─────────────────────────────────────────────────┐
│  AURA — Top Nav (logo, settings, partner toggle) │
├──────────────┬──────────────────────────────────┤
│              │                                    │
│  Sidebar     │  Main Content Area                │
│  Navigation  │                                    │
│              │  Dashboard / Chat / Documents /    │
│  • Dashboard │  Legal / Settings                  │
│  • Chat      │                                    │
│  • Documents │                                    │
│  • Legal     │                                    │
│  • Settings  │                                    │
│              │                                    │
├──────────────┴──────────────────────────────────┤
│  Mobile: Bottom tab navigation                    │
└─────────────────────────────────────────────────┘
```

### 7.2 Key Screens

**Dashboard (Home)**
- Financial health score (simple: green/yellow/red)
- "Safe to spend today" number (big, prominent)
- Upcoming bills countdown
- Recent spending mini-chart
- Aura's daily tip/observation
- Partner combined view toggle

**Chat**
- Full-screen conversational interface
- Message bubbles with Aura's avatar
- Quick action buttons for common queries ("How am I doing?", "What bills are coming?", "Help me with this letter")
- Ability to attach documents mid-conversation

**Documents Vault**
- List of uploaded documents with AI summaries
- Filter by type (contracts, letters, tax, invoices)
- Upload button (camera for mobile, file picker for desktop)
- Status indicators (needs attention / reviewed / resolved)

**Legal Help**
- Browse common situations (received inkasso, landlord raised rent, etc.)
- Template letter generator
- Step-by-step guides for common procedures
- Always with legal disclaimers

### 7.3 Design Principles

- **Dark mode default** (calming, premium feel — financial anxiety is real)
- **Minimal data density** — don't overwhelm. Show the ONE number that matters most.
- **Progressive disclosure** — summary first, details on tap/click
- **Mobile-first** — most financial stress happens on your phone at 11pm
- **Accessibility** — WCAG 2.1 AA minimum (this is a tool for everyone)
- **English language first** — UI in English, responds in whatever language the user writes
- **No gamification** — this is serious money. No confetti for saving 50 kr.

### 7.4 Color Palette Suggestion

| Purpose | Color | Hex |
|---------|-------|-----|
| Primary (Aura's identity) | Deep teal | #0D7377 |
| Background (dark mode) | Near-black | #121218 |
| Surface | Dark gray-blue | #1C1C28 |
| Safe/positive | Muted green | #2D8B6F |
| Warning | Warm amber | #D4A039 |
| Danger/urgent | Muted red | #C75050 |
| Text primary | Off-white | #E8E8EC |
| Text secondary | Gray | #8888A0 |

---

## 8. NEONOMICS INTEGRATION GUIDE

### 8.1 Getting Started

1. **Sign up** at developer.neonomics.io — free sandbox account
2. **Create an application** — select both Account Data and Payment Initiation
3. **Get Client ID and Secret ID** — needed for all API calls
4. **Test in sandbox** — sandbox creates mock bank accounts with test data

### 8.2 Key API Flow

```
1. Authenticate → POST /auth/.../token → get access_token
2. List banks → GET /ics/v3/banks → get bank IDs (DNB, Nordea, etc.)
3. Create session → POST /ics/v3/sessions → create user<>bank session
4. Get consent → GET /consent/{sessionId} → redirect user to BankID
5. User authenticates with BankID → consent granted
6. Get accounts → GET /ics/v3/accounts → list all accounts
7. Get balances → GET /ics/v3/accounts/{id}/balances
8. Get transactions → GET /ics/v3/accounts/{id}/transactions
```

### 8.3 Important Constraints

- **Consent expires:** Up to 180 days, then user must re-authenticate via BankID
- **Rate limits:** Follow Neonomics rate limiting headers
- **Sandbox vs Live:** Sandbox uses mock data. Live requires a signed agreement with Neonomics.
- **x-device-id:** Required header — use a UUID per user/device
- **Data freshness:** Don't poll constantly. Sync on app open + every few hours.

### 8.4 Going Live (When Ready for Real Data)

For personal use, you will need to:
1. Contact Neonomics about going live with your own accounts
2. Sign their commercial agreement
3. They will manage some dashboard functions in the live version
4. Expect ~4 weeks from integration to go-live according to their onboarding process

---

## 9. PARTNER/SHARED ECONOMY DESIGN

### 9.1 How It Works

- Each partner has their own full Aura account with their own bank connection
- A "link" relationship is created between the two accounts
- Each partner chooses which accounts to share visibility on
- Shared view shows combined balances and joint expenses
- Individual spending remains private unless explicitly shared

### 9.2 Privacy Controls

- **Granular sharing:** Share specific accounts, not everything
- **Permission levels:** View-only (see balances/spending) or Full (see transaction details)
- **Instant revoke:** Either partner can unlink at any time
- **No data mixing:** Each partner's data stays in their own user scope. The shared view is a READ operation that queries both users' data (with RLS permission).

### 9.3 Shared Features

- Combined "safe to spend" number
- Joint bill tracking
- "Household" spending category
- Partner financial health overview (if permitted)

---

## 10. BUILD PLAN

### Phase 0: Foundation (Week 1-2)
- [ ] Set up Next.js project with TypeScript
- [ ] Configure Supabase (EU region, auth, initial schema)
- [ ] Set up Vercel deployment (connect Git repo, auto-deploy on push)
- [ ] Implement basic auth (email/password to start)
- [ ] Create layout shell (sidebar, main content, responsive)
- [ ] Set up Tailwind + shadcn/ui components
- [ ] Create basic database tables with RLS

### Phase 1: The Companion (Week 3-6)
- [ ] Integrate Claude API with system prompt
- [ ] Build chat interface (messages, input, history)
- [ ] Connect Neonomics sandbox (mock bank data)
- [ ] Build financial context builder (summarizes bank data for AI)
- [ ] Create dashboard with financial snapshot
- [ ] Implement spending categorization (AI-assisted)
- [ ] Build bill countdown feature
- [ ] Create basic daily check-in message

### Phase 2: The Analyst (Week 7-10)
- [ ] Spending trends charts (use Recharts)
- [ ] Subscription detector (recurring transaction analysis)
- [ ] Safe-to-spend calculator
- [ ] Anomaly detection (compare against historical patterns)
- [ ] Income tracking
- [ ] Partner linking system
- [ ] Shared economy dashboard

### Phase 3: The Lawyer (Week 11-14)
- [ ] Document upload and storage
- [ ] OCR/text extraction pipeline
- [ ] Document analysis with Claude
- [ ] Legal template database (inkasso responses, dispute letters)
- [ ] Letter generator with placeholder filling
- [ ] Rights information database
- [ ] Inkasso procedure checker

### Phase 4: The Optimizer (Week 15-18)
- [ ] Tax deduction scanner
- [ ] BSU tracking and optimization
- [ ] Skattemelding estimation
- [ ] Gold/silver price tracker
- [ ] Investment education content
- [ ] Formueskatt awareness

### Phase 5: Polish & Go Live (Week 19-22)
- [ ] Connect real bank data (Neonomics live)
- [ ] Security audit and penetration testing
- [ ] Performance optimization
- [ ] Error handling and edge cases
- [ ] User onboarding flow
- [ ] Privacy policy and terms
- [ ] DPIA (if going public)

---

## 11. NORWEGIAN LEGAL REFERENCE DATABASE

These laws form Aura's legal knowledge. They are PUBLIC and available on Lovdata.no.

| Law | Norwegian Name | Relevance |
|-----|---------------|-----------|
| Debt Collection Act | Inkassoloven | Collection procedure, inkassovarsel requirements, consumer rights |
| Tenancy Act | Husleieloven | Rent increase limits, tenant rights, deposit rules |
| Financial Contracts Act | Finansavtaleloven | Consumer credit rights, bank obligations, setoff rules |
| Interest on Overdue Payments Act | Forsinkelsesrenteloven | Maximum late payment interest rates |
| Consumer Purchase Act | Forbrukerkjøpsloven | Rights when buying goods/services |
| Marketing Control Act | Markedsføringsloven | Protection against aggressive marketing/sales |
| Tax Administration Act | Skatteforvaltningsloven | Tax return obligations and rights |
| National Insurance Act | Folketrygdloven | NAV benefits, sick leave, unemployment |
| Enforcement Act | Tvangsfullbyrdelsesloven | Asset seizure rules, namsmann procedures |
| Debt Settlement Act | Gjeldsordningsloven | Personal bankruptcy/debt settlement procedures |

**UPDATE NOTE (Jan 2026):** New debt collection rules took effect January 1, 2026. Several collection authorities have been merged into the Collection Authority in the Tax Administration. Verify all inkasso-related guidance against current Skattetaten.no documentation.

---

## 12. COST ESTIMATE (Personal Use)

| Service | Monthly Cost |
|---------|-------------|
| Supabase (free tier) | 0 kr |
| Vercel (free tier) | 0 kr |
| Anthropic Claude API (estimated ~100 messages/day) | ~200-400 kr |
| Neonomics (pricing depends on agreement) | TBD — contact for personal/small use |
| Domain name (optional) | ~100 kr/year |
| **Total estimated** | **~200-500 kr/month** |

---

## 13. RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Neonomics doesn't offer affordable personal-use access | Can't read bank data live | Start with CSV import as fallback; manual bank data entry |
| Claude API costs escalate | Budget issue | Implement token tracking, use summarization to reduce context size, cache common responses |
| Legal information becomes outdated | Bad advice | Date-stamp all legal references, build a "last verified" system, encourage users to verify on Lovdata |
| Supabase free tier limits hit | Need to pay | Budget ~$25/month for Pro tier — well within acceptable costs |
| Partner feature creates privacy conflicts | Relationship issues | Clear consent flow, granular permissions, easy unlink |
| GDPR complaint (if going public) | Legal exposure | Build privacy-first from day 1, get DPIA done, consider a lawyer review before public launch |

---

## 14. WHAT THIS DOCUMENT IS FOR

This document serves as the **complete context file** for Claude Code agents. When you start building, you will:

1. Feed this document as context to Claude Code
2. Work through the build plan phase by phase
3. Reference the data architecture for database setup
4. Use the security section to validate every design decision
5. Reference the Neonomics guide for API integration

A companion document (**AURA-TECHNICAL-SPEC.md**) contains the specific technical implementation details, code patterns, and file structure for the Claude Code agent.

---

*End of Aura Project Definition v1.0*
