"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function VisitsChart({
  data,
}: {
  data: { label: string; total: number }[];
}) {
  const empty = data.every((d) => d.total === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grafik Kunjungan Bulanan</CardTitle>
      </CardHeader>
      <CardContent>
        {empty ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: "0.8rem",
                  color: "hsl(var(--popover-foreground))",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                formatter={(value: number) => [`${value} tamu`, "Kunjungan"]}
              />
              <Bar
                dataKey="total"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function DepartmentChart({
  data,
}: {
  data: { name: string; total: number }[];
}) {
  const top = data.slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kunjungan per Bidang</CardTitle>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={top}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
                horizontal={false}
              />
              <XAxis
                type="number"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tickLine={false}
                axisLine={false}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: "0.8rem",
                  color: "hsl(var(--popover-foreground))",
                }}
                formatter={(value: number) => [`${value} tamu`, "Kunjungan"]}
              />
              <Bar
                dataKey="total"
                fill="hsl(var(--secondary))"
                radius={[0, 4, 4, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
      Belum ada data kunjungan untuk ditampilkan.
    </div>
  );
}
