import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/shared/infrastructure/session";
import { can } from "@/shared/lib/rbac";
import { prisma } from "@/shared/infrastructure/prisma";
import { SettingsForm } from "@/modules/settings/presentation/settings-form";

export const metadata: Metadata = { title: "Pengaturan Sistem" };
export const dynamic = "force-dynamic";

export default async function PengaturanPage() {
  const user = await requireUser();
  if (!can(user.role, "settings", "read")) redirect("/dashboard");

  const settings = await prisma.setting.findMany({ orderBy: { key: "asc" } });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Sistem</h1>
        <p className="text-sm text-muted-foreground">
          Konfigurasi umum aplikasi. Perubahan tercatat di activity log.
        </p>
      </div>

      <SettingsForm
        settings={settings.map((s) => ({
          key: s.key,
          value: s.value,
          description: s.description,
        }))}
      />
    </div>
  );
}
