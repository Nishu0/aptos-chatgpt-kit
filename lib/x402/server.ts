/**
 * x402 Payment Protocol Server Implementation for Aptos
 * Based on Coinbase x402 protocol: https://github.com/coinbase/x402
 */

import type {
  PaymentRequiredResponse,
  PaymentRequirements,
  PaymentPayload,
  VerifyRequest,
  VerifyResponse,
  SettleRequest,
  SettleResponse,
} from "./types";
import { X402_VERSION, APTOS_SCHEME } from "./types";

export interface X402ServerConfig {
  network: "mainnet" | "testnet" | "devnet";
  treasuryAddress: string;
  facilitatorUrl: string;
  rpcUrl?: string;
}

/**
 * x402 Payment Handler for Server-Side (Aptos)
 */
export class X402PaymentHandler {
  private config: X402ServerConfig;

  constructor(config: X402ServerConfig) {
    this.config = config;
  }

  /**
   * Extract payment header from request headers
   */
  extractPayment(headers: Record<string, string | undefined>): string | null {
    return headers["x-payment"] || headers["X-PAYMENT"] || null;
  }

  /**
   * Create payment requirements for a resource
   */
  async createPaymentRequirements(options: {
    price: {
      amount: string; // Amount in octas
      coinType?: string; // Coin type (defaults to APT)
    };
    network: "mainnet" | "testnet" | "devnet";
    config: {
      description: string;
      resource: `${string}://${string}`;
      mimeType?: string;
      outputSchema?: any;
      maxTimeoutSeconds?: number;
    };
  }): Promise<PaymentRequirements> {
    const networkMap = {
      mainnet: "aptos-mainnet",
      testnet: "aptos-testnet",
      devnet: "aptos-devnet",
    };

    return {
      scheme: APTOS_SCHEME,
      network: networkMap[options.network],
      maxAmountRequired: options.price.amount,
      resource: options.config.resource,
      description: options.config.description,
      mimeType: options.config.mimeType || "application/json",
      outputSchema: options.config.outputSchema || null,
      payTo: this.config.treasuryAddress,
      maxTimeoutSeconds: options.config.maxTimeoutSeconds || 60,
      extra: null,
    };
  }

  /**
   * Create 402 Payment Required response
   */
  create402Response(paymentRequirements: PaymentRequirements): {
    status: number;
    body: PaymentRequiredResponse;
  } {
    return {
      status: 402,
      body: {
        x402Version: X402_VERSION,
        accepts: [paymentRequirements],
      },
    };
  }

  /**
   * Verify payment with facilitator
   */
  async verifyPayment(
    paymentHeader: string,
    paymentRequirements: PaymentRequirements
  ): Promise<boolean> {
    try {
      const verifyRequest: VerifyRequest = {
        x402Version: X402_VERSION,
        paymentHeader,
        paymentRequirements,
      };

      const response = await fetch(`${this.config.facilitatorUrl}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Connection: "keep-alive",
        },
        body: JSON.stringify(verifyRequest),
      });

      if (!response.ok) {
        console.error(`[x402] Verify failed: ${response.status} ${response.statusText}`);
        return false;
      }

      const verification = (await response.json()) as VerifyResponse;
      return verification.isValid;
    } catch (error) {
      console.error("[x402] Verify error:", error);
      return false;
    }
  }

  /**
   * Settle payment with facilitator
   */
  async settlePayment(
    paymentHeader: string,
    paymentRequirements: PaymentRequirements
  ): Promise<SettleResponse> {
    try {
      const settleRequest: SettleRequest = {
        x402Version: X402_VERSION,
        paymentHeader,
        paymentRequirements,
      };

      const response = await fetch(`${this.config.facilitatorUrl}/settle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Connection: "keep-alive",
        },
        body: JSON.stringify(settleRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Settlement failed: ${response.status} ${errorText}`,
        };
      }

      return (await response.json()) as SettleResponse;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

