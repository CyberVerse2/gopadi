import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { trustlessActions } from "../../../../db/schema";
import { badRequest, readJson } from "../../../../lib/http";
import { findErrand, openDispute } from "../../../../lib/errands-repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await readJson<{
      openedBy: "customer" | "runner";
      reason: string;
      evidenceUrl?: string;
      signer: string;
    }>(request);

    const errand = await findErrand(id);
    if (!errand) return badRequest("Errand not found.", 404);

    const expected =
      body.openedBy === "customer" ? errand.customerWallet : errand.runnerWallet;
    if (!body.signer || body.signer !== expected) {
      return badRequest("Connected wallet cannot open this dispute.", 403);
    }

    // Enforce: the on-chain dispute_escrow transaction must have been
    // submitted by this signer for this errand. Trustless Work enforces
    // the money lock; the local case record is just documentation around it.
    const [onChain] = await getDb()
      .select()
      .from(trustlessActions)
      .where(
        and(
          eq(trustlessActions.errandId, id),
          eq(trustlessActions.type, "dispute_escrow"),
          eq(trustlessActions.status, "submitted"),
          eq(trustlessActions.signer, body.signer),
        ),
      )
      .orderBy(desc(trustlessActions.submittedAt))
      .limit(1);

    if (!onChain) {
      return badRequest(
        "Sign and submit the on-chain dispute_escrow transaction before opening the local case.",
        409,
      );
    }

    return Response.json(
      await openDispute(id, body.openedBy, body.reason, body.evidenceUrl),
    );
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to open dispute.");
  }
}
