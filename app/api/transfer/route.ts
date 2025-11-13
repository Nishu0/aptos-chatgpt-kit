import { NextResponse } from "next/server";
import {
  getAptosClient,
  getWalletAccount,
  externalWallet,
  getExplorerUrl,
  TOKENS,
} from "@/lib/aptos-config";
import { resolveAddressOrDomain, formatAddress } from "@/lib/address-resolver";

const OCTAS_PER_APT = 100_000_000; // 10^8

/**
 * POST /api/transfer
 * Transfer APT or other tokens to a recipient
 *
 * Body:
 * - toAddress: Recipient address or ANS domain
 * - amount: Amount in APT (or token units)
 * - coinType: Optional - coin type to transfer (defaults to APT)
 * - userAddress: Required for external wallet mode
 *
 * Returns: { success, txHash, explorerUrl, from, to, amount }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toAddress, amount, coinType, userAddress } = body;

    console.log("[TRANSFER] Request:", { toAddress, amount, coinType, userAddress });

    // Validate inputs
    if (!toAddress || !amount) {
      return NextResponse.json(
        { error: "toAddress and amount are required" },
        { status: 400 }
      );
    }

    if (externalWallet && !userAddress) {
      return NextResponse.json(
        { error: "userAddress is required when using external wallet" },
        { status: 400 }
      );
    }

    const client = getAptosClient();

    // Resolve destination address (supports ANS domains)
    let destination: string;
    try {
      const resolved = await resolveAddressOrDomain(toAddress, client);
      destination = formatAddress(resolved);
    } catch (e) {
      return NextResponse.json(
        {
          error:
            e instanceof Error
              ? e.message
              : "Invalid destination wallet or domain",
        },
        { status: 400 }
      );
    }

    // Parse amount
    const aptAmount = parseFloat(amount);
    if (!Number.isFinite(aptAmount) || aptAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // Determine coin type
    const transferCoinType = coinType || TOKENS.APT;
    const isAPT = transferCoinType === TOKENS.APT;

    // Convert to octas/base units
    const octas = Math.round(aptAmount * OCTAS_PER_APT);

    // Get sender address
    const fromAddress = externalWallet ? userAddress : formatAddress(getWalletAccount().accountAddress);

    console.log(`[TRANSFER] ${aptAmount} ${isAPT ? "APT" : "tokens"} from ${fromAddress} to ${destination}`);

    // Build transaction payload
    const transaction = {
      function: "0x1::coin::transfer",
      type_arguments: [transferCoinType],
      arguments: [destination, octas.toString()],
    };

    // External wallet mode: Return unsigned transaction
    if (externalWallet) {
      console.log("[TRANSFER] Returning unsigned transaction for client signing");

      return NextResponse.json({
        success: true,
        unsignedTransaction: transaction,
        from: fromAddress,
        to: destination,
        amount: aptAmount,
        octas,
        unit: isAPT ? "APT" : "tokens",
        coinType: transferCoinType,
        timestamp: new Date().toISOString(),
      });
    }

    // Server wallet mode: Sign and submit
    const account = getWalletAccount();

    const pendingTxn = await client.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: transaction.function as `0x${string}::${string}::${string}`,
        typeArguments: transaction.type_arguments as `0x${string}::${string}::${string}`[],
        functionArguments: transaction.arguments,
      },
    });

    // Sign transaction
    const committedTxn = await client.signAndSubmitTransaction({
      signer: account,
      transaction: pendingTxn,
    });

    // Wait for transaction confirmation
    const executedTransaction = await client.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    if (!executedTransaction.success) {
      throw new Error(`Transaction failed: ${executedTransaction.vm_status}`);
    }

    const txHash = committedTxn.hash;
    const explorerUrl = getExplorerUrl(txHash);

    console.log(`[TRANSFER] Success! TxHash: ${txHash}`);

    return NextResponse.json({
      success: true,
      txHash,
      explorerUrl,
      from: fromAddress,
      to: destination,
      amount: aptAmount,
      octas,
      unit: isAPT ? "APT" : "tokens",
      coinType: transferCoinType,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[TRANSFER] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to transfer tokens",
      },
      { status: 500 }
    );
  }
}
