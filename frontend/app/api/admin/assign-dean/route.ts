import { type NextRequest } from "next/server";
import { proxyAuthorizedRequest } from "@/lib/server/backend-proxy";

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyAuthorizedRequest("/api/admin/assign-dean", {
    method: "POST",
    body,
    contentType: request.headers.get("content-type") ?? "application/json",
  });
}
