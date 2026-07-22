"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  FileDown,
  FileSpreadsheet,
  Printer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REPORT_TYPES, type ReportType } from "../application/report.schema";

export function ReportControls({
  canExport,
}: {
  canExport: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startNav] = useTransition();

  const type = (params.get("type") as ReportType) ?? "harian";

  const setParams = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (!v) next.delete(k);
      else next.set(k, v);
    }
    startNav(() => router.push(`/laporan?${next.toString()}`));
  };

  const exportHref = (format: "excel" | "pdf") => {
    const next = new URLSearchParams(params.toString());
    next.set("format", format);
    return `/laporan/export?${next.toString()}`;
  };

  const todayYmd = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 no-print">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Jenis Laporan</Label>
          <Select value={type} onValueChange={(v) => setParams({ type: v, date: undefined, dari: undefined, sampai: undefined })}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(type === "harian" || type === "mingguan") && (
          <div className="space-y-1">
            <Label className="text-xs">Tanggal</Label>
            <Input
              type="date"
              defaultValue={params.get("date") ?? todayYmd}
              onChange={(e) => setParams({ date: e.target.value })}
              className="w-auto"
            />
          </div>
        )}
        {type === "bulanan" && (
          <div className="space-y-1">
            <Label className="text-xs">Bulan</Label>
            <Input
              type="month"
              defaultValue={params.get("date") ?? todayYmd.slice(0, 7)}
              onChange={(e) => setParams({ date: e.target.value })}
              className="w-auto"
            />
          </div>
        )}
        {type === "tahunan" && (
          <div className="space-y-1">
            <Label className="text-xs">Tahun</Label>
            <Input
              type="number"
              min={2000}
              max={2100}
              defaultValue={params.get("date") ?? todayYmd.slice(0, 4)}
              onChange={(e) => setParams({ date: e.target.value })}
              className="w-28"
            />
          </div>
        )}
        {type === "rentang" && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Dari</Label>
              <Input
                type="date"
                defaultValue={params.get("dari") ?? todayYmd}
                onChange={(e) => setParams({ dari: e.target.value })}
                className="w-auto"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sampai</Label>
              <Input
                type="date"
                defaultValue={params.get("sampai") ?? todayYmd}
                onChange={(e) => setParams({ sampai: e.target.value })}
                className="w-auto"
              />
            </div>
          </>
        )}
      </div>

      {canExport && (
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <Button variant="outline" size="sm" asChild>
            <a href={exportHref("excel")}>
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={exportHref("pdf")} target="_blank" rel="noreferrer">
              <FileDown className="h-4 w-4" />
              Export PDF
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Cetak
          </Button>
        </div>
      )}
    </div>
  );
}
