"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MasterConfig } from "./master-config";
import type { MasterRow } from "../application/master-crud.usecase";
import { createMasterAction, updateMasterAction } from "./actions";

interface MasterFormDialogProps {
  config: MasterConfig;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row?: MasterRow | null;
  departments?: { id: string; name: string }[];
}

type FormState = Record<string, string | boolean>;

export function MasterFormDialog({
  config,
  open,
  onOpenChange,
  row,
  departments = [],
}: MasterFormDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<FormState>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!row;

  useEffect(() => {
    if (!open) return;
    const init: FormState = { isActive: row ? row.isActive : true };
    for (const f of config.fields) {
      init[f.key] = (row?.[f.key as keyof MasterRow] as string) ?? "";
    }
    setValues(init);
    setErrors({});
  }, [open, row, config.fields]);

  const setField = (key: string, value: string | boolean) =>
    setValues((v) => ({ ...v, [key]: value }));

  const submit = () => {
    setErrors({});
    startTransition(async () => {
      const payload = { ...values };
      const res = isEdit
        ? await updateMasterAction(config.entity, row!.id, payload)
        : await createMasterAction(config.entity, payload);

      if (!res.ok) {
        if (res.error.fieldErrors) setErrors(res.error.fieldErrors);
        toast.error(res.error.message);
        return;
      }
      toast.success(
        isEdit
          ? `${config.singular} diperbarui.`
          : `${config.singular} ditambahkan.`,
      );
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit ${config.singular}` : `Tambah ${config.singular}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {config.fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={`field-${f.key}`}>
                {f.label}
                {f.required && <span className="ml-1 text-destructive">*</span>}
              </Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={`field-${f.key}`}
                  value={String(values[f.key] ?? "")}
                  onChange={(e) => setField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={2}
                />
              ) : f.type === "select" ? (
                <Select
                  value={String(values[f.key] ?? "")}
                  onValueChange={(v) => setField(f.key, v)}
                >
                  <SelectTrigger id={`field-${f.key}`}>
                    <SelectValue placeholder="Pilih bidang" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`field-${f.key}`}
                  value={String(values[f.key] ?? "")}
                  onChange={(e) => setField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  inputMode={f.type === "phone" ? "tel" : undefined}
                />
              )}
              {errors[f.key] && (
                <p className="text-xs font-medium text-destructive">
                  {errors[f.key]}
                </p>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="field-isActive">Status Aktif</Label>
              <p className="text-xs text-muted-foreground">
                Data nonaktif tidak muncul di pilihan form tamu.
              </p>
            </div>
            <Switch
              id="field-isActive"
              checked={!!values.isActive}
              onCheckedChange={(c) => setField("isActive", c)}
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
