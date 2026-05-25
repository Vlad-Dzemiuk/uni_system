"use client";

import { RequireAuth } from "@/providers/auth-providers";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth allowedRoles={["ADMIN"]}>{children}</RequireAuth>;
}
