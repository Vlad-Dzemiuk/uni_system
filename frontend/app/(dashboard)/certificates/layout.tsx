"use client";

import { RequireAuth } from "@/providers/auth-providers";

export default function CertificatesLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth allowedRoles={["STUDENT", "TEACHER"]}>{children}</RequireAuth>;
}
