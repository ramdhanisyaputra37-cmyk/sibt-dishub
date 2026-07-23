import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";

import { getGuestLookups } from "@/modules/guest/application/guest-lookups.usecase";
import { KioskRegisterForm } from "@/modules/guest/presentation/kiosk-register-form";

export const metadata: Metadata = {
  title: "Isi Buku Tamu",
  description:
    "Catat kunjungan Anda ke Dinas Perhubungan Kota Batu secara mandiri.",
};
export const dynamic = "force-dynamic";

export default async function KioskFormPage() {
  const lookups = await getGuestLookups();

  return (
    <div className="min-h-screen bg-background">
      {/* Header ringkas */}
      <header className="sticky top-0 z-20 border-b bg-card">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
            Beranda
          </Link>
          <div className="flex items-center gap-2">
            <Image
              src="/logo-dishub.svg"
              alt="Logo Dinas Perhubungan"
              width={26}
              height={26}
            />
            <span className="font-display text-sm font-bold text-secondary">
              SIBT-DISHUB
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-secondary">
            Buku Tamu Digital
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Silakan isi data kunjungan Anda. Kolom bertanda{" "}
            <span className="text-destructive">*</span> wajib diisi. Butuh
            bantuan? Petugas resepsionis siap membantu.
          </p>
        </div>

        <KioskRegisterForm lookups={lookups} />

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Dinas Perhubungan Kota Batu &copy; {new Date().getFullYear()}
        </p>
      </main>
    </div>
  );
}
