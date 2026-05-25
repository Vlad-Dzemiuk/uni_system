"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  mapBackendCertificateType,
  toBackendCertificateTypePayload,
  type BackendCertificateType,
} from "@/lib/admission";
import type { CertificateType } from "@/lib/types";
import { CertificateEditor } from "@/components/dean/CertificateEditor";
import { Card, CardContent } from "@/components/ui/card";

export default function EditCertificatePage() {
  const router = useRouter();
  const params = useParams<{ certificateId: string }>();
  const [certificate, setCertificate] = useState<CertificateType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const certificateId = decodeURIComponent(params.certificateId);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const payload = await api<unknown>(`/api/admission/certificate-types/${encodeURIComponent(certificateId)}`);
        if (cancelled) return;
        const raw =
          payload && typeof payload === "object" && "item" in payload
            ? (payload as Record<string, unknown>).item
            : payload;
        setCertificate(mapBackendCertificateType(raw as BackendCertificateType, 0));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Не вдалося завантажити довідку");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [certificateId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Завантаження довідки...</CardContent>
      </Card>
    );
  }

  if (error || !certificate) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-red-600">{error ?? "Довідку не знайдено."}</CardContent>
      </Card>
    );
  }

  return (
    <CertificateEditor
      mode="edit"
      initial={certificate}
      onCancel={() => router.push("/dean/certificates")}
      onSave={async (payload) => {
        await api(`/api/admission/certificate-types/${encodeURIComponent(certificateId)}`, {
          method: "PATCH",
          body: JSON.stringify(toBackendCertificateTypePayload(payload)),
        });
        router.push("/dean/certificates");
      }}
    />
  );
}
