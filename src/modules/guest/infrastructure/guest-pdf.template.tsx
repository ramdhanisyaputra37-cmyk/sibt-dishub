import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// Layout PDF daftar tamu (docs/01 §4.8) — dirender di server via renderToBuffer.
const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica" },
  header: { marginBottom: 16, borderBottom: "2 solid #005BAC", paddingBottom: 8 },
  title: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#0F4C81" },
  subtitle: { fontSize: 9, color: "#64748B", marginTop: 2 },
  meta: { fontSize: 8, color: "#64748B", marginTop: 4 },
  summary: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 4,
  },
  summaryItem: { flexDirection: "column" },
  summaryLabel: { fontSize: 7, color: "#64748B" },
  summaryValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#0F4C81" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#005BAC",
    color: "#FFFFFF",
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottom: "0.5 solid #E2E8F0",
    fontSize: 8,
  },
  rowAlt: { backgroundColor: "#F8FAFC" },
  cNo: { width: "12%" },
  cName: { width: "20%" },
  cInst: { width: "20%" },
  cDept: { width: "16%" },
  cIn: { width: "10%" },
  cOut: { width: "10%" },
  cStatus: { width: "12%" },
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

export interface GuestPdfRow {
  queueNumber: string;
  fullName: string;
  institution: string;
  department: string;
  checkIn: string;
  checkOut: string;
  status: string;
}

export interface GuestPdfProps {
  rows: GuestPdfRow[];
  periodLabel: string;
  generatedAt: string;
}

export function GuestListPdf({ rows, periodLabel, generatedAt }: GuestPdfProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>SIBT-DISHUB — Laporan Buku Tamu</Text>
          <Text style={styles.subtitle}>Dinas Perhubungan</Text>
          <Text style={styles.meta}>
            {periodLabel} · Dibuat: {generatedAt}
          </Text>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Kunjungan</Text>
            <Text style={styles.summaryValue}>{rows.length}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.cNo}>No. Antrian</Text>
          <Text style={styles.cName}>Nama</Text>
          <Text style={styles.cInst}>Instansi</Text>
          <Text style={styles.cDept}>Bidang</Text>
          <Text style={styles.cIn}>Masuk</Text>
          <Text style={styles.cOut}>Keluar</Text>
          <Text style={styles.cStatus}>Status</Text>
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
            <Text style={styles.cIn}>{r.checkIn}</Text>
            <Text style={styles.cOut}>{r.checkOut}</Text>
            <Text style={styles.cStatus}>{r.status}</Text>
          </View>
        ))}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Halaman ${pageNumber} dari ${totalPages} — SIBT-DISHUB`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
