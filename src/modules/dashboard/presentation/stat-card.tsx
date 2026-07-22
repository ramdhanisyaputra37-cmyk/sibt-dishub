import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  Icon: LucideIcon;
  delta?: number;
  deltaLabel?: string;
}

export function StatCard({
  label,
  value,
  Icon,
  delta,
  deltaLabel,
}: StatCardProps) {
  const showDelta = typeof delta === "number";
  const positive = (delta ?? 0) >= 0;

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {value.toLocaleString("id-ID")}
          </p>
          {showDelta && (
            <p
              className={cn(
                "mt-1 flex items-center gap-1 text-xs",
                positive ? "text-success" : "text-destructive",
              )}
            >
              {positive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {positive ? "+" : ""}
              {delta} {deltaLabel}
            </p>
          )}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
