import type { MasterEntity } from "../application/schemas";

export interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "phone" | "select";
  required?: boolean;
  placeholder?: string;
  /** untuk type=select (mis. departmentId pada pegawai) */
  optionsKey?: "departments";
}

export interface MasterConfig {
  entity: MasterEntity;
  singular: string;
  plural: string;
  /** kolom yang ditampilkan di tabel selain Nama & Status */
  columns: { key: string; label: string }[];
  /** field pada form tambah/edit (selain isActive) */
  fields: FieldConfig[];
}

export const MASTER_CONFIG: Record<MasterEntity, MasterConfig> = {
  department: {
    entity: "department",
    singular: "Bidang",
    plural: "Bidang",
    columns: [{ key: "description", label: "Deskripsi" }],
    fields: [
      { key: "name", label: "Nama Bidang", type: "text", required: true, placeholder: "mis. Bidang Angkutan" },
      { key: "description", label: "Deskripsi", type: "textarea", placeholder: "Opsional" },
    ],
  },
  institution: {
    entity: "institution",
    singular: "Instansi",
    plural: "Instansi",
    columns: [
      { key: "address", label: "Alamat" },
      { key: "phoneNumber", label: "No. HP" },
    ],
    fields: [
      { key: "name", label: "Nama Instansi", type: "text", required: true, placeholder: "mis. PT Angkutan Jaya" },
      { key: "address", label: "Alamat", type: "textarea", placeholder: "Opsional" },
      { key: "phoneNumber", label: "No. HP", type: "phone", placeholder: "08xxxxxxxxxx (opsional)" },
    ],
  },
  purpose: {
    entity: "purpose",
    singular: "Keperluan",
    plural: "Keperluan",
    columns: [{ key: "description", label: "Deskripsi" }],
    fields: [
      { key: "name", label: "Nama Keperluan", type: "text", required: true, placeholder: "mis. Pengurusan Izin" },
      { key: "description", label: "Deskripsi", type: "textarea", placeholder: "Opsional" },
    ],
  },
  employee: {
    entity: "employee",
    singular: "Pegawai",
    plural: "Pegawai",
    columns: [
      { key: "nip", label: "NIP" },
      { key: "position", label: "Jabatan" },
      { key: "departmentName", label: "Bidang" },
    ],
    fields: [
      { key: "name", label: "Nama Pegawai", type: "text", required: true, placeholder: "Nama lengkap" },
      { key: "nip", label: "NIP", type: "text", placeholder: "Opsional" },
      { key: "position", label: "Jabatan", type: "text", placeholder: "mis. Kepala Seksi" },
      { key: "departmentId", label: "Bidang", type: "select", required: true, optionsKey: "departments" },
      { key: "phoneNumber", label: "No. HP", type: "phone", placeholder: "08xxxxxxxxxx (opsional)" },
    ],
  },
};
