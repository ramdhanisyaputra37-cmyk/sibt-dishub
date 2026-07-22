"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Eraser } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface SignaturePadProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  invalid?: boolean;
}

/**
 * Canvas tanda tangan digital (docs/01 §3). Menghasilkan base64 PNG yang
 * langsung disimpan di kolom DB. Nilai awal (edit) ditampilkan sebagai gambar
 * read-only dengan opsi "Ulangi" untuk menggambar ulang.
 */
export function SignaturePad({ value, onChange, invalid }: SignaturePadProps) {
  const ref = useRef<SignatureCanvas>(null);
  const [editing, setEditing] = useState(!value);

  const clear = () => {
    ref.current?.clear();
    onChange("");
  };

  const handleEnd = () => {
    const canvas = ref.current;
    if (canvas && !canvas.isEmpty()) {
      onChange(canvas.toDataURL("image/png"));
    }
  };

  if (value && !editing) {
    return (
      <div className="space-y-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Tanda tangan"
          className="h-40 w-full rounded-md border bg-white object-contain"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setEditing(true);
            onChange("");
          }}
        >
          <Eraser className="h-4 w-4" />
          Ulangi Tanda Tangan
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "overflow-hidden rounded-md border bg-white",
          invalid && "border-destructive",
        )}
      >
        <SignatureCanvas
          ref={ref}
          onEnd={handleEnd}
          canvasProps={{
            className: "h-40 w-full touch-none",
            "aria-label": "Area tanda tangan",
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Bubuhkan tanda tangan di area putih di atas.
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          <Eraser className="h-4 w-4" />
          Bersihkan
        </Button>
      </div>
    </div>
  );
}
