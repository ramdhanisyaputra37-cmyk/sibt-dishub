"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTIVITY_ACTIONS } from "../application/list-activity.usecase";

const ALL = "__all__";

export function ActivityFilters({
  users,
}: {
  users: { id: string; name: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startNav] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const setParam = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (!v || v === ALL) next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    startNav(() => router.push(`/activity-log?${next.toString()}`));
  };

  const hasFilters =
    params.get("q") ||
    params.get("userId") ||
    params.get("action") ||
    params.get("dari") ||
    params.get("sampai");

  return (
    <div className="flex flex-wrap items-end gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setParam({ q: q || undefined });
        }}
        className="relative min-w-[200px] flex-1"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari aktivitas / pengguna..."
          className="pl-9"
        />
      </form>

      <Select
        value={params.get("userId") ?? ALL}
        onValueChange={(v) => setParam({ userId: v })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Pengguna" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Semua Pengguna</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.get("action") ?? ALL}
        onValueChange={(v) => setParam({ action: v })}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Aksi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Semua Aksi</SelectItem>
          {ACTIVITY_ACTIONS.map((a) => (
            <SelectItem key={a.value} value={a.value}>
              {a.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={params.get("dari") ?? ""}
        onChange={(e) => setParam({ dari: e.target.value })}
        className="w-auto"
        aria-label="Dari tanggal"
      />
      <Input
        type="date"
        value={params.get("sampai") ?? ""}
        onChange={(e) => setParam({ sampai: e.target.value })}
        className="w-auto"
        aria-label="Sampai tanggal"
      />

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQ("");
            startNav(() => router.push("/activity-log"));
          }}
        >
          <X className="h-4 w-4" />
          Reset
        </Button>
      )}
    </div>
  );
}
