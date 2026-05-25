"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toBackendCertificateTypePayload } from "@/lib/admission";
import { CertificateEditor } from "@/components/dean/CertificateEditor";

export default function NewCertificatePage() {
  const router = useRouter();

  return (
    <CertificateEditor
      mode="create"
      onCancel={() => router.push("/dean/certificates")}
      onSave={async (payload) => {
        await api("/api/admission/certificate-types", {
          method: "POST",
          body: JSON.stringify(toBackendCertificateTypePayload(payload)),
        });
        router.push("/dean/certificates");
      }}
    />
  );
}
