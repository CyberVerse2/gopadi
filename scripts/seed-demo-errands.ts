import "dotenv/config";

import { createErrand } from "../app/lib/errands-repository";

const customerWallet =
  process.env.GOPADI_PLATFORM_WALLET ??
  "GDEMO000000000000000000000000000000000000000000000000000";

const demoErrands = [
  {
    customerWallet,
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
  for (const input of demoErrands) {
    created.push(await createErrand(input));
  }
  console.log(JSON.stringify({ ok: true, created: created.map((e) => e.id) }, null, 2));
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
