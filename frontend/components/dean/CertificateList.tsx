"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { mapBackendCertificateTypes, type DeanCertificateType } from "@/lib/admission";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus } from "lucide-react";

function audienceLabel(audience?: string) {
  if (audience === "student") return "Студент";
  if (audience === "teacher") return "Викладач";
  return "Усі";
}

export function CertificateList() {
  const [items, setItems] = useState<DeanCertificateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = await api<unknown>("/api/admission/certificate-types");
      setItems(mapBackendCertificateTypes(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити довідки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onDelete = async (id: string) => {
    const ok = confirm("Видалити цей тип довідки?");
    if (!ok) return;

    try {
      await api(`/api/admission/certificate-types/${encodeURIComponent(id)}`, {
        method: "DELETE",
        body: JSON.stringify({}),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося видалити довідку");
    }
  };

  const { pageItems, pageCount } = useMemo(() => {
    const count = Math.max(1, Math.ceil(items.length / pageSize));
    const safe = Math.min(page, count);
    const start = (safe - 1) * pageSize;
    return { pageItems: items.slice(start, start + pageSize), pageCount: count };
  }, [items, page]);

  useEffect(() => {
    setPage(1);
  }, [items.length]);

  return (
    <Card className="fade-in">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Керування довідками</CardTitle>
          <CardDescription>Створення, редагування та видалення типів довідок.</CardDescription>
        </div>

        <Link href="/dean/certificates/new">
          <Button className="rounded-xl">
            <Plus className="h-4 w-4" />
            Додати довідку
          </Button>
        </Link>
      </CardHeader>

      <CardContent>
        {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <div className="data-table-shell">
          <Table className="min-w-[920px]">
            <THead>
              <TR>
                <TH>Назва</TH>
                <TH>Опис</TH>
                <TH>Доступно</TH>
                <TH>Поля</TH>
                <TH>Статус</TH>
                <TH className="text-right">Дії</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TR>
                  <TD colSpan={6} className="text-center text-muted-foreground">
                    Завантаження...
                  </TD>
                </TR>
              ) : null}

              {!loading
                ? pageItems.map((certificate) => (
                    <TR key={certificate.id}>
                      <TD className="font-semibold">{certificate.name}</TD>
                      <TD className="text-muted-foreground">{certificate.description || "—"}</TD>
                      <TD className="text-muted-foreground">{audienceLabel(certificate.audience)}</TD>
                      <TD className="text-muted-foreground">{certificate.fields.length}</TD>
                      <TD>
                        <Badge variant={certificate.isActive ? "approved" : "cancelled"}>
                          {certificate.isActive ? "Активна" : "Неактивна"}
                        </Badge>
                      </TD>
                      <TD className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dean/certificates/${encodeURIComponent(certificate.id)}/edit`}>
                            <Button variant="outline" size="sm" className="rounded-xl">
                              <Pencil className="h-4 w-4" />
                              Редагувати
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => void onDelete(certificate.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Видалити
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))
                : null}

              {!loading && items.length === 0 ? (
                <TR>
                  <TD colSpan={6} className="text-center text-muted-foreground">
                    Довідок ще немає.
                  </TD>
                </TR>
              ) : null}
            </TBody>
          </Table>
        </div>

        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </CardContent>
    </Card>
  );
}
