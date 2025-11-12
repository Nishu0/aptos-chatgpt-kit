/**
 * x402 Payment Protocol Configuration for Aptos
 */

import { X402PaymentHandler } from "./x402/server";
import { TOKENS } from "./aptos-config";

/**
 * Initialize x402 Payment Handler for Aptos
 */
export function getX402Handler(): X402PaymentHandler {
  const treasuryAddress = process.env.X402_TREASURY_ADDRESS;
  const facilitatorUrl = process.env.FACILITATOR_URL || "https://facilitator.payai.network";
  const network = (process.env.APTOS_NETWORK || "mainnet") as "mainnet" | "testnet" | "devnet";
  const rpcUrl = process.env.APTOS_RPC_URL;

  if (!treasuryAddress) {
    throw new Error("X402_TREASURY_ADDRESS not found in environment variables");
  }

  console.log(`🔧 x402 Config: treasury=${treasuryAddress}, facilitator=${facilitatorUrl}, network=${network}`);

  const handler = new X402PaymentHandler({
    network,
    treasuryAddress,
    facilitatorUrl,
    rpcUrl,
  });

  console.log("✅ x402 Payment Handler created (Aptos)");
  return handler;
}

/**
 * Payment configuration constants for Aptos
 */
export const X402_FEE_CONFIG = {
  amount: "100000", // 0.001 APT in octas (8 decimals: 0.001 * 10^8)
  coinType: TOKENS.APT,
  network: "mainnet" as const,
  description: "API Transfer Fee - 0.001 APT",
} as const;

/**
 * Check if x402 payments are enabled
 */
export function isX402Enabled(): boolean {
  return !!process.env.X402_TREASURY_ADDRESS;
}
