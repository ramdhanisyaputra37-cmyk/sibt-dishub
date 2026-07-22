import Image from "next/image";
import { Suspense } from "react";
import type { Metadata } from "next";

import { LoginForm } from "@/modules/auth/presentation/login-form";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Masuk",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo-dishub.svg"
            alt="Logo Dinas Perhubungan"
            width={56}
            height={56}
            priority
          />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            SIBT-DISHUB
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sistem Informasi Buku Tamu Digital
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Dinas Perhubungan &copy; {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
