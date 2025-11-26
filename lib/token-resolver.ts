import { TOKENS, TOKEN_DECIMALS } from "@/lib/aptos-config";

export type ResolvedToken = {
  coinType: string;
  symbol: string;
  decimals: number;
};

/**
 * Checks if a string looks like an Aptos coin type
 * Format: 0x{address}::{module}::{struct}
 */
function isCoinType(value: string): boolean {
  // Basic check for Aptos coin type format
  return /^0x[a-fA-F0-9]+::[a-zA-Z_][a-zA-Z0-9_]*::[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);
}

/**
 * Sanitize symbol input (remove $, trim, uppercase)
 */
function sanitizeSymbol(input: string): string {
  return input.trim().replace(/^\$/i, "").toUpperCase();
}

/**
 * Search for token by symbol (placeholder for future API integration)
 * Note: Aptos doesn't have a centralized token registry like Jupiter yet
 * This is a placeholder for future API integration with aggregators
 */
async function searchTokenBySymbol(
  symbol: string
): Promise<{ coinType: string; symbol: string; decimals: number } | null> {
  try {
    // Placeholder: In the future, integrate with Aptos token aggregators
    // For now, return null and rely on our local TOKENS map

    // Example future implementation:
    // const res = await fetch(`https://aptos-token-api.com/search?q=${encodeURIComponent(symbol)}`);
    // if (!res.ok) return null;
    // const data = await res.json();
    // return { coinType: data.type, symbol: data.symbol, decimals: data.decimals };

    return null;
  } catch {
    return null;
  }
}

/**
 * Resolve a token parameter to a coin type, symbol, and decimals
 *
 * @param input - Token symbol (e.g., "APT", "USDC") or full coin type
 * @param fallbackSymbol - Symbol to use if resolution fails
 * @returns Resolved token information
 */
export async function resolveTokenParam(
  input: string | null | undefined,
  fallbackSymbol: keyof typeof TOKENS
): Promise<ResolvedToken> {
  // Fallback values
  const fallbackCoinType = TOKENS[fallbackSymbol];
  const fallbackDecimals = TOKEN_DECIMALS[fallbackSymbol] ?? 8;

  if (!input || input.trim() === "") {
    return {
      coinType: fallbackCoinType,
      symbol: String(fallbackSymbol),
      decimals: fallbackDecimals,
    };
  }

  const raw = input.trim();

  // 1) Check if input is a full coin type
  if (isCoinType(raw)) {
    // Try to extract symbol from coin type or use the coin type itself
    // For example: 0x1::aptos_coin::AptosCoin -> APTOS_COIN (or just use the type)
    const parts = raw.split("::");
    const structName = parts[parts.length - 1] || raw;

    // Try to find matching token in our registry
    const knownEntry = Object.entries(TOKENS).find(
      ([, coinType]) => coinType.toLowerCase() === raw.toLowerCase()
    );

    if (knownEntry) {
      const [sym] = knownEntry;
      return {
        coinType: raw,
        symbol: sym,
        decimals: (TOKEN_DECIMALS as any)[sym] ?? 8,
      };
    }

    // Unknown coin type, use best effort
    return {
      coinType: raw,
      symbol: structName,
      decimals: 8, // Default to 8 decimals for Aptos
    };
  }

  // 2) Symbol path
  const sym = sanitizeSymbol(raw);

  // 3) Check known tokens map
  if ((TOKENS as any)[sym]) {
    const coinType = (TOKENS as any)[sym] as string;
    const decimals = (TOKEN_DECIMALS as any)[sym] ?? 8;
    return { coinType, symbol: sym, decimals };
  }

  // 4) Try external search (currently returns null, future enhancement)
  const hit = await searchTokenBySymbol(sym);
  if (hit) {
    return {
      coinType: hit.coinType,
      symbol: sym,
      decimals: hit.decimals,
    };
  }

  // 5) Fallback to default
  return {
    coinType: fallbackCoinType,
    symbol: String(fallbackSymbol),
    decimals: fallbackDecimals,
  };
}

/**
 * Get token info by symbol (synchronous)
 */
export function getTokenBySymbol(
  symbol: string
): { coinType: string; decimals: number } | null {
  const sym = sanitizeSymbol(symbol);
  if ((TOKENS as any)[sym]) {
    return {
      coinType: (TOKENS as any)[sym],
      decimals: (TOKEN_DECIMALS as any)[sym] ?? 8,
    };
  }
  return null;
}

/**
 * Extract a readable symbol from a coin type string
 * Example: 0x1::aptos_coin::AptosCoin -> AptosCoin
 */
export function extractSymbolFromCoinType(coinType: string): string {
  const parts = coinType.split("::");
  return parts[parts.length - 1] || coinType;
}
