import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Font display untuk heading halaman publik (landing & login). Ditugaskan
// pemerintah Provinsi DKI Jakarta — cocok untuk identitas instansi.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SIBT-DISHUB — Buku Tamu Digital",
    template: "%s | SIBT-DISHUB",
  },
  description:
    "Sistem Informasi Buku Tamu Digital Dinas Perhubungan — pencatatan tamu yang cepat, akurat, dan terekam audit.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jakarta.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
