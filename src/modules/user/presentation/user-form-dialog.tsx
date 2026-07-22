"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_OPTIONS } from "../application/user.schema";
import type { UserRow } from "../application/user.usecase";
import { createUserAction, updateUserAction } from "./actions";

type Role = "SUPER_ADMIN" | "ADMIN" | "RESEPSIONIS" | "KEPALA_DINAS";

export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user?: UserRow | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<{
    name: string;
    email: string;
    password: string;
    role: Role;
    phoneNumber: string;
    isActive: boolean;
  }>({
    name: "",
    email: "",
    password: "",
    role: "RESEPSIONIS",
    phoneNumber: "",
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = !!user;

  useEffect(() => {
    if (!open) return;
    setValues({
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      role: (user?.role as Role) ?? "RESEPSIONIS",
      phoneNumber: "",
      isActive: user?.isActive ?? true,
    });
    setErrors({});
  }, [open, user]);

  const set = (k: string, v: string | boolean) =>
    setValues((s) => ({ ...s, [k]: v }));

  const submit = () => {
    setErrors({});
    startTransition(async () => {
      const res = isEdit
        ? await updateUserAction(user!.id, values)
        : await createUserAction(values);
      if (!res.ok) {
        if (res.error.fieldErrors) setErrors(res.error.fieldErrors);
        toast.error(res.error.message);
        return;
      }
      toast.success(isEdit ? "Pengguna diperbarui." : "Pengguna ditambahkan.");
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Pengguna" : "Tambah Pengguna"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Kosongkan kata sandi bila tidak ingin mengubahnya."
              : "Kata sandi minimal 8 karakter."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="Nama" required error={errors.name}>
            <Input
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field label="Email" required error={errors.email}>
            <Input
              type="email"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field
            label={isEdit ? "Kata Sandi Baru" : "Kata Sandi"}
            required={!isEdit}
            error={errors.password}
          >
            <Input
              type="password"
              value={values.password}
              placeholder={isEdit ? "Kosongkan bila tidak diubah" : ""}
              onChange={(e) => set("password", e.target.value)}
            />
          </Field>
          <Field label="Role" required error={errors.role}>
            <Select value={values.role} onValueChange={(v) => set("role", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="No. HP" error={errors.phoneNumber}>
            <Input
              value={values.phoneNumber}
              placeholder="Opsional"
              onChange={(e) => set("phoneNumber", e.target.value)}
            />
          </Field>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="user-active">Akun Aktif</Label>
            <Switch
              id="user-active"
              checked={values.isActive}
              onCheckedChange={(c) => set("isActive", c)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Batal
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
