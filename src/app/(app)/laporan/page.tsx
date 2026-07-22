import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/shared/infrastructure/session";
import { can } from "@/shared/lib/rbac";
import { formatTimeID, formatDateID } from "@/shared/lib/timezone";
import { reportQuerySchema } from "@/modules/report/application/report.schema";
import { generateReport } from "@/modules/report/application/generate-report.usecase";
import { ReportControls } from "@/modules/report/presentation/report-controls";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Laporan" };
export const dynamic = "force-dynamic";

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  if (!can(user.role, "report", "read")) redirect("/dashboard");

  const sp = await searchParams;
  const query = reportQuerySchema.parse({
    type: sp.type,
    date: sp.date,
    dari: sp.dari,
    sampai: sp.sampai,
  });
  const report = await generateReport(query);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan Kunjungan</h1>
        <p className="text-sm text-muted-foreground">
          Rekap kunjungan tamu per periode, siap diexport dan dicetak.
        </p>
      </div>

      <ReportControls canExport={can(user.role, "report", "export")} />

      {/* Ringkasan */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">{report.periodLabel}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryTile label="Total Kunjungan" value={report.summary.total} highlight />
          {report.summary.byStatus.slice(0, 4).map((s) => (
            <SummaryTile key={s.label} label={s.label} value={s.count} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownCard
          title="Kunjungan per Bidang"
          items={report.summary.byDepartment}
        />
        <BreakdownCard
          title="Instansi Terbanyak"
          items={report.summary.byInstitution}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail Kunjungan</CardTitle>
        </CardHeader>
        <CardContent>
          {report.rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Tidak ada kunjungan pada periode ini.
            </p>
          ) : (
            <div className="max-h-[32rem] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>No. Antrian</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Instansi</TableHead>
                    <TableHead>Bidang</TableHead>
                    <TableHead>Keperluan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Masuk</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.rows.map((r) => (
                    <TableRow key={r.queueNumber}>
                      <TableCell className="font-mono text-xs">
                        {r.queueNumber}
                      </TableCell>
                      <TableCell className="font-medium">{r.fullName}</TableCell>
                      <TableCell>{r.institution}</TableCell>
                      <TableCell>{r.department}</TableCell>
                      <TableCell>{r.purpose}</TableCell>
                      <TableCell>{formatDateID(r.checkIn)}</TableCell>
                      <TableCell>{formatTimeID(r.checkIn)}</TableCell>
                      <TableCell>{r.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary/40 bg-primary/5" : ""}>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">
          {value.toLocaleString("id-ID")}
        </p>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({
  title,
  items,
}: {
  title: string;
  items: { name: string; count: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada data.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.name} className="flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 truncate text-sm">
                  {it.name}
                </span>
                <span className="text-sm font-medium tabular-nums text-muted-foreground">
                  {it.count.toLocaleString("id-ID")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
