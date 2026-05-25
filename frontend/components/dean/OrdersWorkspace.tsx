"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { readDate } from "@/lib/admission";
import { buildRequestDetailFields, type RequestDetailDefinition, type RequestDetailField } from "@/lib/request-details";
import { formatDate } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { Filter } from "lucide-react";

type AdmissionStatus = "SUBMITTED" | "IN_REVIEW" | "FORMING" | "READY" | "REJECTED";

type AdmissionType = {
  title?: unknown;
  fields?: unknown;
};

type AdmissionTypeField = {
  key?: unknown;
  label?: unknown;
  type?: unknown;
  order?: unknown;
};

type AdmissionRequester = {
  fullName?: unknown;
  email?: unknown;
  role?: unknown;
};

type AdmissionRequest = {
  _id?: unknown;
  requestNo?: unknown;
  regNumber?: unknown;
  requestTitle?: unknown;
  requestMode?: unknown;
  status?: unknown;
  submittedAt?: unknown;
  decisionComment?: unknown;
  pickupFrom?: unknown;
  requesterFullName?: unknown;
  requesterEmail?: unknown;
  requesterRole?: unknown;
  requester?: unknown;
  type?: unknown;
  payload?: unknown;
  timeline?: unknown;
};

type AdmissionListResponse = {
  items?: unknown;
  total?: unknown;
  page?: unknown;
  limit?: unknown;
};

type RequestRow = {
  id: string;
  requestNo: string;
  status: AdmissionStatus;
  submittedAt: string;
  requesterName: string;
  requesterEmail: string;
  requesterRole: string;
  certificateTitle: string;
  decisionComment: string;
  pickupFrom: string;
};

function extractArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items as T[];
  if (Array.isArray(record.data)) return record.data as T[];
  if (Array.isArray(record.results)) return record.results as T[];

  return [];
}

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toIsoDateTimeFromDateInput(value: string) {
  const date = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return `${date}T00:00:00.000Z`;
}

function statusLabel(status: AdmissionStatus) {
  if (status === "SUBMITTED") return "Подано";
  if (status === "IN_REVIEW") return "На розгляді";
  if (status === "FORMING") return "Формується";
  if (status === "READY") return "Готово";
  return "Відхилено";
}

function statusBadge(status: AdmissionStatus) {
  if (status === "READY") return "approved" as const;
  if (status === "REJECTED") return "rejected" as const;
  return "pending" as const;
}

function normalizeStatus(value: unknown): AdmissionStatus {
  const raw = readString(value, "SUBMITTED");
  if (raw === "IN_REVIEW" || raw === "FORMING" || raw === "READY" || raw === "REJECTED") return raw;
  return "SUBMITTED";
}

function mapRequest(item: AdmissionRequest): RequestRow {
  const requester = (item.requester && typeof item.requester === "object" ? item.requester : {}) as AdmissionRequester;
  const type = (item.type && typeof item.type === "object" ? item.type : {}) as AdmissionType;

  return {
    id: readString(item._id),
    requestNo: readString(item.requestNo) || readString(item.regNumber) || "—",
    status: normalizeStatus(item.status),
    submittedAt: readDate(item.submittedAt),
    requesterName: readString(item.requesterFullName) || readString(requester.fullName) || "—",
    requesterEmail: readString(item.requesterEmail) || readString(requester.email) || "—",
    requesterRole: readString(item.requesterRole) || readString(requester.role) || "—",
    certificateTitle: readString(item.requestTitle) || readString(type.title) || "—",
    decisionComment: readString(item.decisionComment),
    pickupFrom: readDate(item.pickupFrom),
  };
}

function mapListResponse(payload: unknown) {
  const listResponse = (payload && typeof payload === "object" ? payload : {}) as AdmissionListResponse;
  const items = extractArray<AdmissionRequest>(listResponse.items ?? payload).map(mapRequest);

  const total = typeof listResponse.total === "number" ? listResponse.total : items.length;
  const page = typeof listResponse.page === "number" ? listResponse.page : 1;
  const limit = typeof listResponse.limit === "number" ? listResponse.limit : 20;

  return { items, total, page, limit };
}

function normalizeTypeFields(typeValue: unknown) {
  const typeRecord =
    typeValue && typeof typeValue === "object" ? (typeValue as Record<string, unknown>) : {};
  const raw = extractArray<AdmissionTypeField>(typeRecord.fields);

  return raw
    .map((field, index): RequestDetailDefinition => ({
      key: readString(field.key),
      label: readString(field.label),
      type: readString(field.type).toLowerCase(),
      order: typeof field.order === "number" ? field.order : index + 1,
    }))
    .filter((field) => field.key.length > 0)
    .sort((a, b) => a.order - b.order);
}

function buildRequestDetails(payloadValue: unknown, typeValue: unknown): RequestDetailField[] {
  return buildRequestDetailFields(payloadValue, normalizeTypeFields(typeValue));
}

