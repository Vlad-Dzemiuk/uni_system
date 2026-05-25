import { type NextRequest } from "next/server";
import { proxyAuthorizedRequest } from "@/lib/server/backend-proxy";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { facultyId: string } }
) {
  return proxyAuthorizedRequest(`/api/admin/deans/${params.facultyId}`, {
    method: "DELETE",
  });
}
