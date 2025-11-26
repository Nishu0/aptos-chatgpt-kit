/**
 * Wallet utility functions for external wallet integration (Petra, Martian, etc.)
 */

export interface AptosProvider {
  isPetra?: boolean;
  isMartian?: boolean;
  isConnected?: boolean;
  account?: () => Promise<{ address: string; publicKey: string }> | { address: string; publicKey: string };
  connect?: () => Promise<{ address: string; publicKey: string }>;
  disconnect?: () => Promise<void>;
  signAndSubmitTransaction?: (transaction: any) => Promise<{ hash: string } | string>;
  signTransaction?: (transaction: any) => Promise<Uint8Array>;
  network?: () => Promise<{ name: string; chainId: string }>;
}

/**
 * Get Aptos wallet provider from window, parent, or top
 * Supports Petra, Martian, and other Aptos Wallet Standard wallets
 */
export function getProvider(): AptosProvider | null {
  if (typeof window === "undefined") return null;

  // Type definition for window with Aptos wallets
  const w = window as any;

  // Try window.aptos (Petra wallet)
  if (w?.aptos?.isPetra) return w.aptos;
  if (w?.aptos) return w.aptos;

  // Try window.martian (Martian wallet)
  if (w?.martian) return w.martian;

  // Try parent window if in iframe (same-origin only)
  try {
    if (window.parent && window.parent !== window) {
      const p = window.parent as any;
      if (p?.aptos?.isPetra) return p.aptos;
      if (p?.aptos) return p.aptos;
      if (p?.martian) return p.martian;
    }
  } catch {
    // Cross-origin access blocked, continue
  }

  // Try top window if in nested iframe (same-origin only)
  try {
    if (window.top && window.top !== window) {
      const t = window.top as any;
      if (t?.aptos?.isPetra) return t.aptos;
      if (t?.aptos) return t.aptos;
      if (t?.martian) return t.martian;
    }
  } catch {
    // Cross-origin access blocked, continue
  }

  return null;
}

/**
 * Ensure wallet is connected and return the provider
 */
export async function ensureWalletConnected(): Promise<AptosProvider> {
  const provider = getProvider();
  if (!provider) {
    throw new Error(
      "No Aptos wallet found. Please install Petra, Martian, or another Aptos wallet."
    );
  }

  try {
    // Check if already connected
    if (provider.isConnected || (provider.account && typeof provider.account === "function")) {
      try {
        const account = typeof provider.account === "function"
          ? await provider.account()
          : provider.account;
        if (account?.address) {
          return provider;
        }
      } catch {
        // Not connected, need to connect
      }
    }

    // Connect if not connected
    if (provider.connect && typeof provider.connect === "function") {
      await provider.connect();
      return provider;
    }

    throw new Error("Wallet does not support connection");
  } catch (e) {
    throw new Error(`Wallet connection failed: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
}

/**
 * Get the connected wallet's address
 */
export async function getWalletAddress(provider: AptosProvider): Promise<string | null> {
  try {
    if (provider.account && typeof provider.account === "function") {
      const account = await provider.account();
      return account?.address ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get the current network from the wallet
 */
export async function getWalletNetwork(provider: AptosProvider): Promise<string | null> {
  try {
    if (provider.network && typeof provider.network === "function") {
      const network = await provider.network();
      return network?.name ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Sign and submit a transaction using the external wallet
 *
 * @param provider - Aptos wallet provider
 * @param transaction - Transaction payload to sign and submit
 * @returns Transaction hash
 */
export async function signAndSubmitTransaction(
  provider: AptosProvider,
  transaction: any
): Promise<string> {
  if (!provider.signAndSubmitTransaction || typeof provider.signAndSubmitTransaction !== "function") {
    throw new Error("Wallet does not support transaction signing");
  }

  try {
    const result = await provider.signAndSubmitTransaction(transaction);

    // Handle different return formats
    if (typeof result === "string") {
      return result;
    }

    if (typeof result === "object" && result !== null) {
      // Check for hash property
      if ("hash" in result && typeof result.hash === "string") {
        return result.hash;
      }

      // Check for signature property (some wallets might use this)
      if ("signature" in result && typeof (result as any).signature === "string") {
        return (result as any).signature;
      }
    }

    throw new Error("Invalid transaction result format");
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Transaction signing failed: ${error.message}`);
    }
    throw new Error("Transaction signing failed: Unknown error");
  }
}

/**
 * Check if a wallet is installed
 */
export function isWalletInstalled(): boolean {
  const provider = getProvider();
  return provider !== null;
}

/**
 * Get the wallet name
 */
export function getWalletName(provider: AptosProvider): string {
  if (provider.isPetra) return "Petra";
  if (provider.isMartian) return "Martian";
  return "Unknown Wallet";
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet(provider: AptosProvider): Promise<void> {
  if (provider.disconnect && typeof provider.disconnect === "function") {
    await provider.disconnect();
  }
}
