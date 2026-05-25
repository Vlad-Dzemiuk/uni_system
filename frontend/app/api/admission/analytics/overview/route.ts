import { proxyAuthorizedGet } from "@/lib/server/backend-proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyAuthorizedGet(`/api/admission/analytics/overview${url.search}`);
}
