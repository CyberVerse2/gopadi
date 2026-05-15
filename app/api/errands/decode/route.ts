import { badRequest, readJson } from "../../../lib/http";
import { decodeErrandText } from "../../../lib/errand-decoder";

export async function POST(request: Request) {
  try {
    const body = await readJson<{ text: string }>(request);
    return Response.json({ decoded: await decodeErrandText(body.text) });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to decode errand.");
  }
}
