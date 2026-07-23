import Link from "next/link";
import type { Metadata } from "next";
import {
  ClipboardPen,
  LogIn,
  QrCode,
  PenLine,
  Ticket,
  DoorOpen,
  ClipboardCheck,
  Hash,
  BarChart3,
  ShieldCheck,
  MapPin,
  Clock,
  Phone,
  Mail,
  ArrowRight,
} from "lucide-react";

import { getPublicStats } from "@/modules/landing/application/get-public-stats.usecase";
import { LandingNavbar } from "@/modules/landing/presentation/landing-navbar";
import { Reveal } from "@/modules/landing/presentation/reveal";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "SIBT-DISHUB — Buku Tamu Digital Dinas Perhubungan Kota Batu",
  description:
    "Buku tamu digital Dinas Perhubungan Kota Batu. Catat kunjungan Anda secara mandiri lewat ponsel — cepat, rapi, dan terekam.",
};

// Statistik hero di-cache 60 detik agar tidak membebani database (angka nyata).
export const revalidate = 60;

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: "Pencatatan Otomatis",
    desc: "Setiap kunjungan tercatat digital lengkap dengan jam masuk dan keluar, tanpa buku manual.",
  },
  {
    icon: Hash,
    title: "Nomor Antrian Digital",
    desc: "Nomor antrian dibuat otomatis dan tampil langsung untuk ditunjukkan ke petugas.",
  },
  {
    icon: BarChart3,
    title: "Rekap Laporan",
    desc: "Data kunjungan terangkum dalam laporan harian hingga tahunan yang siap dicetak.",
  },
  {
    icon: ShieldCheck,
    title: "Data Tersimpan Aman",
    desc: "Seluruh data kunjungan tersimpan terpusat dan dapat ditelusuri kembali kapan saja.",
  },
];

const STEPS = [
  {
    icon: QrCode,
    title: "Pindai QR di meja resepsionis",
    desc: "Arahkan kamera ponsel ke poster QR di meja resepsionis. Tidak membawa ponsel? Minta bantuan petugas.",
  },
  {
    icon: PenLine,
    title: "Isi data diri & keperluan",
    desc: "Lengkapi nama, instansi, bidang tujuan, dan keperluan kunjungan Anda pada formulir.",
  },
  {
    icon: Ticket,
    title: "Tunjukkan nomor antrian",
    desc: "Nomor antrian akan muncul di layar. Tunjukkan kepada petugas untuk dilayani.",
  },
  {
    icon: DoorOpen,
    title: "Pindai lagi saat selesai",
    desc: "Setelah selesai berkunjung, pindai QR kunjungan sekali lagi untuk mencatat jam keluar.",
  },
];

