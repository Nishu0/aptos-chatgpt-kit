/**
 * x402 Payment Protocol Client Implementation for Aptos
 * Handles client-side payment creation and submission
 */

import type { PaymentPayload, PaymentRequirements } from "./types";
import { X402_VERSION, APTOS_SCHEME } from "./types";
import { getAptosClient, TOKENS } from "../aptos-config";
import type { AptosProvider } from "../wallet-utils";

export interface X402ClientConfig {
  wallet: AptosProvider;
  network: "mainnet" | "testnet" | "devnet";
  rpcUrl?: string;
}

/**
 * x402 Payment Client for Client-Side (Aptos)
 */
export class X402PaymentClient {
  private config: X402ClientConfig;

  constructor(config: X402ClientConfig) {
    this.config = config;
  }

  /**
   * Create payment transaction based on requirements
   */
  async createPaymentTransaction(
    requirements: PaymentRequirements
  ): Promise<{ transaction: PaymentPayload; signature: string }> {
    const client = getAptosClient();
    const wallet = this.config.wallet;

    // Get wallet address
    const account = typeof wallet.account === "function" 
      ? await wallet.account() 
      : wallet.account;
    
    if (!account?.address) {
      throw new Error("Wallet not connected");
    }

    const fromAddress = account.address;
    const toAddress = requirements.payTo;
    const amount = BigInt(requirements.maxAmountRequired);

    // Determine coin type (default to APT)
    const coinType = (requirements.extra?.coinType || TOKENS.APT) as `0x${string}::${string}::${string}`;

    console.log(`[x402 Client] Creating payment: ${amount} (${coinType}) from ${fromAddress} to ${toAddress}`);

    // Build transfer transaction payload
    const transactionPayload = {
      function: "0x1::coin::transfer" as const,
      type_arguments: [coinType],
      arguments: [toAddress, amount.toString()],
    };

    // Build transaction using Aptos SDK
    const pendingTxn = await client.transaction.build.simple({
      sender: fromAddress,
      data: {
        function: transactionPayload.function,
        typeArguments: transactionPayload.type_arguments,
        functionArguments: transactionPayload.arguments,
      },
    });

    // Sign and submit using wallet
    if (!wallet.signAndSubmitTransaction || typeof wallet.signAndSubmitTransaction !== "function") {
      throw new Error("Wallet does not support transaction signing");
    }

    const result = await wallet.signAndSubmitTransaction(pendingTxn);
    const txHash = typeof result === "string" ? result : (result as { hash: string }).hash;

    if (!txHash) {
      throw new Error("Failed to get transaction hash");
    }

    // Wait for confirmation
    await client.waitForTransaction({ transactionHash: txHash });

    // Serialize transaction for payment payload (use raw transaction object)
    const serializedTxn = JSON.stringify(pendingTxn);

    // Convert to base64 (browser-compatible)
    const base64Txn = typeof window !== "undefined" 
      ? btoa(serializedTxn)
      : Buffer.from(serializedTxn).toString("base64");

    // Create payment payload
    const paymentPayload: PaymentPayload = {
      x402Version: X402_VERSION,
      scheme: APTOS_SCHEME,
      network: requirements.network,
      payload: {
        transaction: base64Txn,
        signature: txHash,
      },
    };

    return {
      transaction: paymentPayload,
      signature: txHash,
    };
  }

  /**
   * Fetch with automatic x402 payment handling
   */
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    // First attempt - may get 402
    let response = await fetch(url, options);

    // If 402 Payment Required, handle payment
    if (response.status === 402) {
      const paymentRequired = (await response.json()) as {
        x402Version: string;
        accepts: PaymentRequirements[];
      };

      if (!paymentRequired.accepts || paymentRequired.accepts.length === 0) {
        throw new Error("No payment requirements provided");
      }

      // Use first payment requirement
      const requirements = paymentRequired.accepts[0];

      console.log(`[x402 Client] Payment required: ${requirements.description}`);
      console.log(`[x402 Client] Amount: ${requirements.maxAmountRequired} octas`);

      // Create and submit payment
      const { transaction } = await this.createPaymentTransaction(requirements);

      // Create payment header
      const paymentHeader = JSON.stringify(transaction);

      // Retry request with payment header
      const headers = new Headers(options.headers);
      headers.set("X-PAYMENT", paymentHeader);

      response = await fetch(url, {
        ...options,
        headers,
      });
    }

    return response;
  }
}

/**
 * Create x402 client instance
 */
export function createX402Client(config: X402ClientConfig): X402PaymentClient {
  return new X402PaymentClient(config);
}

