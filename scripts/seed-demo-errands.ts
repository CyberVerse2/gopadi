import "dotenv/config";

import {
  createFundedErrand,
  openDispute,
  startErrand,
  updateErrandStatus,
  uploadProof,
} from "../app/lib/errands-repository";

const customerWallet =
  process.env.GOPADI_PLATFORM_WALLET ??
  "GDEMO000000000000000000000000000000000000000000000000000";
const runnerWallet =
  process.env.GOPADI_DEMO_PADI_WALLET ??
  "GDEMO111111111111111111111111111111111111111111111111111";
const adminWallet =
  process.env.GOPADI_RESOLVER_WALLET ??
  "GDEMO222222222222222222222222222222222222222222222222222";

const demoErrands = [
  {
    customerWallet,
    customerPhone: "+2348000000000",
    customerEmail: "demo-foodstuff@gopadi.test",
    title: "Buy foodstuff from Ogbete Market",
    description:
      "Please buy 2kg rice, 1 bottle of groundnut oil, beans, and tomato paste. Pack everything well.",
    category: "foodstuff" as const,
    location: "Ogbete Market -> UNN Female Hostel, Block C",
    itemBudgetUSDC: 25,
    runnerFeeUSDC: 5,
    deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    customerWallet,
    customerPhone: "+2348000000001",
    customerEmail: "demo-medicine@gopadi.test",
    title: "Pick up medicine from pharmacy",
    description:
      "Collect prescribed medicine from the pharmacy and deliver to Hilltop Estate.",
    category: "medicine" as const,
    location: "Biovaccines Pharmacy -> Hilltop Estate",
    itemBudgetUSDC: 20,
    runnerFeeUSDC: 4,
    deadline: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    customerWallet,
    customerPhone: "+2348000000002",
    customerEmail: "demo-delivery@gopadi.test",
    title: "Deliver documents across campus",
    description:
      "Pick up sealed documents from Faculty of Arts and deliver to Admin Block reception.",
    category: "delivery" as const,
    location: "Faculty of Arts -> Admin Block",
    itemBudgetUSDC: 1,
    runnerFeeUSDC: 3,
    deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  },
];

async function main() {
  const created = [];
  const [successfulInput, disputedInput, openInput] = demoErrands;

  const successful = await createFundedErrand({
    ...successfulInput,
    runnerWallet,
    adminWallet,
    escrowId: `demo-success-${Date.now()}`,
    escrowContractId: `CDEMO_SUCCESS_${Date.now()}`,
    trustlessEngagementId: `gopadi-demo-success-${Date.now()}`,
  });
  await startErrand(successful.id, runnerWallet);
  await uploadProof(
    successful.id,
    "Bought rice, oil, beans, and tomato paste. Receipt and item photos uploaded in the demo.",
    JSON.stringify([
      {
        type: "receipt",
        url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        name: "demo receipt",
      },
    ]),
  );
  created.push(successful.id);

  const disputed = await createFundedErrand({
    ...disputedInput,
    runnerWallet,
    adminWallet,
    escrowId: `demo-dispute-${Date.now()}`,
    escrowContractId: `CDEMO_DISPUTE_${Date.now()}`,
    trustlessEngagementId: `gopadi-demo-dispute-${Date.now()}`,
  });
  await startErrand(disputed.id, runnerWallet);
  await uploadProof(
    disputed.id,
    "Picked up medicine and delivered to the estate gate, but requester says the handoff was incomplete.",
    JSON.stringify([
      {
        type: "delivery",
        url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        name: "demo handoff",
      },
    ]),
  );
  await updateErrandStatus(disputed.id, "disputed");
  await openDispute(disputed.id, "customer", {
    reasonCode: "proof_rejected",
    reason: "The submitted handoff proof does not show the medicine was received by the right person.",
    track: "normal",
  });
  created.push(disputed.id);

  const open = await createFundedErrand({
    ...openInput,
    runnerWallet,
    adminWallet,
    escrowId: `demo-open-${Date.now()}`,
    escrowContractId: `CDEMO_OPEN_${Date.now()}`,
    trustlessEngagementId: `gopadi-demo-open-${Date.now()}`,
  });
  created.push(open.id);

  console.log(JSON.stringify({ ok: true, created }, null, 2));
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
