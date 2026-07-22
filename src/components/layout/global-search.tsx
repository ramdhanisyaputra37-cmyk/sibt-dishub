"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Input } from "@/components/ui/input";

// Search global topbar — Enter membuka Buku Tamu dengan filter q terisi
// (docs/04 §1). Pencarian detail dilakukan di halaman Buku Tamu (server-side).
export function GlobalSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(q ? `/buku-tamu?q=${encodeURIComponent(q)}` : "/buku-tamu");
      }}
      className="relative max-w-md"
      role="search"
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Cari nama tamu / instansi..."
        className="pl-9"
        aria-label="Cari tamu"
      />
    </form>
  );
}
