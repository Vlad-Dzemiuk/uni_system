"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleIcon } from "@/components/icons/google";
import { useAuth } from "@/providers/auth-providers";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function normalizeRoleFromRaw(rawRole: unknown) {
  const normalized = String(rawRole ?? "").trim().toLowerCase();
  if (normalized === "admin") return "ADMIN";
  if (normalized === "dean") return "DEAN_OFFICE";
  if (normalized === "teacher") return "TEACHER";
  if (normalized === "student") return "STUDENT";
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    const effectiveRole = normalizeRoleFromRaw(user.role) ?? role;
    if (effectiveRole === "ADMIN") {
      router.replace("/admin/faculties");
      return;
    }
    router.replace(effectiveRole === "DEAN_OFFICE" ? "/dean/analytics" : "/certificates");
  }, [loading, user, role, router]);

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="app-shell-inner grid min-h-[calc(100vh-2rem)] overflow-hidden lg:grid-cols-[minmax(0,1fr)_44%]">
        <div className="relative flex items-center justify-center px-6 py-10 md:px-10 lg:px-14">
          <div className="absolute left-8 top-8 hidden rounded-full bg-sky-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 md:block">
            Острозька академія
          </div>

          <div className="w-full max-w-xl">
            <div className="mb-10">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Портал довідок</div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                Вхід до університетського кабінету
              </h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-500">
                Увійдіть через корпоративний Google-акаунт, щоб подавати довідки, відстежувати їхні статуси й працювати із заявками деканату.
              </p>
            </div>

            <Card className="max-w-lg">
              <CardContent className="p-7">
                <a
                  href={`${API_URL}/api/auth/google/start`}
                  className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 font-semibold text-white shadow-[0_18px_32px_rgba(14,165,233,0.28)] transition hover:-translate-y-0.5 hover:brightness-[1.03]"
                >
                  <GoogleIcon className="h-5 w-5" />
                  Продовжити через Google
                </a>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-950/40 via-sky-900/10 to-transparent" />
          <Image src="/logooa.jpg" alt="Кампус університету" fill priority className="object-cover" />
        </div>
      </div>
    </div>
  );
}
