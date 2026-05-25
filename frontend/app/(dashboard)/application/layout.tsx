"use client";

import { RequireAuth } from "@/providers/auth-providers";

export default function ApplicationLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth allowedRoles={["STUDENT", "TEACHER"]}>{children}</RequireAuth>;
}
