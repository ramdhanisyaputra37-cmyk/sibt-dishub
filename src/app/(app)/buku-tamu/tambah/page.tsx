import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { requireUser } from "@/shared/infrastructure/session";
import { can } from "@/shared/lib/rbac";
import { getGuestLookups } from "@/modules/guest/application/guest-lookups.usecase";
import { GuestForm } from "@/modules/guest/presentation/guest-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Tambah Tamu" };
export const dynamic = "force-dynamic";

export default async function TambahTamuPage() {
  const user = await requireUser();
  if (!can(user.role, "guest", "create")) redirect("/buku-tamu");

  const lookups = await getGuestLookups();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/buku-tamu" aria-label="Kembali">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-grad-title text-2xl font-bold tracking-tight">Tambah Tamu Baru</h1>
          <p className="text-sm text-muted-foreground">
            Catat kunjungan tamu. Field bertanda{" "}
            <span className="text-destructive">*</span> wajib diisi.
          </p>
        </div>
      </div>

      <GuestForm lookups={lookups} mode="create" />
    </div>
  );
}
