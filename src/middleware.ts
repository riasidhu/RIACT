import { NextResponse, type NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = [
  "/home",
  "/dashboard",
  "/insights",
  "/goals",
  "/locations",
  "/resources",
  "/session",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for a Supabase auth cookie — presence means the user has (or had) a session.
  // The individual page data queries enforce real auth via RLS; this is just for redirects.
  const hasAuthCookie = request.cookies.getAll().some(
    (c) => c.name.includes("auth-token") && c.value.length > 0
  );

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from /auth back into the app
  if (pathname === "/auth" && hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
