import { badRequest, readJson } from "../../../../lib/http";
import {
  createErrandMessage,
  getChatAccess,
  listErrandMessages,
} from "../../../../lib/errands-repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const wallet = url.searchParams.get("wallet")?.trim();
    if (!wallet) return badRequest("Wallet query parameter is required.", 401);
    const access = await getChatAccess(id, wallet);
    if (!access) {
      return Response.json({ messages: [], access: null });
    }
    const messages = await listErrandMessages(id, wallet);
    return Response.json({ messages, access });
  } catch (error) {
    return badRequest(
      error instanceof Error ? error.message : "Failed to load chat.",
      500,
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await readJson<{
      body: string;
      authorWallet: string;
      imageUrl?: string;
      imageName?: string;
    }>(request);
    const message = await createErrandMessage({
      errandId: id,
      authorWallet: body.authorWallet,
      body: body.body ?? "",
      imageUrl: body.imageUrl,
      imageName: body.imageName,
    });
    return Response.json({ message }, { status: 201 });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to post message.");
  }
}
