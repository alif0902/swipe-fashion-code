import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/session-cookie";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const hasSession = request.cookies
      .getAll()
      .some((c) => c.name.includes("better-auth.session"));

    if (!hasSession) {
      return NextResponse.redirect(new URL("/account", request.url));
    }
  }

  const response = NextResponse.next();

  if (!request.cookies.get(SESSION_COOKIE)) {
    response.cookies.set(SESSION_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|assets|favicon.svg|robots.txt).*)"],
};
