import type { RoleName } from "@prisma/client";

import { requireUser } from "@/shared/infrastructure/session";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { ScrollArea } from "@/components/ui/scroll-area";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guard sesi + isActive di batas seluruh area ber-auth (docs/01 §4.5).
  const user = await requireUser();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar desktop (statis); versi mobile ada di Topbar (Sheet). */}
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">
        <ScrollArea className="h-screen">
          <SidebarNav role={user.role as RoleName} />
        </ScrollArea>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
