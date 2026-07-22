import type { NextAuthConfig } from "next-auth";
import type { RoleName } from "@prisma/client";

/**
 * Konfigurasi Auth.js yang AMAN untuk edge runtime (middleware) — tidak
 * mengimpor Prisma/bcrypt (yang butuh Node runtime). Provider credentials
 * yang butuh DB didefinisikan terpisah di auth.ts. Strategi JWT dipilih agar
 * middleware bisa membaca role dari token tanpa query DB (docs/01 §4.5).
 */
export const authConfig = {
  // Percayai Host header dari reverse-proxy deployment (Vercel meng-set ini
  // otomatis; untuk host lain/lokal perlu eksplisit agar Auth.js tidak
  // menolak dengan UntrustedHost). Bisa juga via env AUTH_TRUST_HOST=true.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 jam — selaras jam kerja kantor (docs/01 §4.5)
  },
  callbacks: {
    jwt({ token, user }) {
      // Saat login, salin id & role dari user ke token. Cast eksplisit karena
      // tipe `user` di callback ini adalah union User | AdapterUser.
      if (user) {
        const u = user as { id?: string; role?: RoleName };
        if (u.id) token.id = u.id;
        if (u.role) token.role = u.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        const t = token as { id?: string; role?: RoleName };
        if (t.id) session.user.id = t.id;
        if (t.role) session.user.role = t.role;
      }
      return session;
    },
  },
  providers: [], // diisi di auth.ts (Node runtime)
} satisfies NextAuthConfig;
