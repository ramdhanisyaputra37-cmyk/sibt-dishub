"use client";

import { useState, useTransition } from "react";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { importGuestsAction } from "./actions";

interface ImportError {
  row: number;
  field: string;
  message: string;
}

export function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [summary, setSummary] = useState<string | null>(null);

  const submit = () => {
    if (!file) {
      toast.error("Pilih file Excel terlebih dahulu.");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      const res = await importGuestsAction(fd);
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      const { imported, failed, errors } = res.data;
      setErrors(errors);
      setSummary(`${imported} baris berhasil, ${failed} gagal.`);
      if (imported > 0) {
        toast.success(`${imported} tamu berhasil diimpor.`);
        router.refresh();
      }
      if (failed === 0) {
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Data Tamu dari Excel</DialogTitle>
          <DialogDescription>
            Kolom yang dikenali: Nama, NIK, Kelamin, Alamat, No HP, Email,
            Instansi, Bidang, Pegawai, Keperluan. Bidang, Keperluan, dan
            Pegawai harus cocok dengan master data yang ada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setErrors([]);
              setSummary(null);
            }}
          />

          {summary && (
            <div className="rounded-md bg-muted px-3 py-2 text-sm">
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                {summary}
              </span>
            </div>
          )}

          {errors.length > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5">
              <p className="border-b border-destructive/20 px-3 py-2 text-sm font-medium text-destructive">
                Baris gagal ({errors.length})
              </p>
              <ScrollArea className="max-h-48">
                <ul className="divide-y divide-border/50 text-sm">
                  {errors.map((e, i) => (
                    <li key={i} className="px-3 py-1.5">
                      <span className="font-medium">Baris {e.row}</span>
                      {" · "}
                      <span className="text-muted-foreground">{e.field}</span>
                      {": "}
                      {e.message}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Tutup
          </Button>
          <Button onClick={submit} disabled={pending || !file}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
