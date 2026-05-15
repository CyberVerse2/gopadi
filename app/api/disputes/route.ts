import { badRequest } from "../../lib/http";
import { listDisputes } from "../../lib/errands-repository";

const RESOLVER_WALLET = process.env.GOPADI_RESOLVER_WALLET;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const signer = url.searchParams.get("signer");
    if (!RESOLVER_WALLET || signer !== RESOLVER_WALLET) {
      return badRequest("Resolver wallet is required to view disputes.", 403);
    }
    return Response.json({ disputes: await listDisputes() });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to list disputes.", 500);
  }
}