export function OrdersWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handledNotificationRequestRef = useRef<string | null>(null);
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(true);
  const [status, setStatus] = useState<"all" | AdmissionStatus>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<RequestRow | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsFields, setDetailsFields] = useState<RequestDetailField[]>([]);

  const [nextStatus, setNextStatus] = useState<AdmissionStatus>("IN_REVIEW");
  const [decisionComment, setDecisionComment] = useState("");
  const [pickupFrom, setPickupFrom] = useState("");
  const [updating, setUpdating] = useState(false);
  const requestFromNotification = searchParams.get("request");

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const clearNotificationRequest = useCallback(() => {
    if (!requestFromNotification) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("request");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [pathname, requestFromNotification, router, searchParams]);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(pageSize));
      if (status !== "all") params.set("status", status);
      if (from) params.set("dateFrom", from);
      if (to) params.set("dateTo", to);

      const payload = await api<unknown>(`/api/admission/requests?${params.toString()}`);
      const mapped = mapListResponse(payload);
      setRows(mapped.items);
      setTotal(mapped.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити заявки");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page, status, from, to]);

  useEffect(() => {
    setPage(1);
  }, [status, from, to]);

  const openRequest = useCallback(async (request: RequestRow) => {
    setSelected(request);
    setNextStatus(
      request.status === "SUBMITTED" || request.status === "REJECTED"
        ? "IN_REVIEW"
        : request.status
    );
    setDecisionComment(request.decisionComment ?? "");
    setPickupFrom(request.pickupFrom ? request.pickupFrom.slice(0, 10) : "");
    setDetailsFields([]);
    setOpen(true);

    setDetailsLoading(true);
    try {
      const payload = await api<unknown>(`/api/admission/requests/${encodeURIComponent(request.id)}`);
      const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
      const obj =
        root.item && typeof root.item === "object"
          ? (root.item as Record<string, unknown>)
          : root;
      setDetailsFields(buildRequestDetails(obj.payload, obj.type));
    } catch {
      setDetailsFields([]);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!requestFromNotification || loading || rows.length === 0 || open) return;
    if (handledNotificationRequestRef.current === requestFromNotification) return;

    const target = rows.find((row) => row.id === requestFromNotification);
    if (target) {
      handledNotificationRequestRef.current = requestFromNotification;
      void openRequest(target);
      clearNotificationRequest();
    }
  }, [requestFromNotification, loading, rows, open, openRequest, clearNotificationRequest]);

  useEffect(() => {
    if (!requestFromNotification) {
      handledNotificationRequestRef.current = null;
    }
  }, [requestFromNotification]);

  const handleSheetOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSelected(null);
      setDetailsFields([]);
      if (requestFromNotification) clearNotificationRequest();
    }
  };

  const updateStatus = async () => {
    if (!selected || updating) return;

    const body: Record<string, unknown> = { status: nextStatus };

    if (nextStatus === "REJECTED") {
      if (decisionComment.trim().length < 3) {
        setError("Для відхилення потрібен коментар (мінімум 3 символи).");
        return;
      }
      body.decisionComment = decisionComment.trim();
    }

    if (nextStatus === "READY") {
      if (!pickupFrom) {
        setError("Для статусу 'Готово' вкажіть дату видачі.");
        return;
      }
      const pickupFromIso = toIsoDateTimeFromDateInput(pickupFrom);
      if (!pickupFromIso) {
        setError("Дата видачі має бути у форматі YYYY-MM-DD.");
        return;
      }
      body.pickupFrom = pickupFromIso;
    }

    if (nextStatus !== "REJECTED" && decisionComment.trim()) {
      body.decisionComment = decisionComment.trim();
    }

    setUpdating(true);
    setError(null);
    try {
      await api(`/api/admission/requests/${encodeURIComponent(selected.id)}/status`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await load();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося оновити статус");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Card className="fade-in">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Заявки</CardTitle>
            <CardDescription>Обробка заявок факультету.</CardDescription>
          </div>

          <Button variant="outline" className="rounded-xl" onClick={() => setFiltersOpen((value) => !value)}>
            <Filter className="h-4 w-4" />
            Фільтри
          </Button>
        </CardHeader>

        <CardContent>
          {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          {filtersOpen ? (
            <div className="mb-4 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-4">
              <div>
                <Label>Статус</Label>
                <div className="mt-2">
                  <Select value={status} onValueChange={(value) => setStatus(value as "all" | AdmissionStatus)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Усі" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Усі</SelectItem>
                      <SelectItem value="SUBMITTED">Подано</SelectItem>
                      <SelectItem value="IN_REVIEW">На розгляді</SelectItem>
                      <SelectItem value="FORMING">Формується</SelectItem>
                      <SelectItem value="READY">Готово</SelectItem>
                      <SelectItem value="REJECTED">Відхилено</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Дата від</Label>
                <Input className="mt-2 rounded-xl" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
              </div>

              <div>
                <Label>Дата до</Label>
                <Input className="mt-2 rounded-xl" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
              </div>

              <div className="flex items-end justify-end">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setStatus("all");
                    setFrom("");
                    setTo("");
                  }}
                >
                  Скинути
                </Button>
              </div>
            </div>
          ) : null}

          <div className="data-table-shell">
            <Table className="min-w-[760px]">
              <THead>
                <TR>
                  <TH>№</TH>
                  <TH>Заявник</TH>
                  <TH>Довідка</TH>
                  <TH>Дата подачі</TH>
                  <TH>Статус</TH>
                </TR>
              </THead>
              <TBody>
                {loading ? (
                  <TR>
                    <TD colSpan={5} className="text-center text-muted-foreground">
                      Завантаження заявок...
                    </TD>
                  </TR>
                ) : null}

                {!loading
                  ? rows.map((row) => (
                      <TR key={row.id} className="cursor-pointer" onClick={() => void openRequest(row)}>
                        <TD className="font-semibold">{row.requestNo}</TD>
                        <TD>
                          <div className="font-medium">{row.requesterName}</div>
                          <div className="text-xs text-muted-foreground">{row.requesterEmail}</div>
                        </TD>
                        <TD>{row.certificateTitle}</TD>
                        <TD className="text-muted-foreground">{row.submittedAt ? formatDate(row.submittedAt) : "—"}</TD>
                        <TD>
                          <Badge variant={statusBadge(row.status)}>{statusLabel(row.status)}</Badge>
                        </TD>
                      </TR>
                    ))
                  : null}

                {!loading && rows.length === 0 ? (
                  <TR>
                    <TD colSpan={5} className="text-center text-muted-foreground">
                      Немає заявок за вибраними фільтрами.
                    </TD>
                  </TR>
                ) : null}
              </TBody>
            </Table>
          </div>

          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Обробка заявки</SheetTitle>
            <SheetDescription>
              {selected ? (
                <>
                  <span className="font-semibold">{selected.requesterName}</span> • {selected.certificateTitle} • {selected.requestNo}
                </>
              ) : (
                "—"
              )}
            </SheetDescription>
          </SheetHeader>

          {selected ? (
            <div className="space-y-5">
              <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground">Поточний статус</div>
                  <Badge variant={statusBadge(selected.status)}>{statusLabel(selected.status)}</Badge>
                </div>
                <div className="mt-2 text-muted-foreground">
                  Подано: <span className="text-foreground">{selected.submittedAt ? formatDate(selected.submittedAt) : "—"}</span>
                </div>
                <div className="mt-1 text-muted-foreground">
                  Роль заявника: <span className="text-foreground">{selected.requesterRole}</span>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-4">
                <Label>Новий статус</Label>
                <div className="mt-2">
                  <Select value={nextStatus} onValueChange={(value) => setNextStatus(value as AdmissionStatus)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN_REVIEW">На розгляді</SelectItem>
                      <SelectItem value="FORMING">Формується</SelectItem>
                      <SelectItem value="READY">Готово</SelectItem>
                      <SelectItem value="REJECTED">Відхилено</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-4">
                  <Label>Дата видачі (для статусу "Готово")</Label>
                  <Input
                    className="mt-2 rounded-xl"
                    type="date"
                    value={pickupFrom}
                    onChange={(event) => setPickupFrom(event.target.value)}
                  />
                </div>

                <div className="mt-4">
                  <Label>Коментар</Label>
                  <Textarea
                    className="mt-2 rounded-xl"
                    value={decisionComment}
                    onChange={(event) => setDecisionComment(event.target.value)}
                    placeholder="Причина/пояснення"
                  />
                </div>

                <div className="mt-4 flex justify-end">
                  <Button onClick={() => void updateStatus()} disabled={updating} className="rounded-xl">
                    {updating ? "Оновлення..." : "Зберегти статус"}
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Label className="text-sm font-semibold">Дані, заповнені користувачем</Label>
                  <Badge variant="default">{detailsFields.length} полів</Badge>
                </div>

                {detailsLoading ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
                    <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
                    <div className="h-20 animate-pulse rounded-xl bg-slate-100 sm:col-span-2" />
                  </div>
                ) : null}

                {!detailsLoading && detailsFields.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {detailsFields.map((field) => (
                      <div
                        key={field.key}
                        className={`rounded-xl border bg-slate-50/70 p-3 ${field.isLong ? "sm:col-span-2" : ""}`}
                      >
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {field.label}
                        </div>
                        <div className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-slate-900">
                          {field.value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {!detailsLoading && detailsFields.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    Користувач не передав додаткових даних у payload.
                  </div>
                ) : null}
              </div>

            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
