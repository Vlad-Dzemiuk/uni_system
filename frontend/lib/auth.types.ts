import type { AppRole } from "@/lib/types";

export type BackendRole = "Student" | "Teacher" | "Dean" | "Admin" | string;

export type Me = {
  _id: string;
  email: string;
  fullName: string;
  role: BackendRole;
  faculty?: string | null;
  groupName?: string;
  specialty?: string;
  birthDate?: string;
  google?: { picture?: string };
};

export function mapRole(role: BackendRole): AppRole {
  const normalized = String(role).trim().toLowerCase();
  if (normalized === "student") return "STUDENT";
  if (normalized === "teacher") return "TEACHER";
  if (normalized === "admin") return "ADMIN";
  return "DEAN_OFFICE";
}
