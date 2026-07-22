"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, X, FileDown, FileSpreadsheet, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GUEST_STATUS_OPTIONS } from "./status-label";

interface GuestFiltersProps {
  departments: { id: string; name: string }[];
  canExport: boolean;
  canImport: boolean;
  onImportClick?: () => void;
}

const ALL = "__all__";

export function GuestFilters({
  departments,
  canExport,
  canImport,
  onImportClick,
}: GuestFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  // Update satu param & reset ke page 1, refleksikan di URL (docs/01 §5.3).
  const setParam = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === ALL) next.delete(key);
        else next.set(key, value);
      }
      next.delete("page");
      startTransition(() => router.push(`/buku-tamu?${next.toString()}`));
    },
    [params, router],
  );

  const hasFilters =
    !!params.get("q") ||
    !!params.get("status") ||
    !!params.get("departmentId") ||
    !!params.get("dari") ||
    !!params.get("sampai");

  const exportHref = (format: "excel" | "pdf") => {
    const next = new URLSearchParams(params.toString());
    next.set("format", format);
    return `/buku-tamu/export?${next.toString()}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam({ q });
          }}
          className="relative flex-1"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, instansi, pegawai, no. antrian..."
            className="pl-9"
          />
        </form>

        <Select
          value={params.get("status") ?? ALL}
          onValueChange={(v) => setParam({ status: v })}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Status</SelectItem>
            {GUEST_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.get("departmentId") ?? ALL}
          onValueChange={(v) => setParam({ departmentId: v })}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Bidang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Bidang</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground">Dari</label>
            <Input
              type="date"
              value={params.get("dari") ?? ""}
              onChange={(e) => setParam({ dari: e.target.value })}
              className="h-8 w-auto"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground">Sampai</label>
            <Input
              type="date"
              value={params.get("sampai") ?? ""}
              onChange={(e) => setParam({ sampai: e.target.value })}
              className="h-8 w-auto"
            />
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQ("");
                startTransition(() => router.push("/buku-tamu"));
              }}
            >
              <X className="h-4 w-4" />
              Reset
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canImport && (
            <Button variant="outline" size="sm" onClick={onImportClick}>
              <Upload className="h-4 w-4" />
              Import Excel
            </Button>
          )}
          {canExport && (
            <>
              <Button variant="outline" size="sm" asChild>
                <a href={exportHref("excel")}>
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={exportHref("pdf")} target="_blank" rel="noreferrer">
                  <FileDown className="h-4 w-4" />
                  PDF
                </a>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
