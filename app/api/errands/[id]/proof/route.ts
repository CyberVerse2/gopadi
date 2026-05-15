import { badRequest, readJson } from "../../../../lib/http";
import { findErrand, uploadProof } from "../../../../lib/errands-repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await readJson<{ proofNote: string; proofUrl?: string; signer: string }>(request);
    const errand = await findErrand(id);
    if (!errand) return badRequest("Errand not found.", 404);
    if (!body.signer || body.signer !== errand.runnerWallet) {
      return badRequest("Connected wallet cannot upload proof for this errand.", 403);
    }
    return Response.json({
      errand: await uploadProof(id, body.proofNote, body.proofUrl),
    });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to upload proof.");
  }
}
