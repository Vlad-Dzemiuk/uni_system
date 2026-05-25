"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, FileText, XCircle } from "lucide-react";
import { useApp } from "@/app/providers";
import { api } from "@/lib/api";
import { buildRequestDetailFields, type RequestDetailField, type RequestDetailDefinition } from "@/lib/request-details";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDate } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";

type BackendRoleSegment = "student" | "teacher";

type BackendTimelineItem = {
  status?: unknown;
  comment?: unknown;
  at?: unknown;
};

type BackendRequest = {
  _id?: unknown;
  requestNo?: unknown;
  regNumber?: unknown;
  requestTitle?: unknown;
  submittedAt?: unknown;
  createdAt?: unknown;
  status?: unknown;
  comment?: unknown;
  details?: unknown;
  decisionComment?: unknown;
  pickupFrom?: unknown;
  type?: unknown;
  timeline?: unknown;
  payload?: unknown;
};

type BackendTypeField = {
  key?: unknown;
  label?: unknown;
  type?: unknown;
  order?: unknown;
};

type BackendAvailableCertificate = {
  _id?: unknown;
  id?: unknown;
  title?: unknown;
  name?: unknown;
};

type OrderedRow = {
  id: string;
  requestNo: string;
  certificateTitle: string;
  submittedAt: string;
  status: string;
  details: string;
};

type TimelineRow = {
  status: string;
  comment: string;
  at: string;
};

type RequestDetails = {
  id: string;
  requestNo: string;
  certificateTitle: string;
  submittedAt: string;
  status: string;
  decisionComment: string;
  pickupFrom: string;
  fields: RequestDetailField[];
  timeline: TimelineRow[];
};

function roleToSegment(role: string): BackendRoleSegment {
  return role === "TEACHER" ? "teacher" : "student";
}

function extractArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items as T[];
  if (Array.isArray(record.data)) return record.data as T[];
  if (Array.isArray(record.results)) return record.results as T[];

  return [];
}

function readObjectId(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (typeof record.$oid === "string" && record.$oid) return record.$oid;
  if (typeof record.id === "string" && record.id) return record.id;

  return null;
}

function readDate(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  if (typeof record.$date === "string") return record.$date;

  return "";
}

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeApiError(error: unknown) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : "Не вдалося завантажити дані заявки";
}

function readCertificateTitle(value: unknown, titleMap: Record<string, string>): string {
  if (typeof value === "string" && value) return value;
  if (!value || typeof value !== "object") return "—";

  const record = value as Record<string, unknown>;
  if (typeof record.title === "string" && record.title) return record.title;
  if (typeof record.name === "string" && record.name) return record.name;

  const typeId = readObjectId(value);
  if (typeId && titleMap[typeId]) return titleMap[typeId];

  return "—";
}

function latestTimelineComment(value: unknown): string {
  const items = extractArray<BackendTimelineItem>(value);
  for (let idx = items.length - 1; idx >= 0; idx -= 1) {
    const item = items[idx];
    if (typeof item.comment === "string" && item.comment.trim().length > 0) {
      return item.comment.trim();
    }
  }
  return "—";
}

function mapAvailableTitleMap(payload: unknown): Record<string, string> {
  const list = extractArray<BackendAvailableCertificate>(payload);
  const result: Record<string, string> = {};

  for (const item of list) {
    const id = readObjectId(item._id) ?? readObjectId(item.id);
    const title =
      (typeof item.title === "string" && item.title) ||
      (typeof item.name === "string" && item.name) ||
      null;
    if (id && title) result[id] = title;
  }

  return result;
}

function mapRequests(payload: unknown, titleMap: Record<string, string>): OrderedRow[] {
  const list = extractArray<BackendRequest>(payload);

  return list.map((item, index) => {
    const requestId = readObjectId(item._id) ?? `REQ-${index + 1}`;
    const requestNo =
      (typeof item.requestNo === "string" && item.requestNo) ||
      (typeof item.regNumber === "string" && item.regNumber) ||
      requestId;

    const submittedAt = readDate(item.submittedAt) || readDate(item.createdAt);

    const details =
      (typeof item.details === "string" && item.details) ||
      (typeof item.comment === "string" && item.comment) ||
      (typeof item.decisionComment === "string" && item.decisionComment) ||
      latestTimelineComment(item.timeline);

    return {
      id: requestId,
      requestNo,
      certificateTitle: readString(item.requestTitle) || readCertificateTitle(item.type, titleMap),
      submittedAt,
      status: typeof item.status === "string" ? item.status : "SUBMITTED",
      details,
    };
  });
}