export default async function LandingPage() {
  const stats = await getPublicStats();
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNavbar />

      <main className="flex-1">
        {/* ============================ HERO ============================ */}
        <section
          id="beranda"
          className="relative overflow-hidden bg-hero-mesh text-white"
        >
          {/* Dekorasi: titik terang halus + noise peredam banding + glow emas. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(hsl(0 0% 100% / 0.06) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div
            aria-hidden
            className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.06]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-gold/20 blur-3xl"
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:py-28 lg:grid-cols-2">
            <Reveal>
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-white/10 px-3 py-1 text-xs font-semibold text-[#F5E0A8] backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  Buku Tamu Digital Resmi
                </span>
                <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
                  Catat kunjungan Anda,{" "}
                  <span className="bg-gradient-to-r from-[#C6DEF9] to-[#F2DCA0] bg-clip-text text-transparent">
                    cukup dari ponsel.
                  </span>
                </h1>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-sky-100/85 sm:text-lg">
                  SIBT-DISHUB menggantikan buku tamu manual Dinas Perhubungan
                  Kota Batu dengan pencatatan digital yang cepat, rapi, dan
                  dapat ditelusuri.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="xl" variant="gradient" className="shadow-lg">
                    <Link href="/kios">
                      <ClipboardPen className="h-5 w-5" />
                      Isi Buku Tamu
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="xl"
                    variant="outline"
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  >
                    <Link href="/login">
                      <LogIn className="h-5 w-5" />
                      Masuk sebagai Petugas
                    </Link>
                  </Button>
                </div>
              </div>
            </Reveal>

            {/* Kartu ringkasan statistik NYATA — kartu terang di atas hero navy. */}
            <Reveal delay={0.15}>
              <div className="relative mx-auto w-full max-w-md">
                <div className="overflow-hidden rounded-2xl border border-white/60 bg-stat-card shadow-2xl">
                  <div className="relative px-6 py-5">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gold" />
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Ringkasan Kunjungan
                    </p>
                    <p className="mt-0.5 font-display text-lg font-bold text-secondary">
                      Dinas Perhubungan Kota Batu
                    </p>
                  </div>
                  <div className="grid grid-cols-2 divide-x border-t">
                    <StatBlock label="Kunjungan Hari Ini" value={stats.today} />
                    <StatBlock label="Kunjungan Bulan Ini" value={stats.month} />
                  </div>
                  <div className="border-t bg-white/50 px-6 py-3">
                    <p className="text-center text-xs text-muted-foreground">
                      Diperbarui otomatis setiap menit
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ============================ TENTANG ============================ */}
        <section id="tentang" className="border-t bg-card">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <SectionEyebrow>Tentang Sistem</SectionEyebrow>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-secondary sm:text-4xl">
                  Apa itu SIBT-DISHUB?
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Sistem Informasi Buku Tamu Digital yang menggantikan
                  pencatatan tamu manual dengan pencatatan kunjungan yang rapi,
                  akurat, dan dapat ditelusuri — memudahkan tamu maupun petugas
                  Dinas Perhubungan.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 0.08}>
                  <div className="group h-full rounded-xl border bg-background p-6 transition-shadow hover:shadow-md">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-base font-bold text-secondary">
                      {f.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {f.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ========================= ALUR KUNJUNGAN ========================= */}
        <section id="alur" className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <SectionEyebrow>Panduan Tamu</SectionEyebrow>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-secondary sm:text-4xl">
                  Alur Kunjungan
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Empat langkah sederhana untuk mencatat kunjungan Anda.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <Reveal key={s.title} delay={i * 0.08}>
                  <div className="relative h-full rounded-xl border bg-card p-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-base font-bold text-white">
                        {i + 1}
                      </span>
                      <s.icon className="h-6 w-6 text-gold" />
                    </div>
                    <h3 className="mt-4 font-display text-base font-bold text-secondary">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {s.desc}
                    </p>
                    {i < STEPS.length - 1 && (
                      <ArrowRight
                        aria-hidden
                        className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-border lg:block"
                      />
                    )}
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.1}>
              <div className="mt-10 flex justify-center">
                <Button asChild size="lg">
                  <Link href="/kios">
                    <ClipboardPen className="h-5 w-5" />
                    Mulai Isi Buku Tamu
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ============================ KONTAK ============================ */}
        <section id="kontak" className="border-t bg-secondary text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
            <Reveal>
              <div className="max-w-2xl">
                <SectionEyebrow className="text-gold">Hubungi Kami</SectionEyebrow>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Kontak & Jam Pelayanan
                </h2>
                <p className="mt-4 text-white/70">
                  Kunjungi kantor kami atau hubungi melalui kontak berikut.
                </p>
              </div>
            </Reveal>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <ContactCard icon={MapPin} label="Alamat Kantor">
                [Alamat kantor Dinas Perhubungan Kota Batu]
              </ContactCard>
              <ContactCard icon={Clock} label="Jam Pelayanan">
                [Senin–Jumat, jam pelayanan]
              </ContactCard>
              <ContactCard icon={Phone} label="Telepon">
                [Nomor telepon]
              </ContactCard>
              <ContactCard icon={Mail} label="Email">
                [Email instansi]
              </ContactCard>
            </div>
          </div>
        </section>
      </main>

      {/* ============================ FOOTER ============================ */}
      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-center sm:flex-row sm:px-6 sm:text-left">
          <div>
            <p className="font-display text-sm font-bold text-secondary">
              SIBT-DISHUB · Dinas Perhubungan Kota Batu
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              &copy; {year} · Dikembangkan sebagai bagian dari kegiatan Praktik
              Kerja Lapangan (PKL).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/login">Masuk Petugas</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/kios">Isi Buku Tamu</Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-6 py-6 text-center">
      <p className="font-display text-4xl font-extrabold tabular-nums text-primary">
        {value.toLocaleString("id-ID")}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SectionEyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`text-xs font-bold uppercase tracking-[0.18em] text-primary ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

function ContactCard({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <div className="h-full rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15 text-gold">
          <Icon className="h-5 w-5" />
        </div>
        <p className="mt-4 text-sm font-semibold">{label}</p>
        <p className="mt-1 text-sm text-white/70">{children}</p>
      </div>
    </Reveal>
  );
}
