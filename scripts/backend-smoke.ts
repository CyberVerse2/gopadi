import "dotenv/config";

import { createErrand, acceptErrand, uploadProof, openDispute, resolveDispute } from "../app/lib/errands-repository";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Add it to .env, run npm run db:migrate, then rerun this smoke test.");
  }

  const suffix = Date.now();
  const errand = await createErrand({
    customerWallet: `GCUSTOMER${suffix}`,
    title: "Smoke test foodstuff errand",
    description: "Buy rice and oil for backend smoke verification.",
    category: "foodstuff",
    location: "Ogbete Market -> UNN Female Hostel",
    itemBudgetUSDC: 25,
    runnerFeeUSDC: 5,
    deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  });

  const accepted = await acceptErrand(errand.id, `GRUNNER${suffix}`);
  if (accepted.status !== "accepted") throw new Error("Accept transition failed.");

  // Local backend state test: emulate already-funded/in-progress state without
  // claiming a Trustless Work transaction happened.
  const { updateErrandStatus } = await import("../app/lib/errands-repository");
  await updateErrandStatus(errand.id, "in_progress");
  const proofed = await uploadProof(errand.id, "Receipt and delivery photo verified.");
  if (proofed.status !== "proof_uploaded") throw new Error("Proof transition failed.");

  const disputed = await openDispute(errand.id, "customer", "Smoke dispute.");
  if (disputed.errand.status !== "disputed") throw new Error("Dispute transition failed.");

  const resolved = await resolveDispute(disputed.dispute.id, "refund_customer", "Smoke refund.");
  if (resolved.errand.status !== "refunded") throw new Error("Resolve transition failed.");

  console.log(JSON.stringify({ ok: true, errandId: errand.id, disputeId: disputed.dispute.id }, null, 2));
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
