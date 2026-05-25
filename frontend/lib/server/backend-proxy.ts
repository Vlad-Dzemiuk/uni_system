import { cookies } from "next/headers";

const BACKEND_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";

type ProxyOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: string;
  contentType?: string | null;
};

export async function proxyAuthorizedRequest(path: string, options: ProxyOptions = {}) {
  if (!BACKEND_URL) {
    return Response.json({ message: "Не налаштовано адресу бекенду" }, { status: 500 });
  }

  const token = cookies().get("access_token")?.value;
  if (!token) {
    return Response.json({ message: "Потрібна авторизація" }, { status: 401 });
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  if (options.contentType) {
    headers["Content-Type"] = options.contentType;
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body,
    cache: "no-store",
  });

  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json; charset=utf-8",
    },
  });
}

export async function proxyAuthorizedGet(path: string) {
  return proxyAuthorizedRequest(path, { method: "GET" });
}
