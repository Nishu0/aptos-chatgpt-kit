import { NextResponse } from "next/server";
import { getAptosClient, TOKENS } from "@/lib/aptos-config";

/**
 * GET /api/price
 * Get USD price for an Aptos token
 *
 * Query params:
 * - tokenId: Coin type (e.g., "0x1::aptos_coin::AptosCoin") or symbol (e.g., "APT")
 *
 * Returns: { tokenId, symbol, price, priceFormatted, lastUpdated }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenIdParam = searchParams.get("tokenId") || searchParams.get("id") || searchParams.get("symbol");

    console.log("[PRICE] incoming params:", { raw: tokenIdParam });

    if (!tokenIdParam) {
      return NextResponse.json(
        { error: "tokenId (coin type or symbol) is required" },
        { status: 400 }
      );
    }

    const tokenId = tokenIdParam.trim();

    // Resolve symbol to coin type if needed
    let coinType: string;
    let symbol: string;

    if (tokenId.startsWith("0x")) {
      // It's a coin type
      coinType = tokenId;
      // Try to find symbol from known tokens
      const knownEntry = Object.entries(TOKENS).find(
        ([, type]) => type.toLowerCase() === coinType.toLowerCase()
      );
      symbol = knownEntry ? knownEntry[0] : "UNKNOWN";
    } else {
      // It's a symbol
      symbol = tokenId.toUpperCase();
      const knownToken = (TOKENS as any)[symbol];
      if (!knownToken) {
        return NextResponse.json(
          { error: `Unknown token symbol: ${symbol}` },
          { status: 404 }
        );
      }
      coinType = knownToken;
    }

    // Fetch price from external API
    // Note: This is a placeholder. In production, integrate with:
    // 1. CoinGecko API
    // 2. Liquidswap price feeds
    // 3. Other Aptos DEX aggregators
    const price = await fetchTokenPrice(symbol, coinType);

    if (price === null) {
      return NextResponse.json(
        { error: "Price not available for the given token" },
        { status: 404 }
      );
    }

    const formatPrice = (price: number) => {
      if (price < 0.0001) return price.toFixed(12);
      if (price < 0.01) return price.toFixed(8);
      if (price < 1) return price.toFixed(6);
      return price.toFixed(4);
    };

    return NextResponse.json({
      tokenId: coinType,
      symbol,
      price,
      priceFormatted: formatPrice(price),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[PRICE] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch price",
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch token price from external sources
 * TODO: Integrate with real price APIs
 */
async function fetchTokenPrice(
  symbol: string,
  coinType: string
): Promise<number | null> {
  try {
    // Method 1: CoinGecko API (for major tokens)
    const coingeckoIds: Record<string, string> = {
      APT: "aptos",
      USDC: "usd-coin",
      USDT: "tether",
      WETH: "weth",
    };

    const coingeckoId = coingeckoIds[symbol];
    if (coingeckoId) {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const price = data[coingeckoId]?.usd;
          if (price !== undefined) {
            console.log(`[PRICE] CoinGecko price for ${symbol}: $${price}`);
            return price;
          }
        }
      } catch (error) {
        console.warn("[PRICE] CoinGecko API error:", error);
      }
    }

    // Method 2: Hardcoded fallback for stablecoins
    if (symbol === "USDC" || symbol === "USDT") {
      return 1.0;
    }

    // Method 3: TODO - Query Liquidswap pools for price
    // This would involve:
    // 1. Finding the pool for the token pair (e.g., APT/USDC)
    // 2. Reading pool reserves
    // 3. Calculating price from reserves

    console.warn(`[PRICE] No price source available for ${symbol}`);
    return null;
  } catch (error) {
    console.error("[PRICE] fetchTokenPrice error:", error);
    return null;
  }
}
