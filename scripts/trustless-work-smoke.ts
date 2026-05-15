import "dotenv/config";

async function main() {
  const apiKey = process.env.TRUSTLESS_WORK_API_KEY ?? process.env.NEXT_PUBLIC_API_KEY;
  const baseURL = process.env.TRUSTLESS_WORK_BASE_URL ?? "https://dev.api.trustlesswork.com";
  const platformFee = parsePlatformFeePercent();

  if (!apiKey) {
    throw new Error("TRUSTLESS_WORK_API_KEY or NEXT_PUBLIC_API_KEY is required.");
  }

  const missing = [
    "GOPADI_PLATFORM_WALLET",
    "GOPADI_RESOLVER_WALLET",
    "GOPADI_PLATFORM_FEE_PERCENT",
    "USDC_TRUSTLINE_ADDRESS",
  ].filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing Trustless Work config: ${missing.join(", ")}`);
  }

  const response = await fetch(`${baseURL}/deployer/single-release`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      signer: process.env.GOPADI_PLATFORM_WALLET,
      engagementId: `gopadi-smoke-${Date.now()}`,
      title: "GoPadi smoke escrow",
      description: "Smoke test for unsigned XDR generation.",
      roles: {
        approver: process.env.GOPADI_PLATFORM_WALLET,
        serviceProvider: process.env.GOPADI_RESOLVER_WALLET,
        platformAddress: process.env.GOPADI_PLATFORM_WALLET,
        releaseSigner: process.env.GOPADI_PLATFORM_WALLET,
        disputeResolver: process.env.GOPADI_RESOLVER_WALLET,
        receiver: process.env.GOPADI_RESOLVER_WALLET,
      },
      amount: 1,
      platformFee,
      milestones: [{ description: "Smoke milestone" }],
      trustline: {
        address: process.env.USDC_TRUSTLINE_ADDRESS,
        symbol: "USDC",
      },
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Trustless Work smoke failed (${response.status}): ${JSON.stringify(body)}`);
  }

  if (typeof body.unsignedTransaction !== "string") {
    throw new Error(`Trustless Work did not return unsignedTransaction: ${JSON.stringify(body)}`);
  }

  console.log(JSON.stringify({ ok: true, unsignedTransaction: "returned" }, null, 2));
}

function parsePlatformFeePercent() {
  const raw = process.env.GOPADI_PLATFORM_FEE_PERCENT;
  if (!raw) return undefined;

  const fee = Number.parseFloat(raw);
  if (!Number.isFinite(fee) || fee < 0 || fee > 99) {
    throw new Error("GOPADI_PLATFORM_FEE_PERCENT must be a number between 0 and 99.");
  }

  return fee;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
