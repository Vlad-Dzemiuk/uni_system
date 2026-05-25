import { type NextRequest } from "next/server";
import { proxyAuthorizedRequest } from "@/lib/server/backend-proxy";

export async function GET(request: NextRequest) {
  return proxyAuthorizedRequest(`/api/admission/faculty/candidates${request.nextUrl.search}`, {
    method: "GET",
  });
}
