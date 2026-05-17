/**
 * Seed script: insert 5 high-quality text prompts (no images).
 *
 * Idempotent — uses existence check on slug.
 *
 * Run with:  npx tsx scripts/seed-text-prompts.ts
 */
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { categories } from "../src/server/models/category.model";
import { models } from "../src/server/models/model.model";
import { prompts } from "../src/server/models/prompt.model";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const db = drizzle(client);

interface SeedTextPrompt {
  slug: string;
  title: string;
  promptText: string;
  expectedOutcome: string;
  tips?: string;
  modelSlug: string;
  categorySlug: string;
  params?: Record<string, unknown>;
}

const SEED_TEXT_PROMPTS: SeedTextPrompt[] = [
  {
    slug: "validate-project-idea",
    title: "Validate Your Project Idea",
    promptText: `Act as an experienced startup advisor with 20 years in venture capital and product launches. I want to validate the following project idea before I invest time and money.

Project: {project_idea}
Target audience: {target_audience}
My background: {your_background}

Please analyze and provide:

1. **Top 3 risks** I should worry about (be specific, not generic)
2. **5 questions I must answer** before building anything
3. **The single biggest assumption** I'm making, and how to test it cheaply (under $100, under 2 weeks)
4. **3 comparable products** that have failed and exactly why they failed
5. **A go / no-go recommendation** with your reasoning

Be brutally honest. Don't be encouraging. I'd rather hear the hard truth now than waste 6 months.`,
    expectedOutcome: `**Top 3 risks:**
1. Market too small — most idea-validation projects fail because founders pick markets of 10k people instead of 1M+
2. You're solving a problem people don't pay for — common in productivity tools
3. The "10x better" claim is unprovable — incremental improvements rarely win against incumbents

**5 questions:**
1. Have you talked to 20 potential customers in the last 30 days?
2. Of those, how many said "I'd pay for this today"?
3. What's the smallest version that delivers the core value?
4. Who else is solving this and how are they doing financially?
5. What's your unfair advantage — distribution, expertise, or speed?

**Biggest assumption:** That target users will pay $X/month. Test: Build a landing page with a $X "pre-order" button and drive 100 visitors via $50 of ads. If <2 buy, the price/demand combo is wrong.

**Failed comparables:**
- Quibi ($1.75B raised, dead in 6 months) — premise that people want premium short-form was untested
- Juicero ($120M raised) — solved a non-problem with engineering
- Color.com ($41M raised) — built without talking to users

**Recommendation:** No-go in current form. Test with a $200 landing-page experiment first. If you get >5% sign-up rate, then go.`,
    tips: "Replace {project_idea}, {target_audience}, {your_background} with your specifics. Best results with GPT-4 or Claude Opus. Lower temperature (0.3-0.5) for harsher analysis.",
    modelSlug: "chatgpt",
    categorySlug: "validation-strategy",
    params: {
      temperature: 0.5,
      max_tokens: 2500,
      system_message: "You are a brutally honest startup advisor. Don't sugarcoat.",
    },
  },
  {
    slug: "code-review-best-practices",
    title: "Code Review with Best Practices",
    promptText: `You are a senior software engineer doing a code review. Review the following code with extreme care.

\`\`\`{language}
{paste_your_code_here}
\`\`\`

Provide your review in this exact format:

**🔴 Critical issues (must fix):**
- (security vulnerabilities, bugs, data loss risks)

**🟡 Important issues (should fix):**
- (performance problems, maintainability concerns, missing error handling)

**🟢 Suggestions (nice to have):**
- (cleaner patterns, better naming, idiomatic improvements)

**✅ What's done well:**
- (acknowledge what works to keep morale)

For each issue, include:
- Line number
- The problematic code
- A concrete fix (full code snippet)
- Why it matters

Be specific. "This could be better" is useless. Show the better version.`,
    expectedOutcome: `**🔴 Critical issues (must fix):**

1. Line 23 — SQL injection vulnerability
   \`\`\`js
   // BAD: db.query(\`SELECT * FROM users WHERE id = \${userId}\`)
   // FIX:
   db.query('SELECT * FROM users WHERE id = $1', [userId])
   \`\`\`
   Why: User input goes directly into the query string. An attacker can pass \`1; DROP TABLE users\` and destroy your data.

2. Line 67 — Race condition on the counter increment
   \`\`\`js
   // BAD: counter = await db.get('counter'); await db.set('counter', counter + 1)
   // FIX: await db.increment('counter')
   \`\`\`
   Why: Two concurrent requests will both read the same value and overwrite each other.

**🟡 Important issues:**
- Line 45: Missing error handling on \`fetch\` call. Network failures will crash the app.
- Line 89: O(n²) loop where O(n) would work. Replace nested loop with a Map lookup.

**🟢 Suggestions:**
- Use \`const\` instead of \`let\` for variables that aren't reassigned (lines 12, 34, 56)
- Extract the validation logic into a separate function for testability

**✅ What's done well:**
- Clear function names and good module structure
- Tests cover the happy path well`,
    tips: "Replace {language} (e.g. 'typescript') and paste your code. Works best with Claude Sonnet for thorough analysis or GPT-4 for fast feedback.",
    modelSlug: "claude-sonnet",
    categorySlug: "coding-development",
    params: {
      temperature: 0.3,
      max_tokens: 3000,
    },
  },
  {
    slug: "email-that-gets-replies",
    title: "Cold Email That Actually Gets Replies",
    promptText: `Write a cold email that a busy CEO would actually reply to.

About me: {your_background}
About them: {their_background_or_company}
What I want: {specific_ask}

Constraints:
- Maximum 5 sentences. No fluff.
- No "I hope this email finds you well"
- No "I came across your profile"
- Open with something specific to them (a recent post, a number from their company, a public statement)
- The ask must be a 15-min call OR a yes/no question — never both
- Subject line under 50 characters, no clickbait

Generate 3 variations: (1) flattering but specific, (2) direct and useful, (3) provocative or contrarian.`,
    expectedOutcome: `**Variation 1 — Flattering but specific:**
Subject: Question about your scaling-by-50 talk

Sara — your line at SaaSCon about "we got to $10M ARR with 3 sales reps" is the most-quoted slide in our team Slack. We're at $2M and stuck. I'm building [product] and would love 15 minutes to ask one question: how did you decide *when* to hire your 4th rep? Free Tuesday or Thursday next week?

— Mike

**Variation 2 — Direct and useful:**
Subject: Saw the AWS migration post — quick benchmark for you

Sara — read your post on the AWS-to-Hetzner migration. We did the same thing last quarter and saved 78% on infra. Happy to share our exact numbers (DM or call) — figured it might be useful for your next post. No agenda beyond that.

— Mike

**Variation 3 — Provocative:**
Subject: Why your pricing page is leaving $50K/year on the table

Sara — your free tier currently converts at 0.8% based on the public Stripe data. Industry average for your space is 2.4%. I rebuilt three SaaS pricing pages last year and tripled conversion each time. Worth 15 minutes to show you what I'd change?

— Mike`,
    tips: "Variation 3 is high-risk, high-reward — only use if your data claim is real. Variation 2 wins replies most often in B2B.",
    modelSlug: "chatgpt-5",
    categorySlug: "writing-content",
    params: {
      temperature: 0.8,
      max_tokens: 1500,
    },
  },
  {
    slug: "landing-page-hero-copy",
    title: "Landing Page Hero Copy That Converts",
    promptText: `Write 5 variations of landing page hero copy for the following product. Each must follow this structure:

H1 (max 8 words, value-focused not feature-focused)
H2 / subheading (max 15 words, the "for whom" + "in what timeframe")
CTA button text (max 4 words, action verb)

Product: {product_description}
Target customer: {target_customer}
Their main pain: {main_pain_point}
What makes us different: {differentiator}

Style each variation differently:
1. **Outcome-focused** (what they'll have after using it)
2. **Pain-focused** (what they'll stop suffering)
3. **Time-focused** (how fast they'll get the result)
4. **Proof-focused** (social proof or numbers)
5. **Curiosity-focused** (provoking, makes them want to know more)

After the 5 variations, recommend which one to A/B test first and why.`,
    expectedOutcome: `**1. Outcome-focused**
- H1: Ship features 3x faster
- H2: A code review tool that catches bugs before users do — for engineering teams of 5–50.
- CTA: Start free trial

**2. Pain-focused**
- H1: Stop reviewing code at midnight
- H2: We catch the bugs your team misses, automatically. Reclaim your evenings.
- CTA: See how

**3. Time-focused**
- H1: Code review in 5 minutes
- H2: Connect your repo, get instant AI-powered feedback. First review in under 5 minutes.
- CTA: Connect repo

**4. Proof-focused**
- H1: 3,200 teams ship faster
- H2: From Stripe to Y Combinator startups — see why dev teams switch from manual review.
- CTA: View case studies

**5. Curiosity-focused**
- H1: Your code has 14 bugs right now
- H2: We scan in 30 seconds. If we find nothing, we'll donate $50 to charity. Most repos: 14 issues.
- CTA: Scan my repo

**Recommendation:** A/B test #5 first. The provocative H1 grabs attention and the "bet" reduces risk. If it doesn't convert, fall back to #1 (which is the safest, but lowest ceiling).`,
    tips: "Run all 5 through your highest-traffic page in a 2-week test. Use Statistical significance, not vibes.",
    modelSlug: "chatgpt",
    categorySlug: "marketing-sales",
    params: {
      temperature: 0.9,
      max_tokens: 1500,
    },
  },
  {
    slug: "explain-like-im-five",
    title: "Explain Like I'm 5 (But Still Useful for Adults)",
    promptText: `Explain the following concept in two passes:

Concept: {concept}

**Pass 1: Explain like I'm 5**
- Use one analogy from everyday life (kitchen, playground, school)
- Avoid all jargon
- Maximum 3 sentences
- A 5-year-old should be able to repeat it back to a friend

**Pass 2: Explain like I'm a smart adult who's new to this**
- Build on the analogy from Pass 1, don't replace it
- Include the 2 most important technical terms (define them in line)
- Mention one real-world example where this matters
- Maximum 6 sentences

End with: "If you remember only one thing: ___"`,
    expectedOutcome: `**Concept: How CDNs work**

**Pass 1 (5-year-old):**
Imagine your favorite ice cream shop only has one store, very far away. Your mom got tired driving there, so the shop opened tiny copies of itself in every neighborhood. Now you get ice cream fast, even if the main store is far away.

**Pass 2 (adult):**
A CDN (Content Delivery Network) is exactly that — a network of "edge servers" placed in cities around the world that hold copies of a website's content. When you visit netflix.com from Mumbai, you don't fetch the video from California; you fetch it from the nearest edge node, maybe in Delhi. The two key terms are "origin server" (the original "main store") and "edge node" (the local copy). This matters because Netflix would melt under load if every viewer hit one server, and the experience would be molasses-slow for anyone outside California. CDNs are why the modern internet feels instant.

**If you remember only one thing:** CDNs trade extra storage cost for a 10–100x speed boost — that's why every site you visit uses one.`,
    tips: "Replace {concept} with anything technical. Works for: blockchain, machine learning, OAuth, microservices, etc. Try with Claude Sonnet for slightly better analogies.",
    modelSlug: "any-llm",
    categorySlug: "learning-education",
    params: {
      temperature: 0.7,
      max_tokens: 1200,
    },
  },
];

