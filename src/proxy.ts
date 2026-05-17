import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

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
/** Social / search crawlers — skip Supabase session refresh (faster, avoids bot 403s). */
const CRAWLER_UA =
  /facebookexternalhit|Facebot|FacebookBot|Meta-ExternalAgent|Twitterbot|LinkedInBot|WhatsApp|Slackbot|Discordbot|Googlebot|bingbot|Applebot/i;

export async function proxy(request: NextRequest) {
  // Pass current pathname + full URL (with query) as headers so server
  // components can read them for conditional rendering and redirect targets.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  requestHeaders.set(
    "x-url",
    request.nextUrl.pathname + request.nextUrl.search,
  );

  const ua = request.headers.get("user-agent") ?? "";
  if (CRAWLER_UA.test(ua)) {
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
