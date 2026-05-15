import { badRequest } from "../../../lib/http";
import { findDisputeForErrand, findErrand } from "../../../lib/errands-repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const errand = await findErrand(id);
    if (!errand) return badRequest("Errand not found.", 404);
    const dispute = await findDisputeForErrand(id);
    return Response.json({ errand, dispute });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to load errand.", 500);
  }
}
