import { badRequest, readJson } from "../../../../lib/http";
import { startErrand } from "../../../../lib/errands-repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await readJson<{ runnerWallet: string }>(request);
    return Response.json({ errand: await startErrand(id, body.runnerWallet) });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to start errand.");
  }
}
