const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function extractApiErrorMessage(text: string, status: number) {
  const trimmed = text.trim();
  if (!trimmed) return `Помилка API: ${status}`;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      if (typeof record.message === "string" && record.message.trim()) {
        return record.message.trim();
      }
      if (typeof record.error === "string" && record.error.trim()) {
        return record.error.trim();
      }
      if (record.error && typeof record.error === "object") {
        const errRecord = record.error as Record<string, unknown>;
        if (typeof errRecord.message === "string" && errRecord.message.trim()) {
          return errRecord.message.trim();
        }
      }
    }
  } catch {
    // Ignore JSON parse errors and return raw text below.
  }

  return trimmed;
}

export async function api<T>(path: string, init: RequestInit = {}) {
  const target = path.startsWith("/api/") ? path : `${API_URL}${path}`;

  const res = await fetch(target, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(extractApiErrorMessage(text, res.status));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text().catch(() => "");
    return text as T;
  }

  const text = await res.text().catch(() => "");
  if (!text.trim()) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
