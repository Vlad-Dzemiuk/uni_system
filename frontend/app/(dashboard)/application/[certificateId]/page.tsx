"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/app/providers";
import { api } from "@/lib/api";
import type { CertificateType, FieldType } from "@/lib/types";
import { ApplicationForm } from "@/components/certificates/ApplicationForm";
import { Card, CardContent } from "@/components/ui/card";

type BackendAvailableField = {
  key?: unknown;
  label?: unknown;
  type?: unknown;
  required?: unknown;
  options?: unknown;
  placeholder?: unknown;
  helpText?: unknown;
  order?: unknown;
};

type BackendAvailableCertificate = {
  _id?: unknown;
  id?: unknown;
  title?: unknown;
  name?: unknown;
  description?: unknown;
  fields?: unknown;
  isSpecialPurpose?: unknown;
};

function roleToSegment(role: string): "student" | "teacher" {
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

function mapFieldType(raw: unknown): FieldType {
  if (typeof raw !== "string") return "text";

  const value = raw.toLowerCase();
  if (value === "date") return "date";
  if (value === "number") return "number";
  if (value === "textarea") return "textarea";
  if (value === "select") return "select";
  if (value === "checkbox") return "checkbox";
  return "text";
}

function mapAvailableCertificates(payload: unknown): CertificateType[] {
  const list = extractArray<BackendAvailableCertificate>(payload);

  return list.map((item, index) => {
    const id =
      readObjectId(item._id) ??
      (typeof item.id === "string" && item.id ? item.id : null) ??
      `cert-${index + 1}`;

    const fieldsRaw = extractArray<BackendAvailableField>(item.fields);
    const fields = fieldsRaw
      .map((field, fieldIndex) => ({
        key: typeof field.key === "string" && field.key ? field.key : `field_${fieldIndex + 1}`,
        label: typeof field.label === "string" && field.label ? field.label : `Поле ${fieldIndex + 1}`,
        type: mapFieldType(field.type),
        required: field.required === true,
        options: extractArray<string>(field.options).filter((opt) => typeof opt === "string"),
        placeholder: typeof field.placeholder === "string" ? field.placeholder : undefined,
        helpText: typeof field.helpText === "string" ? field.helpText : undefined,
        order: typeof field.order === "number" ? field.order : fieldIndex + 1,
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return {
      id,
      name:
        (typeof item.title === "string" && item.title) ||
        (typeof item.name === "string" && item.name) ||
        "Довідка",
      description: typeof item.description === "string" ? item.description : "",
      fields,
      isSpecialPurpose: item.isSpecialPurpose === true,
    };
  });
}

export default function ApplicationFormPage() {
  const params = useParams<{ certificateId: string }>();
  const { auth, certificates } = useApp();
  const [remoteCert, setRemoteCert] = useState<CertificateType | null>(null);
  const [loading, setLoading] = useState(true);

  const certificateId = useMemo(() => decodeURIComponent(params.certificateId), [params.certificateId]);

  const localCert = useMemo(
    () => certificates.find((certificate) => certificate.id === certificateId) ?? null,
    [certificates, certificateId]
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (localCert) {
        setRemoteCert(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const roleSegment = roleToSegment(auth.role);
        const payload = await api<unknown>(`/api/${roleSegment}/certificates/available`);
        if (cancelled) return;

        const mapped = mapAvailableCertificates(payload);
        setRemoteCert(mapped.find((certificate) => certificate.id === certificateId) ?? null);
      } catch {
        if (!cancelled) setRemoteCert(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [auth.role, certificateId, localCert]);

  if (auth.role === "DEAN_OFFICE") {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Деканат не подає заявки. Використайте розділ "Заявки".
        </CardContent>
      </Card>
    );
  }

  const cert = localCert ?? remoteCert;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Завантаження форми...</CardContent>
      </Card>
    );
  }

  if (!cert) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Довідку не знайдено.</CardContent>
      </Card>
    );
  }

  return <ApplicationForm cert={cert} />;
}

