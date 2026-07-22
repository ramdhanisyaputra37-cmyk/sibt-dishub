import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { headers } from "next/headers";

import { authConfig } from "./auth.config";
import { prisma } from "./prisma";
import { recordActivity } from "./activity-logger";
import { loginSchema } from "@/modules/auth/application/login.schema";

/**
 * Konfigurasi Auth.js lengkap (Node runtime) — menambahkan Credentials
 * provider dengan verifikasi bcrypt. Pengecekan isActive dilakukan di sini
 * saat login; pengecekan ulang untuk sesi yang sudah berjalan ada di
 * requireRole()/getSession helper (docs/01 §4.5).
 */
export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Kata Sandi", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { role: true },
        });

        // User nonaktif diblokir login walau password benar (docs/01 §4.3).
        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Catat LOGIN di sini (bukan di action) agar tetap tercatat walau
        // action memakai redirectTo yang melempar NEXT_REDIRECT.
        const hdrs = await headers();
        await recordActivity({
          userId: user.id,
          action: "LOGIN",
          description: `${user.name} berhasil masuk`,
          ipAddress:
            hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            hdrs.get("x-real-ip"),
          userAgent: hdrs.get("user-agent"),
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
        };
      },
    }),
  ],
});
