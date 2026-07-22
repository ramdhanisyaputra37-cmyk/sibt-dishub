"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { RoleName } from "@prisma/client";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/shared/lib/utils";
import { canAccessModule } from "@/shared/lib/rbac";
import { NAV_ITEMS } from "./nav-items";

interface SidebarNavProps {
  role: RoleName;
  onNavigate?: () => void;
}

export function SidebarNav({ role, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => canAccessModule(role, item.module));

  return (
    <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Menu utama">
      <div className="mb-4 flex items-center gap-2 px-2">
        <Image
          src="/logo-dishub.svg"
          alt=""
          width={32}
          height={32}
          className="shrink-0"
        />
        <span className="text-lg font-bold tracking-tight">SIBT-DISHUB</span>
      </div>

      {items.map((item) =>
        item.children ? (
          <SidebarGroup
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ) : (
          <SidebarLink
            key={item.href}
            href={item.href}
            label={item.label}
            Icon={item.icon}
            active={
              pathname === item.href || pathname.startsWith(item.href + "/")
            }
            onNavigate={onNavigate}
          />
        ),
      )}
    </nav>
  );
}

function SidebarLink({
  href,
  label,
  Icon,
  active,
  onNavigate,
  nested,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        nested && "ml-4 py-1.5",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function SidebarGroup({
  item,
  pathname,
  onNavigate,
}: {
  item: (typeof NAV_ITEMS)[number];
  pathname: string;
  onNavigate?: () => void;
}) {
  const groupActive = pathname.startsWith(item.href);
  const [open, setOpen] = useState(groupActive);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          groupActive
            ? "text-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate text-left">{item.label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="mt-1 flex flex-col gap-1">
          {item.children!.map((child) => (
            <SidebarLink
              key={child.href}
              href={child.href}
              label={child.label}
              Icon={child.icon}
              active={pathname === child.href}
              onNavigate={onNavigate}
              nested
            />
          ))}
        </div>
      )}
    </div>
  );
}
