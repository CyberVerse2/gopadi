const HORIZON_URL = process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
const USDC_ISSUER = process.env.USDC_TRUSTLINE_ADDRESS;

type HorizonBalance = {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
};

type HorizonAccount = {
  balances: HorizonBalance[];
};

export async function getWalletUsdcBalance(address: string) {
  if (!USDC_ISSUER) throw new Error("USDC_TRUSTLINE_ADDRESS is required.");
  if (!address.trim()) throw new Error("Wallet address is required.");

  const response = await fetch(`${HORIZON_URL}/accounts/${address}`);
  if (response.status === 404) {
    return { balanceUSDC: 0, hasTrustline: false };
  }
  if (!response.ok) {
    throw new Error(`Could not check wallet balance. Horizon returned ${response.status}.`);
  }

  const account = (await response.json()) as HorizonAccount;
  const usdcBalance = account.balances.find(
    (balance) =>
      balance.asset_code === "USDC" &&
      balance.asset_issuer === USDC_ISSUER,
  );

  return {
    balanceUSDC: usdcBalance ? Number.parseFloat(usdcBalance.balance) : 0,
    hasTrustline: Boolean(usdcBalance),
  };
}
