"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface PhotoUploadProps {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
}

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/** Upload foto tamu (opsional). Preview + validasi tipe/ukuran di client;
 *  divalidasi ulang di server saat upload ke Vercel Blob (docs/01 §4.9). */
export function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(value);

  const handleFile = (file: File) => {
    if (!ALLOWED.includes(file.type)) {
      toast.error("Foto harus JPEG, PNG, atau WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Ukuran foto maksimal 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      onChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const clear = () => {
    setPreview(undefined);
    onChange(undefined);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      {preview ? (
        <div className="relative w-fit">
          <Image
            src={preview}
            alt="Foto tamu"
            width={128}
            height={128}
            className="h-32 w-32 rounded-md border object-cover"
            unoptimized
          />
          <button
            type="button"
            onClick={clear}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
            aria-label="Hapus foto"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="h-4 w-4" />
          Ambil / Unggah Foto
        </Button>
      )}
    </div>
  );
}
