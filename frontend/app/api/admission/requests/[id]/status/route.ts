import { type NextRequest } from "next/server";
import { proxyAuthorizedRequest } from "@/lib/server/backend-proxy";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.text();
  return proxyAuthorizedRequest(`/api/admission/requests/${params.id}/status`, {
    method: "PATCH",
    body,
    contentType: request.headers.get("content-type") ?? "application/json",
  });
}