"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettingsAction } from "./actions";

export interface SettingItem {
  key: string;
  value: string;
  description: string | null;
}

export function SettingsForm({ settings }: { settings: SettingItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value])),
  );

  const submit = () => {
    startTransition(async () => {
      const res = await updateSettingsAction(values);
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success("Pengaturan disimpan.");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {settings.map((s) => (
          <div key={s.key} className="space-y-1.5">
            <Label htmlFor={`setting-${s.key}`}>
              {s.description ?? s.key}
            </Label>
            <Input
              id={`setting-${s.key}`}
              value={values[s.key] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [s.key]: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">Kunci: {s.key}</p>
          </div>
        ))}
        <div className="flex justify-end">
          <Button onClick={submit} disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Simpan Pengaturan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
