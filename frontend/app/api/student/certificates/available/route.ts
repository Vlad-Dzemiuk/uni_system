import { proxyAuthorizedGet } from "@/lib/server/backend-proxy";

export async function GET() {
  return proxyAuthorizedGet("/api/student/certificates/available");
}

