import type { Metadata } from "next";

import { MasterPage } from "@/modules/master-data/presentation/master-page";

export const metadata: Metadata = { title: "Master Keperluan" };
export const dynamic = "force-dynamic";

export default function KeperluanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <MasterPage entity="purpose" searchParams={searchParams} />;
}
