"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Clock3, FileCheck2, FileX2, Inbox, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

type MetricSummary = {
  total: number;
  pending: number;
  ready: number;
  rejected: number;
  inReview: number;
  forming: number;
  submittedToday: number;
  submittedThisWeek: number;
  completionRate: number;
  averageProcessingHours: number;
};

type StatusRow = { status?: unknown; label?: unknown; count?: unknown };
type RoleRow = { role?: unknown; label?: unknown; count?: unknown };
type ModeRow = { mode?: unknown; label?: unknown; count?: unknown };
type TrendRow = { key?: unknown; label?: unknown; submitted?: unknown; ready?: unknown; rejected?: unknown };
type TopRow = { title?: unknown; count?: unknown };
type RecentRow = {
  id?: unknown;
  requestNo?: unknown;
  requestTitle?: unknown;
  status?: unknown;
  requesterName?: unknown;
  submittedAt?: unknown;
};

type AnalyticsPayload = {
  summary?: unknown;
  byStatus?: unknown;
  byRole?: unknown;
  byMode?: unknown;
  dailyTrend?: unknown;
  topRequests?: unknown;
  recent?: unknown;
};

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function extractArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function statusBadge(status: string) {
  if (status === "READY") return "approved" as const;
  if (status === "REJECTED") return "rejected" as const;
  return "pending" as const;
}

function mapSummary(value: unknown): MetricSummary {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    total: readNumber(raw.total),
    pending: readNumber(raw.pending),
    ready: readNumber(raw.ready),
    rejected: readNumber(raw.rejected),
    inReview: readNumber(raw.inReview),
    forming: readNumber(raw.forming),
    submittedToday: readNumber(raw.submittedToday),
    submittedThisWeek: readNumber(raw.submittedThisWeek),
    completionRate: readNumber(raw.completionRate),
    averageProcessingHours: readNumber(raw.averageProcessingHours),
  };
}

