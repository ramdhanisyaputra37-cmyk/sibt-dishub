import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";

import { requireUser } from "@/shared/infrastructure/session";
import { can } from "@/shared/lib/rbac";
import { generateKioskQr } from "@/shared/lib/qr";
import {
  formatDateID,
  formatTimeID,
  formatDuration,
} from "@/shared/lib/timezone";
import { getGuestById } from "@/modules/guest/application/get-guest.usecase";
import { canEditGuest } from "@/modules/guest/application/update-guest.usecase";
import { GuestStatusBadge } from "@/modules/guest/presentation/status-badge";
import { StatusSelect } from "@/modules/guest/presentation/status-select";
import { QrPreview } from "@/modules/guest/presentation/qr-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Detail Kunjungan" };
export const dynamic = "force-dynamic";

export default async function GuestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const guest = await getGuestById(id);
  if (!guest) notFound();

  const qrDataUrl = await generateKioskQr(guest.qrToken);
  const editable =
    can(user.role, "guest", "update") &&
    canEditGuest(user.role, {
      visitDate: guest.visitDate,
      status: guest.status,
      checkInTime: guest.checkInTime,
    });

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/buku-tamu" aria-label="Kembali">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Detail Kunjungan
            </h1>
            <p className="font-mono text-sm text-muted-foreground">
              {guest.queueNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editable ? (
            <StatusSelect guestId={guest.id} current={guest.status} />
          ) : (
            <GuestStatusBadge status={guest.status} />
          )}
          {editable && (
            <Button variant="outline" asChild>
              <Link href={`/buku-tamu/${guest.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Informasi Tamu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              {guest.photoUrl ? (
                <Image
                  src={guest.photoUrl}
                  alt={`Foto ${guest.fullName}`}
                  width={112}
                  height={112}
                  className="h-28 w-28 shrink-0 rounded-md border object-cover"
                />
              ) : (
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                  Tanpa foto
                </div>
              )}
              <div className="grid flex-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                <Field label="Nama Lengkap" value={guest.fullName} />
                <Field label="NIK" value={guest.nik ?? "-"} />
                <Field
                  label="Jenis Kelamin"
                  value={guest.gender === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}
                />
                <Field label="No. HP" value={guest.phoneNumber} />
                <Field label="Email" value={guest.email ?? "-"} />
                <Field label="Alamat" value={guest.address} />
              </div>
            </div>

            <Separator />

            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              <Field label="Instansi" value={guest.institution.name} />
              <Field label="Bidang Tujuan" value={guest.department.name} />
              <Field
                label="Pegawai Ditemui"
                value={
                  guest.employee
                    ? `${guest.employee.name}${guest.employee.position ? ` (${guest.employee.position})` : ""}`
                    : "-"
                }
              />
              <Field label="Keperluan" value={guest.purpose.name} />
              {guest.visitDetail && (
                <Field
                  label="Tujuan Kunjungan"
                  value={guest.visitDetail}
                  className="sm:col-span-2"
                />
              )}
              <Field label="Tanggal" value={formatDateID(guest.visitDate)} />
              <Field
                label="Waktu"
                value={`${formatTimeID(guest.checkInTime)} – ${
                  guest.checkOutTime
                    ? `${formatTimeID(guest.checkOutTime)} (${formatDuration(guest.checkInTime, guest.checkOutTime)})`
                    : "belum keluar"
                }`}
              />
              {guest.notes && (
                <Field
                  label="Catatan"
                  value={guest.notes}
                  className="sm:col-span-2"
                />
              )}
            </div>

            {guest.signatureImage && (
              <>
                <Separator />
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    Tanda Tangan
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={guest.signatureImage}
                    alt="Tanda tangan tamu"
                    className="h-24 rounded-md border bg-white object-contain"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">QR Kunjungan</CardTitle>
          </CardHeader>
          <CardContent>
            <QrPreview dataUrl={qrDataUrl} queueNumber={guest.queueNumber} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
