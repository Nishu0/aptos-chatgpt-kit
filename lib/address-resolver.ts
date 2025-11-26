import { Aptos, AccountAddress } from "@aptos-labs/ts-sdk";
import { getAptosClient } from "./aptos-config";

function normalizeInput(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Validates if a string is a valid Aptos address
 */
export function isValidAptosAddress(address: string): boolean {
  try {
    // Try to create AccountAddress - will throw if invalid
    AccountAddress.from(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves an Aptos address or ANS domain to an AccountAddress
 * Supports:
 * 1. Standard Aptos addresses (0x...)
 * 2. ANS domains (.apt)
 */
export async function resolveAddressOrDomain(
  input: string,
  client?: Aptos
): Promise<AccountAddress> {
  const raw = input.trim();
  const normalized = normalizeInput(raw);

  // 1) Try as direct Aptos address first
  try {
    const address = AccountAddress.from(raw);
    // Verify the account exists on-chain (optional but recommended)
    return address;
  } catch {}

  // 2) If it contains a dot, try ANS resolution
  if (normalized.includes(".")) {
    const aptosClient = client || getAptosClient();

    // Check if it's a .apt domain
    if (normalized.endsWith(".apt")) {
      try {
        const address = await resolveANSDomain(normalized, aptosClient);
        return address;
      } catch (error) {
        throw new Error(`Failed to resolve ANS domain: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    throw new Error("Unsupported domain format. Only .apt domains are supported.");
  }

  throw new Error("Invalid address format. Must be a valid Aptos address (0x...) or .apt domain");
}

/**
 * Resolves an ANS (.apt) domain to an Aptos address
 * ANS Router address: 0x867ed1f6bf916171b1de3ee92849b8978b7d1b9e0a8cc982a3d19d535dfd9c0c
 */
async function resolveANSDomain(
  domain: string,
  client: Aptos
): Promise<AccountAddress> {
  // ANS Router module address
  const ANS_ROUTER = "0x867ed1f6bf916171b1de3ee92849b8978b7d1b9e0a8cc982a3d19d535dfd9c0c";

  try {
    // Remove .apt suffix for lookup
    const domainName = domain.replace(/\.apt$/i, "");

    // Query ANS router to get the primary name record
    // The view function returns the address associated with the domain
    const result = await client.view({
      payload: {
        function: `${ANS_ROUTER}::router::get_address`,
        typeArguments: [],
        functionArguments: [domainName, "apt"], // domain name and subdomain
      },
    });

    // result[0] should contain the address
    if (result && result[0]) {
      const addressStr = result[0] as string;
      return AccountAddress.from(addressStr);
    }

    throw new Error("Domain not found or not registered");
  } catch (error) {
    console.error("ANS resolution error:", error);
    throw new Error(`Failed to resolve ANS domain "${domain}": ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Format an Aptos address to standard form (0x...)
 */
export function formatAddress(address: AccountAddress | string): string {
  if (typeof address === "string") {
    return address;
  }
  return address.toString();
}

/**
 * Shorten an address for display (0x1234...5678)
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 2) {
    return address;
  }
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
