import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { disputes } from "../../../../db/schema";
import { badRequest } from "../../../../lib/http";
import {
  findErrand,
  listErrandMessages,
} from "../../../../lib/errands-repository";
import { generateDisputeBrief } from "../../../../lib/dispute-brief";
import { listTrustlessActions } from "../../../../lib/trustless-work";
import { serializeDispute } from "../../../../lib/serializers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const signer = new URL(request.url).searchParams.get("signer")?.trim();
    if (!signer || signer !== process.env.GOPADI_RESOLVER_WALLET) {
      return badRequest("Resolver wallet is required to generate dispute briefs.", 403);
    }

    const [disputeRow] = await getDb()
      .select()
      .from(disputes)
      .where(eq(disputes.id, id))
      .limit(1);
    if (!disputeRow) return badRequest("Dispute not found.", 404);

    const dispute = serializeDispute(disputeRow);
    const errand = await findErrand(dispute.errandId);
    if (!errand) return badRequest("Errand not found for this dispute.", 404);
    if (errand.adminWallet !== signer) {
      return badRequest("Only the assigned resolver can brief this dispute.", 403);
    }

    const [messages, actions] = await Promise.all([
      listErrandMessages(errand.id, signer),
      listTrustlessActions(errand.id),
    ]);
    const brief = await generateDisputeBrief({
      errand,
      dispute,
      messages,
      actions,
    });

    return Response.json({ brief });
  } catch (error) {
    return badRequest(
      error instanceof Error ? error.message : "Failed to generate dispute brief.",
    );
  }
}
