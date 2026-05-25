import { type NextRequest } from "next/server";
import { proxyAuthorizedRequest } from "@/lib/server/backend-proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyAuthorizedRequest(`/api/admission/certificate-types/${params.id}${request.nextUrl.search}`, {
    method: "GET",
  });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.text();
  return proxyAuthorizedRequest(`/api/admission/certificate-types/${params.id}`, {
    method: "PATCH",
    body,
    contentType: request.headers.get("content-type") ?? "application/json",
  });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.text();
  return proxyAuthorizedRequest(`/api/admission/certificate-types/${params.id}${request.nextUrl.search}`, {
    method: "DELETE",
    body: body || undefined,
    contentType: request.headers.get("content-type") ?? (body ? "application/json" : null),
  });
}
