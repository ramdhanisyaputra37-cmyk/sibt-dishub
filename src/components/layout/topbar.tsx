"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import type { RoleName } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DarkModeToggle } from "./dark-mode-toggle";
import { UserMenu } from "./user-menu";
import { SidebarNav } from "./sidebar-nav";
import { GlobalSearch } from "./global-search";
import type { CurrentUser } from "@/shared/infrastructure/session";

export function Topbar({ user }: { user: CurrentUser }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-grad-b sticky top-0 z-30 flex h-16 items-center gap-2 bg-card/85 px-4 backdrop-blur-md lg:px-6">
      {/* Tombol menu mobile */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarNav
            role={user.role as RoleName}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex-1">
        <GlobalSearch />
      </div>

      <DarkModeToggle />
      <UserMenu user={user} />
    </header>
  );
}
