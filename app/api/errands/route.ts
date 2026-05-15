import { badRequest } from "../../lib/http";
import { listErrands } from "../../lib/errands-repository";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const escrowOnly = url.searchParams.get("scope") === "escrow";
    return Response.json({ errands: await listErrands({ escrowOnly }) });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to list errands.", 500);
  }
}

export async function POST() {
  try {
    return badRequest("Errands must be funded before they are saved. Use /api/errands/funded.", 409);
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to create errand.");
  }
}
