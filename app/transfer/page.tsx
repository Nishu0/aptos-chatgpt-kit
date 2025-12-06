"use client";

import { useEffect, useState } from "react";
import { useWidgetProps } from "../hooks";
import { useMaxHeight } from "../hooks/use-max-height";
import { useOpenAIGlobal } from "../hooks/use-openai-global";
import { ensureWalletConnected, getWalletAddress, signAndSubmitTransaction } from "@/lib/wallet-utils";
import { createX402Client } from "@/lib/x402/client";
import { getAptosClient } from "@/lib/aptos-config";

type TransferWidgetProps = {
  toAddress?: string;
  amount?: string;
};

export default function TransferPage() {
  const toolOutput = useWidgetProps<TransferWidgetProps>();
  const maxHeight = useMaxHeight() ?? undefined;
  const theme = useOpenAIGlobal("theme");

  const [toAddress, setToAddress] = useState(toolOutput?.toAddress || "");
  const [amount, setAmount] = useState(toolOutput?.amount || "0.1");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    txHash: string;
    explorerUrl: string;
  } | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    if (toolOutput?.toAddress) setToAddress(String(toolOutput.toAddress));
    if (toolOutput?.amount) setAmount(String(toolOutput.amount));
  }, [toolOutput?.toAddress, toolOutput?.amount]);

  const handleSend = async () => {
    if (!toAddress || !amount || parseFloat(amount) <= 0) {
      setError("Enter a valid address and positive amount");
      return;
    }

    setIsSending(true);
    setError("");
    setResult(null);

    try {
      // Connect wallet and get address
      const provider = await ensureWalletConnected();
      const address = await getWalletAddress(provider);
      if (!address) {
        throw new Error("Failed to get wallet address");
      }
      const userAddress = address;
      setWalletAddress(address);

      // Get network from environment or default to mainnet
      const networkEnv = process.env.NEXT_PUBLIC_APTOS_NETWORK || "mainnet";
      const network = networkEnv === "mainnet" ? "mainnet" : networkEnv === "testnet" ? "testnet" : "devnet";

      // Create x402 client with connected wallet
      const x402Client = createX402Client({
        wallet: provider,
        network,
      });

      // Use x402 client fetch - automatically handles 402 payment
      const res = await x402Client.fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toAddress, amount, userAddress }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send APT");

      // Sign and send the transaction
      if (data.unsignedTransaction) {
        const client = getAptosClient();
        
        // Build transaction from unsigned transaction payload
        const pendingTxn = await client.transaction.build.simple({
          sender: userAddress,
          data: {
            function: data.unsignedTransaction.function,
            typeArguments: data.unsignedTransaction.type_arguments,
            functionArguments: data.unsignedTransaction.arguments,
          },
        });

        // Sign and submit using wallet
        const txHash = await signAndSubmitTransaction(provider, pendingTxn);
        
        // Wait for confirmation
        await client.waitForTransaction({ transactionHash: txHash });

        const explorerUrl = `https://explorer.aptoslabs.com/txn/${txHash}?network=${network}`;
        setResult({ txHash, explorerUrl });
      } else {
        setResult({ txHash: data.txHash, explorerUrl: data.explorerUrl });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send APT");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      style={{
        maxHeight,
        overflow: "auto",
        padding: 16,
        background: theme === "dark" ? "#0B0B0C" : "#fff",
        color: theme === "dark" ? "#fff" : "#111",
        borderRadius: 12,
        border: theme === "dark" ? "1px solid #222" : "1px solid #eee",
      }}
    >
      <h2 style={{ margin: 0, marginBottom: 12 }}>Send APT</h2>

      <div style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Destination (Address or ANS Domain)</span>
          <input
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="0x... or user.apt"
            style={{
              padding: 10,
              borderRadius: 8,
              border: theme === "dark" ? "1px solid #333" : "1px solid #ddd",
              background: theme === "dark" ? "#0F0F10" : "#fafafa",
              color: "inherit",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Amount (APT)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.1"
            style={{
              padding: 10,
              borderRadius: 8,
              border: theme === "dark" ? "1px solid #333" : "1px solid #ddd",
              background: theme === "dark" ? "#0F0F10" : "#fafafa",
              color: "inherit",
            }}
          />
        </label>

        {error ? (
          <div style={{ color: "#e5484d", fontSize: 14 }}>{error}</div>
        ) : null}

        {result ? (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: theme === "dark" ? "#0F1612" : "#eefcf3",
              border: theme === "dark" ? "1px solid #193b2d" : "1px solid #c7f0d9",
              fontSize: 14,
            }}
          >
            <div style={{ marginBottom: 6 }}>Transfer sent successfully.</div>
            <a
              href={result.explorerUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#16a34a" }}
            >
              View on Aptos Explorer
            </a>
            <div style={{ marginTop: 6, fontSize: 12, fontFamily: "monospace", wordBreak: "break-all" }}>
              {result.txHash}
            </div>
          </div>
        ) : null}

        {walletAddress ? (
          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              textAlign: "center",
              wordBreak: "break-all",
            }}
          >
            Connected: {walletAddress}
          </div>
        ) : null}

        <button
          disabled={isSending}
          onClick={handleSend}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "none",
            background: isSending ? "#6b7280" : "#2563eb",
            color: "#fff",
            cursor: isSending ? "not-allowed" : "pointer",
          }}
        >
          {isSending ? "Sending..." : "Confirm & Send"}
        </button>
      </div>
    </div>
  );
}
