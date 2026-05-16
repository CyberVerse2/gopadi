import { badRequest, readJson } from "../../../../lib/http";
import {
  createErrandComment,
  listErrandComments,
} from "../../../../lib/errands-repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return Response.json({ comments: await listErrandComments(id) });
  } catch (error) {
    return badRequest(
      error instanceof Error ? error.message : "Failed to load comments.",
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
    }>(request);
    const comment = await createErrandComment({
      errandId: id,
      authorWallet: body.authorWallet,
      body: body.body ?? "",
    });
    return Response.json({ comment }, { status: 201 });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to post comment.");
  }
}
