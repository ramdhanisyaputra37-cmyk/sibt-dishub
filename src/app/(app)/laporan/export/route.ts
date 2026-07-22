import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { authorize } from "@/shared/infrastructure/session";
import { recordActivity } from "@/shared/infrastructure/activity-logger";
import { formatDateTimeID, formatTimeID } from "@/shared/lib/timezone";
import { reportQuerySchema } from "@/modules/report/application/report.schema";
import { generateReport } from "@/modules/report/application/generate-report.usecase";
import { buildReportExcel } from "@/modules/report/infrastructure/report-excel.builder";
import { ReportPdf } from "@/modules/report/infrastructure/report-pdf.template";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authz = await authorize("report", "export");
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error.message }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const format = sp.get("format") === "pdf" ? "pdf" : "excel";
  const query = reportQuerySchema.parse({
    type: sp.get("type") ?? undefined,
    date: sp.get("date") ?? undefined,
    dari: sp.get("dari") ?? undefined,
    sampai: sp.get("sampai") ?? undefined,
  });

  const data = await generateReport(query);
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "excel") {
    const buffer = await buildReportExcel(data);
    await recordActivity({
      userId: authz.value.id,
      action: "EXPORT",
      entityType: "Report",
      description: `Export ${data.periodLabel} (Excel)`,
    });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="laporan-${query.type}-${stamp}.xlsx"`,
      },
    });
  }

  const buffer = await renderToBuffer(
    ReportPdf({
      periodLabel: data.periodLabel,
      generatedAt: formatDateTimeID(new Date()),
      summary: data.summary,
      rows: data.rows.map((r) => ({
        queueNumber: r.queueNumber,
        fullName: r.fullName,
        institution: r.institution,
        department: r.department,
        purpose: r.purpose,
        checkIn: formatTimeID(r.checkIn),
        status: r.status,
      })),
    }),
  );
  await recordActivity({
    userId: authz.value.id,
    action: "EXPORT",
    entityType: "Report",
    description: `Export ${data.periodLabel} (PDF)`,
  });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="laporan-${query.type}-${stamp}.pdf"`,
    },
  });
}
