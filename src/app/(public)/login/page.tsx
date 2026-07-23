import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Bus,
  TramFront,
  Ship,
  Navigation,
  Milestone,
  TrafficCone,
  Anchor,
  Bike,
  ShieldCheck,
  BarChart3,
  Clock,
} from "lucide-react";

import { LoginForm } from "@/modules/auth/presentation/login-form";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Masuk",
};

const HIGHLIGHTS = [
  { icon: BarChart3, text: "Rekap kunjungan & laporan siap cetak" },
  { icon: Clock, text: "Pencatatan jam masuk & keluar otomatis" },
  { icon: ShieldCheck, text: "Data terpusat, aman, dan dapat ditelusuri" },
];

export default function LoginPage() {
  return (
    <main className="flex min-h-screen">
      {/* ===================== PANEL KIRI (desktop) ===================== */}
      <aside className="bg-login-panel relative hidden w-[57%] flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:p-14">
        {/* noise peredam banding */}
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.07]" />

        {/* dekorasi ikon transportasi (sangat tipis) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 text-white/[0.07]">
          <Bus className="absolute left-[10%] top-[18%] h-20 w-20 -rotate-12" />
          <TrafficCone className="absolute left-[70%] top-[12%] h-14 w-14 rotate-6" />
          <TramFront className="absolute left-[78%] top-[62%] h-24 w-24 -rotate-6" />
          <Navigation className="absolute left-[16%] top-[68%] h-16 w-16 rotate-12" />
          <Milestone className="absolute left-[44%] top-[40%] h-16 w-16" />
          <Ship className="absolute left-[30%] top-[86%] h-14 w-14 -rotate-6" />
          <Anchor className="absolute left-[86%] top-[36%] h-12 w-12" />
          <Bike className="absolute left-[6%] top-[44%] h-12 w-12 rotate-6" />
        </div>

        {/* atas: identitas */}
        <div className="relative flex items-center gap-3">
          <Image
            src="/logo-dishub.svg"
            alt="Logo Dinas Perhubungan"
            width={40}
            height={40}
            priority
          />
          <div className="leading-tight">
            <p className="font-display text-lg font-extrabold tracking-tight">
              SIBT-DISHUB
            </p>
            <p className="text-xs text-white/70">Dinas Perhubungan Kota Batu</p>
          </div>
        </div>

        {/* tengah: kalimat + poin */}
        <div className="relative max-w-md">
          <h2 className="font-display text-3xl font-extrabold leading-tight xl:text-4xl">
            Portal Petugas{" "}
            <span className="bg-gradient-to-r from-[#C6DEF9] to-[#F2DCA0] bg-clip-text text-transparent">
              Buku Tamu Digital
            </span>
          </h2>
          <p className="mt-3 text-sm text-sky-100/80">
            Kelola kunjungan, master data, dan laporan Dinas Perhubungan Kota
            Batu dalam satu sistem.
          </p>
          <ul className="mt-7 space-y-3.5">
            {HIGHLIGHTS.map((h) => (
              <li key={h.text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#E7C878]">
                  <h.icon className="h-4 w-4" />
                </span>
                <span className="text-sm text-white/85">{h.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* bawah: copyright */}
        <p className="relative text-xs text-white/50">
          &copy; {new Date().getFullYear()} Dinas Perhubungan Kota Batu ·
          Dikembangkan dalam rangka PKL.
        </p>
      </aside>

      {/* ===================== PANEL KANAN (form) ===================== */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-4 py-10 lg:w-[43%]">
        <div className="w-full max-w-sm">
          {/* Header ringkas (mobile only, ganti panel kiri) */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <Image
              src="/logo-dishub.svg"
              alt="Logo Dinas Perhubungan"
              width={52}
              height={52}
              priority
            />
            <h1 className="mt-3 font-display text-xl font-extrabold tracking-tight text-secondary">
              SIBT-DISHUB
            </h1>
            <p className="text-xs text-muted-foreground">
              Dinas Perhubungan Kota Batu
            </p>
          </div>

          {/* Judul (desktop only) */}
          <div className="mb-6 hidden lg:block">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-secondary">
              Masuk
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Silakan masuk dengan akun petugas Anda.
            </p>
          </div>

          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <LoginForm />
              </Suspense>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke beranda
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
