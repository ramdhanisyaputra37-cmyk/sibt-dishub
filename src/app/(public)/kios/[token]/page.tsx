import Image from "next/image";
import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

import { getGuestByToken } from "@/modules/guest/application/checkout-guest.usecase";
import { KioskCheckout } from "@/modules/guest/presentation/kiosk-checkout";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Checkout Kios",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function KioskPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const guest = await getGuestByToken(token);

  const invalid =
    !guest || guest.status === "DIBATALKAN" || !!guest.checkOutTime;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo-dishub.svg"
            alt="Logo Dinas Perhubungan"
            width={56}
            height={56}
            priority
          />
          <h1 className="mt-3 text-xl font-bold tracking-tight">SIBT-DISHUB</h1>
        </div>

        <Card>
          <CardContent className="py-10">
            {invalid ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertTriangle className="h-16 w-16 text-warning" />
                <div>
                  <h2 className="text-xl font-bold">Tautan tidak berlaku</h2>
                  <p className="mt-2 text-muted-foreground">
                    {guest?.checkOutTime
                      ? "Kunjungan ini sudah diselesaikan sebelumnya."
                      : guest?.status === "DIBATALKAN"
                        ? "Kunjungan ini telah dibatalkan."
                        : "Kunjungan tidak ditemukan atau tautan tidak valid."}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Silakan hubungi resepsionis.
                  </p>
                </div>
              </div>
            ) : (
              <KioskCheckout
                token={token}
                fullName={guest.fullName}
                institutionName={guest.institution.name}
                checkInTime={guest.checkInTime.toISOString()}
              />
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Dinas Perhubungan &copy; {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
