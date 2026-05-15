import { badRequest } from "../../../../lib/http";
import { listTrustlessActions } from "../../../../lib/trustless-work";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return Response.json({ actions: await listTrustlessActions(id) });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to load escrow actions.", 500);
  }
}
