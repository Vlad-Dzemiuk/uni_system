import { type NextRequest } from "next/server";
import { proxyAuthorizedRequest } from "@/lib/server/backend-proxy";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const body = await request.text();
  return proxyAuthorizedRequest(`/api/users/${params.userId}`, {
    method: "PATCH",
    body,
    contentType: request.headers.get("content-type") ?? "application/json",
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  return proxyAuthorizedRequest(`/api/users/${params.userId}`, {
    method: "DELETE",
  });
}
