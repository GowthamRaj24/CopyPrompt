# 04 — Technical Flows

> What the system does under the hood for each user action. Sequence diagrams + step-by-step technical walkthroughs.

## Flow Index
1. [Instant Search](#1-instant-search)
2. [Copy Prompt (with Telemetry)](#2-copy-prompt)
3. [Image Upload (Direct to R2)](#3-image-upload)
4. [Submission + Moderation Pipeline](#4-submission--moderation-pipeline)
5. [SSR + ISR Rendering for SEO](#5-ssr--isr-rendering)
6. [Auth Flow (Supabase OAuth)](#6-auth-flow)
7. [Razorpay Subscription Lifecycle](#7-razorpay-subscription-lifecycle)
8. [Free Flux Image Generation (Together AI)](#8-free-flux-image-generation)
9. [Favorites Sync (Anon → Logged-In)](#9-favorites-sync)
10. [Trending Refresh (Cron)](#10-trending-refresh)

---

## 1. Instant Search

The hot path. Should resolve in under 200ms p95.

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant CDN as Vercel Edge CDN
    participant API as Next.js API Route
    participant DB as Supabase Postgres

    U->>B: Types "cinematic portrait" in SearchBox
    B->>B: Debounce 200ms (useDeferredValue)
    B->>B: Cancel any in-flight request<br/>via AbortController
    B->>CDN: GET /api/search?q=cinematic+portrait&model=flux
    
    CDN->>CDN: Check edge cache<br/>(key = full URL, TTL 60s)
    
    alt Cache hit
        CDN-->>B: Cached JSON (2-10ms total)
    else Cache miss
        CDN->>API: Forward request
        API->>API: Parse + validate query params
        API->>API: Build SQL query (ts_rank + filters)
        API->>DB: SELECT with FTS, JOIN images, LIMIT 24
        DB-->>API: Rows (20-80ms typical)
        API->>API: Shape JSON response
        API-->>CDN: 200 OK with Cache-Control: s-maxage=60
        CDN->>CDN: Store in edge cache
        CDN-->>B: JSON
    end
    
    B->>B: useTransition() to keep input responsive
    B->>U: Render result grid
    
    Note over B: Hover on card<br/>= prefetch detail page
```

### Key Implementation Details
- **`websearch_to_tsquery`** parses Google-style queries (quotes, OR, -negation)
- **`ts_rank` weighting:** title (A) 1.0, prompt_text (B) 0.4, tips (C) 0.2
- **`AbortController`** cancels stale requests when user keeps typing
- **`useTransition`** ensures the input stays responsive even on slow renders
- **Edge cache key** includes full query string, so different filter combos cache independently
- **Pagination** via `OFFSET` is fine up to ~100 pages; beyond that switch to keyset pagination

### Performance Budgets
- p50: < 80ms
- p95: < 200ms
- p99: < 400ms

### Failure Modes
| Failure | Handling |
|---------|----------|
| DB timeout | Return 503; client shows "Search slow, retrying" toast and retries once |
| Edge cache miss + DB slow | Stream a fast empty placeholder, then hydrate when DB responds |
| Network drop | Show last-cached results; banner "You may be offline" |

---

## 2. Copy Prompt

The most-clicked button on the site. Designed for **zero-blocking UX** — feedback is instant, telemetry is fire-and-forget.

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant API as /api/prompts/[id]/copy
    participant DB as Postgres

    U->>B: Clicks Copy button<br/>(or presses C)
    B->>B: navigator.clipboard.writeText(promptText)
    B->>U: Show toast: "Prompt copied!" (lime)
    
    Note over B,API: Fire-and-forget telemetry<br/>(no await — never blocks UX)
    
    par Telemetry call
        B->>API: POST /api/prompts/[id]/copy<br/>headers: { x-session-id: cookie }
    and User starts using copy
        U->>U: Switches to Flux/MJ tab, pastes
    end
    
    API->>API: Rate-limit check (1 copy per session per prompt)
    API->>DB: UPDATE prompts SET copy_count = copy_count + 1
    API->>API: Throttled revalidation:<br/>If copy_count crosses 10x boundary,<br/>revalidatePath('/prompt/[slug]')
    API-->>B: 204 No Content
```

### Why Fire-and-Forget
- Clipboard write is synchronous in browsers — toast shows immediately
- Backend POST happens in parallel; if it fails, user doesn't care, the copy already worked
- This makes the experience feel instant even on slow networks

### Anti-Spam
- Session cookie tracks copies per prompt; only first counts
- Optional: increment a per-IP counter daily; if > 100 copies/min from one IP, return 429
- The counter is *intentionally fuzzy* — a 1% inflation is fine; this isn't a financial system

### Keyboard Shortcut
```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'c' && !e.metaKey && !e.ctrlKey 
        && document.activeElement?.tagName !== 'INPUT'
        && document.activeElement?.tagName !== 'TEXTAREA') {
      copyPrompt();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [promptText]);
```

---

## 3. Image Upload

Direct-to-R2 upload with presigned URLs. **The browser uploads directly to Cloudflare** — never through your server.

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant API as /api/upload
    participant R2 as Cloudflare R2
    participant DB as Postgres

    U->>B: Drops image into form
    B->>B: Client-side validation:<br/>size < 10MB, type in [jpg,png,webp],<br/>dim 512-4096
    B->>B: Show preview thumbnail (FileReader)
    
    B->>API: POST /api/upload<br/>{ filename, mimetype, size }
    API->>API: Auth + rate-limit check<br/>(5 uploads/min per user)
    API->>API: Generate unique R2 key<br/>uploads/[userId]/[uuid].[ext]
    API->>R2: Generate presigned PUT URL (5min TTL)
    R2-->>API: presignedUrl
    API-->>B: { presignedUrl, finalUrl, key }
    
    B->>R2: PUT to presignedUrl<br/>with image bytes<br/>(direct upload, no server hop)
    R2-->>B: 200 OK
    
    B->>B: Update form state<br/>imageKeys.push(key)
    
    Note over B,API: When user submits the form...
    
    B->>API: POST /api/submit<br/>{ ...formData, imageKeys: [...] }
    API->>API: Validate keys belong to this user<br/>(prevents stealing others' uploads)
    API->>R2: HEAD each key to verify<br/>(file exists, size matches expected)
    API->>DB: INSERT INTO submissions<br/>{ status: 'pending', prompt_data: {...} }
    API-->>B: 201 Created
```

### Why Direct-to-R2 (vs through your server)
- **Bandwidth:** Vercel functions have a 4.5 MB body limit on Hobby tier; large images would fail
- **Cost:** Zero egress through your serverless function = lower bills
- **Speed:** User uploads to nearest CF edge directly = faster than via Vercel
- **Memory:** Your function never holds the bytes = less memory pressure

### Security
- Presigned URL has 5-minute TTL
- Path includes `userId` so a malicious user can't write to others' folders
- Server validates `ownership` of the key by reading the path before linking it to a submission
- Cloudflare bucket has CORS restricted to your domain

### On Submission Approval
```mermaid
sequenceDiagram
    participant Admin as You (Admin)
    participant API as /api/admin/submissions/[id]/approve
    participant R2 as R2
    participant CFI as Cloudflare Images
    participant DB as Postgres

    Admin->>API: POST approve
    API->>DB: SELECT submission
    API->>R2: COPY uploads/[uid]/[id].jpg<br/>→ prompts/[promptId]/[i].jpg
    API->>CFI: Trigger variant generation<br/>(thumb, card, hero, og)
    CFI-->>API: Variant URLs
    API->>DB: BEGIN<br/>INSERT INTO prompts<br/>INSERT INTO images<br/>INSERT INTO prompt_tags<br/>UPDATE submissions SET status='approved'<br/>COMMIT
    API->>API: revalidatePath('/category/...'),<br/>revalidatePath('/model/...')
    API->>Resend: Send approval email
    API-->>Admin: 200 OK
```

---

## 4. Submission + Moderation Pipeline

```mermaid
flowchart TB
    A[User fills /submit form] --> B[Direct upload to R2 via presigned URLs]
    B --> C[POST /api/submit]
    C --> D[Validate + store in submissions<br/>status='pending']
    D --> E[Admin sees in /admin/queue]
    E --> F{Decision}
    F -->|Approve| G[Server transaction:<br/>1. Copy R2 keys<br/>2. Insert prompt<br/>3. Insert images<br/>4. Insert tags<br/>5. Trigger CF Images variants<br/>6. Email user]
    F -->|Approve with edits| H[Admin tweaks fields<br/>→ same as Approve]
    F -->|Reject| I[Mark rejected with reason<br/>→ Email user reason]
    G --> J[revalidatePath fires<br/>→ ISR pages refresh]
    H --> J
    I --> K[Done]
    J --> L[Live on site, indexed by Google]
```

### Idempotency
The approve operation is wrapped in a Postgres transaction. If anything fails (e.g. CF Images is down), the entire approval rolls back and the admin can retry.

### Race Conditions
- Two admins approving simultaneously → use `SELECT ... FOR UPDATE` on the submission row
- Slug collision → submission stores a tentative slug; on approve, server appends `-2`, `-3` etc. if taken

---

## 5. SSR + ISR Rendering

Pre-rendered HTML is **the SEO superpower**. Detail pages are statically generated then revalidated periodically.

```mermaid
sequenceDiagram
    participant G as Google Bot or User
    participant CDN as Vercel Edge
    participant ISR as ISR Layer
    participant SSR as Next.js Server
    participant DB as Postgres

    G->>CDN: GET /prompt/cinematic-cyberpunk-portrait
    CDN->>ISR: Check static cache
    
    alt Fresh (< 1hr since last regen)
        ISR-->>CDN: Cached HTML
        CDN-->>G: 200 + HTML (10-50ms total)
    else Stale or never generated
        ISR-->>CDN: Stale-while-revalidate signal
        CDN-->>G: 200 + Stale HTML (instant)
        Note over CDN,SSR: Background regeneration
        CDN->>SSR: Trigger regen
        SSR->>DB: SELECT prompt + images + tags + related
        DB-->>SSR: Data
        SSR->>SSR: Render React Server Components<br/>+ generateMetadata (OG, schema.org)
        SSR-->>ISR: Fresh HTML
        ISR->>ISR: Update cache (TTL 1hr)
    end
    
    Note over G,CDN: Subsequent requests get fresh HTML in 10ms
```

### Why ISR (Not pure SSR)
- **5,000+ pages** can't all be SSG'd at build time (slow builds, expensive)
- **ISR pre-renders on first hit**, then serves cache for 1hr → 99% of requests skip the DB entirely
- **Stale-while-revalidate** means even cache miss returns instantly (with stale content) and refreshes in background

### On-Demand Revalidation
Triggered when:
- New submission approved → `revalidatePath('/category/[slug]')`
- Prompt copy_count crosses 10x threshold → `revalidatePath('/prompt/[slug]')` to update display count
- Daily cron at 3 AM → revalidate homepage trending grid

### Schema.org Markup Embedded
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ImageObject",
  "name": "Cinematic Cyberpunk Portrait",
  "description": "...",
  "contentUrl": "https://cdn.fluxprompts.io/...",
  "creator": { "@type": "Organization", "name": "CopyPrompt" },
  "license": "https://fluxprompts.io/license"
}
</script>
```

---

## 6. Auth Flow

Supabase Auth via OAuth. Magic links also supported as fallback.

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant App as Next.js (Server)
    participant SB as Supabase Auth
    participant Google as Google OAuth

    U->>B: Clicks "Sign in with Google"
    B->>App: GET /api/auth/signin?provider=google
    App->>SB: createClient.auth.signInWithOAuth({ provider: 'google' })
    SB-->>App: { url: googleOAuthUrl }
    App-->>B: 302 Redirect to Google
    
    B->>Google: User logs in + grants consent
    Google-->>B: 302 Redirect to /auth/callback?code=...
    
    B->>App: GET /auth/callback?code=...
    App->>SB: exchangeCodeForSession(code)
    SB-->>App: { session: { access_token, refresh_token, user } }
    App->>App: Set HttpOnly cookies<br/>(sb-access-token, sb-refresh-token)
    App-->>B: 302 Redirect to home (or original page)
    
    Note over B,App: Subsequent requests include session cookie
    
    B->>App: GET /favorites (with cookie)
    App->>App: createServerClient() reads cookie
    App->>SB: getUser() to verify
    SB-->>App: { user: { id, email, ... } }
    App->>DB: SELECT favorites WHERE user_id = $1
    DB-->>App: Rows
    App-->>B: HTML with user's favorites
```

### Session Storage
- Tokens stored in **HttpOnly Secure cookies** (XSS-safe, CSRF-token-protected)
- Access token TTL: 1 hour
- Refresh token TTL: 30 days, sliding window
- On expiry, middleware silently refreshes via Supabase client

### Magic Link Fallback
For users who don't want OAuth:
1. User enters email → POST `/api/auth/magic-link`
2. Server calls `supabase.auth.signInWithOtp({ email })`
3. Resend delivers email with link
4. Click link → `/auth/callback?token_hash=...&type=magiclink`
5. Same callback handler exchanges for session

### Anonymous Mode
Most of the site works without auth. Auth is only required for:
- `/submit` (optional — allow anon with email)
- `/favorites/sync`
- `/account/*`
- `/admin/*`

---

## 7. Razorpay Subscription Lifecycle

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant App as Next.js
    participant RZ as Razorpay
    participant DB as Postgres

    U->>B: Clicks "Get Premium" on /pricing
    B->>App: POST /api/billing/checkout<br/>{ plan: 'premium_monthly' }
    App->>App: Auth check (must be logged in)
    App->>RZ: Create subscription<br/>(plan_id, customer_email)
    RZ-->>App: { subscription_id, short_url }
    App-->>B: { razorpay_key, subscription_id }
    
    B->>B: Open Razorpay Checkout modal<br/>(JS SDK)
    U->>B: Pays via card or UPI
    B->>RZ: Submit payment
    RZ-->>B: { razorpay_payment_id, signature }
    B->>App: POST /api/billing/verify<br/>{ payment_id, subscription_id, signature }
    App->>App: Verify HMAC signature<br/>using webhook secret
    App->>DB: UPDATE users SET<br/>razorpay_customer_id, razorpay_subscription_id<br/>(plan stays 'free' until webhook confirms)
    App-->>B: 200 OK
    B->>U: Redirect /account/billing?success=1
    
    Note over RZ,App: Asynchronously...
    
    RZ->>App: POST /api/razorpay/webhook<br/>event: subscription.activated
    App->>App: Verify HMAC signature<br/>(reject if invalid)
    App->>DB: UPDATE users SET plan='premium'
    App-->>RZ: 200 OK
```

### Webhook Events We Handle
| Event | Action |
|-------|--------|
| `subscription.activated` | Set `plan = 'premium'` |
| `subscription.charged` | Log payment for billing history |
| `subscription.halted` | Failed payment retries exhausted → `plan = 'free'`, send email |
| `subscription.cancelled` | User canceled → `plan = 'free'` at period end |
| `payment.failed` | Log; Razorpay handles retries |

### Idempotency
- Razorpay sends webhooks at-least-once → we dedupe by `event.id` in a `webhook_events` table
- All updates use `ON CONFLICT DO NOTHING` for idempotent inserts

### Verification (Critical Security)
```typescript
const expected = crypto
  .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex');
if (expected !== request.headers.get('x-razorpay-signature')) {
  return new Response('Invalid signature', { status: 401 });
}
```

---

## 8. Free Flux Image Generation

How we generate seed images for ₹0 using Together AI's free Flux Schnell tier.

```mermaid
sequenceDiagram
    participant Admin as You (Admin)
    participant Script as seed-script.ts
    participant Together as Together AI Free
    participant R2 as Cloudflare R2
    participant DB as Postgres

    Admin->>Script: npm run seed:flux<br/>(with prompts.json: 50 prompt ideas)
    
    loop For each prompt
        Script->>Together: POST /v1/images/generations<br/>{ model: 'flux-schnell-free',<br/>  prompt: '...', n: 1 }
        Together-->>Script: { url: 'https://...' or b64_json }
        Script->>Script: Download image
        Script->>R2: PUT prompts/[uuid].jpg
        Script->>DB: INSERT prompt + image rows<br/>status='draft'
        Script->>Script: Sleep 1s (rate limit)
    end
    
    Note over Script: Done — 50 prompts seeded for free
    Script-->>Admin: Summary: 50 generated, 0 errors
    
    Admin->>DB: Bulk update status='published'<br/>after manual quality check
```

### Free Tier Limits (Together AI)
- 60 RPM (1 request/second)
- 6,000 RPD (6,000 images/day)
- Plenty for 200/month seeding

### Backup: Pollinations.ai
For when you want zero-auth, instant generation:
```typescript
const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&nologo=true`;
// fetch + save to R2
```

### Quality Tier (Optional, Paid)
For "hero" prompts where you want Flux Dev quality:
- Use fal.ai or Replicate ($1 free signup credits)
- ~₹2/image
- Reserve for top 50 most-featured prompts

---

## 9. Favorites Sync (Anon → Logged-In)

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant App as Next.js
    participant DB as Postgres

    Note over U,B: Anonymous browsing
    U->>B: Clicks heart on prompt
    B->>B: localStorage.setItem('cp:favs',<br/>[...existing, promptId])
    B->>U: Heart fills, toast shown
    
    Note over U,B: User decides to sign up
    U->>B: Sign up via Google
    B->>App: OAuth callback
    App-->>B: Logged in, session cookie set
    
    Note over B,App: Post-signup hook
    B->>B: Read localStorage favorites
    
    alt Has localStorage favorites
        B->>App: POST /api/favorites/sync<br/>{ promptIds: [...] }
        App->>DB: INSERT INTO favorites (user_id, prompt_id)<br/>VALUES ... ON CONFLICT DO NOTHING
        DB-->>App: Inserted count
        App-->>B: { synced: 12 }
        B->>B: Clear localStorage<br/>(now source of truth is DB)
        B->>U: Toast: "12 favorites synced!"
    end
```

---

## 10. Trending Refresh (Cron)

Computed once per hour, cached for everyone.

```mermaid
sequenceDiagram
    participant Cron as Vercel Cron
    participant App as /api/cron/trending
    participant DB as Postgres
    participant Cache as Edge Cache

    Note over Cron: Every hour at :00
    Cron->>App: GET (with cron-secret header)
    App->>App: Verify CRON_SECRET header
    App->>DB: SELECT prompts ranked by<br/>(copy_count_last_7d * 0.5 +<br/> upvote_rate * 0.3 +<br/> recency_score * 0.2)<br/>LIMIT 50
    DB-->>App: Top 50 prompts
    App->>DB: UPDATE trending_snapshot SET payload = $1
    App->>Cache: revalidateTag('trending')
    App-->>Cron: 200 OK
    
    Note over Cache: Subsequent /api/trending<br/>requests get fresh data instantly
```

### Why Snapshot Table (Not Live Query)
- Trending query joins multiple tables and does aggregation → ~200-500ms
- Running it on every homepage hit would crush DB at scale
- Snapshot table lets `/api/trending` be a simple `SELECT * FROM trending_snapshot` (~5ms)

### Vercel Cron Configuration
```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/trending", "schedule": "0 * * * *" },
    { "path": "/api/cron/sitemap-refresh", "schedule": "0 3 * * *" },
    { "path": "/api/cron/keepalive-supabase", "schedule": "0 */3 * * *" }
  ]
}
```

> **Note:** The `keepalive-supabase` cron is a workaround for the Supabase free tier's 7-day inactivity pause. A simple `SELECT 1` every 3 hours keeps it warm.

---

**Next:** [05-UI-MOCKUPS.md](./05-UI-MOCKUPS.md) — what every screen looks like (ASCII layouts + component specs).
