import type { NextRequest } from "next/server";

import { CACHE_DURATIONS, errorResponse, successResponse } from "@/lib/utils/api/common";
import { RATE_LIMIT_TIERS, withRateLimit } from "@/lib/utils/api/rate-limiter";
import { apiLogger } from "@/lib/utils/core/logger";
import { PanoraTokenListService, type PanoraToken } from "@/lib/services/panora-token-list";

async function handler(request: NextRequest) {
  const startTime = Date.now();

  try {
    const symbol = request.nextUrl.searchParams.get("symbol");
    const address = request.nextUrl.searchParams.get("address");
    const all = request.nextUrl.searchParams.get("all");

    apiLogger.info("Token list API request", {
      symbol,
      address,
      all,
      endpoint: "/api/tokens",
    });

    // If requesting all tokens
    if (all === "true") {
      const tokens = await PanoraTokenListService.getTokenList();
      
      return successResponse(
        {
          success: true,
          count: tokens.length,
          tokens,
          timestamp: new Date().toISOString(),
        },
        CACHE_DURATIONS.MEDIUM,
        {
          "X-Response-Time": `${Date.now() - startTime}ms`,
        }
      );
    }

    // If looking up a specific token
    const identifier = symbol || address;
    if (!identifier) {
      return errorResponse(
        "Either 'symbol', 'address', or 'all=true' parameter is required",
        400
      );
    }

    const token = await PanoraTokenListService.getTokenInfo(identifier);

    if (!token) {
      return errorResponse(`Token not found: ${identifier}`, 404);
    }

    return successResponse(
      {
        success: true,
        token,
        timestamp: new Date().toISOString(),
      },
      CACHE_DURATIONS.MEDIUM,
      {
        "X-Response-Time": `${Date.now() - startTime}ms`,
      }
    );
  } catch (error) {
    apiLogger.error("Token list API error", {
      error: error instanceof Error ? error.message : String(error),
      endpoint: "/api/tokens",
      responseTime: Date.now() - startTime,
    });

    return errorResponse(
      "Failed to fetch token information",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

export const GET = withRateLimit(handler, {
  name: "token-list",
  ...RATE_LIMIT_TIERS.PUBLIC,
});
