# 05 — UI Mockups (ASCII Layouts)

> Visual structure of every key screen. ASCII layouts + component breakdowns. Lexica-style: dark, image-dense, minimal chrome.

## Design System Quick Reference

| Token | Value | Usage |
|-------|-------|-------|
| Background | `zinc-950` (#09090b) | Page bg |
| Surface | `zinc-900` (#18181b) | Card bg |
| Border | `zinc-800` (#27272a) | Subtle borders |
| Text Primary | `zinc-100` (#f4f4f5) | Body text |
| Text Secondary | `zinc-400` (#a1a1aa) | Captions, meta |
| Accent | `lime-400` (#a3e635) | CTAs, hearts, active states |
| Mono | JetBrains Mono | Prompt text only |
| Sans | Inter | Everything else |

**Mobile breakpoint:** 768px. Below: single-column, sticky bottom action bar.

## Page Index

1. [Homepage](#1-homepage)
2. [Search Results](#2-search-results)
3. [Prompt Detail Page](#3-prompt-detail-page) ⭐
4. [Submit Form](#4-submit-form)
5. [Model / Category Pages](#5-model--category-pages)
6. [Pricing Page](#6-pricing-page)
7. [Favorites Page](#7-favorites-page)
8. [Account & Billing](#8-account--billing)
9. [Admin Queue](#9-admin-queue)
10. [Mobile Adaptations](#10-mobile-adaptations)

---

## 1. Homepage

**URL:** `/`
**Goal:** Get the user to start searching within 2 seconds.

### Desktop Layout

```
┌─ Sticky Header (h-14, border-b zinc-800) ─────────────────────────────────────┐
│  [LOGO] CopyPrompt    [mini search bar - shows on scroll]    Submit   Login   │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Hero Section (h-screen-minus-header on first paint) ─────────────────────────┐
│                                                                                │
│                                                                                │
│             Find the perfect Flux prompt in seconds.                          │
│        text-5xl font-semibold zinc-100, then text-xl zinc-400 below           │
│                                                                                │
│        Free, fast, copy-paste ready. No signup needed.                        │
│                                                                                │
│   ┌──────────────────────────────────────────────────────────────────┐        │
│   │ [search-icon]  Search 5,000+ Flux prompts...         [Cmd+K]     │        │
│   └──────────────────────────────────────────────────────────────────┘        │
│   h-14 rounded-2xl, zinc-900 bg, ring-1 zinc-800, focus:ring-lime-400         │
│                                                                                │
│   [All]  [Cinematic]  [Portrait]  [Product]  [Logo]  [Anime]  [Architecture]  │
│   pill buttons, h-9 rounded-full, hover:bg-zinc-800                           │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Trending Section ────────────────────────────────────────────────────────────┐
│  ─── Trending today ──────────────────────── See all →                        │
│                                                                                │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐                   │
│  │           │  │           │  │           │  │           │                   │
│  │   IMAGE   │  │   IMAGE   │  │   IMAGE   │  │   IMAGE   │                   │
│  │  (1:1     │  │           │  │           │  │           │                   │
│  │   blurhash│  │           │  │           │  │           │  ♥                │
│  │   placeholder)            │  │           │  │           │                   │
│  │           │  │           │  │           │  │           │                   │
│  │ ♥         │  │ ♥         │  │ ♥         │  │ ♥         │                   │
│  ├───────────┤  ├───────────┤  ├───────────┤  ├───────────┤                   │
│  │ Cinematic │  │ Cyberpunk │  │ Product   │  │ Cosmic    │                   │
│  │ portrait  │  │ alley     │  │ photo     │  │ portrait  │                   │
│  │ Flux Dev  │  │ Flux Dev  │  │ Flux Dev  │  │ Flux Dev  │                   │
│  │ 2.4k 📋   │  │ 1.8k 📋   │  │ 1.5k 📋   │  │ 1.2k 📋   │                   │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘                   │
│                                                                                │
│  (4 more cards in row 2 for desktop)                                          │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Prompt of the Day ───────────────────────────────────────────────────────────┐
│  ─── Prompt of the Day ────────────────────                                   │
│  ┌──────────────────────────────────────────────────────────────────┐         │
│  │                          │                                        │         │
│  │      LARGE HERO          │   Cinematic Cyberpunk Portrait        │         │
│  │      IMAGE 16:9          │                                        │         │
│  │                          │   "moody neon-lit portrait of a..."   │         │
│  │                          │                                        │         │
│  │                          │   [▸ View prompt]                     │         │
│  └──────────────────────────────────────────────────────────────────┘         │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Browse by Model ─────────────────────────────────────────────────────────────┐
│  ─── Browse by model ─────────────────────                                    │
│  [Flux Dev]  [Flux Schnell]  [Flux Pro]  [Midjourney soon]  [SD soon]         │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Footer ──────────────────────────────────────────────────────────────────────┐
│  CopyPrompt          Submit a prompt   About    Privacy    Twitter            │
│  (c) 2026                                                                      │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown
- `<HeroSearch>` — large autofocus input, debounced; navigates to `/search?q=...` on Enter
- `<CategoryPills>` — links to `/category/[slug]`
- `<TrendingGrid>` — fetches `/api/trending` (cached 5min); 8 cards on desktop, 2 cols mobile
- `<PromptCard>` — image (next/image) + title + model + copy_count + heart icon overlay
- `<PromptOfTheDay>` — featured prompt, manually pinned by admin

### Interactions
- **Cmd+K** — opens command palette with quick search (anywhere on site)
- **Hover card** — image zooms slightly (scale-105), border glows lime
- **Heart icon click** — toggles favorite (localStorage if anon, DB if logged in); animates fill
- **Card click** — navigates to `/prompt/[slug]`; pre-fetched on hover

---

## 2. Search Results

**URL:** `/search?q=cinematic+portrait&model=flux&sort=popular`
**Goal:** Help the user pick the right prompt fast.

### Desktop Layout (with filter sidebar)

```
┌─ Sticky Header ───────────────────────────────────────────────────────────────┐
│  [LOGO]  [search bar with current query]                  Submit  Login       │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Filters Sidebar (240px) ─┬─ Results Main ─────────────────────────────────────┐
│                            │                                                    │
│  ─ Model ─                 │  1,248 results for "cinematic portrait"           │
│  [✓] Flux Dev      (842)   │                                                    │
│  [ ] Flux Schnell  (312)   │  Active filters:  [Flux Dev ✕]  [Latest ✕]        │
│  [ ] Flux Pro      (94)    │                                                    │
│                            │  Sort by: ▾ Popular   View: [▦ Grid] [☰ List]    │
│  ─ Style ─                 │                                                    │
│  [ ] Cinematic             │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  [ ] Photorealistic        │  │  IMG   │ │  IMG   │ │  IMG   │ │  IMG   │      │
│  [ ] Anime                 │  │        │ │        │ │        │ │        │      │
│  [ ] Cyberpunk             │  │      ♥ │ │      ♥ │ │      ♥ │ │      ♥ │      │
│  [ ] Fantasy               │  ├────────┤ ├────────┤ ├────────┤ ├────────┤      │
│                            │  │ title  │ │ title  │ │ title  │ │ title  │      │
│  ─ Aspect Ratio ─          │  │ 2.1k 📋│ │ 1.8k 📋│ │ 1.6k 📋│ │ 1.2k 📋│      │
│  [ ] 1:1                   │  └────────┘ └────────┘ └────────┘ └────────┘      │
│  [ ] 16:9                  │                                                    │
│  [ ] 9:16                  │  (more rows...)                                   │
│  [ ] 3:2                   │                                                    │
│                            │  ┌──────────────────────────┐                      │
│  ─ Sort ─                  │  │  Load more (24 of 1,248) │                      │
│  ◉ Popular                 │  └──────────────────────────┘                      │
│  ◯ Latest                  │                                                    │
│  ◯ Trending                │                                                    │
│                            │                                                    │
│  [Clear all filters]       │                                                    │
│                            │                                                    │
└────────────────────────────┴────────────────────────────────────────────────────┘
```

### Component Breakdown
- `<FilterPanel>` — collapsible on mobile via `<Sheet>`; checkboxes + radio
- `<ActiveFilters>` — chips at top of results; clicking removes
- `<ResultsGrid>` / `<ResultsList>` — toggleable view; uses `useDeferredValue` for smooth filter changes
- `<LoadMore>` — infinite scroll on desktop, button on mobile (data saver)
- `<EmptyState>` — when 0 results: illustration + "Try removing filters or [browse Trending]"

### Interactions
- **URL is the source of truth** — every filter updates `searchParams`; users can share/bookmark filtered views
- **Pressing `/`** focuses search bar (like Google/GitHub)
- **Filter changes** debounce 100ms before refetching
- **Skeleton cards** show during loading (matching grid layout, no layout shift)

---

## 3. Prompt Detail Page ⭐

**URL:** `/prompt/cinematic-cyberpunk-portrait`
**Goal:** Show the image beautifully, make Copy effortless.

### Desktop Layout

```
┌─ Sticky Header ───────────────────────────────────────────────────────────────┐
│  [LOGO]  [search]                    Submit   ♥ Favorites   Login              │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Breadcrumb (text-sm zinc-400) ───────────────────────────────────────────────┐
│  Flux  →  Cinematic Portraits  →  Cinematic Cyberpunk Portrait                │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Two Column Layout (60/40 split) ─────────────────────────────────────────────┐
│                                                  │                              │
│  ┌────────────────────────────────────────┐     │  Cinematic Cyberpunk         │
│  │                                        │     │  Portrait                    │
│  │                                        │     │  text-3xl font-semibold      │
│  │           HERO IMAGE                   │     │                              │
│  │           1024x1024 ish                │     │  by @user_name • 2 days ago  │
│  │                                        │     │  text-sm zinc-400            │
│  │           [click to zoom ⛶]           │     │                              │
│  │                                        │     │  ─ The Prompt ─              │
│  └────────────────────────────────────────┘     │  ┌────────────────────────┐ │
│                                                  │  │ moody neon-lit portrait│ │
│  ┌────────┐ ┌────────┐                           │  │ of a cybernetic woman, │ │
│  │ thumb1 │ │ thumb2 │                           │  │ rain-slick streets,    │ │
│  │ 80x80  │ │ 80x80  │                           │  │ blade runner aesthetic,│ │
│  └────────┘ └────────┘                           │  │ 8k, hyperrealistic     │ │
│                                                  │  └────────────────────────┘ │
│                                                  │  font-mono text-sm           │
│                                                  │  bg-zinc-900 p-4             │
│                                                  │                              │
│                                                  │  ┌──────────────────────┐   │
│                                                  │  │  ▸  Copy Prompt   C  │   │
│                                                  │  └──────────────────────┘   │
│                                                  │  h-12 bg-lime-400 text-black │
│                                                  │  font-medium rounded-xl      │
│                                                  │                              │
│                                                  │  [Copy with Parameters]      │
│                                                  │  ghost button h-10           │
│                                                  │                              │
│                                                  │  ─ Negative Prompt ▸ ─       │
│                                                  │  (collapsed by default)      │
│                                                  │                              │
│                                                  │  ─ Parameters ─              │
│                                                  │  Model:        Flux Dev      │
│                                                  │  Aspect:       1:1           │
│                                                  │  Steps:        30            │
│                                                  │  Guidance:     3.5           │
│                                                  │  Seed:         12345         │
│                                                  │                              │
│                                                  │  ─ Tips from creator ─       │
│                                                  │  "For best results, use      │
│                                                  │   --ar 1:1 and seed 12345"   │
│                                                  │                              │
│                                                  │  ┌─────┬─────┬─────┬─────┐  │
│                                                  │  │  ♥  │  ↗  │  ⟳  │ 👍👎│  │
│                                                  │  │ Save│Share│Remix│Rate │  │
│                                                  │  └─────┴─────┴─────┴─────┘  │
│                                                  │                              │
└──────────────────────────────────────────────────┴──────────────────────────────┘

┌─ Stats Strip ─────────────────────────────────────────────────────────────────┐
│  📋 2,431 copies   ♥ 348 favorites   👁 12,840 views   👍 92% liked            │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Variations Gallery ──────────────────────────────────────────────────────────┐
│  ─ Variations from the community ────                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                                  │
│  │ remix1 │ │ remix2 │ │ remix3 │ │ remix4 │  (other users' generations       │
│  └────────┘ └────────┘ └────────┘ └────────┘   from this prompt)              │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Tags ────────────────────────────────────────────────────────────────────────┐
│  #cinematic  #cyberpunk  #portrait  #neon  #bladerunner                       │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Related Prompts ─────────────────────────────────────────────────────────────┐
│  ─ You might also like ───                                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                                  │
│  │ rel 1  │ │ rel 2  │ │ rel 3  │ │ rel 4  │                                  │
│  └────────┘ └────────┘ └────────┘ └────────┘                                  │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Critical UX Details

#### The Copy Button (the most important pixel on the site)
- **Size:** h-12 (48px), takes full width of right column
- **Color:** lime-400 background, black text
- **Font:** Inter font-medium 16px
- **Icon:** small `▸` paste icon on the left
- **Keyboard hint:** `C` shortcut shown on the right (kbd-style border)
- **Hover:** slight scale-[1.02] + shadow-lime-400/20
- **Click feedback:**
  - Instantly: button changes to "✓ Copied!" with green check
  - Toast slides up from bottom-right
  - 2 seconds later, button returns to "Copy Prompt"
- **Accessibility:** `aria-live="polite"` so screen readers announce "Prompt copied"

#### The Prompt Box
- Monospace font (JetBrains Mono)
- `whitespace-pre-wrap` so line breaks render
- Selectable but with `user-select: all` on focus for one-click select
- Subtle border-zinc-800 + bg-zinc-900
- On hover: border-zinc-700

#### Image Gallery
- Click main image → opens `<Lightbox>` (full-screen, blur backdrop, ESC to close)
- Thumbnails reorder main image
- All images lazy-loaded except first (priority)
- LQIP (low-quality image placeholder / blurhash) prevents CLS

### Schema.org Markup (Embedded)
- `ImageObject` for each image
- `WebPage` with `mainEntity` referencing the prompt
- `BreadcrumbList`

---

## 4. Submit Form

**URL:** `/submit`

```
┌─ Header ──────────────────────────────────────────────────────────────────────┐
│  [LOGO]  Submit a prompt                                                      │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Form (max-w-3xl mx-auto) ────────────────────────────────────────────────────┐
│                                                                                │
│  ─ Submit a prompt ─                                                          │
│  Help others find their next great image. Approval is usually < 24 hours.    │
│                                                                                │
│  Title *                                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐         │
│  │ Cinematic cyberpunk portrait                                      │         │
│  └──────────────────────────────────────────────────────────────────┘         │
│  text-sm zinc-400: 10-80 characters                                            │
│                                                                                │
│  Prompt text *                                                                 │
│  ┌──────────────────────────────────────────────────────────────────┐         │
│  │ moody neon-lit portrait of a cybernetic woman,                   │         │
│  │ rain-slick streets, blade runner aesthetic,                      │         │
│  │ 8k, hyperrealistic                                               │         │
│  │                                                                   │         │
│  └──────────────────────────────────────────────────────────────────┘         │
│  font-mono                                                                     │
│                                                                                │
│  ─ Negative prompt (optional) ─ ▸                                              │
│  (collapsed by default)                                                        │
│                                                                                │
│  Model *                          Category *                                   │
│  ┌──────────────┐                 ┌──────────────┐                             │
│  │ Flux Dev   ▾ │                 │ Cinematic  ▾ │                             │
│  └──────────────┘                 └──────────────┘                             │
│                                                                                │
│  Tags (up to 5)                                                                │
│  ┌──────────────────────────────────────────────────────────────────┐         │
│  │ [cinematic ✕] [cyberpunk ✕] [neon ✕]  type to add...             │         │
│  └──────────────────────────────────────────────────────────────────┘         │
│  Autocomplete from existing tags                                               │
│                                                                                │
│  Images * (1-3)                                                                │
│  ┌──────────────────────────────────────────────────────────────────┐         │
│  │                                                                   │         │
│  │              ⤓  Drop images here, or click to browse              │         │
│  │              JPG/PNG/WebP, max 10MB each                          │         │
│  │                                                                   │         │
│  └──────────────────────────────────────────────────────────────────┘         │
│  border-2 border-dashed zinc-700 rounded-2xl                                   │
│                                                                                │
│  After upload:                                                                 │
│  ┌────────┐ ┌────────┐ [+]                                                    │
│  │ thumb1 │ │ thumb2 │                                                         │
│  │      ✕ │ │      ✕ │                                                         │
│  └────────┘ └────────┘                                                         │
│                                                                                │
│  Tips & notes (optional)                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐         │
│  │ For best results, use seed 12345 and aspect 1:1                  │         │
│  └──────────────────────────────────────────────────────────────────┘         │
│                                                                                │
│  ─ Parameters used (optional) ─ ▸                                              │
│  (collapsed: aspect ratio, steps, guidance, seed inputs)                       │
│                                                                                │
│  Email (for approval notification, if not logged in)                           │
│  ┌──────────────────────────────────────────────────────────────────┐         │
│  │ you@example.com                                                   │         │
│  └──────────────────────────────────────────────────────────────────┘         │
│                                                                                │
│  [Cloudflare Turnstile] (anti-spam, invisible)                                │
│                                                                                │
│  ┌──────────────────┐  ┌──────────────────┐                                   │
│  │  Save as draft   │  │  Submit prompt → │                                   │
│  └──────────────────┘  └──────────────────┘                                   │
│  ghost button           lime-400 button                                        │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown
- `<FormField>` — wraps label + input + error message; uses react-hook-form
- `<TagInput>` — chip-based, autocomplete from `/api/tags?q=...`
- `<ImageDropzone>` — `react-dropzone` + uploads via presigned URL flow
- `<UploadProgress>` — per-file progress bar; cancel button
- `<DraftSaver>` — autosaves form state to localStorage every 5s
- `<Turnstile>` — Cloudflare anti-spam widget

### Validation
- Client: zod schema, errors shown inline below each field
- Server: same zod schema (re-validated)
- Image type/size validated client AND server

### Edge Cases
- Image upload fails mid-way → "Retry" button appears next to thumb
- User logs out mid-form → draft persists in localStorage, restored on next visit
- User submits, then closes tab before redirect → form is submitted (server received it), thank-you email confirms

---

## 5. Model / Category Pages

**URL:** `/model/flux` or `/category/cinematic-portraits`
**Goal:** Programmatic-SEO landing pages.

```
┌─ Hero (slimmer than homepage hero) ───────────────────────────────────────────┐
│                                                                                │
│              The best Flux prompts, curated.                                  │
│                                                                                │
│   3,184 prompts • Updated daily                                               │
│                                                                                │
│   ┌──────────────────────────────────────────────────────┐                    │
│   │  Search Flux prompts...                              │                    │
│   └──────────────────────────────────────────────────────┘                    │
│                                                                                │
│   [All]  [Dev]  [Schnell]  [Pro]                                              │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ SEO Description Block (rich text, 200-400 words) ────────────────────────────┐
│  Flux is a state-of-the-art image generation model developed by Black Forest │
│  Labs. It excels at... [paragraph]                                            │
│  Below you'll find the most-copied Flux prompts on CopyPrompt — all tested,  │
│  all free to use. Click any prompt to see the full text and example images.  │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Sub-categories chips ────────────────────────────────────────────────────────┐
│  Browse by style:                                                              │
│  [Cinematic Portraits]  [Product Photography]  [Logo Design]  [Anime]  ...   │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Sort + View toggles ─────────────────────────────────────────────────────────┐
│  Sort by: ▾ Popular         View: [▦ Grid] [☰ List]                          │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Grid (same as search results) ───────────────────────────────────────────────┐
│  ... 24 cards per page, infinite scroll ...                                   │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ FAQ block (great for long-tail SEO) ─────────────────────────────────────────┐
│  Frequently asked                                                              │
│  ▸ What is Flux Dev?                                                           │
│  ▸ How do I run Flux locally?                                                  │
│  ▸ What's the difference between Flux Schnell and Flux Dev?                   │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Why this matters
Pages like `/model/flux` are your **organic traffic engine**. Google ranks them for queries like "best flux prompts", "flux prompt examples", etc. The SEO description + FAQ blocks add 600+ words of unique content per page.

---

## 6. Pricing Page

**URL:** `/pricing`

```
┌─ Hero ────────────────────────────────────────────────────────────────────────┐
│                                                                                │
│              Free for everyone. Premium for power users.                      │
│                                                                                │
│              Toggle: [ Monthly ]  [ Yearly — Save 16% ]                       │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Two Plans Side by Side ──────────────────────────────────────────────────────┐
│  ┌──────────────────────────┐    ┌──────────────────────────┐                 │
│  │  Free                    │    │  Premium      [POPULAR]  │                 │
│  │                          │    │                          │                 │
│  │  ₹0                      │    │  ₹399 / month            │                 │
│  │  forever                 │    │  ₹3,999 / year           │                 │
│  │                          │    │                          │                 │
│  │  ✓ Search 5,000+ prompts │    │  Everything in Free, +   │                 │
│  │  ✓ Copy to clipboard     │    │                          │                 │
│  │  ✓ Browser favorites     │    │  ✓ Bulk export (CSV/JSON)│                 │
│  │  ✓ Submit prompts        │    │  ✓ No ads                │                 │
│  │  ✓ Browse all categories │    │  ✓ Unlimited collections │                 │
│  │                          │    │  ✓ Public API access     │                 │
│  │                          │    │  ✓ Early access features │                 │
│  │                          │    │  ✓ Support indie dev ❤   │                 │
│  │                          │    │                          │                 │
│  │  ┌────────────────────┐  │    │  ┌────────────────────┐  │                 │
│  │  │  Use it now        │  │    │  │  Get Premium →     │  │                 │
│  │  └────────────────────┘  │    │  └────────────────────┘  │                 │
│  │  ghost button            │    │  lime-400 button         │                 │
│  └──────────────────────────┘    └──────────────────────────┘                 │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Trust Strip ─────────────────────────────────────────────────────────────────┐
│  Cancel anytime  •  UPI, cards, wallets accepted via Razorpay                 │
│  No commitment  •  Secure payments                                             │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ FAQ ─────────────────────────────────────────────────────────────────────────┐
│  ▸ What payment methods are supported?                                         │
│  ▸ Can I cancel anytime?                                                       │
│  ▸ Do you offer refunds?                                                       │
│  ▸ Is my payment information secure?                                           │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Favorites Page

**URL:** `/favorites`

```
┌─ Header ──────────────────────────────────────────────────────────────────────┐
│  ─ Your favorites ─                                                            │
│  47 saved prompts  •  [Sort ▾]  [Filter by model ▾]                            │
│                                                                                │
│  💡 You're not signed in. [Sign in] to sync across devices.  (if anon)        │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Grid ────────────────────────────────────────────────────────────────────────┐
│  Same card grid as search results                                             │
│  Each card has filled lime heart                                              │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Empty State (when no favorites) ─────────────────────────────────────────────┐
│                                                                                │
│              [illustration of empty heart]                                    │
│                                                                                │
│              You haven't saved any prompts yet.                               │
│                                                                                │
│              ┌──────────────────┐                                             │
│              │ Browse trending → │                                             │
│              └──────────────────┘                                             │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Account & Billing

**URL:** `/account` and `/account/billing`

```
┌─ Sidebar Nav ─┬─ Content ──────────────────────────────────────────────────┐
│               │                                                             │
│  Account      │  ─ Account ─                                                │
│  • Profile    │  Email: you@example.com                                     │
│  • Billing    │  Joined: 2026-03-15                                         │
│  • API keys   │                                                             │
│  • Sign out   │  Display name                                               │
│               │  ┌─────────────────────────┐ [Save]                         │
│               │  │ Your Name               │                                │
│               │  └─────────────────────────┘                                │
│               │                                                             │
│               │  Avatar  [⌽ Upload]                                         │
│               │                                                             │
│               │  ─ Danger zone ─                                            │
│               │  [Export my data]  [Delete account]                         │
└───────────────┴─────────────────────────────────────────────────────────────┘
```

### Billing tab

```
─ Billing ─

Plan: Premium (Yearly)
Renews: 2027-03-15                            [Change plan]  [Cancel]

Payment method: VISA ending in 4242  (via Razorpay)

─ Invoice history ─
• 2026-03-15  ₹3,999  PAID    [Download invoice]
• 2025-03-15  ₹3,999  PAID    [Download invoice]
```

---

## 9. Admin Queue

**URL:** `/admin/queue` (RBAC-gated)

```
┌─ Tabs ────────────────────────────────────────────────────────────────────────┐
│  [Pending (12)]  [Approved (1,234)]  [Rejected (84)]                           │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Pending Submission Card ─────────────────────────────────────────────────────┐
│  ┌──────────────┐  Cinematic Portrait at Dawn                                  │
│  │              │  Submitted by: anon@example.com  •  2 hours ago              │
│  │   IMAGE      │  Model: Flux Dev   Category: Cinematic                       │
│  │              │                                                               │
│  │              │  Prompt:                                                      │
│  └──────────────┘  ┌─────────────────────────────────────────────┐             │
│                    │ a soft golden-hour portrait of a young woman │             │
│  ┌──────────────┐  │ standing on a misty cliff, ethereal lighting │             │
│  │              │  │ ...                                          │             │
│  │   IMAGE 2    │  └─────────────────────────────────────────────┘             │
│  │              │                                                               │
│  └──────────────┘  Tips: "Use seed 7777 for similar lighting"                  │
│                                                                                 │
│                    Tags: [cinematic] [portrait] [golden-hour] [misty]          │
│                                                                                 │
│  ┌──────────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐    │
│  │  ✓  Approve      │  │  ✏ Edit      │  │  ✗ Reject   │  │  ⏭ Skip      │    │
│  └──────────────────┘  └──────────────┘  └─────────────┘  └──────────────┘    │
│  lime-400              ghost           red-400         ghost                   │
│  Keyboard: A           Keyboard: E     Keyboard: R     Keyboard: J             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

(Next pending submission below — keyboard nav between cards with J/K)
```

### Why keyboard-first
You'll process 60+ submissions per hour. Mouse + click is slow. Vim-style J/K navigation between cards + A/R for approve/reject = 30 seconds per submission.

---

## 10. Mobile Adaptations

Mobile is the **default** for this audience. Here's how layouts shift below 768px.

### Homepage (Mobile)

```
┌────────────────────────────┐
│ ☰  CopyPrompt          ♥  │  <- mobile header
├────────────────────────────┤
│                            │
│  Find the perfect Flux     │
│  prompt in seconds.        │
│                            │
│  ┌──────────────────────┐  │
│  │ 🔍 Search prompts... │  │
│  └──────────────────────┘  │
│                            │
│  [All] [Cinematic] [...]   │  <- horizontal scroll
│                            │
│  ─ Trending today ─        │
│                            │
│  ┌────────┐  ┌────────┐    │  <- 2 columns
│  │  IMG   │  │  IMG   │    │
│  │      ♥ │  │      ♥ │    │
│  ├────────┤  ├────────┤    │
│  │ title  │  │ title  │    │
│  └────────┘  └────────┘    │
│                            │
│  (more rows scrolling)     │
│                            │
└────────────────────────────┘
[ ⌂ Home ][ 🔍 Search ][ ♥ Saved ][ + Submit ]  <- sticky bottom nav
```

### Detail Page (Mobile)

```
┌────────────────────────────┐
│ ← Back                  ⋮  │
├────────────────────────────┤
│                            │
│   ┌────────────────────┐   │
│   │                    │   │
│   │       IMAGE        │   │
│   │      (full-w)      │   │
│   │                    │   │
│   └────────────────────┘   │
│   thumbs:  ◯ ◯ ◯           │
│                            │
│   Cinematic Cyberpunk      │
│   Portrait                 │
│                            │
│   by @user_name            │
│                            │
│   ─ Prompt ─               │
│   ┌──────────────────────┐ │
│   │ moody neon-lit       │ │
│   │ portrait of a...     │ │
│   └──────────────────────┘ │
│                            │
│   ─ Parameters ─           │
│   Model: Flux Dev          │
│   Aspect: 1:1              │
│                            │
│   ─ Tips ─                 │
│   "For best results..."    │
│                            │
│   (Variations, Related,    │
│    etc. continue scroll)   │
│                            │
└────────────────────────────┘
┌────────────────────────────┐
│ ♥   ↗   ⟳    📋 Copy        │  <- sticky bottom action bar
└────────────────────────────┘
   ghost ghost ghost   LIME
```

### Mobile Submit (Mobile)

- Single column, full-width fields
- Image dropzone becomes a tap-to-open file picker
- Sticky "Submit" button at bottom
- Drag-drop still works on mobile devices that support it

### Filter Sheet (Mobile)

```
Tap "Filter" → bottom sheet slides up:

┌────────────────────────────┐
│  ── grab bar ──            │
│                            │
│  Filters                   │
│                            │
│  Model                     │
│  ◉ All                     │
│  ◯ Flux Dev                │
│  ◯ Flux Schnell            │
│                            │
│  Sort by                   │
│  ◉ Popular                 │
│  ◯ Latest                  │
│                            │
│  ┌──────────────────────┐  │
│  │  Apply (24 results)  │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

---

## Common Components Across Pages

### `<PromptCard>`

```
┌─────────────────────┐
│                     │
│      IMAGE          │
│      blurhash       │
│                     │
│                  ♥  │  <- top-right heart (lime when filled)
├─────────────────────┤
│ Cinematic portrait  │  <- title (line-clamp-2)
│ Flux Dev            │  <- model badge (text-xs zinc-400)
│ 2.4k 📋  •  ♥ 92    │  <- stats (text-xs zinc-500)
└─────────────────────┘
```

### `<Toast>` (Copy confirmation)

```
                 ┌──────────────────────────────┐
                 │  ✓  Prompt copied!           │
                 │     Paste it into Flux       │
                 └──────────────────────────────┘
                 (slides up from bottom-right,
                  auto-dismisses after 2s)
                 bg-zinc-800 border-zinc-700
```

### `<KeyboardShortcuts>` palette (Cmd+K or `?`)

```
┌────────────────────────────────────────────┐
│  Search prompts                       /    │
│  Open search                       Cmd+K   │
│  Copy prompt (on detail page)         C    │
│  Submit a prompt                    G + S  │
│  Go home                            G + H  │
│  Toggle theme                         T    │
└────────────────────────────────────────────┘
```

---

## Color & Typography Cheat Sheet

```css
/* Tailwind config (excerpt) */
colors: {
  bg:        'zinc-950',  /* page bg */
  surface:   'zinc-900',  /* card bg */
  border:    'zinc-800',
  text:      'zinc-100',
  textMuted: 'zinc-400',
  accent:    'lime-400',  /* the only colored accent */
}
fontFamily: {
  sans: ['Inter', 'system-ui'],
  mono: ['"JetBrains Mono"', 'monospace'],
}
```

**The whole site is intentionally monochromatic with one accent.** This is the Lexica/Linear/Vercel aesthetic — beautiful AI imagery POPS against a neutral, dark, sharp UI.

---

**Done.** That's the complete UI specification. Combined with [01-HLD.md](./01-HLD.md), [02-LLD.md](./02-LLD.md), [03-USER-FLOWS.md](./03-USER-FLOWS.md), and [04-TECH-FLOWS.md](./04-TECH-FLOWS.md), you have everything needed to build CopyPrompt end-to-end.
