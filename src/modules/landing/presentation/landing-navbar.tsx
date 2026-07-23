"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, LogIn, ClipboardPen } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Beranda", href: "#beranda" },
  { label: "Tentang", href: "#tentang" },
  { label: "Alur Kunjungan", href: "#alur" },
  { label: "Kontak", href: "#kontak" },
];

export function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-colors",
        scrolled
          ? "border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75"
          : "border-transparent bg-background",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Kiri: logo + nama instansi */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo-dishub.svg"
            alt="Logo Dinas Perhubungan"
            width={36}
            height={36}
            priority
          />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-base font-extrabold tracking-tight text-secondary">
              SIBT-DISHUB
            </span>
            <span className="text-[11px] text-muted-foreground">
              Dinas Perhubungan Kota Batu
            </span>
          </span>
        </Link>

        {/* Tengah: anchor links (desktop) */}
        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-secondary"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Kanan: aksi */}
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="shadow-sm">
            <Link href="/kios">
              <ClipboardPen className="h-4 w-4" />
              Isi Buku Tamu
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="hidden md:inline-flex"
          >
            <Link href="/login">
              <LogIn className="h-4 w-4" />
              Masuk
            </Link>
          </Button>

          {/* Hamburger (mobile) */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Menu mobile */}
      {open && (
        <div className="border-t bg-background md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-secondary"
              >
                {l.label}
              </a>
            ))}
            <Button asChild variant="outline" className="mt-2">
              <Link href="/login" onClick={() => setOpen(false)}>
                <LogIn className="h-4 w-4" />
                Masuk sebagai Petugas
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
