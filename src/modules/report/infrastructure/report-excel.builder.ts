import ExcelJS from "exceljs";

import { formatDateTimeID } from "@/shared/lib/timezone";
import type { ReportData } from "../application/generate-report.usecase";

/** Bangun workbook laporan: sheet Ringkasan + sheet Detail (docs/07). */
export async function buildReportExcel(data: ReportData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SIBT-DISHUB";
  wb.created = new Date();

  // --- Sheet Ringkasan ---
  const s = wb.addWorksheet("Ringkasan");
  s.getColumn(1).width = 32;
  s.getColumn(2).width = 14;

  const titleCell = s.addRow([data.periodLabel]);
  titleCell.font = { bold: true, size: 14, color: { argb: "FF0F4C81" } };
  s.addRow(["Dinas Perhubungan"]);
  s.addRow([]);
  const totalRow = s.addRow(["Total Kunjungan", data.summary.total]);
  totalRow.font = { bold: true };
  s.addRow([]);

  s.addRow(["Status", "Jumlah"]).font = { bold: true };
  for (const st of data.summary.byStatus) s.addRow([st.label, st.count]);
  s.addRow([]);

  s.addRow(["Bidang", "Jumlah"]).font = { bold: true };
  for (const d of data.summary.byDepartment) s.addRow([d.name, d.count]);
  s.addRow([]);

  s.addRow(["Instansi (Top 10)", "Jumlah"]).font = { bold: true };
  for (const i of data.summary.byInstitution) s.addRow([i.name, i.count]);

  // --- Sheet Detail ---
  const d = wb.addWorksheet("Detail");
  d.columns = [
    { header: "No. Antrian", key: "q", width: 18 },
    { header: "Nama", key: "name", width: 26 },
    { header: "Instansi", key: "inst", width: 26 },
    { header: "Bidang", key: "dept", width: 22 },
    { header: "Keperluan", key: "purp", width: 24 },
    { header: "Jam Masuk", key: "in", width: 20 },
    { header: "Jam Keluar", key: "out", width: 20 },
    { header: "Status", key: "status", width: 14 },
  ];
  const header = d.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF005BAC" },
  };
  for (const r of data.rows) {
    d.addRow({
      q: r.queueNumber,
      name: r.fullName,
      inst: r.institution,
      dept: r.department,
      purp: r.purpose,
      in: formatDateTimeID(r.checkIn),
      out: r.checkOut ? formatDateTimeID(r.checkOut) : "-",
      status: r.status,
    });
  }
  d.autoFilter = { from: "A1", to: "H1" };

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
