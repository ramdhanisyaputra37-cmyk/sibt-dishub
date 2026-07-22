import type { RoleName } from "@prisma/client";

/**
 * Implementasi matriks hak akses docs/01-analisis-kebutuhan.md §6.
 * SATU sumber kebenaran untuk seluruh pengecekan izin — middleware, Server
 * Action, dan UI semuanya merujuk ke sini, tidak ada aturan akses implisit.
 */

export type Module =
  | "dashboard"
  | "guest"
  | "master"
  | "report"
  | "activityLog"
  | "user"
  | "settings";

export type Action =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "print"
  | "import";

// Matriks: modul -> aksi -> daftar role yang diizinkan.
const MATRIX: Record<Module, Partial<Record<Action, RoleName[]>>> = {
  dashboard: {
    read: ["SUPER_ADMIN", "ADMIN", "RESEPSIONIS", "KEPALA_DINAS"],
  },
  guest: {
    create: ["SUPER_ADMIN", "ADMIN", "RESEPSIONIS"],
    read: ["SUPER_ADMIN", "ADMIN", "RESEPSIONIS", "KEPALA_DINAS"],
    update: ["SUPER_ADMIN", "ADMIN", "RESEPSIONIS"], // Resepsionis dibatasi §4.4 di layer usecase
    delete: ["SUPER_ADMIN", "ADMIN"],
    export: ["SUPER_ADMIN", "ADMIN", "KEPALA_DINAS"],
    print: ["SUPER_ADMIN", "ADMIN", "RESEPSIONIS", "KEPALA_DINAS"],
    import: ["SUPER_ADMIN", "ADMIN"],
  },
  master: {
    create: ["SUPER_ADMIN", "ADMIN"],
    read: ["SUPER_ADMIN", "ADMIN", "RESEPSIONIS", "KEPALA_DINAS"],
    update: ["SUPER_ADMIN", "ADMIN"],
    delete: ["SUPER_ADMIN", "ADMIN"],
  },
  report: {
    read: ["SUPER_ADMIN", "ADMIN", "KEPALA_DINAS"],
    export: ["SUPER_ADMIN", "ADMIN", "KEPALA_DINAS"],
    print: ["SUPER_ADMIN", "ADMIN", "KEPALA_DINAS"],
  },
  activityLog: {
    read: ["SUPER_ADMIN"],
  },
  user: {
    create: ["SUPER_ADMIN"],
    read: ["SUPER_ADMIN"],
    update: ["SUPER_ADMIN"],
    delete: ["SUPER_ADMIN"],
  },
  settings: {
    read: ["SUPER_ADMIN"],
    update: ["SUPER_ADMIN"],
  },
};

export function can(
  role: RoleName | undefined | null,
  module: Module,
  action: Action,
): boolean {
  if (!role) return false;
  return MATRIX[module]?.[action]?.includes(role) ?? false;
}

/** Apakah role punya akses baca (minimal) ke sebuah modul — dipakai untuk
 *  menampilkan/menyembunyikan menu sidebar & guard route di middleware. */
export function canAccessModule(
  role: RoleName | undefined | null,
  module: Module,
): boolean {
  if (!role) return false;
  const actions = MATRIX[module];
  if (!actions) return false;
  return Object.values(actions).some((roles) => roles?.includes(role));
}

/** Peta prefix path -> modul, untuk pengecekan cepat di middleware (edge). */
export const ROUTE_MODULE_MAP: { prefix: string; module: Module }[] = [
  { prefix: "/dashboard", module: "dashboard" },
  { prefix: "/buku-tamu", module: "guest" },
  { prefix: "/master", module: "master" },
  { prefix: "/laporan", module: "report" },
  { prefix: "/activity-log", module: "activityLog" },
  { prefix: "/pengguna", module: "user" },
  { prefix: "/pengaturan", module: "settings" },
];

export function moduleForPath(pathname: string): Module | null {
  const match = ROUTE_MODULE_MAP.find((r) => pathname.startsWith(r.prefix));
  return match?.module ?? null;
}

export const ROLE_LABELS: Record<RoleName, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  RESEPSIONIS: "Resepsionis",
  KEPALA_DINAS: "Kepala Dinas",
};
