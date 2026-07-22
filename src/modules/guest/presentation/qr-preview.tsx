"use client";

import Image from "next/image";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Tampilkan QR (data URL yang digenerate di server dari qrToken) + tombol
 *  cetak tiket. QR mengarah ke halaman kios untuk self-checkout (docs/01 §4.1). */
export function QrPreview({
  dataUrl,
  queueNumber,
}: {
  dataUrl: string;
  queueNumber: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Image
        src={dataUrl}
        alt={`QR Code kunjungan ${queueNumber}`}
        width={176}
        height={176}
        className="rounded-md border bg-white p-2"
        unoptimized
      />
      <p className="text-center text-xs text-muted-foreground">
        Pindai untuk checkout mandiri di kios, atau tunjukkan ke resepsionis
        saat meninggalkan lokasi.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="no-print"
        onClick={() => window.print()}
      >
        <Printer className="h-4 w-4" />
        Cetak Tiket
      </Button>
    </div>
  );
}
