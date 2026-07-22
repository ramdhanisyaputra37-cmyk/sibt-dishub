import type { RoleName } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Augment tipe session & JWT agar membawa id + role (dipakai RBAC di middleware
// & Server Action tanpa round-trip DB tiap request — docs/01 §4.5).
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: RoleName;
    } & DefaultSession["user"];
  }

  interface User {
    role: RoleName;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: RoleName;
  }
}
