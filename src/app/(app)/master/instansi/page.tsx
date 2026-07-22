import type { Metadata } from "next";

import { MasterPage } from "@/modules/master-data/presentation/master-page";

export const metadata: Metadata = { title: "Master Instansi" };
export const dynamic = "force-dynamic";

export default function InstansiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <MasterPage entity="institution" searchParams={searchParams} />;
}
