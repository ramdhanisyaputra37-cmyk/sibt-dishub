import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { requireUser } from "@/shared/infrastructure/session";
import { can } from "@/shared/lib/rbac";
import { getGuestById } from "@/modules/guest/application/get-guest.usecase";
import { canEditGuest } from "@/modules/guest/application/update-guest.usecase";
import { getGuestLookups } from "@/modules/guest/application/guest-lookups.usecase";
import { GuestForm } from "@/modules/guest/presentation/guest-form";
import type { GuestFormInput } from "@/modules/guest/application/guest.schema";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Edit Tamu" };
export const dynamic = "force-dynamic";

export default async function EditTamuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const guest = await getGuestById(id);
  if (!guest) notFound();

  // Guard retensi edit (docs/01 §4.4) — ditegakkan juga di server action.
  const allowed =
    can(user.role, "guest", "update") &&
    canEditGuest(user.role, {
      visitDate: guest.visitDate,
      status: guest.status,
      checkInTime: guest.checkInTime,
    });
  if (!allowed) redirect(`/buku-tamu/${id}`);

  const lookups = await getGuestLookups();

  const defaults: Partial<GuestFormInput> = {
    fullName: guest.fullName,
    nik: guest.nik ?? "",
    gender: guest.gender,
    address: guest.address,
    phoneNumber: guest.phoneNumber,
    email: guest.email ?? "",
    institutionId: guest.institution.id,
    departmentId: guest.department.id,
    employeeId: guest.employee?.id ?? "",
    purposeId: guest.purpose.id,
    visitDetail: guest.visitDetail ?? "",
    notes: guest.notes ?? "",
    signatureImage: guest.signatureImage ?? "",
    photoData: "",
    status: guest.status,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/buku-tamu/${id}`} aria-label="Kembali">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Data Tamu</h1>
          <p className="font-mono text-sm text-muted-foreground">
            {guest.queueNumber}
          </p>
        </div>
      </div>

      <GuestForm
        lookups={lookups}
        mode="edit"
        guestId={id}
        defaultValues={defaults}
      />
    </div>
  );
}
