import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";

export async function POST() {
  const token = cookies().get("access_token")?.value;

  if (BACKEND_URL && token) {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });
    } catch {
      // Ignore backend logout errors and clear local cookie anyway.
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete("access_token");
  return response;
}
