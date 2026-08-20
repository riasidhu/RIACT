import { NextResponse } from "next/server";

// Proxy intentionally kept minimal (renamed from the deprecated `middleware`
// file convention in Next.js 16).
// Auth is enforced client-side in each page and server-side via Supabase RLS.
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