async function main() {
  console.log("Seeding text prompts...");

  const allModels = await db.select().from(models);
  const allCategories = await db.select().from(categories);

  const modelBySlug = new Map(allModels.map((m) => [m.slug, m.id]));
  const categoryBySlug = new Map(allCategories.map((c) => [c.slug, c.id]));

  let inserted = 0;

  for (const p of SEED_TEXT_PROMPTS) {
    const modelId = modelBySlug.get(p.modelSlug);
    const categoryId = categoryBySlug.get(p.categorySlug);

    if (!modelId || !categoryId) {
      console.warn(
        `Skipping ${p.slug}: missing model "${p.modelSlug}" or category "${p.categorySlug}"`,
      );
      continue;
    }

    const existing = await db
      .select({ id: prompts.id })
      .from(prompts)
      .where(eq(prompts.slug, p.slug))
      .limit(1);

    if (existing.length > 0) continue;

    // Engagement counters omitted on purpose — copy_count / upvotes /
    // view_count / downvotes default to 0 so the catalog never lies
    // about traction before real users have interacted with it.
    await db.insert(prompts).values({
      slug: p.slug,
      title: p.title,
      promptText: p.promptText,
      expectedOutcome: p.expectedOutcome,
      tips: p.tips,
      modelId,
      categoryId,
      params: p.params ?? {},
      status: "published",
    });

    inserted++;
  }

  const total = await db.select().from(prompts);
  console.log(
    `Done. Inserted ${inserted} new text prompts. Total prompts in DB: ${total.length}`,
  );

  await client.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
