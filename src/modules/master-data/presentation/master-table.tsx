"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Database, MoreHorizontal, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MasterConfig } from "./master-config";
import type { MasterRow } from "../application/master-crud.usecase";
import { MasterFormDialog } from "./master-form-dialog";
import {
  deleteMasterAction,
  toggleMasterActiveAction,
} from "./actions";

interface MasterTableProps {
  config: MasterConfig;
  rows: MasterRow[];
  departments?: { id: string; name: string }[];
  canManage: boolean;
}

export function MasterTable({
  config,
  rows,
  departments = [],
  canManage,
}: MasterTableProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startNav] = useTransition();
  const [pending, startAction] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MasterRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MasterRow | null>(null);

  const setParam = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (!v) next.delete(k);
      else next.set(k, v);
    }
    startNav(() => router.push(`?${next.toString()}`));
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: MasterRow) => {
    setEditing(row);
    setFormOpen(true);
  };

  const toggleActive = (row: MasterRow) => {
    startAction(async () => {
      const res = await toggleMasterActiveAction(
        config.entity,
        row.id,
        !row.isActive,
      );
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success(
        row.isActive
          ? `${config.singular} dinonaktifkan.`
          : `${config.singular} diaktifkan.`,
      );
      router.refresh();
    });
  };

  const doDelete = () => {
    if (!deleteTarget) return;
    startAction(async () => {
      const res = await deleteMasterAction(config.entity, deleteTarget.id);
      if (!res.ok) {
        toast.error(res.error.message);
        setDeleteTarget(null);
        return;
      }
      toast.success(`${config.singular} dihapus.`);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const showInactive = params.get("status") === "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setParam({ q: q || undefined });
            }}
            className="relative flex-1 sm:max-w-xs"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Cari ${config.singular.toLowerCase()}...`}
              className="pl-9"
            />
          </form>
          <Select
            value={showInactive ? "all" : "active"}
            onValueChange={(v) =>
              setParam({ status: v === "all" ? "all" : undefined })
            }
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Hanya Aktif</SelectItem>
              <SelectItem value="all">Semua Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canManage && (
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Tambah {config.singular}
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Database className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Belum ada data {config.singular.toLowerCase()}</p>
            <p className="text-sm text-muted-foreground">
              {canManage
                ? `Klik "Tambah ${config.singular}" untuk membuat data pertama.`
                : "Data akan muncul di sini."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                {config.columns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
                <TableHead>Status</TableHead>
                {canManage && (
                  <TableHead className="w-12 text-right">Aksi</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className={!row.isActive ? "opacity-60" : ""}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  {config.columns.map((c) => (
                    <TableCell key={c.key}>
                      {(row[c.key as keyof MasterRow] as string) || "—"}
                    </TableCell>
                  ))}
                  <TableCell>
                    {row.isActive ? (
                      <Badge variant="success">Aktif</Badge>
                    ) : (
                      <Badge variant="secondary">Nonaktif</Badge>
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEdit(row)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => toggleActive(row)}
                            disabled={pending}
                          >
                            <Power className="h-4 w-4" />
                            {row.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={(e) => {
                              e.preventDefault();
                              setDeleteTarget(row);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <MasterFormDialog
        config={config}
        open={formOpen}
        onOpenChange={setFormOpen}
        row={editing}
        departments={departments}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {config.singular}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && deleteTarget.referenceCount > 0 ? (
                <>
                  <strong>{deleteTarget.name}</strong> masih dipakai oleh{" "}
                  {deleteTarget.referenceCount} data buku tamu. Data yang sudah
                  direferensikan tidak dapat dihapus — nonaktifkan saja agar
                  tidak muncul di form baru namun riwayat tetap utuh.
                </>
              ) : (
                <>
                  Data <strong>{deleteTarget?.name}</strong> akan dihapus
                  permanen. Tindakan ini tidak dapat dibatalkan.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                doDelete();
              }}
              disabled={pending || (deleteTarget?.referenceCount ?? 0) > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
