import { type NextRequest } from "next/server";
import { proxyAuthorizedRequest } from "@/lib/server/backend-proxy";

export async function GET(request: NextRequest) {
  return proxyAuthorizedRequest(`/api/admission/certificate-types${request.nextUrl.search}`, {
    method: "GET",
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyAuthorizedRequest("/api/admission/certificate-types", {
    method: "POST",
    body,
    contentType: request.headers.get("content-type") ?? "application/json",
  });
}