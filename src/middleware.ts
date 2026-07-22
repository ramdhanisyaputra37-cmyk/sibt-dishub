import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/shared/infrastructure/auth.config";
import { canAccessModule, moduleForPath } from "@/shared/lib/rbac";

// Middleware pakai config edge-safe (tanpa Prisma/bcrypt). Pengecekan role di
// sini berbasis JWT (cepat); validasi per-record tetap di Server Action.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const path = nextUrl.pathname;

  // Route publik — selalu boleh (kios & login tidak butuh sesi).
  const isPublic =
    path.startsWith("/login") || path.startsWith("/kios");

  if (isPublic) {
    // Bila sudah login lalu buka /login, arahkan ke dashboard.
    if (path.startsWith("/login") && isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // Semua route lain butuh sesi.
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  // Guard berbasis modul: bila route termap ke modul & role tak punya akses,
  // tolak ke dashboard (bukan halaman error, agar UX mulus).
  const mod = moduleForPath(path);
  if (mod && !canAccessModule(role, mod)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Jalankan di semua route kecuali aset statis, gambar, & API auth internal.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
