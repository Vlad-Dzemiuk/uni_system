import { proxyAuthorizedRequest } from "@/lib/server/backend-proxy";

export async function PATCH(
  _request: Request,
  { params }: { params: { id: string } }
) {
  return proxyAuthorizedRequest(`/api/notifications/${params.id}/read`, {
    method: "PATCH",
    body: JSON.stringify({}),
    contentType: "application/json",
  });
}
