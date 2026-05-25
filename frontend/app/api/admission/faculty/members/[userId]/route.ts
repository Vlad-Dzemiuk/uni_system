import { type NextRequest } from "next/server";
import { proxyAuthorizedRequest } from "@/lib/server/backend-proxy";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const body = await request.text();
  return proxyAuthorizedRequest(
    `/api/admission/faculty/members/${params.userId}${request.nextUrl.search}`,
    {
      method: "PATCH",
      body,
      contentType: request.headers.get("content-type") ?? "application/json",
    }
  );
}
