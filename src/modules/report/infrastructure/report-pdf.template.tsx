import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica" },
  header: { marginBottom: 12, borderBottom: "2 solid #005BAC", paddingBottom: 8 },
  title: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#0F4C81" },
  subtitle: { fontSize: 9, color: "#64748B", marginTop: 2 },
  meta: { fontSize: 8, color: "#64748B", marginTop: 4 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0F4C81",
    marginTop: 10,
    marginBottom: 4,
  },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  summaryBox: {
    flex: 1,
    padding: 6,
    backgroundColor: "#F8FAFC",
    borderRadius: 4,
    border: "0.5 solid #E2E8F0",
  },
  summaryLabel: { fontSize: 7, color: "#64748B" },
  summaryValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0F4C81" },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 1.5,
  },
  breakdownName: { fontSize: 8 },
  breakdownCount: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#005BAC",
    color: "#FFFFFF",
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    marginTop: 6,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottom: "0.5 solid #E2E8F0",
    fontSize: 7.5,
  },
  rowAlt: { backgroundColor: "#F8FAFC" },
  cNo: { width: "13%" },
  cName: { width: "19%" },
  cInst: { width: "19%" },
  cDept: { width: "15%" },
  cPurp: { width: "16%" },
  cIn: { width: "9%" },
  cStat: { width: "9%" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    fontSize: 7,
    color: "#94A3B8",
    textAlign: "center",
    borderTop: "0.5 solid #E2E8F0",
    paddingTop: 4,
  },
});

export interface ReportPdfProps {
  periodLabel: string;
  generatedAt: string;
  summary: {
    total: number;
    byStatus: { label: string; count: number }[];
    byDepartment: { name: string; count: number }[];
    byInstitution: { name: string; count: number }[];
  };
  rows: {
    queueNumber: string;
    fullName: string;
    institution: string;
    department: string;
    purpose: string;
    checkIn: string;
    status: string;
  }[];
}

export function ReportPdf({
  periodLabel,
  generatedAt,
  summary,
  rows,
}: ReportPdfProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>SIBT-DISHUB — {periodLabel}</Text>
          <Text style={styles.subtitle}>Dinas Perhubungan</Text>
          <Text style={styles.meta}>Dibuat: {generatedAt}</Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Kunjungan</Text>
            <Text style={styles.summaryValue}>{summary.total}</Text>
          </View>
          {summary.byStatus.slice(0, 4).map((s) => (
            <View style={styles.summaryBox} key={s.label}>
              <Text style={styles.summaryLabel}>{s.label}</Text>
              <Text style={styles.summaryValue}>{s.count}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Kunjungan per Bidang</Text>
            {summary.byDepartment.map((d) => (
              <View style={styles.breakdownRow} key={d.name}>
                <Text style={styles.breakdownName}>{d.name}</Text>
                <Text style={styles.breakdownCount}>{d.count}</Text>
              </View>
            ))}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Instansi Terbanyak</Text>
            {summary.byInstitution.map((i) => (
              <View style={styles.breakdownRow} key={i.name}>
                <Text style={styles.breakdownName}>{i.name}</Text>
                <Text style={styles.breakdownCount}>{i.count}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Detail Kunjungan</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.cNo}>No. Antrian</Text>
          <Text style={styles.cName}>Nama</Text>
          <Text style={styles.cInst}>Instansi</Text>
          <Text style={styles.cDept}>Bidang</Text>
          <Text style={styles.cPurp}>Keperluan</Text>
          <Text style={styles.cIn}>Masuk</Text>
          <Text style={styles.cStat}>Status</Text>
        </View>
        {rows.map((r, i) => (
          <View
            key={r.queueNumber}
            style={i % 2 === 1 ? [styles.row, styles.rowAlt] : styles.row}
            wrap={false}
          >
            <Text style={styles.cNo}>{r.queueNumber}</Text>
            <Text style={styles.cName}>{r.fullName}</Text>
            <Text style={styles.cInst}>{r.institution}</Text>
            <Text style={styles.cDept}>{r.department}</Text>
            <Text style={styles.cPurp}>{r.purpose}</Text>
            <Text style={styles.cIn}>{r.checkIn}</Text>
            <Text style={styles.cStat}>{r.status}</Text>
          </View>
        ))}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Halaman ${pageNumber} dari ${totalPages} — SIBT-DISHUB · Dinas Perhubungan`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
