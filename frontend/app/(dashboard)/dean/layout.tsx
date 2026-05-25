"use client";

import { RequireAuth } from "@/providers/auth-providers";

export default function DeanLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth allowedRoles={["DEAN_OFFICE"]}>{children}</RequireAuth>;
}
