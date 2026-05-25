import { formatDate } from "@/lib/utils";

export type RequestDetailField = {
  key: string;
  label: string;
  value: string;
  isLong: boolean;
};

export type RequestDetailDefinition = {
  key: string;
  label: string;
  type: string;
  order: number;
};

const fallbackLabels: Record<string, string> = {
  requestpurpose: "Для чого потрібна довідка",
  specialty: "Спеціальність",
  groupname: "Група",
  birthdate: "Дата народження",
  fullname: "ПІБ",
  email: "Електронна пошта",
  additionalcomment: "Додатковий коментар",
};

function normalizeFieldKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9а-яіїєґ]/gi, "");
}

function looksLikeDateValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}(?:[T\s].*)?$/.test(value.trim());
}

function humanizeFieldLabel(key: string) {
  const normalized = normalizeFieldKey(key);
  if (fallbackLabels[normalized]) return fallbackLabels[normalized];

  const readable = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-zа-яіїєґ])([A-ZА-ЯІЇЄҐ])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

  if (!readable) return key;
  return readable.charAt(0).toUpperCase() + readable.slice(1);
}

function formatPayloadValue(value: unknown, type?: string) {
  if (value === null || value === undefined) return "—";

  if (typeof value === "boolean") return value ? "Так" : "Ні";
  if (typeof value === "number") return String(value);

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "—";

    if (type === "date" || looksLikeDateValue(trimmed)) {
      return formatDate(trimmed, { year: "numeric", month: "2-digit", day: "2-digit" });
    }

    return trimmed;
  }

  if (Array.isArray(value)) {
    const list = value.map((item) => (typeof item === "string" ? item.trim() : JSON.stringify(item)));
    return list.filter(Boolean).join(", ") || "—";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "—";
  }
}

export function buildRequestDetailFields(
  payloadValue: unknown,
  definitions: RequestDetailDefinition[]
): RequestDetailField[] {
  const payload =
    payloadValue && typeof payloadValue === "object"
      ? (payloadValue as Record<string, unknown>)
      : {};

  const payloadEntries = Object.entries(payload);
  const payloadByNormalizedKey = new Map(
    payloadEntries.map(([key, value]) => [normalizeFieldKey(key), { key, value }])
  );
  const knownKeys = new Set(definitions.map((field) => normalizeFieldKey(field.key)));

  const primary = definitions
    .filter((field) => payloadByNormalizedKey.has(normalizeFieldKey(field.key)))
    .map((field) => {
      const entry = payloadByNormalizedKey.get(normalizeFieldKey(field.key));
      const formatted = formatPayloadValue(entry?.value, field.type);
      return {
        key: entry?.key ?? field.key,
        label: field.label || humanizeFieldLabel(field.key),
        value: formatted,
        isLong: field.type === "textarea" || formatted.length > 80,
      };
    });

  const extras = payloadEntries
    .filter(([key]) => !knownKeys.has(normalizeFieldKey(key)))
    .map(([key, value]) => {
      const normalizedKey = normalizeFieldKey(key);
      const inferredType = normalizedKey.endsWith("date") ? "date" : undefined;
      const formatted = formatPayloadValue(value, inferredType);
      return {
        key,
        label: humanizeFieldLabel(key),
        value: formatted,
        isLong: formatted.length > 80,
      };
    });

  return [...primary, ...extras];
}
