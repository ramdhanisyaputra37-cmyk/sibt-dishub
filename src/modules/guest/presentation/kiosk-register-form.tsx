"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, ClipboardPen, Home, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { SignaturePad } from "./signature-pad";
import {
  guestFormSchema,
  GENDER_OPTIONS,
  type GuestFormInput,
} from "../application/guest.schema";
import type { GuestLookups } from "../application/guest-lookups.usecase";
import {
  kioskRegisterAction,
  type KioskRegisterResult,
} from "./kiosk-register-actions";

export function KioskRegisterForm({ lookups }: { lookups: GuestLookups }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<Extract<KioskRegisterResult, { ok: true }> | null>(
    null,
  );
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
      employeeName: "",
      purposeId: "",
      visitDetail: "",
      notes: "",
      signatureImage: "",
      photoData: "",
      status: "MENUNGGU",
    },
  });

  const institutionOptions = useMemo(
    () => [
      ...lookups.institutions.map((i) => ({ value: i.id, label: i.name })),
      ...newInstitutions,
    ],
    [lookups.institutions, newInstitutions],
  );

  const onSubmit = (values: GuestFormInput) => {
    const payload: GuestFormInput = { ...values };
    if (payload.institutionId?.startsWith("__new__:")) {
      payload.newInstitutionName = payload.institutionId.slice("__new__:".length);
      payload.institutionId = "";
    }
    startTransition(async () => {
      const res = await kioskRegisterAction(payload);
      if (!res.ok) {
        if (res.fieldErrors) {
          for (const [k, m] of Object.entries(res.fieldErrors)) {
            form.setError(k as keyof GuestFormInput, { message: m });
          }
        }
        toast.error(res.message);
        return;
      }
      setDone(res);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  if (done) {
    return (
      <SuccessView
        result={done}
        onReset={() => {
          form.reset();
          setNewInstitutions([]);
          setDone(null);
        }}
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FieldGroup title="Data Diri">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Nama Lengkap</FormLabel>
                <FormControl>
                  <Input placeholder="Nama lengkap Anda" {...field} />
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
                    className="flex gap-6 pt-1"
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <div key={g.value} className="flex items-center gap-2">
                        <RadioGroupItem value={g.value} id={`k-gender-${g.value}`} />
                        <Label htmlFor={`k-gender-${g.value}`} className="font-normal">
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
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Alamat</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Alamat Anda"
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
                  <Input
                    inputMode="tel"
                    placeholder="08xxxxxxxxxx"
                    {...field}
                  />
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
                    inputMode="email"
                    placeholder="email@contoh.com (opsional)"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FieldGroup>

        <FieldGroup title="Keperluan Kunjungan">
          <FormField
            control={form.control}
            name="institutionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Instansi Asal Anda</FormLabel>
                <FormControl>
                  <Combobox
                    options={institutionOptions}
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v);
                      form.setValue("newInstitutionName", "");
                    }}
                    placeholder="Ketik nama instansi asal Anda"
                    onCreate={(label) => {
                      const tmp = `__new__:${label}`;
                      setNewInstitutions((prev) =>
                        prev.some((p) => p.label === label)
                          ? prev
                          : [...prev, { value: tmp, label }],
                      );
                      field.onChange(tmp);
                      form.setValue("newInstitutionName", label);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Instansi, perusahaan, atau organisasi tempat Anda berasal —
                  bukan bidang yang Anda tuju. Bila belum terdaftar dalam
                  daftar, ketik saja namanya lalu pilih opsi menambahkan.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Bidang Tujuan di Dinas Perhubungan</FormLabel>
                <FormControl>
                  <Combobox
                    options={lookups.departments.map((d) => ({
                      value: d.id,
                      label: d.name,
                    }))}
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v);
                      form.setValue("employeeId", "");
                    }}
                    placeholder="Pilih bidang tujuan"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="employeeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pegawai yang Ditemui</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Tulis nama pegawai (opsional)"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>
                  Kosongkan bila Anda belum tahu nama pegawai yang akan ditemui.
                </FormDescription>
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
              <FormItem>
                <FormLabel>Keterangan Tambahan</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Keterangan keperluan (opsional)"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FieldGroup>

        <FieldGroup title="Tanda Tangan">
          <FormField
            control={form.control}
            name="signatureImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bubuhkan Tanda Tangan (opsional)</FormLabel>
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
        </FieldGroup>

        <div className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
          <Button
            type="submit"
            size="xl"
            className="w-full shadow-md"
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ClipboardPen className="h-5 w-5" />
            )}
            Kirim & Ambil Nomor Antrian
          </Button>
        </div>
      </form>
    </Form>
  );
}

function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="mb-4 font-display text-base font-bold text-secondary">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SuccessView({
  result,
  onReset,
}: {
  result: Extract<KioskRegisterResult, { ok: true }>;
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-8">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
        <BadgeCheck className="h-9 w-9" />
      </div>
      <h2 className="mt-4 font-display text-xl font-bold text-secondary">
        Kunjungan Tercatat!
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tunjukkan nomor antrian berikut kepada petugas.
      </p>

      <div className="mx-auto mt-5 w-full max-w-xs rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Nomor Antrian
        </p>
        <p className="mt-1 font-display text-3xl font-extrabold tracking-tight text-primary">
          {result.queueNumber}
        </p>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <Image
          src={result.qrDataUrl}
          alt="QR checkout kunjungan"
          width={160}
          height={160}
          className="rounded-lg border bg-white p-2"
          unoptimized
        />
        <p className="max-w-xs text-xs text-muted-foreground">
          Simpan atau foto QR ini. Pindai sekali lagi saat selesai berkunjung
          untuk mencatat jam keluar.
        </p>
      </div>

      <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </Button>
        <Button onClick={onReset}>Isi untuk Tamu Lain</Button>
      </div>
    </div>
  );
}
