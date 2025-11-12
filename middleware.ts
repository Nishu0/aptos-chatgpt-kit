import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { paymentMiddleware } from "./lib/x402/middleware";
import { isX402Enabled, X402_FEE_CONFIG } from "./lib/x402-config";
import { Network } from "@aptos-labs/ts-sdk";

// CORS middleware
function corsMiddleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    response.headers.set("Access-Control-Allow-Headers", "*");
    return response;
  }
  return NextResponse.next({
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

// x402 payment middleware (only if enabled)
let x402Middleware: ReturnType<typeof paymentMiddleware> | null = null;

if (isX402Enabled()) {
  const treasuryAddress = process.env.X402_TREASURY_ADDRESS!;
  const facilitatorUrl = process.env.FACILITATOR_URL || "https://facilitator.payai.network";
  
  // Get network from environment
  const networkEnv = process.env.APTOS_NETWORK || "mainnet";
  const network = networkEnv === "mainnet" ? "mainnet" : networkEnv === "testnet" ? "testnet" : "devnet";

  const routes: Record<string, any> = {
    "/api/transfer": {
      price: X402_FEE_CONFIG.amount,
      network,
      config: {
        description: X402_FEE_CONFIG.description,
        mimeType: "application/json",
        maxTimeoutSeconds: 300,
      },
    },
  };

  x402Middleware = paymentMiddleware(treasuryAddress, routes, { url: facilitatorUrl });
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Apply x402 middleware for protected routes
  if (x402Middleware && pathname.startsWith("/api/transfer")) {
    return x402Middleware(request);
  }

  // Apply CORS middleware for all other routes
  return corsMiddleware(request);
}

export const config = {
  matcher: "/:path*",
};
