import { NextResponse, type NextRequest } from "next/server";

// Middleware intentionally kept minimal.
// Auth is enforced client-side in each page and server-side via Supabase RLS.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
