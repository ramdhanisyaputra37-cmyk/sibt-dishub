import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/shared/infrastructure/session";
import { can } from "@/shared/lib/rbac";
import { listUsers } from "@/modules/user/application/user.usecase";
import { UserTable } from "@/modules/user/presentation/user-table";

export const metadata: Metadata = { title: "Manajemen Pengguna" };
export const dynamic = "force-dynamic";

export default async function PenggunaPage() {
  const user = await requireUser();
  if (!can(user.role, "user", "read")) redirect("/dashboard");

  const users = await listUsers();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Manajemen Pengguna
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola akun staf dan hak aksesnya.
        </p>
      </div>

      <UserTable users={users} currentUserId={user.id} />
    </div>
  );
}