export function AnalyticsWorkspace() {
  const [payload, setPayload] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await api<AnalyticsPayload>("/api/admission/analytics/overview");
        if (!cancelled) setPayload(data);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Не вдалося завантажити аналітику");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => mapSummary(payload?.summary), [payload]);
  const byStatus = useMemo(
    () =>
      extractArray<StatusRow>(payload?.byStatus).map((item) => ({
        status: readString(item.status),
        label: readString(item.label, "Статус"),
        count: readNumber(item.count),
      })),
    [payload]
  );
  const byRole = useMemo(
    () =>
      extractArray<RoleRow>(payload?.byRole).map((item) => ({
        role: readString(item.role),
        label: readString(item.label, "Роль"),
        count: readNumber(item.count),
      })),
    [payload]
  );
  const byMode = useMemo(
    () =>
      extractArray<ModeRow>(payload?.byMode).map((item) => ({
        mode: readString(item.mode),
        label: readString(item.label, "Тип"),
        count: readNumber(item.count),
      })),
    [payload]
  );
  const trend = useMemo(
    () =>
      extractArray<TrendRow>(payload?.dailyTrend).map((item) => ({
        key: readString(item.key),
        label: readString(item.label),
        submitted: readNumber(item.submitted),
        ready: readNumber(item.ready),
        rejected: readNumber(item.rejected),
      })),
    [payload]
  );
  const topRequests = useMemo(
    () =>
      extractArray<TopRow>(payload?.topRequests).map((item) => ({
        title: readString(item.title, "Довідка"),
        count: readNumber(item.count),
      })),
    [payload]
  );
  const recent = useMemo(
    () =>
      extractArray<RecentRow>(payload?.recent).map((item, index) => ({
        id: readString(item.id, `recent-${index + 1}`),
        requestNo: readString(item.requestNo, "—"),
        requestTitle: readString(item.requestTitle, "Довідка"),
        requesterName: readString(item.requesterName, "—"),
        status: readString(item.status, "SUBMITTED"),
        submittedAt: readString(item.submittedAt),
      })),
    [payload]
  );

  const maxTrend = useMemo(
    () => Math.max(1, ...trend.map((item) => Math.max(item.submitted, item.ready, item.rejected))),
    [trend]
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-slate-500">Завантаження аналітики...</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-rose-600">{error}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="fade-in overflow-hidden">
        <CardContent className="grid gap-6 p-0 xl:grid-cols-[minmax(0,1.4fr)_340px]">
          <div className="p-6 md:p-7">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Аналітика деканату</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Огляд навантаження та руху довідок
            </h1>
            <p className="section-copy max-w-2xl">
              Дашборд показує поточну чергу, темп обробки, структуру звернень і нестандартні заявки за призначенням.
            </p>
          </div>

          <div className="border-l border-slate-100 bg-slate-50/70 p-6 md:p-7">
            <div className="rounded-[24px] bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Швидкі дії</div>
                  <div className="mt-1 text-xs text-slate-500">Перейти до обробки</div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <Link href="/dean/orders">
                  <Button className="w-full justify-between">
                    Відкрити всі заявки
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dean/certificates">
                  <Button variant="outline" className="w-full justify-between">
                    Перевірити шаблони
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">Усього заявок</div>
            <Inbox className="h-5 w-5 text-sky-600" />
          </div>
          <div className="mt-4 text-3xl font-semibold text-slate-950">{summary.total}</div>
          <div className="mt-2 text-sm text-slate-500">Сьогодні: {summary.submittedToday}</div>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">У роботі</div>
            <BarChart3 className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-4 text-3xl font-semibold text-slate-950">{summary.pending}</div>
          <div className="mt-2 text-sm text-slate-500">Включно з формуванням і розглядом</div>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">Готово</div>
            <FileCheck2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-4 text-3xl font-semibold text-slate-950">{summary.ready}</div>
          <div className="mt-2 text-sm text-slate-500">Рівень завершення: {summary.completionRate}%</div>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">Середній час</div>
            <Clock3 className="h-5 w-5 text-slate-600" />
          </div>
          <div className="mt-4 text-3xl font-semibold text-slate-950">{summary.averageProcessingHours} год</div>
          <div className="mt-2 text-sm text-slate-500">По завершених та відхилених заявках</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Динаміка за останні 14 днів</CardTitle>
              <CardDescription>Подані, готові та відхилені заявки по днях.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {trend.map((item) => (
                  <div key={item.key} className="grid items-center gap-3 md:grid-cols-[90px_minmax(0,1fr)]">
                    <div className="text-sm font-medium text-slate-500">{item.label}</div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-[96px_minmax(0,1fr)_40px] items-center gap-3">
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Подано</div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-sky-500"
                            style={{ width: `${(item.submitted / maxTrend) * 100}%` }}
                          />
                        </div>
                        <div className="text-right text-sm font-semibold text-slate-700">{item.submitted}</div>
                      </div>
                      <div className="grid grid-cols-[96px_minmax(0,1fr)_40px] items-center gap-3">
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Готово</div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{ width: `${(item.ready / maxTrend) * 100}%` }}
                          />
                        </div>
                        <div className="text-right text-sm font-semibold text-slate-700">{item.ready}</div>
                      </div>
                      <div className="grid grid-cols-[96px_minmax(0,1fr)_40px] items-center gap-3">
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Відхилено</div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-rose-500"
                            style={{ width: `${(item.rejected / maxTrend) * 100}%` }}
                          />
                        </div>
                        <div className="text-right text-sm font-semibold text-slate-700">{item.rejected}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Нещодавня активність</CardTitle>
              <CardDescription>Останні заявки, які надійшли до деканату.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recent.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-slate-200/80 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{item.requestTitle}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.requestNo} • {item.requesterName}
                      </div>
                    </div>
                    <Badge variant={statusBadge(item.status)}>{item.status === "READY" ? "Готово" : item.status === "REJECTED" ? "Відхилено" : "В роботі"}</Badge>
                  </div>
                  <div className="mt-3 text-sm text-slate-500">
                    {item.submittedAt ? formatDate(item.submittedAt) : "—"}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Статуси</CardTitle>
              <CardDescription>Поточний розподіл заявок.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {byStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-700">{item.label}</div>
                  <div className="text-lg font-semibold text-slate-950">{item.count}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Типи подачі</CardTitle>
              <CardDescription>Шаблонні заявки та звернення за призначенням.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {byMode.map((item) => (
                <div key={item.mode} className="rounded-2xl border border-slate-200/80 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                    <Badge variant={item.mode === "PURPOSE" ? "default" : "pending"}>{item.count}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Хто подає заявки</CardTitle>
              <CardDescription>Розподіл звернень за ролями.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {byRole.map((item) => (
                <div key={item.role} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-700">{item.label}</div>
                  <div className="text-lg font-semibold text-slate-950">{item.count}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Найчастіші довідки</CardTitle>
              <CardDescription>Які звернення надходять найчастіше.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {topRequests.map((item, index) => (
                <div key={`${item.title}-${index}`} className="rounded-2xl border border-slate-200/80 bg-white p-4">
                  <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                  <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
                    <span>Кількість заявок</span>
                    <span className="font-semibold text-slate-900">{item.count}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Короткий висновок</CardTitle>
          <CardDescription>Що варто тримати в фокусі цього тижня.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[22px] bg-amber-50 p-5 text-amber-900">
            <div className="text-sm font-semibold">Черга в роботі</div>
            <div className="mt-2 text-3xl font-semibold">{summary.pending}</div>
            <div className="mt-2 text-sm leading-6 text-amber-800">
              Саме стільки заявок зараз потребують уваги деканату.
            </div>
          </div>
          <div className="rounded-[22px] bg-emerald-50 p-5 text-emerald-900">
            <div className="text-sm font-semibold">Готово цього тижня</div>
            <div className="mt-2 text-3xl font-semibold">{summary.ready}</div>
            <div className="mt-2 text-sm leading-6 text-emerald-800">
              Добрий орієнтир для навантаження й швидкості обробки.
            </div>
          </div>
          <div className="rounded-[22px] bg-rose-50 p-5 text-rose-900">
            <div className="text-sm font-semibold">Відхилені заявки</div>
            <div className="mt-2 text-3xl font-semibold">{summary.rejected}</div>
            <div className="mt-2 text-sm leading-6 text-rose-800">
              Варто перевіряти коментарі, щоб користувачі швидко виправляли помилки й подавали знову.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
