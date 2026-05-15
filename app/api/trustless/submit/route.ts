import { badRequest, readJson } from "../../../lib/http";
import { submitSignedTrustlessAction } from "../../../lib/trustless-work";

export async function POST(request: Request) {
  try {
    const body = await readJson<{ actionId: string; signedXdr: string }>(request);
    const action = await submitSignedTrustlessAction(body.actionId, body.signedXdr);
    return Response.json({ action });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to submit signed XDR.");
  }
}
