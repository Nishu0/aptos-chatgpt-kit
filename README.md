# Aptos ChatGPT Kit

A fully functional ChatGPT integration for Aptos blockchain operations with x402 payment protocol support.

## Features

- ✅ **Send APT** - Transfer APT to addresses or ANS domains with x402 payment protection
- ✅ **Check Balance** - Query APT and token balances
- 🔄 **Swap Tokens** - Trade on Liquidswap (coming soon)
- 🔄 **Stake APT** - Stake to validators (coming soon)
- ✅ **Token Prices** - Real-time USD prices

## x402 Payment Protocol

This application implements the [x402 payment protocol](https://github.com/coinbase/x402) for API monetization. When using external wallet mode, each transfer requires a small APT payment fee (0.001 APT) before execution.

**How it works:**
1. User initiates transfer with browser wallet connected (Petra/Martian)
2. Client calls `/api/transfer` → Server returns 402 Payment Required
3. **Client automatically creates payment transaction** (0.001 APT to treasury)
4. **User signs payment with their wallet** (first transaction - APT payment)
5. Client retries request with `X-PAYMENT` header containing proof
6. Server verifies payment with facilitator
7. Server returns unsigned transfer transaction
8. **User signs transfer with their wallet** (second transaction - APT transfer)
9. Transfer executes successfully

## Setup

### Prerequisites

- Node.js 18+ and npm/pnpm
- Aptos wallet (Petra or Martian) for external wallet mode
- Environment variables configured

### Installation

```bash
# Install dependencies
npm install
# or
pnpm install
```

### Environment Variables

Create a `.env.local` file:

```bash
# Aptos Configuration
APTOS_NETWORK=mainnet  # or testnet/devnet
APTOS_RPC_URL=https://fullnode.mainnet.aptoslabs.com/v1  # Optional, uses default if not set

# x402 Payment Protocol
X402_TREASURY_ADDRESS=0x...  # Your Aptos address to receive payments
FACILITATOR_URL=https://facilitator.payai.network  # x402 facilitator URL
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Testing in ChatGPT

### Prerequisites

1. Deploy your app to a public URL (Vercel, Railway, etc.)
2. Ensure environment variables are set in your deployment
3. Have ChatGPT Apps SDK access (or use OpenAI's ChatGPT interface)

### Step 1: Configure MCP Server

1. In ChatGPT, go to Settings → Model Context Protocol
2. Add a new MCP server with:
   - **Name**: Aptos ChatGPT Kit
   - **URL**: `https://your-deployment-url.com/mcp`
   - **Protocol**: HTTP

### Step 2: Test Transfer Feature

#### Example 1: Simple Transfer

```
Send 0.1 APT to 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

**What happens:**
1. ChatGPT calls `send_apt` tool with your parameters
2. Transfer widget opens in ChatGPT
3. You connect your wallet (Petra/Martian)
4. x402 payment is automatically handled (0.001 APT fee)
5. You sign the payment transaction
6. You sign the transfer transaction
7. Transfer completes successfully

#### Example 2: Transfer to ANS Domain

```
Send 0.5 APT to alice.apt
```

The system automatically resolves the ANS domain to an address.

#### Example 3: Check Balance

```
What's my balance?
```

or

```
Check balance for 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Step 3: Test Token Price

```
What's the price of APT?
```

or

```
Get price for USDC
```

### Step 4: Verify Transactions

After each transfer, you'll receive:
- Transaction hash
- Explorer link to view the transaction
- Confirmation status

## Architecture

### x402 Implementation

The x402 payment protocol is fully implemented from scratch for Aptos:

- **`lib/x402/types.ts`** - TypeScript types for x402 protocol
- **`lib/x402/server.ts`** - Server-side payment handler
- **`lib/x402/client.ts`** - Client-side payment handler
- **`lib/x402/middleware.ts`** - Next.js middleware for payment verification
- **`lib/x402-config.ts`** - Configuration and initialization

### API Routes

- **`/api/transfer`** - Transfer APT (protected by x402 middleware)
- **`/api/wallet/balance`** - Check balances
- **`/api/price`** - Get token prices
- **`/api/swap/quote`** - Get swap quotes (coming soon)
- **`/api/swap/execute`** - Execute swaps (coming soon)
- **`/api/stake`** - Stake APT (coming soon)

### MCP Server

The MCP server (`/mcp`) exposes tools to ChatGPT:
- `send_apt` - Send APT with confirmation widget
- `check_balance` - Check wallet balances
- `token_price` - Get token prices

## Wallet Integration

This MCP server uses external wallet mode exclusively. Users connect their own wallets (Petra, Martian) to sign transactions client-side. This is the only supported mode for ChatGPT MCP connectors since wallet private keys cannot be stored in the MCP server.

## Troubleshooting

### Wallet Not Connecting

- Ensure Petra or Martian wallet is installed
- Check browser console for errors
- Verify wallet is on the correct network (mainnet/testnet)

### x402 Payment Failing

- Check `X402_TREASURY_ADDRESS` is set correctly
- Verify `FACILITATOR_URL` is accessible
- Ensure wallet has sufficient APT for payment fee (0.001 APT)

### Transaction Failing

- Verify recipient address is valid
- Check sufficient balance for transfer + fees
- Ensure network matches (mainnet/testnet)

## Development Notes

### x402 Payment Flow

1. **Client Request** → API endpoint
2. **Middleware** → Checks for `X-PAYMENT` header
3. **No Payment** → Returns 402 with payment requirements
4. **Client** → Creates payment transaction, signs, submits
5. **Client Retry** → Includes `X-PAYMENT` header with proof
6. **Middleware** → Verifies payment with facilitator
7. **Middleware** → Settles payment
8. **API Route** → Processes request and returns result

### Adding New Protected Routes

To protect a new route with x402:

1. Add route configuration in `middleware.ts`:

```typescript
const routes: Record<string, any> = {
  "/api/transfer": { ... },
  "/api/your-new-route": {
    price: "100000", // 0.001 APT in octas
    network: "mainnet",
    config: {
      description: "Your route description",
      mimeType: "application/json",
      maxTimeoutSeconds: 300,
    },
  },
};
```

2. Update middleware matcher if needed

## License

MIT

## Contributing

Contributions welcome! Please ensure:
- Code follows TypeScript best practices
- x402 protocol compliance maintained
- Tests pass (when available)
- Documentation updated
