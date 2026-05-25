"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CertificateType } from "@/lib/types";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/app/providers";

type RoleSegment = "student" | "teacher";

function roleToSegment(role: string): RoleSegment {
  return role === "TEACHER" ? "teacher" : "student";
}

function normalizeApiError(error: unknown) {
  if (!(error instanceof Error)) return "Не вдалося надіслати заявку";

  try {
    const parsed = JSON.parse(error.message) as { message?: unknown };
    if (typeof parsed.message === "string" && parsed.message.trim()) return parsed.message;
  } catch {
    // ignore
  }

  return error.message || "Не вдалося надіслати заявку";
}

function toDateInputValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function ApplicationForm({ cert }: { cert: CertificateType }) {
  const router = useRouter();
  const { auth } = useApp();

  const initial = useMemo(() => {
    const values: Record<string, string | boolean> = {};

    cert.fields.forEach((field) => {
      if (field.type === "checkbox") {
        values[field.key] = false;
        return;
      }

      if (field.key === "fullName") values[field.key] = auth.userName || "";
      else if (field.key === "email") values[field.key] = auth.email || "";
      else if (field.key === "groupName") values[field.key] = auth.groupName || "";
      else if (field.key === "specialty") values[field.key] = auth.specialty || "";
      else if (field.key === "birthDate") values[field.key] = toDateInputValue(auth.birthDate);
      else values[field.key] = "";
    });

    return values;
  }, [auth.birthDate, auth.email, auth.groupName, auth.specialty, auth.userName, cert.fields]);

  const [values, setValues] = useState<Record<string, string | boolean>>(initial);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setValues(initial);
  }, [initial]);

  const setValue = (key: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const getStringValue = (key: string) => {
    const value = values[key];
    return typeof value === "string" ? value : "";
  };

  const isFieldFilled = (key: string) => {
    const value = values[key];
    if (typeof value === "boolean") return true;
    return value.trim().length > 0;
  };

  const buildPayload = () => {
    const payload: Record<string, string | boolean> = {};

    for (const field of cert.fields) {
      const raw = values[field.key];

      if (field.type === "checkbox") {
        payload[field.key] = raw === true;
        continue;
      }

      const text = typeof raw === "string" ? raw.trim() : "";
      if (!field.required && text.length === 0) continue;
      payload[field.key] = text;
    }

    return payload;
  };

  const onSubmit = async () => {
    if (submitting) return;

    setError(null);
    const missing = cert.fields.find((field) => field.required && !isFieldFilled(field.key));
    if (missing) {
      setError(`Заповніть поле: ${missing.label}`);
      return;
    }

    const segment = roleToSegment(auth.role);
    const payload = buildPayload();

    setSubmitting(true);
    try {
      await api(`/api/${segment}/certificates/requests`, {
        method: "POST",
        body: JSON.stringify({
          typeId: cert.id,
          requestPurpose:
            typeof payload.requestPurpose === "string" ? payload.requestPurpose : undefined,
          payload,
        }),
      });

      router.push("/certificates/ordered");
    } catch (submitError) {
      setError(normalizeApiError(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-grid">
      <Card className="fade-in">
        <CardHeader>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
            {cert.isSpecialPurpose ? "Гнучкий запит" : "Подання довідки"}
          </div>
          <CardTitle className="mt-2 text-3xl">{cert.name}</CardTitle>
          <CardDescription>
            {cert.description || "Заповніть форму, а деканат опрацює вашу заявку."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {cert.fields.map((field) => (
              <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                <Label className="flex items-center gap-2 text-slate-700" htmlFor={field.key}>
                  {field.label}
                  {field.required ? <span className="text-xs text-rose-500">*</span> : null}
                </Label>

                <div className="mt-2">
                  {field.type === "textarea" ? (
                    <Textarea
                      id={field.key}
                      placeholder={field.placeholder}
                      value={getStringValue(field.key)}
                      onChange={(event) => setValue(field.key, event.target.value)}
                    />
                  ) : null}

                  {field.type === "select" ? (
                    <Select value={getStringValue(field.key)} onValueChange={(value) => setValue(field.key, value)}>
                      <SelectTrigger id={field.key}>
                        <SelectValue placeholder={field.placeholder ?? "Оберіть значення"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(field.options ?? []).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}

                  {field.type === "checkbox" ? (
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3">
                      <input
                        id={field.key}
                        type="checkbox"
                        checked={values[field.key] === true}
                        onChange={(event) => setValue(field.key, event.target.checked)}
                        className="h-4 w-4 accent-sky-600"
                      />
                      <span className="text-sm text-slate-700">{field.placeholder ?? "Так"}</span>
                    </label>
                  ) : null}

                  {field.type !== "textarea" && field.type !== "select" && field.type !== "checkbox" ? (
                    <Input
                      id={field.key}
                      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                      placeholder={field.placeholder}
                      value={getStringValue(field.key)}
                      onChange={(event) => setValue(field.key, event.target.value)}
                      min={typeof field.min === "number" ? field.min : undefined}
                      max={typeof field.max === "number" ? field.max : undefined}
                    />
                  ) : null}
                </div>

                {field.helpText ? <p className="mt-2 text-xs leading-5 text-slate-500">{field.helpText}</p> : null}
              </div>
            ))}
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="outline" onClick={() => router.back()} disabled={submitting}>
              Назад
            </Button>
            <Button onClick={() => void onSubmit()} disabled={submitting}>
              {submitting ? "Надсилаємо..." : "Надіслати заявку"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="text-xl">Пам’ятка</CardTitle>
            <CardDescription>
              Перед відправкою перевірте, щоб усі обов’язкові поля були заповнені без помилок.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4">
              Деканат отримає вашу заявку одразу після відправлення, а в розділі “Мої заявки” з’явиться її статус.
            </div>
            {cert.isSpecialPurpose ? (
              <div className="rounded-2xl bg-sky-50 p-4 text-sky-800">
                Якщо ви не знаєте точну назву довідки, опишіть її призначення максимально конкретно. Це допоможе деканату швидше підібрати правильний формат документа.
              </div>
            ) : (
              <div className="rounded-2xl bg-cyan-50 p-4 text-cyan-800">
                Якщо потрібної довідки немає у списку, поверніться назад і оберіть варіант “Довідка за призначенням”.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
