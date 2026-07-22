import { put } from "@vercel/blob";

import { appError, err, ok, type Result } from "@/shared/domain/result";

/**
 * Wrapper upload foto tamu ke Vercel Blob (keputusan terkunci docs/01 §3 & §4.9).
 * TIDAK memakai filesystem lokal — Vercel serverless ephemeral. Validasi tipe
 * & ukuran dilakukan di sini (server), bukan hanya di input client.
 */
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 2 * 1024 * 1024; // 2MB

interface UploadedPhoto {
  url: string;
}

/** Terima data URL base64 (dari client), validasi, upload. */
export async function uploadGuestPhoto(
  dataUrl: string,
): Promise<Result<UploadedPhoto>> {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    return err(appError("VALIDATION", "Format foto tidak valid."));
  }
  const [, mime, b64] = match;
  if (!mime || !ALLOWED.has(mime)) {
    return err(
      appError("VALIDATION", "Tipe foto harus JPEG, PNG, atau WebP."),
    );
  }

  const buffer = Buffer.from(b64!, "base64");
  if (buffer.byteLength > MAX_BYTES) {
    return err(appError("VALIDATION", "Ukuran foto maksimal 2MB."));
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // Tanpa token blob, upload tidak mungkin. Kembalikan error jelas agar
    // tidak gagal diam-diam (dev lokal: foto opsional, bisa dilewati).
    return err(
      appError(
        "INTERNAL",
        "Penyimpanan foto belum dikonfigurasi (BLOB_READ_WRITE_TOKEN). " +
          "Foto bersifat opsional — Anda bisa menyimpan tanpa foto.",
      ),
    );
  }

  const ext = mime.split("/")[1]!.replace("+xml", "");
  try {
    const blob = await put(`guests/${crypto.randomUUID()}.${ext}`, buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType: mime,
    });
    return ok({ url: blob.url });
  } catch (e) {
    console.error("[blob-storage] gagal upload:", e);
    return err(appError("INTERNAL", "Gagal mengunggah foto. Coba lagi."));
  }
}
