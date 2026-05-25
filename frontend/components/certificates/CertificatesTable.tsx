"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CertificateType } from "@/lib/types";
import { Pagination } from "@/components/ui/pagination";

export function CertificatesTable({ items }: { items: CertificateType[] }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const pageSize = 7;

  const { pageItems, pageCount } = useMemo(() => {
    const count = Math.max(1, Math.ceil(items.length / pageSize));
    const safePage = Math.min(page, count);
    const start = (safePage - 1) * pageSize;
    return { pageItems: items.slice(start, start + pageSize), pageCount: count };
  }, [items, page]);

  const specialItem = useMemo(
    () => items.find((item) => item.isSpecialPurpose) ?? null,
    [items]
  );

  return (
    <div className="space-y-5">
      <Card className="fade-in overflow-hidden">
        <CardContent className="grid gap-5 p-0 lg:grid-cols-[minmax(0,1.3fr)_340px]">
          <div className="p-6 md:p-7">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Подача довідок</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Оберіть шаблон або подайте запит за призначенням
            </h1>
            <p className="section-copy max-w-2xl">
              Доступні довідки вже налаштовані деканатом. Якщо точної назви немає, скористайтесь окремим сценарієм і опишіть, для чого потрібен документ.
            </p>
          </div>

          <div className="border-l border-slate-100 bg-slate-50/70 p-6 md:p-7">
            <div className="rounded-[24px] bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Гнучкий сценарій</div>
                  <div className="mt-1 text-xs text-slate-500">Для нестандартних запитів</div>
                </div>
              </div>

              <div className="mt-4 text-sm leading-6 text-slate-600">
                {specialItem?.description ||
                  "Якщо ви не знаєте точний тип довідки, система дозволяє описати її призначення у вільній формі."}
              </div>

              {specialItem ? (
                <Button
                  className="mt-5 w-full"
                  onClick={() => router.push(`/application/${encodeURIComponent(specialItem.id)}`)}
                >
                  Подати запит за призначенням
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="fade-in">
        <CardHeader>
          <CardTitle>Доступні довідки</CardTitle>
          <CardDescription>
            Натисніть на рядок або кнопку дії, щоб перейти до заповнення форми.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="data-table-shell">
            <Table className="min-w-[760px]">
              <THead>
                <TR>
                  <TH>Тип довідки</TH>
                  <TH>Опис</TH>
                  <TH>Поля</TH>
                  <TH className="text-right">Дія</TH>
                </TR>
              </THead>
              <TBody>
                {pageItems.map((certificate) => (
                  <TR
                    key={certificate.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/application/${encodeURIComponent(certificate.id)}`)}
                  >
                    <TD>
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                          {certificate.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{certificate.name}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {certificate.isSpecialPurpose ? "Вільний опис потреби" : "Стандартний шаблон"}
                          </div>
                        </div>
                      </div>
                    </TD>
                    <TD className="max-w-[420px] text-slate-500">{certificate.description || "—"}</TD>
                    <TD>
                      <Badge variant={certificate.isSpecialPurpose ? "default" : "pending"}>
                        {certificate.fields.length} полів
                      </Badge>
                    </TD>
                    <TD className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          router.push(`/application/${encodeURIComponent(certificate.id)}`);
                        }}
                      >
                        Відкрити
                      </Button>
                    </TD>
                  </TR>
                ))}

                {items.length === 0 ? (
                  <TR>
                    <TD colSpan={4} className="text-center text-slate-500">
                      Поки що немає доступних довідок.
                    </TD>
                  </TR>
                ) : null}
              </TBody>
            </Table>
          </div>

          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
