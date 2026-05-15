import "dotenv/config";

import {
  Asset,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const BASE_FEE = "100000";
const NETWORK = Networks.TESTNET;
const TRUSTLESS_BASE_URL =
  process.env.TRUSTLESS_WORK_BASE_URL ?? "https://dev.api.trustlesswork.com";

type Json = Record<string, unknown>;

async function main() {
  const apiKey = process.env.TRUSTLESS_WORK_API_KEY ?? process.env.NEXT_PUBLIC_API_KEY;
  const platformSecret = required("GOPADI_PLATFORM_SECRET");
  const resolverSecret = required("GOPADI_RESOLVER_SECRET");
  const usdcIssuer = required("USDC_TRUSTLINE_ADDRESS");
  const platformFee = parsePlatformFeePercent();
  if (!apiKey) throw new Error("TRUSTLESS_WORK_API_KEY or NEXT_PUBLIC_API_KEY is required.");

  const platform = Keypair.fromSecret(platformSecret);
  const resolver = Keypair.fromSecret(resolverSecret);
  const server = new Horizon.Server(HORIZON_URL);
  const usdc = new Asset("USDC", usdcIssuer);

  console.log("1. Funding testnet role wallets with Friendbot...");
  await fundWithFriendbot(platform.publicKey());
  await fundWithFriendbot(resolver.publicKey());

  console.log("2. Ensuring USDC trustlines exist...");
  await ensureTrustline(server, platform, usdc);
  await ensureTrustline(server, resolver, usdc);

  console.log("2b. Ensuring platform wallet has 1 testnet USDC...");
  await ensureUsdcBalance(server, platform, usdc, "1");

  console.log("3. Requesting Trustless Work deploy XDR...");
  const deployPayload = {
    signer: platform.publicKey(),
    engagementId: `gopadi-live-${Date.now()}`,
    title: "GoPadi live escrow validation",
    description: "End-to-end Trustless Work validation for GoPadi.",
    roles: {
      approver: platform.publicKey(),
      serviceProvider: resolver.publicKey(),
      platformAddress: platform.publicKey(),
      releaseSigner: platform.publicKey(),
      disputeResolver: resolver.publicKey(),
      receiver: resolver.publicKey(),
    },
    amount: 1,
    platformFee,
    milestones: [{ description: "Complete GoPadi validation errand" }],
    trustline: {
      symbol: "USDC",
      address: usdcIssuer,
    },
  };

  const deploy = await trustlessPost("/deployer/single-release", deployPayload, apiKey);
  const deployXdr = assertUnsigned(deploy, "deploy");

  console.log("4. Signing and submitting deploy XDR...");
  const deploySubmit = await submitTrustlessXdr(deployXdr, platform, apiKey);
  const contractId = stringFrom(deploySubmit, "contractId");
  if (!contractId) {
    throw new Error(`Deploy submit succeeded but did not return contractId: ${JSON.stringify(deploySubmit)}`);
  }

  console.log("5. Requesting fund escrow XDR...");
  const fund = await trustlessPost(
    "/escrow/single-release/fund-escrow",
    {
      contractId,
      signer: platform.publicKey(),
      amount: 1,
    },
    apiKey,
  );
  const fundXdr = assertUnsigned(fund, "fund");

  console.log("6. Signing and submitting fund XDR...");
  const fundSubmit = await submitTrustlessXdr(fundXdr, platform, apiKey);

  console.log("7. Marking milestone completed...");
  const changeStatus = await trustlessPost(
    "/escrow/single-release/change-milestone-status",
    {
      contractId,
      milestoneIndex: "0",
      newEvidence: "GoPadi validation errand completed.",
      newStatus: "Completed",
      serviceProvider: resolver.publicKey(),
    },
    apiKey,
  );
  await submitTrustlessXdr(assertUnsigned(changeStatus, "change status"), resolver, apiKey);

  console.log("8. Approving milestone...");
  const approve = await trustlessPost(
    "/escrow/single-release/approve-milestone",
    {
      contractId,
      milestoneIndex: "0",
      approver: platform.publicKey(),
    },
    apiKey,
  );
  await submitTrustlessXdr(assertUnsigned(approve, "approve"), platform, apiKey);

  console.log("9. Releasing funds...");
  const release = await trustlessPost(
    "/escrow/single-release/release-funds",
    {
      contractId,
      releaseSigner: platform.publicKey(),
    },
    apiKey,
  );
  const releaseSubmit = await submitTrustlessXdr(assertUnsigned(release, "release"), platform, apiKey);

  console.log(
    JSON.stringify(
      {
        ok: true,
        platformWallet: platform.publicKey(),
        resolverWallet: resolver.publicKey(),
        contractId,
        deployStatus: deploySubmit.status,
        fundStatus: fundSubmit.status,
        releaseStatus: releaseSubmit.status,
      },
      null,
      2,
    ),
  );
}

async function fundWithFriendbot(address: string) {
  const accountExists = await fetch(`${HORIZON_URL}/accounts/${address}`).then((res) => res.ok);
  if (accountExists) return;
  const response = await fetch(`https://friendbot.stellar.org?addr=${address}`);
  if (!response.ok) {
    throw new Error(`Friendbot failed for ${address}: ${await response.text()}`);
  }
}

async function ensureTrustline(
  server: Horizon.Server,
  keypair: Keypair,
  asset: Asset,
) {
  const accountData = await server.accounts().accountId(keypair.publicKey()).call();
  const hasTrustline = accountData.balances.some(
    (balance) =>
      "asset_code" in balance &&
      balance.asset_code === asset.code &&
      balance.asset_issuer === asset.issuer,
  );
  if (hasTrustline) return;

  const source = await server.loadAccount(keypair.publicKey());
  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(Operation.changeTrust({ asset }))
    .setTimeout(60)
    .build();
  tx.sign(keypair);
  await server.submitTransaction(tx);
}

async function ensureUsdcBalance(
  server: Horizon.Server,
  keypair: Keypair,
  asset: Asset,
  amount: string,
) {
  const accountData = await server.accounts().accountId(keypair.publicKey()).call();
  const balance = accountData.balances.find(
    (line) =>
      "asset_code" in line &&
      line.asset_code === asset.code &&
      line.asset_issuer === asset.issuer,
  );
  const current = balance && "balance" in balance ? Number(balance.balance) : 0;
  if (current >= Number(amount)) return;

  const paths = await server
    .strictReceivePaths([Asset.native()], asset, amount)
    .call();
  const bestPath = paths.records[0];
  if (!bestPath) {
    throw new Error(`No Stellar testnet path found to acquire ${amount} ${asset.code}.`);
  }

  const source = await server.loadAccount(keypair.publicKey());
  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(
      Operation.pathPaymentStrictReceive({
        sendAsset: Asset.native(),
        sendMax: String(Math.ceil(Number(bestPath.source_amount) * 2)),
        destination: keypair.publicKey(),
        destAsset: asset,
        destAmount: amount,
        path: bestPath.path.map((pathAsset) =>
          new Asset(pathAsset.asset_code, pathAsset.asset_issuer),
        ),
      }),
    )
    .setTimeout(60)
    .build();
  tx.sign(keypair);
  await server.submitTransaction(tx);
}

async function trustlessPost(endpoint: string, payload: Json, apiKey: string) {
  const response = await fetch(`${TRUSTLESS_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });
  const body = (await response.json().catch(() => ({}))) as Json;
  if (!response.ok) {
    throw new Error(`${endpoint} failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

async function submitTrustlessXdr(xdr: string, signer: Keypair, apiKey: string) {
  const tx = TransactionBuilder.fromXDR(xdr, NETWORK);
  tx.sign(signer);
  return trustlessPost("/helper/send-transaction", { signedXdr: tx.toXDR() }, apiKey);
}

function assertUnsigned(body: Json, label: string) {
  const unsigned = stringFrom(body, "unsignedTransaction");
  if (!unsigned) {
    throw new Error(`Trustless Work ${label} did not return unsignedTransaction: ${JSON.stringify(body)}`);
  }
  return unsigned;
}

function stringFrom(body: Json, key: string) {
  const value = body[key];
  return typeof value === "string" ? value : undefined;
}

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function parsePlatformFeePercent() {
  const raw = required("GOPADI_PLATFORM_FEE_PERCENT");
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