function statusLabel(status: string) {
  if (status === "SUBMITTED") return "Подано";
  if (status === "IN_REVIEW") return "На розгляді";
  if (status === "FORMING") return "Формується";
  if (status === "READY") return "Готово";
  if (status === "APPROVED") return "Схвалено";
  if (status === "REJECTED") return "Відхилено";
  if (status === "CANCELLED") return "Скасовано";
  return status;
}

function badgeVariant(status: string) {
  if (status === "READY" || status === "APPROVED") return "approved" as const;
  if (status === "REJECTED") return "rejected" as const;
  if (status === "CANCELLED") return "cancelled" as const;
  return "pending" as const;
}

function unwrapObject(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const root = payload as Record<string, unknown>;
  if (root.item && typeof root.item === "object") return root.item as Record<string, unknown>;
  return root;
}

function normalizeTypeFields(typeValue: unknown) {
  const typeRecord =
    typeValue && typeof typeValue === "object" ? (typeValue as Record<string, unknown>) : {};
  const raw = extractArray<BackendTypeField>(typeRecord.fields);

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

function buildPayloadFields(payloadValue: unknown, typeValue: unknown): RequestDetailField[] {
  return buildRequestDetailFields(payloadValue, normalizeTypeFields(typeValue));
}

function mapTimeline(value: unknown): TimelineRow[] {
  const list = extractArray<BackendTimelineItem>(value);
  return list
    .map((item) => ({
      status: readString(item.status, "SUBMITTED"),
      comment: readString(item.comment, "—"),
      at: readDate(item.at),
    }))
    .sort((a, b) => {
      const atA = a.at ? new Date(a.at).getTime() : 0;
      const atB = b.at ? new Date(b.at).getTime() : 0;
      return atA - atB;
    });
}

function buildDetailsFromRow(row: OrderedRow): RequestDetails {
  return {
    id: row.id,
    requestNo: row.requestNo,
    certificateTitle: row.certificateTitle,
    submittedAt: row.submittedAt,
    status: row.status,
    decisionComment: "",
    pickupFrom: "",
    fields: [],
    timeline: [],
  };
}

function buildDetailsFromPayload(payload: unknown, fallback: OrderedRow): RequestDetails {
  const obj = unwrapObject(payload);

  return {
    id: readObjectId(obj._id) ?? fallback.id,
    requestNo:
      readString(obj.requestNo) ||
      readString(obj.regNumber) ||
      fallback.requestNo,
    certificateTitle:
      readString(obj.requestTitle) ||
      (readCertificateTitle(obj.type, {}) !== "—"
        ? readCertificateTitle(obj.type, {})
        : fallback.certificateTitle),
    submittedAt: readDate(obj.submittedAt) || readDate(obj.createdAt) || fallback.submittedAt,
    status: readString(obj.status, fallback.status),
    decisionComment: readString(obj.decisionComment),
    pickupFrom: readDate(obj.pickupFrom),
    fields: buildPayloadFields(obj.payload, obj.type),
    timeline: mapTimeline(obj.timeline),
  };
}

export default function OrderedCertificatesPage() {
  const { auth } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handledNotificationRequestRef = useRef<string | null>(null);
  const [items, setItems] = useState<OrderedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<RequestDetails | null>(null);

  const pageSize = 8;
  const roleSegment = useMemo(() => roleToSegment(auth.role), [auth.role]);
  const requestFromNotification = searchParams.get("request");

  const clearNotificationRequest = useCallback(() => {
    if (!requestFromNotification) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("request");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [pathname, requestFromNotification, router, searchParams]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [requestsPayload, availablePayload] = await Promise.all([
          api<unknown>(`/api/${roleSegment}/certificates/requests`),
          api<unknown>(`/api/${roleSegment}/certificates/available`).catch(() => []),
        ]);
        if (cancelled) return;
        const titleMap = mapAvailableTitleMap(availablePayload);
        setItems(mapRequests(requestsPayload, titleMap));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Не вдалося завантажити заявки");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [roleSegment]);

  const { pageItems, pageCount } = useMemo(() => {
    const count = Math.max(1, Math.ceil(items.length / pageSize));
    const safe = Math.min(page, count);
    const start = (safe - 1) * pageSize;
    return { pageItems: items.slice(start, start + pageSize), pageCount: count };
  }, [items, page]);

  const metrics = useMemo(() => {
    const total = items.length;
    const ready = items.filter((item) => item.status === "READY").length;
    const rejected = items.filter((item) => item.status === "REJECTED").length;
    const pending = items.filter((item) => item.status !== "READY" && item.status !== "REJECTED").length;
    return { total, ready, rejected, pending };
  }, [items]);

  const metricCards = useMemo(
    () => [
      {
        label: "Усього заявок",
        value: metrics.total,
        note: "Усі подані звернення",
        Icon: FileText,
        barClass: "from-sky-500 via-cyan-400 to-cyan-300",
        iconClass: "border-sky-100 bg-sky-50 text-sky-700",
        dotClass: "bg-sky-500",
      },
      {
        label: "Очікують / у роботі",
        value: metrics.pending,
        note: "Поточна черга обробки",
        Icon: Clock3,
        barClass: "from-amber-400 via-orange-300 to-yellow-200",
        iconClass: "border-amber-100 bg-amber-50 text-amber-700",
        dotClass: "bg-amber-500",
      },
      {
        label: "Готово",
        value: metrics.ready,
        note: "Можна переглянути статус видачі",
        Icon: CheckCircle2,
        barClass: "from-emerald-500 via-teal-400 to-cyan-300",
        iconClass: "border-emerald-100 bg-emerald-50 text-emerald-700",
        dotClass: "bg-emerald-500",
      },
      {
        label: "Відхилено",
        value: metrics.rejected,
        note: "Потрібно перевірити коментар",
        Icon: XCircle,
        barClass: "from-rose-500 via-pink-400 to-orange-200",
        iconClass: "border-rose-100 bg-rose-50 text-rose-700",
        dotClass: "bg-rose-500",
      },
    ],
    [metrics.pending, metrics.ready, metrics.rejected, metrics.total]
  );

  useEffect(() => {
    setPage(1);
  }, [items.length]);

  const openDetails = useCallback(async (row: OrderedRow) => {
    setSelectedDetails(buildDetailsFromRow(row));
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsError(null);

    try {
      const payload = await api<unknown>(
        `/api/${roleSegment}/certificates/requests/${encodeURIComponent(row.id)}`
      );
      setSelectedDetails(buildDetailsFromPayload(payload, row));
    } catch (err) {
      setDetailsError(normalizeApiError(err));
      setSelectedDetails(buildDetailsFromRow(row));
    } finally {
      setDetailsLoading(false);
    }
  }, [roleSegment]);

  useEffect(() => {
    if (!requestFromNotification || loading || items.length === 0 || detailsOpen) return;
    if (handledNotificationRequestRef.current === requestFromNotification) return;

    const target = items.find((item) => item.id === requestFromNotification);
    if (target) {
      handledNotificationRequestRef.current = requestFromNotification;
      void openDetails(target);
      clearNotificationRequest();
    }
  }, [requestFromNotification, loading, items, detailsOpen, openDetails, clearNotificationRequest]);

  useEffect(() => {
    if (!requestFromNotification) {
      handledNotificationRequestRef.current = null;
    }
  }, [requestFromNotification]);

  const handleDetailsOpenChange = (nextOpen: boolean) => {
    setDetailsOpen(nextOpen);
    if (!nextOpen && requestFromNotification) {
      clearNotificationRequest();
    }
  };

  return (
    <>
      <div className="space-y-5">
      <div className="metrics-grid">
        {metricCards.map((item) => (
          <div key={item.label} className="metric-card">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.barClass}`} />
            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </div>
                <div className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">{item.value}</div>
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span className={`h-2 w-2 rounded-full ${item.dotClass}`} />
                  {item.note}
                </div>
              </div>

              <div
                className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] ${item.iconClass}`}
              >
                <item.Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card className="fade-in">
        <CardHeader>
          <CardTitle>Мої заявки</CardTitle>
          <CardDescription>Подані заявки та їх статус.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="data-table-shell">
            <Table className="min-w-[780px]">
              <THead>
                <TR>
                  <TH>№</TH>
                  <TH>Назва довідки</TH>
                  <TH>Дата подачі</TH>
                  <TH>Статус</TH>
                  <TH>Деталі</TH>
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

                {!loading && error ? (
                  <TR>
                    <TD colSpan={5} className="text-center text-red-600">
                      {error}
                    </TD>
                  </TR>
                ) : null}

                {!loading && !error
                  ? pageItems.map((item) => (
                      <TR key={item.id}>
                        <TD className="font-semibold">{item.requestNo}</TD>
                        <TD>{item.certificateTitle}</TD>
                        <TD className="text-muted-foreground">
                          {item.submittedAt ? formatDate(item.submittedAt) : "—"}
                        </TD>
                        <TD>
                          <Badge variant={badgeVariant(item.status)}>{statusLabel(item.status)}</Badge>
                        </TD>
                        <TD>
                          <div className="max-w-[260px] truncate text-muted-foreground">
                            {item.details || "—"}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-8 rounded-lg px-2"
                            onClick={() => void openDetails(item)}
                          >
                            Переглянути
                          </Button>
                        </TD>
                      </TR>
                    ))
                  : null}

                {!loading && !error && items.length === 0 ? (
                  <TR>
                    <TD colSpan={5} className="text-center text-muted-foreground">
                      Поки що немає поданих заявок.
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

      <Sheet open={detailsOpen} onOpenChange={handleDetailsOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Деталі заявки</SheetTitle>
            <SheetDescription>
              {selectedDetails
                ? `${selectedDetails.requestNo} • ${selectedDetails.certificateTitle}`
                : "—"}
            </SheetDescription>
          </SheetHeader>

          {detailsError ? (
            <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              {detailsError}
            </div>
          ) : null}

          {selectedDetails ? (
            <div className="space-y-4">
              <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Статус</span>
                  <Badge variant={badgeVariant(selectedDetails.status)}>
                    {statusLabel(selectedDetails.status)}
                  </Badge>
                </div>
                <div className="mt-2 text-muted-foreground">
                  Подано: <span className="text-foreground">{selectedDetails.submittedAt ? formatDate(selectedDetails.submittedAt) : "—"}</span>
                </div>
                <div className="mt-1 text-muted-foreground">
                  Дата видачі: <span className="text-foreground">{selectedDetails.pickupFrom ? formatDate(selectedDetails.pickupFrom) : "—"}</span>
                </div>
              </div>

              {selectedDetails.decisionComment ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-red-600">Коментар деканату</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-red-900">{selectedDetails.decisionComment}</div>
                </div>
              ) : null}

              <div className="rounded-2xl border bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold">Заповнені поля</div>
                  <Badge variant="default">{selectedDetails.fields.length}</Badge>
                </div>

                {detailsLoading ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
                    <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
                    <div className="h-20 animate-pulse rounded-xl bg-slate-100 sm:col-span-2" />
                  </div>
                ) : null}

                {!detailsLoading && selectedDetails.fields.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedDetails.fields.map((field) => (
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

                {!detailsLoading && selectedDetails.fields.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    Додаткові поля заявки відсутні або ще не завантажені.
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border bg-white p-4">
                <div className="mb-3 text-sm font-semibold">Історія заявки</div>

                {selectedDetails.timeline.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDetails.timeline.map((event, index) => (
                      <div key={`${event.status}-${event.at}-${index}`} className="rounded-xl border bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant={badgeVariant(event.status)}>{statusLabel(event.status)}</Badge>
                          <div className="text-xs text-muted-foreground">
                            {event.at ? formatDate(event.at) : "—"}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-slate-700">{event.comment || "—"}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    Історія подій поки що відсутня.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
