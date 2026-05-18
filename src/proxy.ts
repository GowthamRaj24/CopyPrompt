import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { SITE_BRAND } from "@/lib/site-brand";

/**
 * Next.js 16 proxy (was "middleware" in Next.js 15 and earlier).
 * Runs on every request before the route handler.
 *
 * Why we need it:
 *   Supabase Auth uses HttpOnly cookies (sb-access-token, sb-refresh-token).
 *   Access tokens expire in 1 hour. Without active refreshing, server components
 *   would see a logged-in user as suddenly logged out after their token expires.
 *
 *   This proxy silently refreshes those cookies on every request, so the
 *   user stays signed in across SSR navigations.
 */
/** Meta crawlers — used by Facebook Sharing Debugger and WhatsApp previews. */
const META_CRAWLER_UA =
  /facebookexternalhit|Facebot|FacebookBot|Meta-ExternalAgent/i;

/** Other crawlers — skip Supabase session refresh (faster, fewer edge cases). */
const CRAWLER_UA =
  /Twitterbot|LinkedInBot|WhatsApp|Slackbot|Discordbot|Googlebot|bingbot|Applebot/i;

const OG_TITLE = SITE_BRAND.defaultTitle;
const OG_DESCRIPTION = SITE_BRAND.description;

function metaCrawlerHtml(origin: string): string {
  const pageUrl = `${origin}/`;
  const ogImage = `${origin}/opengraph-image`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${OG_TITLE}</title>
<meta name="description" content="${OG_DESCRIPTION}"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="${pageUrl}"/>
<meta property="og:site_name" content="${SITE_BRAND.name}"/>
<meta property="og:title" content="${OG_TITLE}"/>
<meta property="og:description" content="${OG_DESCRIPTION}"/>
<meta property="og:image" content="${ogImage}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:alt" content="${SITE_BRAND.ogImageAlt}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${OG_TITLE}"/>
<meta name="twitter:description" content="Search, copy, paste. Prompts for every AI tool. Free forever."/>
<meta name="twitter:image" content="${ogImage}"/>
</head>
<body></body>
</html>`;
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Supabase OAuth sometimes lands on Site URL (/) with ?code= instead of
  // /auth/callback when redirect URLs are misconfigured — forward to handler.
  if (
    pathname !== "/auth/callback" &&
    searchParams.has("code") &&
    request.method === "GET"
  ) {
    const callback = new URL("/auth/callback", request.url);
    callback.search = request.nextUrl.search;
    return NextResponse.redirect(callback);
  }

  // Pass current pathname + full URL (with query) as headers so server
  // components can read them for conditional rendering and redirect targets.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  requestHeaders.set(
    "x-url",
    request.nextUrl.pathname + request.nextUrl.search,
  );

  const ua = request.headers.get("user-agent") ?? "";
  // Lightweight HTML for Meta — avoids heavy SSR/DB on their scrape (403 workaround)
  if (
    META_CRAWLER_UA.test(ua) &&
    request.method === "GET" &&
    pathname === "/"
  ) {
    return new NextResponse(metaCrawlerHtml(request.nextUrl.origin), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  }

  if (META_CRAWLER_UA.test(ua) || CRAWLER_UA.test(ua)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // This call refreshes the session if it's expired
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static asset paths:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - any file with an extension (.svg, .png, .jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
