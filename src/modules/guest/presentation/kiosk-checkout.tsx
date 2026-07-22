"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, LogOut, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatTimeID, formatDuration } from "@/shared/lib/timezone";
import { kioskCheckoutAction, type KioskResult } from "./kiosk-actions";

interface KioskCheckoutProps {
  token: string;
  fullName: string;
  institutionName: string;
  checkInTime: string;
}

export function KioskCheckout({
  token,
  fullName,
  institutionName,
  checkInTime,
}: KioskCheckoutProps) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<KioskResult | null>(null);

  const submit = () => {
    startTransition(async () => {
      const res = await kioskCheckoutAction(token);
      setDone(res);
    });
  };

  if (done?.ok) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="h-20 w-20 text-success" />
        <div>
          <h2 className="text-2xl font-bold">Terima kasih, {done.fullName}!</h2>
          <p className="mt-2 text-muted-foreground">
            Durasi kunjungan:{" "}
            <span className="font-semibold text-foreground">
              {formatDuration(
                new Date(done.checkInTime),
                new Date(done.checkOutTime),
              )}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            {formatTimeID(done.checkInTime)} – {formatTimeID(done.checkOutTime)}
          </p>
        </div>
      </div>
    );
  }

  if (done && !done.ok) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <XCircle className="h-20 w-20 text-destructive" />
        <div>
          <h2 className="text-xl font-bold">Tidak dapat memproses</h2>
          <p className="mt-2 text-muted-foreground">{done.message}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Silakan hubungi resepsionis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div>
        <h2 className="text-xl font-semibold text-muted-foreground">
          Konfirmasi Selesai Kunjungan?
        </h2>
        <p className="mt-4 text-3xl font-bold">{fullName}</p>
        <p className="mt-1 text-lg text-muted-foreground">{institutionName}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Masuk pukul {formatTimeID(checkInTime)}
        </p>
      </div>

      <Button
        size="xl"
        variant="success"
        className="w-full max-w-sm"
        onClick={submit}
        disabled={pending}
      >
        <LogOut className="h-5 w-5" />
        {pending ? "Memproses..." : "Ya, Saya Selesai (Check-out)"}
      </Button>
    </div>
  );
}
