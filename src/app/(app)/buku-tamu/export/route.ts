import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { authorize } from "@/shared/infrastructure/session";
import { recordActivity } from "@/shared/infrastructure/activity-logger";
import { formatDateTimeID } from "@/shared/lib/timezone";
import { listQuerySchema } from "@/modules/guest/application/guest.schema";
import {
  exportGuestsExcel,
  getGuestExportData,
} from "@/modules/guest/application/export-guests.usecase";
import { GuestListPdf } from "@/modules/guest/infrastructure/guest-pdf.template";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authz = await authorize("guest", "export");
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error.message }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const format = sp.get("format") === "pdf" ? "pdf" : "excel";
  const query = listQuerySchema.parse({
    q: sp.get("q") ?? undefined,
    status: sp.get("status") ?? undefined,
    departmentId: sp.get("departmentId") ?? undefined,
    dari: sp.get("dari") ?? undefined,
    sampai: sp.get("sampai") ?? undefined,
    sort: sp.get("sort") ?? undefined,
    order: sp.get("order") ?? undefined,
    // Ekspor mengabaikan pagination; ambil semua yang cocok filter.
    page: 1,
    perPage: 100,
  });

  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "excel") {
    const buffer = await exportGuestsExcel(query);
    await recordActivity({
      userId: authz.value.id,
      action: "EXPORT",
      entityType: "Guest",
      description: "Export buku tamu ke Excel",
    });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="buku-tamu-${stamp}.xlsx"`,
      },
    });
  }

  // PDF
  const rows = await getGuestExportData(query);
  const periodLabel =
    query.dari || query.sampai
      ? `Periode ${query.dari ?? "awal"} s/d ${query.sampai ?? "kini"}`
      : "Semua data (sesuai filter)";
  const buffer = await renderToBuffer(
    GuestListPdf({
      rows,
      periodLabel,
      generatedAt: formatDateTimeID(new Date()),
    }),
  );
  await recordActivity({
    userId: authz.value.id,
    action: "EXPORT",
    entityType: "Guest",
    description: "Export buku tamu ke PDF",
  });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="buku-tamu-${stamp}.pdf"`,
    },
  });
}
