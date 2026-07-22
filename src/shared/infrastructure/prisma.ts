import { PrismaClient } from "@prisma/client";

// Singleton Prisma client — mencegah pembukaan koneksi berulang saat hot-reload
// di dev (Next.js me-reload modul, tanpa guard ini tiap reload membuat pool baru).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
