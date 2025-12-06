import { logger } from "@/lib/utils/core/logger";
import { getPanoraAuthHeaders } from "@/lib/utils/api/common";

const PANORA_TOKEN_LIST_ENDPOINT = "https://api.panora.exchange/tokenlist";

export interface PanoraToken {
  chainId: number;
  panoraId: string;
  tokenAddress: string | null;
  faAddress: string | null;
  name: string;
  symbol: string;
  decimals: number;
  bridge: string | null;
  panoraSymbol: string;
  usdPrice: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  panoraUI: boolean;
  panoraTags: string[];
  panoraIndex: number;
  coinGeckoId: string | null;
  coinMarketCapId: number | null;
  isInPanoraTokenList: boolean;
  isBanned: boolean;
}

export class PanoraTokenListService {
  private static tokenMap: Map<string, PanoraToken> | null = null;
  private static tokenList: PanoraToken[] | null = null;
  private static lastFetchTime: number = 0;
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Fetch the complete Panora token list
   */
  static async getTokenList(): Promise<PanoraToken[]> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (
      PanoraTokenListService.tokenList &&
      now - PanoraTokenListService.lastFetchTime < PanoraTokenListService.CACHE_DURATION
    ) {
      return PanoraTokenListService.tokenList;
    }

    try {
      logger.info("Fetching token list from Panora API");

      const response = await fetch(PANORA_TOKEN_LIST_ENDPOINT, {
        method: "GET",
        headers: {
          ...getPanoraAuthHeaders(),
          "Accept-Encoding": "gzip",
        },
      });

      if (!response.ok) {
        throw new Error(`Panora Token List API error: ${response.status}`);
      }

      const data = await response.json();
      const result = Array.isArray(data) ? data : [];

      logger.info(`Retrieved ${result.length} tokens from Panora Token List`);

      // Build the token map for quick lookups
      PanoraTokenListService.tokenMap = new Map();
      result.forEach((token: PanoraToken) => {
        // Index by symbol
        PanoraTokenListService.tokenMap!.set(token.symbol.toUpperCase(), token);

        // Index by faAddress if available
        if (token.faAddress) {
          PanoraTokenListService.tokenMap!.set(token.faAddress.toLowerCase(), token);
        }

        // Index by tokenAddress if available
        if (token.tokenAddress) {
          PanoraTokenListService.tokenMap!.set(token.tokenAddress.toLowerCase(), token);
        }
      });

      PanoraTokenListService.tokenList = result;
      PanoraTokenListService.lastFetchTime = now;

      return result;
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        "Failed to fetch Panora token list"
      );
      
      // Return cached data if available, even if stale
      if (PanoraTokenListService.tokenList) {
        return PanoraTokenListService.tokenList;
      }
      
      throw error;
    }
  }

  /**
   * Get token info by symbol, faAddress, or tokenAddress
   */
  static async getTokenInfo(identifier: string): Promise<PanoraToken | null> {
    // Ensure token map is loaded
    if (!PanoraTokenListService.tokenMap) {
      await PanoraTokenListService.getTokenList();
    }

    if (!PanoraTokenListService.tokenMap) {
      return null;
    }

    // Try uppercase symbol first
    let token = PanoraTokenListService.tokenMap.get(identifier.toUpperCase());
    if (token) return token;

    // Try lowercase address
    token = PanoraTokenListService.tokenMap.get(identifier.toLowerCase());
    if (token) return token;

    return null;
  }

  /**
   * Get logo URL for a token
   */
  static async getTokenLogoUrl(identifier: string): Promise<string | null> {
    const token = await PanoraTokenListService.getTokenInfo(identifier);
    return token?.logoUrl || null;
  }

  /**
   * Get token price in USD
   */
  static async getTokenPrice(identifier: string): Promise<number | null> {
    const token = await PanoraTokenListService.getTokenInfo(identifier);
    if (!token?.usdPrice) return null;
    return parseFloat(token.usdPrice);
  }
}
