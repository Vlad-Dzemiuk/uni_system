import { proxyAuthorizedRequest } from "@/lib/server/backend-proxy";

export async function PATCH() {
  return proxyAuthorizedRequest("/api/notifications/read-all", {
    method: "PATCH",
    body: JSON.stringify({}),
    contentType: "application/json",
  });
}
