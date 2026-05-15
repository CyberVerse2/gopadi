import { badRequest } from "../../../../lib/http";
import { getWalletUsdcBalance } from "../../../../lib/stellar-balances";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  try {
    const { address } = await params;
    return Response.json(await getWalletUsdcBalance(address));
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to check USDC balance.", 500);
  }
}
