import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Plus Jakarta Sans dipakai di seluruh aplikasi (bukan hanya heading publik):
// terminal hurufnya lebih membulat sehingga terasa lebih lembut dibanding
// grotesk kaku, namun tetap berwibawa untuk konteks instansi.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
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
