import { type NextRequest } from "next/server";
import { proxyAuthorizedRequest } from "@/lib/server/backend-proxy";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.text();
  return proxyAuthorizedRequest(`/api/admission/faculties/${params.id}`, {
    method: "PATCH",
    body,
    contentType: request.headers.get("content-type") ?? "application/json",
  });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.text();
  return proxyAuthorizedRequest(`/api/admission/faculties/${params.id}${request.nextUrl.search}`, {
    method: "DELETE",
    body: body || undefined,
    contentType: request.headers.get("content-type") ?? (body ? "application/json" : null),
  });
}
