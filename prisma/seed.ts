import { PrismaClient, type RoleName, type GuestStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Password default akun demo — WAJIB diganti di produksi (docs README).
const DEFAULT_PASSWORD = "Password123!";

const ROLE_SEED: { name: RoleName; description: string }[] = [
  { name: "SUPER_ADMIN", description: "Akses penuh: user, master data, laporan, pengaturan, activity log" },
  { name: "ADMIN", description: "Kelola buku tamu, master data, dan laporan" },
  { name: "RESEPSIONIS", description: "Input & edit buku tamu hari berjalan" },
  { name: "KEPALA_DINAS", description: "Read-only: dashboard, laporan, buku tamu" },
];

const USER_SEED: { name: string; email: string; role: RoleName }[] = [
  { name: "Super Admin", email: "superadmin@dishub.go.id", role: "SUPER_ADMIN" },
  { name: "Admin Dishub", email: "admin@dishub.go.id", role: "ADMIN" },
  { name: "Resepsionis Lobi", email: "resepsionis@dishub.go.id", role: "RESEPSIONIS" },
  { name: "Kepala Dinas", email: "kadis@dishub.go.id", role: "KEPALA_DINAS" },
];

const DEPARTMENTS = [
  "Sekretariat",
  "Bidang Angkutan",
  "Bidang Lalu Lintas",
  "Bidang Perizinan",
  "Bidang Sarana & Prasarana",
  "Bidang Pengujian Kendaraan",
];

const PURPOSES = [
  "Pengurusan Izin Trayek",
  "Konsultasi Perizinan",
  "Pengujian Kendaraan Bermotor",
  "Undangan Rapat",
  "Pengaduan Masyarakat",
  "Koordinasi Antar Instansi",
  "Lainnya",
];

const INSTITUTIONS = [
  { name: "Umum / Perorangan", address: "-" },
  { name: "PO Sinar Jaya", address: "Jl. Raya Bekasi No. 12" },
  { name: "Dinas Perhubungan Provinsi", address: "Jl. Merdeka No. 1" },
  { name: "PT Angkutan Kota Mandiri", address: "Jl. Sudirman No. 45" },
  { name: "Koperasi Angkutan Sejahtera", address: "Jl. Diponegoro No. 8" },
  { name: "CV Logistik Nusantara", address: "Jl. Ahmad Yani No. 90" },
];

const EMPLOYEES: { name: string; position: string; department: string }[] = [
  { name: "Budi Hartono", position: "Kepala Bidang Angkutan", department: "Bidang Angkutan" },
  { name: "Siti Nurhaliza", position: "Kepala Seksi Perizinan", department: "Bidang Perizinan" },
  { name: "Ahmad Fauzi", position: "Staf Lalu Lintas", department: "Bidang Lalu Lintas" },
  { name: "Dewi Lestari", position: "Sekretaris Dinas", department: "Sekretariat" },
  { name: "Rudi Setiawan", position: "Penguji Kendaraan", department: "Bidang Pengujian Kendaraan" },
];

const FIRST_NAMES = ["Andi", "Bella", "Candra", "Dian", "Eka", "Fajar", "Gita", "Hadi", "Indah", "Joko", "Kartika", "Lukman"];
const LAST_NAMES = ["Wijaya", "Santoso", "Pratama", "Utami", "Kusuma", "Halim", "Saputra", "Maulana"];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pad(n: number, len: number): string {
  return String(n).padStart(len, "0");
}

async function main() {
  console.log("🌱 Seeding SIBT-DISHUB...");

  // Roles
  const roles = new Map<RoleName, string>();
  for (const r of ROLE_SEED) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
    roles.set(r.name, role.id);
  }
  console.log(`  ✓ ${roles.size} roles`);

  // Users
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  let superAdminId = "";
  for (const u of USER_SEED) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, roleId: roles.get(u.role)!, isActive: true },
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        roleId: roles.get(u.role)!,
        isActive: true,
      },
    });
    if (u.role === "SUPER_ADMIN") superAdminId = user.id;
  }
  console.log(`  ✓ ${USER_SEED.length} users (password: ${DEFAULT_PASSWORD})`);

  // Departments
  const deptIds = new Map<string, string>();
  for (const name of DEPARTMENTS) {
    const existing = await prisma.department.findFirst({ where: { name } });
    const dept =
      existing ??
      (await prisma.department.create({
        data: { name, createdById: superAdminId },
      }));
    deptIds.set(name, dept.id);
  }
  console.log(`  ✓ ${deptIds.size} departments`);

  // Purposes
  const purposeIds: string[] = [];
  for (const name of PURPOSES) {
    const existing = await prisma.purpose.findFirst({ where: { name } });
    const p =
      existing ??
      (await prisma.purpose.create({
        data: { name, createdById: superAdminId },
      }));
    purposeIds.push(p.id);
  }
  console.log(`  ✓ ${purposeIds.length} purposes`);

  // Institutions
  const instIds: string[] = [];
  for (const inst of INSTITUTIONS) {
    const existing = await prisma.institution.findFirst({
      where: { name: inst.name },
    });
    const i =
      existing ??
      (await prisma.institution.create({
        data: { name: inst.name, address: inst.address, createdById: superAdminId },
      }));
    instIds.push(i.id);
  }
  console.log(`  ✓ ${instIds.length} institutions`);

  // Employees
  const empIds: string[] = [];
  for (const e of EMPLOYEES) {
    const deptId = deptIds.get(e.department)!;
    const existing = await prisma.employee.findFirst({
      where: { name: e.name, departmentId: deptId },
    });
    const emp =
      existing ??
      (await prisma.employee.create({
        data: {
          name: e.name,
          position: e.position,
          departmentId: deptId,
          createdById: superAdminId,
        },
      }));
    empIds.push(emp.id);
  }
  console.log(`  ✓ ${empIds.length} employees`);

  // Sample guests — tersebar beberapa bulan terakhir agar dashboard berisi.
  const existingGuests = await prisma.guest.count();
  if (existingGuests === 0) {
    const deptIdList = [...deptIds.values()];
    const statuses: GuestStatus[] = ["SELESAI", "SELESAI", "SELESAI", "DIPROSES", "MENUNGGU", "DIBATALKAN"];
    const now = new Date();
    const dailyCounters = new Map<string, number>();

    const guestsData: Parameters<typeof prisma.guest.create>[0]["data"][] = [];
    for (let i = 0; i < 120; i++) {
      // Sebar mundur 0..150 hari.
      const daysAgo = Math.floor(Math.random() * 150);
      const checkIn = new Date(now);
      checkIn.setDate(checkIn.getDate() - daysAgo);
      checkIn.setHours(8 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);

      const y = checkIn.getFullYear();
      const mo = pad(checkIn.getMonth() + 1, 2);
      const da = pad(checkIn.getDate(), 2);
      const dateKey = `${y}${mo}${da}`;
      const seq = (dailyCounters.get(dateKey) ?? 0) + 1;
      dailyCounters.set(dateKey, seq);

      const status = rand(statuses);
      const checkOut =
        status === "SELESAI"
          ? new Date(checkIn.getTime() + (20 + Math.floor(Math.random() * 90)) * 60000)
          : null;

      const visitDate = new Date(Date.UTC(y, checkIn.getMonth(), checkIn.getDate()));

      guestsData.push({
        queueNumber: `${dateKey}-${pad(seq, 4)}`,
        visitDate,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        fullName: `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`,
        gender: Math.random() > 0.5 ? "LAKI_LAKI" : "PEREMPUAN",
        address: "Jl. Contoh Alamat No. " + (i + 1),
        phoneNumber: "08" + pad(Math.floor(Math.random() * 1000000000), 10),
        institutionId: rand(instIds),
        departmentId: rand(deptIdList),
        employeeId: Math.random() > 0.3 ? rand(empIds) : null,
        purposeId: rand(purposeIds),
        status,
        createdById: superAdminId,
      });
    }

    // Insert satu per satu untuk menghormati counter unik (createMany tidak
    // menjamin urutan queueNumber; volume kecil jadi tetap cepat).
    for (const data of guestsData) {
      await prisma.guest.create({ data });
    }
    console.log(`  ✓ ${guestsData.length} sample guests`);

    // Sinkronkan daily_counters agar nomor antrian produksi lanjut dari seed.
    for (const [dateKey, last] of dailyCounters) {
      const dateObj = new Date(
        Date.UTC(
          Number(dateKey.slice(0, 4)),
          Number(dateKey.slice(4, 6)) - 1,
          Number(dateKey.slice(6, 8)),
        ),
      );
      await prisma.dailyCounter.upsert({
        where: { date: dateObj },
        update: { lastValue: last },
        create: { date: dateObj, lastValue: last },
      });
    }
  } else {
    console.log(`  • ${existingGuests} guests already present, skip sample`);
  }

  // Settings
  const SETTINGS = [
    { key: "app.name", value: "SIBT-DISHUB", description: "Nama aplikasi" },
    { key: "app.instansi", value: "Dinas Perhubungan", description: "Nama instansi" },
    { key: "guest.edit_window_hours", value: "0", description: "Jendela edit resepsionis (0 = hanya hari berjalan)" },
  ];
  for (const s of SETTINGS) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }
  console.log(`  ✓ ${SETTINGS.length} settings`);

  console.log("✅ Seeding selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
