import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { disputes, trustlessActions } from "../../../../db/schema";
import { badRequest, readJson } from "../../../../lib/http";
import { resolveDispute } from "../../../../lib/errands-repository";
import type { DisputeResolution } from "../../../../types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await readJson<{
      resolution: DisputeResolution;
      signer: string;
      resolverNotes?: string;
    }>(request);

    if (body.signer !== process.env.GOPADI_RESOLVER_WALLET) {
      return badRequest("Resolver wallet is required to resolve disputes.", 403);
    }

    const [dispute] = await getDb()
      .select()
      .from(disputes)
      .where(eq(disputes.id, id))
      .limit(1);
    if (!dispute) return badRequest("Dispute not found.", 404);

    // Enforce: the on-chain resolve_dispute transaction must have been
    // submitted by this resolver for this errand. Trustless Work moves
    // the money; we only document the case decision.
    const [onChain] = await getDb()
      .select()
      .from(trustlessActions)
      .where(
        and(
          eq(trustlessActions.errandId, dispute.errandId),
          eq(trustlessActions.type, "resolve_dispute"),
          eq(trustlessActions.status, "submitted"),
          eq(trustlessActions.signer, body.signer),
        ),
      )
      .orderBy(desc(trustlessActions.submittedAt))
      .limit(1);

    if (!onChain) {
      return badRequest(
        "Sign and submit the on-chain resolve_dispute transaction before recording the local decision.",
        409,
      );
    }

    return Response.json(
      await resolveDispute(id, body.resolution, body.resolverNotes),
    );
  } catch (error) {
    return badRequest(
      error instanceof Error ? error.message : "Failed to resolve dispute.",
    );
  }
}
