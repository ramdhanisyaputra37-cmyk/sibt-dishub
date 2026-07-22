import QRCode from "qrcode";

/** Base URL aplikasi untuk menyusun tautan absolut (QR kios, dll). */
export function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
}

/** Generate QR (data URL PNG) berisi URL kios self-checkout untuk token tamu.
 *  QR selalu diturunkan dari token saat render — tidak disimpan (docs/01 §4.1). */
export async function generateKioskQr(token: string): Promise<string> {
  const url = `${appBaseUrl()}/kios/${token}`;
  return QRCode.toDataURL(url, {
    width: 320,
    margin: 1,
    color: { dark: "#0F4C81", light: "#FFFFFF" },
  });
}
