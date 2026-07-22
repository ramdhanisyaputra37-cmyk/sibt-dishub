import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookUser,
  Database,
  FileBarChart,
  ScrollText,
  Users,
  Settings,
  Building2,
  Briefcase,
  UserCog,
  ClipboardList,
} from "lucide-react";

import type { Module } from "@/shared/lib/rbac";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  module: Module;
  children?: { label: string; href: string; icon: LucideIcon }[];
}

// Menu sidebar — modul dipakai untuk filter berbasis RBAC (docs/01 §6).
export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    module: "dashboard",
  },
  {
    label: "Buku Tamu",
    href: "/buku-tamu",
    icon: BookUser,
    module: "guest",
  },
  {
    label: "Master Data",
    href: "/master",
    icon: Database,
    module: "master",
    children: [
      { label: "Pegawai", href: "/master/pegawai", icon: UserCog },
      { label: "Bidang", href: "/master/bidang", icon: Briefcase },
      { label: "Instansi", href: "/master/instansi", icon: Building2 },
      { label: "Keperluan", href: "/master/keperluan", icon: ClipboardList },
    ],
  },
  {
    label: "Laporan",
    href: "/laporan",
    icon: FileBarChart,
    module: "report",
  },
  {
    label: "Activity Log",
    href: "/activity-log",
    icon: ScrollText,
    module: "activityLog",
  },
  {
    label: "Manajemen Pengguna",
    href: "/pengguna",
    icon: Users,
    module: "user",
  },
  {
    label: "Pengaturan",
    href: "/pengaturan",
    icon: Settings,
    module: "settings",
  },
];
