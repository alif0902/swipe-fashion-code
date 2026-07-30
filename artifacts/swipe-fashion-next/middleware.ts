import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/session-cookie";

export function middleware(request: NextRequest) {
  // Ini KENYAMANAN, bukan pengaman.
  //
  // Middleware berjalan di edge runtime dan tidak bisa membaca database, jadi
  // ia tidak mungkin tahu peran seseorang — yang bisa dilihat hanyalah "ada
  // cookie sesi atau tidak". Pengecekan admin yang sesungguhnya ada di
  // requireAdmin(), dipanggil di setiap halaman dan setiap Server Action di
  // bawah /admin. Ini cuma memotong perjalanan tamu lebih awal.
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
  // Lewati aset statis — tiap request gambar tidak perlu melewati middleware.
  matcher: ["/((?!_next/static|_next/image|assets|favicon.svg|robots.txt).*)"],
};
