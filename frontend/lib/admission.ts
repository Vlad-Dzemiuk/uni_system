import type {
  CertificateAudience,
  CertificateField,
  CertificateType,
  FieldType,
} from "@/lib/types";

export type BackendCertificateField = {
  key?: unknown;
  label?: unknown;
  type?: unknown;
  required?: unknown;
  options?: unknown;
  placeholder?: unknown;
  helpText?: unknown;
  order?: unknown;
};

export type BackendCertificateType = {
  _id?: unknown;
  id?: unknown;
  title?: unknown;
  name?: unknown;
  description?: unknown;
  isActive?: unknown;
  audience?: unknown;
  fields?: unknown;
  isSpecialPurpose?: unknown;
};

export type DeanCertificateType = CertificateType & {
  isActive: boolean;
};

export function extractArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items as T[];
  if (Array.isArray(record.data)) return record.data as T[];
  if (Array.isArray(record.results)) return record.results as T[];

  return [];
}

export function readObjectId(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (typeof record.$oid === "string" && record.$oid) return record.$oid;
  if (typeof record.id === "string" && record.id) return record.id;

  return null;
}

export function readDate(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  if (typeof record.$date === "string") return record.$date;

  return "";
}

export function mapFieldType(raw: unknown): FieldType {
  if (typeof raw !== "string") return "text";
  const value = raw.toLowerCase();

  if (value === "date") return "date";
  if (value === "number") return "number";
  if (value === "textarea") return "textarea";
  if (value === "select") return "select";
  if (value === "checkbox") return "checkbox";
  return "text";
}

export function mapBackendField(field: BackendCertificateField, index: number): CertificateField {
  return {
    key: typeof field.key === "string" && field.key ? field.key : `field_${index + 1}`,
    label: typeof field.label === "string" && field.label ? field.label : `Поле ${index + 1}`,
    type: mapFieldType(field.type),
    required: field.required === true,
    options: extractArray<string>(field.options).filter((opt) => typeof opt === "string"),
    placeholder: typeof field.placeholder === "string" ? field.placeholder : undefined,
    helpText: typeof field.helpText === "string" ? field.helpText : undefined,
    order: typeof field.order === "number" ? field.order : index + 1,
  };
}

function mapAudience(raw: unknown): CertificateAudience {
  if (raw === "student" || raw === "teacher" || raw === "all") return raw;
  return "all";
}

export function mapBackendCertificateType(input: BackendCertificateType, index: number): DeanCertificateType {
  const id =
    readObjectId(input._id) ??
    (typeof input.id === "string" && input.id ? input.id : null) ??
    `cert-${index + 1}`;

  const fields = extractArray<BackendCertificateField>(input.fields)
    .map((field, fieldIndex) => mapBackendField(field, fieldIndex))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return {
    id,
    name:
      (typeof input.title === "string" && input.title) ||
      (typeof input.name === "string" && input.name) ||
      "Довідка",
    description: typeof input.description === "string" ? input.description : "",
    isActive: input.isActive !== false,
    audience: mapAudience(input.audience),
    fields,
    isSpecialPurpose: input.isSpecialPurpose === true,
  };
}

export function mapBackendCertificateTypes(payload: unknown): DeanCertificateType[] {
  return extractArray<BackendCertificateType>(payload).map((item, index) => mapBackendCertificateType(item, index));
}

export function toBackendCertificateTypePayload(payload: Omit<CertificateType, "id">) {
  return {
    title: payload.name,
    description: payload.description ?? "",
    isActive: true,
    audience: payload.audience ?? "all",
    fields: payload.fields.map((field, index) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required === true,
      options: field.type === "select" ? field.options ?? [] : [],
      placeholder: field.placeholder ?? "",
      helpText: field.helpText ?? "",
      order: field.order ?? index + 1,
    })),
  };
}

