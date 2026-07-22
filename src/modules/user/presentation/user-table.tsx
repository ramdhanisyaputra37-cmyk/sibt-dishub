"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Plus, Power } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS } from "@/shared/lib/rbac";
import { formatDateTimeID } from "@/shared/lib/timezone";
import type { RoleName } from "@prisma/client";
import type { UserRow } from "../application/user.usecase";
import { UserFormDialog } from "./user-form-dialog";
import { toggleUserActiveAction } from "./actions";

export function UserTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [, startAction] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

  const toggleActive = (u: UserRow) => {
    startAction(async () => {
      const res = await toggleUserActiveAction(u.id, !u.isActive);
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success(u.isActive ? "Akun dinonaktifkan." : "Akun diaktifkan.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Tambah Pengguna
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Login Terakhir</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} className={!u.isActive ? "opacity-60" : ""}>
                <TableCell className="font-medium">
                  {u.name}
                  {u.id === currentUserId && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Anda)
                    </span>
                  )}
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {ROLE_LABELS[u.role as RoleName]}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {u.lastLoginAt ? formatDateTimeID(u.lastLoginAt) : "Belum pernah"}
                </TableCell>
                <TableCell>
                  {u.isActive ? (
                    <Badge variant="success">Aktif</Badge>
                  ) : (
                    <Badge variant="secondary">Nonaktif</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => {
                          setEditing(u);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => toggleActive(u)}
                        disabled={u.id === currentUserId}
                      >
                        <Power className="h-4 w-4" />
                        {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
      />
    </div>
  );
}
