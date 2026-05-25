import { type NextRequest } from "next/server";
import { proxyAuthorizedRequest } from "@/lib/server/backend-proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyAuthorizedRequest(
    `/api/teacher/certificates/requests/${params.id}${request.nextUrl.search}`,
    {
      method: "GET",
    }
  );
}
