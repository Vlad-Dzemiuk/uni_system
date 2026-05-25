import { cookies } from "next/headers";

const BACKEND_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";

export async function GET() {
  if (!BACKEND_URL) {
    return Response.json({ message: "Не налаштовано адресу бекенду" }, { status: 500 });
  }

  const token = cookies().get("access_token")?.value;
  if (!token) {
    return Response.json({ message: "Потрібна авторизація" }, { status: 401 });
  }

  const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
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
