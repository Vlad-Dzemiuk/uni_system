"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  FolderKanban,
  LayoutGrid,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/app/providers";

type NavItem = { href: string; label: string; hint: string; icon: React.ReactNode };

function roleTitle(role: string) {
  if (role === "STUDENT") return "Студент";
  if (role === "TEACHER") return "Викладач";
  if (role === "ADMIN") return "Адміністратор";
  return "Деканат";
}

export function SidebarNav({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const { auth } = useApp();

  const items: NavItem[] =
    auth.role === "ADMIN"
      ? [
          {
            href: "/admin/faculties",
            label: "Факультети",
            hint: "Структура університету",
            icon: <Building2 className="h-4 w-4" />,
          },
        ]
      : auth.role === "DEAN_OFFICE"
        ? [
            {
              href: "/dean/analytics",
              label: "Аналітика",
              hint: "Зведення по довідках",
              icon: <BarChart3 className="h-4 w-4" />,
            },
            {
              href: "/dean/orders",
              label: "Заявки",
              hint: "Черга на обробку",
              icon: <ClipboardList className="h-4 w-4" />,
            },
            {
              href: "/dean/certificates",
              label: "Шаблони довідок",
              hint: "Керування формами",
              icon: <FolderKanban className="h-4 w-4" />,
            },
            {
              href: "/dean/faculty",
              label: "Факультет",
              hint: "Користувачі та склад",
              icon: <Users className="h-4 w-4" />,
            },
          ]
        : [
            {
              href: "/certificates",
              label: "Подати довідку",
              hint: "Усі доступні варіанти",
              icon: <LayoutGrid className="h-4 w-4" />,
            },
            {
              href: "/certificates/ordered",
              label: "Мої заявки",
              hint: "Статуси й коментарі",
              icon: <FileText className="h-4 w-4" />,
            },
          ];

  return (
    <>
      <div className={cn("border-b border-slate-200 px-6 pb-6 pt-7", compact && "px-4")}>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-[0_14px_28px_rgba(24,181,247,0.22)]">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[1.05rem] font-semibold text-slate-900">{roleTitle(auth.role)}</div>
            <div className="mt-1 text-sm text-slate-500">Портал довідок університету</div>
          </div>
        </div>
      </div>

      <nav className={cn("flex-1 px-4 py-5", compact && "px-3")}>
        <div className="space-y-3">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-4 rounded-[22px] px-4 py-4 transition-all",
                  active
                    ? "bg-sky-50 text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                )}
              >
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all",
                    active
                      ? "bg-sky-100 text-sky-700"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                  )}
                >
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-[1rem] font-semibold leading-5">{item.label}</div>
                  <div className="mt-1 text-sm text-slate-500">{item.hint}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
