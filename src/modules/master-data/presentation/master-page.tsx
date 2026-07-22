import { redirect } from "next/navigation";

import { requireUser } from "@/shared/infrastructure/session";
import { canAccessModule, can } from "@/shared/lib/rbac";
import { prisma } from "@/shared/infrastructure/prisma";
import { listMaster } from "../application/list-master.usecase";
import type { MasterEntity } from "../application/schemas";
import { MASTER_CONFIG } from "./master-config";
import { MasterTable } from "./master-table";

interface MasterPageProps {
  entity: MasterEntity;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Halaman manajemen master data generik (docs/04 §8) — dipakai 4 route tipis. */
export async function MasterPage({ entity, searchParams }: MasterPageProps) {
  const user = await requireUser();
  if (!canAccessModule(user.role, "master")) redirect("/dashboard");

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const showInactive = sp.status === "all";
  const config = MASTER_CONFIG[entity];

  const [rows, departments] = await Promise.all([
    listMaster(entity, { q, showInactive }),
    entity === "employee"
      ? prisma.department.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Master {config.plural}
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola data {config.plural.toLowerCase()} yang dipakai pada form buku
          tamu.
        </p>
      </div>

      <MasterTable
        config={config}
        rows={rows}
        departments={departments}
        canManage={can(user.role, "master", "create")}
      />
    </div>
  );
}
