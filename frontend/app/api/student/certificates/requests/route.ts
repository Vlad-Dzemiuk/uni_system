import { type NextRequest } from "next/server";
import { proxyAuthorizedGet, proxyAuthorizedRequest } from "@/lib/server/backend-proxy";

export async function GET() {
  return proxyAuthorizedGet("/api/student/certificates/requests");
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyAuthorizedRequest("/api/student/certificates/requests", {
    method: "POST",
    body,
    contentType: request.headers.get("content-type") ?? "application/json",
  });
}