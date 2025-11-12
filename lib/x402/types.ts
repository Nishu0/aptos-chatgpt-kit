/**
 * x402 Payment Protocol Types for Aptos
 * Based on Coinbase x402 protocol: https://github.com/coinbase/x402
 */

export const X402_VERSION = "1.0.0";
export const APTOS_SCHEME = "aptos";
export const APTOS_TESTNET = "aptos-testnet";
export const APTOS_MAINNET = "aptos-mainnet";

/**
 * Payment Requirements - defines what payment is needed
 */
export interface PaymentRequirements {
  scheme: string; // "aptos"
  network: string; // "aptos-mainnet" or "aptos-testnet"
  maxAmountRequired: string; // Amount in octas (base units)
  resource: string; // URL of the resource being accessed
  description: string; // Human-readable description
  mimeType: string; // MIME type of the resource
  outputSchema: any | null; // JSON schema of expected output
  payTo: string; // Aptos address to receive payment
  maxTimeoutSeconds: number; // Maximum time to wait for payment
  extra: any | null; // Additional metadata
}

/**
 * Payment Required Response (402 status)
 */
export interface PaymentRequiredResponse {
  x402Version: string;
  accepts: PaymentRequirements[];
}

/**
 * Payment Payload - contains the actual payment proof
 */
export interface PaymentPayload {
  x402Version: string;
  scheme: string;
  network: string;
  payload: {
    transaction: string; // Base64 encoded transaction
    signature: string; // Transaction signature
  };
}

/**
 * Verify Request - sent to facilitator
 */
export interface VerifyRequest {
  x402Version: string;
  paymentHeader: string; // JSON stringified PaymentPayload
  paymentRequirements: PaymentRequirements;
}

/**
 * Verify Response - from facilitator
 */
export interface VerifyResponse {
  isValid: boolean;
  invalidReason?: string;
}

/**
 * Settle Request - sent to facilitator
 */
export interface SettleRequest {
  x402Version: string;
  paymentHeader: string;
  paymentRequirements: PaymentRequirements;
}

/**
 * Settle Response - from facilitator
 */
export interface SettleResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Route Configuration for middleware
 */
export interface RouteConfig {
  price: string; // Amount in octas
  network: "mainnet" | "testnet" | "devnet";
  config?: {
    description?: string;
    mimeType?: string;
    outputSchema?: any;
    maxTimeoutSeconds?: number;
  };
}

/**
 * Facilitator Configuration
 */
export interface FacilitatorConfig {
  url: string;
}

