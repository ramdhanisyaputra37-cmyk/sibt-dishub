import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, CalendarRange, Plus, Users, CalendarClock } from "lucide-react";

import { requireUser } from "@/shared/infrastructure/session";
import { can } from "@/shared/lib/rbac";
import { getDashboardStats } from "@/modules/dashboard/application/get-dashboard-stats.usecase";
import { autoCloseStaleGuests } from "@/modules/guest/application/auto-close-guests.usecase";
import { StatCard } from "@/modules/dashboard/presentation/stat-card";
import {
  VisitsChart,
  DepartmentChart,
} from "@/modules/dashboard/presentation/visits-chart";
import {
  RecentGuestsList,
  TopInstitutionsList,
} from "@/modules/dashboard/presentation/recent-guests-list";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

// Selalu render dinamis — statistik harus mencerminkan data terkini.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  await autoCloseStaleGuests();
  const stats = await getDashboardStats();

  const canCreateGuest = can(user.role, "guest", "create");
  // Resepsionis melihat versi ringkas (tanpa grafik manajemen), sesuai docs/04 §3.
  const showManagementCharts = user.role !== "RESEPSIONIS";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-grad-title text-2xl font-bold tracking-tight">
            Selamat datang, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan aktivitas buku tamu Dinas Perhubungan.
          </p>
        </div>
        {canCreateGuest && (
          <Button asChild>
            <Link href="/buku-tamu/tambah">
              <Plus className="h-4 w-4" />
              Tambah Tamu
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pengunjung Hari Ini"
          value={stats.today}
          Icon={CalendarClock}
          delta={stats.yesterdayDelta}
          deltaLabel="dari kemarin"
        />
        <StatCard label="Minggu Ini" value={stats.week} Icon={CalendarDays} />
        <StatCard label="Bulan Ini" value={stats.month} Icon={CalendarRange} />
        <StatCard label="Tahun Ini" value={stats.year} Icon={Users} />
      </div>

      {showManagementCharts && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <VisitsChart data={stats.monthly} />
          <DepartmentChart data={stats.byDepartment} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {showManagementCharts && (
          <TopInstitutionsList institutions={stats.topInstitutions} />
        )}
        <div className={showManagementCharts ? "" : "lg:col-span-2"}>
          <RecentGuestsList guests={stats.recent} />
        </div>
      </div>
    </div>
  );
}
