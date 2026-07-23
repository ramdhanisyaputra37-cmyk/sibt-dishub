"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SignaturePad } from "./signature-pad";
import { PhotoUpload } from "./photo-upload";
import { GUEST_STATUS_OPTIONS } from "./status-label";
import {
  guestFormSchema,
  GENDER_OPTIONS,
  type GuestFormInput,
} from "../application/guest.schema";
import type { GuestLookups } from "../application/guest-lookups.usecase";
import {
  createGuestAction,
  updateGuestAction,
  type ActionResult,
} from "./actions";

interface GuestFormProps {
  lookups: GuestLookups;
  mode: "create" | "edit";
  guestId?: string;
  defaultValues?: Partial<GuestFormInput>;
}

export function GuestForm({
  lookups,
  mode,
  guestId,
  defaultValues,
}: GuestFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Instansi baru yang diketik user tapi belum ada di master.
  const [newInstitutions, setNewInstitutions] = useState<
    { value: string; label: string }[]
  >([]);

  const form = useForm<GuestFormInput>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      fullName: "",
      nik: "",
      gender: undefined,
      address: "",
      phoneNumber: "",
      email: "",
      institutionId: "",
      newInstitutionName: "",
      departmentId: "",
      employeeId: "",
      purposeId: "",
      visitDetail: "",
      notes: "",
      signatureImage: "",
      photoData: "",
      status: "MENUNGGU",
      ...defaultValues,
    },
  });

  const selectedDept = form.watch("departmentId");
  const institutionOptions = useMemo(
    () => [
      ...lookups.institutions.map((i) => ({ value: i.id, label: i.name })),
      ...newInstitutions,
    ],
    [lookups.institutions, newInstitutions],
  );
  const employeeOptions = useMemo(
    () =>
      lookups.employees
        .filter((e) => !selectedDept || e.departmentId === selectedDept)
        .map((e) => ({ value: e.id, label: e.name })),
    [lookups.employees, selectedDept],
  );

  const onSubmit = (values: GuestFormInput) => {
    // Normalisasi instansi baru: marker "__new__:<label>" -> newInstitutionName.
    const payload: GuestFormInput = { ...values };
    if (payload.institutionId?.startsWith("__new__:")) {
      payload.newInstitutionName = payload.institutionId.slice("__new__:".length);
      payload.institutionId = "";
    }

    startTransition(async () => {
      const action: Promise<ActionResult<{ id: string }>> =
        mode === "create"
          ? createGuestAction(payload)
          : updateGuestAction(guestId!, payload);
      const result = await action;

      if (!result.ok) {
        // Petakan fieldErrors ke form bila ada.
        if (result.error.fieldErrors) {
          for (const [key, message] of Object.entries(
            result.error.fieldErrors,
          )) {
            form.setError(key as keyof GuestFormInput, { message });
          }
        }
        toast.error(result.error.message);
        return;
      }

      toast.success(
        mode === "create" ? "Tamu berhasil dicatat." : "Data tamu diperbarui.",
      );
      router.push(`/buku-tamu/${result.data.id}`);
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Diri</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel required>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama lengkap tamu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nik"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIK</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      maxLength={16}
                      placeholder="16 digit (opsional)"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Jenis Kelamin</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-6 pt-2"
                    >
                      {GENDER_OPTIONS.map((g) => (
                        <div key={g.value} className="flex items-center gap-2">
                          <RadioGroupItem value={g.value} id={`gender-${g.value}`} />
                          <Label htmlFor={`gender-${g.value}`} className="font-normal">
                            {g.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel required>Alamat</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Alamat tamu"
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Nomor HP</FormLabel>
                  <FormControl>
                    <Input placeholder="08xxxxxxxxxx" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@contoh.com (opsional)"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kunjungan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="institutionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Instansi</FormLabel>
                  <FormControl>
                    <Combobox
                      options={institutionOptions}
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v);
                        form.setValue("newInstitutionName", "");
                      }}
                      placeholder="Pilih instansi"
                      onCreate={(label) => {
                        // Tandai instansi baru: simpan nama, kosongkan id.
                        const tmpValue = `__new__:${label}`;
                        setNewInstitutions((prev) =>
                          prev.some((p) => p.label === label)
                            ? prev
                            : [...prev, { value: tmpValue, label }],
                        );
                        field.onChange(tmpValue);
                        form.setValue("newInstitutionName", label);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Bidang Tujuan</FormLabel>
                  <FormControl>
                    <Combobox
                      options={lookups.departments.map((d) => ({
                        value: d.id,
                        label: d.name,
                      }))}
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v);
                        form.setValue("employeeId", ""); // reset pegawai saat bidang ganti
                      }}
                      placeholder="Pilih bidang"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pegawai yang Ditemui</FormLabel>
                  <FormControl>
                    <Combobox
                      options={employeeOptions}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder={
                        selectedDept
                          ? "Pilih pegawai (opsional)"
                          : "Pilih bidang dahulu"
                      }
                      disabled={!selectedDept}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purposeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Keperluan</FormLabel>
                  <FormControl>
                    <Combobox
                      options={lookups.purposes.map((p) => ({
                        value: p.id,
                        label: p.name,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Pilih keperluan"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="visitDetail"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Tujuan Kunjungan (detail)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Keterangan spesifik keperluan (opsional)"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Catatan tambahan (opsional)"
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {mode === "edit" && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GUEST_STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verifikasi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block">Foto Tamu</Label>
              <PhotoUpload
                value={form.watch("photoData") || undefined}
                onChange={(v) => form.setValue("photoData", v ?? "")}
              />
            </div>
            <FormField
              control={form.control}
              name="signatureImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanda Tangan (opsional)</FormLabel>
                  <FormControl>
                    <SignaturePad
                      value={field.value || undefined}
                      onChange={field.onChange}
                      invalid={!!form.formState.errors.signatureImage}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={pending}
          >
            Batal
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {mode === "create" ? "Simpan & Cetak Tiket" : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
