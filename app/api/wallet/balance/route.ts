import { NextResponse } from "next/server";
import { getAptosClient, TOKENS, TOKEN_DECIMALS } from "@/lib/aptos-config";
import { resolveAddressOrDomain, formatAddress } from "@/lib/address-resolver";

const OCTAS_PER_APT = 100_000_000; // 10^8

/**
 * GET /api/wallet/balance
 * Get APT and token balances for an Aptos account
 *
 * Query params:
 * - account: Aptos address or ANS domain (e.g., "user.apt")
 * - coinType: Optional - specific coin type to query
 *
 * Returns: { account, resolvedAddress, apt, octas, tokens, timestamp }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const account = searchParams.get("account");
    const coinType = searchParams.get("coinType");

    if (!account) {
      return NextResponse.json(
        { error: "account parameter is required" },
        { status: 400 }
      );
    }

    const client = getAptosClient();

    // Resolve address or ANS domain
    const accountAddress = await resolveAddressOrDomain(account, client);
    const resolvedAddress = formatAddress(accountAddress);

    console.log(`[BALANCE] Querying balance for ${account} -> ${resolvedAddress}`);

    // Query APT balance
    const aptBalance = await client.getAccountCoinAmount({
      accountAddress: resolvedAddress,
      coinType: TOKENS.APT,
    });

    const apt = Number(aptBalance) / OCTAS_PER_APT;

    // If specific coin type requested, query it
    let specificCoinBalance = null;
    if (coinType && coinType !== TOKENS.APT) {
      try {
        const balance = await client.getAccountCoinAmount({
          accountAddress: resolvedAddress,
          coinType: coinType as `0x${string}::${string}::${string}`,
        });

        // Try to determine decimals
        let decimals = 8; // Default
        const knownToken = Object.entries(TOKENS).find(
          ([, type]) => type.toLowerCase() === coinType.toLowerCase()
        );
        if (knownToken) {
          const symbol = knownToken[0] as keyof typeof TOKEN_DECIMALS;
          decimals = TOKEN_DECIMALS[symbol] ?? 8;
        }

        specificCoinBalance = {
          coinType,
          balance: Number(balance),
          balanceFormatted: Number(balance) / Math.pow(10, decimals),
          decimals,
        };
      } catch (error) {
        console.warn(`[BALANCE] Failed to query coin ${coinType}:`, error);
      }
    }

    // Query balances for all known tokens
    const tokens: Array<{
      symbol: string;
      coinType: string;
      balance: number;
      balanceFormatted: number;
    }> = [];

    for (const [symbol, type] of Object.entries(TOKENS)) {
      if (type === TOKENS.APT) continue; // Already queried

      try {
        const balance = await client.getAccountCoinAmount({
          accountAddress: resolvedAddress,
          coinType: type,
        });

        if (Number(balance) > 0) {
          const decimals = TOKEN_DECIMALS[symbol as keyof typeof TOKEN_DECIMALS] ?? 8;
          tokens.push({
            symbol,
            coinType: type,
            balance: Number(balance),
            balanceFormatted: Number(balance) / Math.pow(10, decimals),
          });
        }
      } catch (error) {
        // Token might not exist in account, skip
        console.debug(`[BALANCE] Skipping ${symbol}:`, error);
      }
    }

    return NextResponse.json({
      account,
      resolvedAddress,
      apt,
      octas: Number(aptBalance),
      ...(specificCoinBalance && { specificCoin: specificCoinBalance }),
      tokens,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[BALANCE] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch balance",
      },
      { status: 500 }
    );
  }
}
