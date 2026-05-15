import { badRequest, readJson } from "../../lib/http";
import { createErrand, listErrands } from "../../lib/errands-repository";
import type { CreateErrandInput } from "../../lib/errands-repository";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const escrowOnly = url.searchParams.get("scope") === "escrow";
    return Response.json({ errands: await listErrands({ escrowOnly }) });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to list errands.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = await readJson<CreateErrandInput>(request);
    return Response.json({ errand: await createErrand(input) }, { status: 201 });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to create errand.");
  }
}
