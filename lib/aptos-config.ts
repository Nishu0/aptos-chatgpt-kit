import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// token coin types (move resource addresses)
export const TOKENS = {
  APT: "0x1::aptos_coin::AptosCoin",
  USDC: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC", // LayerZero USDC
  USDT: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT", // LayerZero USDT
  WETH: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH", // LayerZero WETH
} as const;

export const TOKEN_DECIMALS = {
  APT: 8,
  USDC: 6,
  USDT: 6,
  WETH: 8,
} as const;

//liquidswap (pontem network) configuration
export const LIQUIDSWAP = {
  // Liquidswap router and pool addresses
  SCRIPTS_V05: "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12",
  RESOURCE_ACCOUNT: "0x05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948",
  CURVES: {
    UNCORRELATED: "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated",
    STABLE: "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Stable",
  }
} as const;

// aptos Staking configuration
export const STAKING = {
  // delegation pool module
  DELEGATION_POOL: "0x1::delegation_pool",
  MIN_STAKE: 11_000_000, // 0.11 APT in octas
} as const;

// Get network from environment
export function getAptosNetwork(): Network {
  const network = process.env.APTOS_NETWORK || "mainnet";

  switch (network.toLowerCase()) {
    case "mainnet":
      return Network.MAINNET;
    case "testnet":
      return Network.TESTNET;
    case "devnet":
      return Network.DEVNET;
    default:
      return Network.MAINNET;
  }
}

// Initialize Aptos client
export function getAptosClient(): Aptos {
  const network = getAptosNetwork();
  const config = new AptosConfig({
    network,
    fullnode: process.env.APTOS_RPC_URL,
  });

  return new Aptos(config);
}



// Liquidswap API endpoints (if available)
// Note: Liquidswap doesn't have a centralized quote API like Jupiter
// Quotes are calculated on-chain or via SDK
export const LIQUIDSWAP_API = {
  // For now, we'll calculate quotes directly via on-chain calls
  // Future: Add aggregator API endpoints if available
  ROUTER: "https://api.liquidswap.com/v1", // Placeholder
} as const;

// Optional referral settings
export const LIQUIDSWAP_REFERRAL_ADDRESS = "";
export const LIQUIDSWAP_REFERRAL_FEE = 0;

// Explorer URLs
export const EXPLORER_URL = {
  [Network.MAINNET]: "https://explorer.aptoslabs.com",
  [Network.TESTNET]: "https://explorer.aptoslabs.com/testnet",
  [Network.DEVNET]: "https://explorer.aptoslabs.com/devnet",
} as const;

export function getExplorerUrl(txHash: string): string {
  const network = getAptosNetwork();
  let baseUrl: string;
  if (network === Network.MAINNET) {
    baseUrl = EXPLORER_URL[Network.MAINNET];
  } else if (network === Network.TESTNET) {
    baseUrl = EXPLORER_URL[Network.TESTNET];
  } else if (network === Network.DEVNET) {
    baseUrl = EXPLORER_URL[Network.DEVNET];
  } else {
    baseUrl = EXPLORER_URL[Network.MAINNET];
  }
  return `${baseUrl}/txn/${txHash}?network=${network}`;
}
