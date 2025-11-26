import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const getAppsSdkCompatibleHtml = async (baseUrl: string, path: string) => {
  const result = await fetch(`${baseUrl}${path}`);
  return await result.text();
};

type ContentWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  description: string;
  widgetDomain: string;
};

function widgetMeta(widget: ContentWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": false,
    "openai/resultCanProduceWidget": true,
  } as const;
}

const handler = createMcpHandler(async (server) => {
  // Fetch HTML for each widget page
  const html = await getAppsSdkCompatibleHtml(baseURL, "/");
  const transferHtml = await getAppsSdkCompatibleHtml(baseURL, "/transfer");
  const swapHtml = await getAppsSdkCompatibleHtml(baseURL, "/swap");
  const stakeHtml = await getAppsSdkCompatibleHtml(baseURL, "/stake");

  // Define widgets
  const contentWidget: ContentWidget = {
    id: "show_content",
    title: "Show Content",
    templateUri: "ui://widget/content-template.html",
    invoking: "Loading content...",
    invoked: "Content loaded",
    html: html,
    description: "Displays the Aptos ChatGPT Kit homepage",
    widgetDomain: "https://aptoslabs.com",
  };

  const transferWidget: ContentWidget = {
    id: "send_apt",
    title: "Send APT",
    templateUri: "ui://widget/transfer-template.html",
    invoking: "Preparing transfer interface...",
    invoked: "Transfer interface ready",
    html: transferHtml,
    description: "Send APT to a wallet address or ANS domain (.apt) with confirmation",
    widgetDomain: "https://aptoslabs.com",
  };

  const swapWidget: ContentWidget = {
    id: "swap_tokens",
    title: "Swap Tokens",
    templateUri: "ui://widget/swap-template.html",
    invoking: "Loading swap interface...",
    invoked: "Swap interface ready",
    html: swapHtml,
    description: "Swap tokens on Aptos using Liquidswap",
    widgetDomain: "https://liquidswap.com",
  };

  const stakeWidget: ContentWidget = {
    id: "stake_apt",
    title: "Stake APT",
    templateUri: "ui://widget/stake-template.html",
    invoking: "Loading staking interface...",
    invoked: "Staking interface ready",
    html: stakeHtml,
    description: "Stake APT to validators via delegation pools",
    widgetDomain: "https://aptoslabs.com",
  };

  // Register Resources (Widgets)

  // Homepage widget
  server.registerResource(
    "content-widget",
    contentWidget.templateUri,
    {
      title: contentWidget.title,
      description: contentWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": contentWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${contentWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": contentWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": contentWidget.widgetDomain,
          },
        },
      ],
    })
  );

  // Transfer widget
  server.registerResource(
    "transfer-widget",
    transferWidget.templateUri,
    {
      title: transferWidget.title,
      description: transferWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": transferWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${transferWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": transferWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": transferWidget.widgetDomain,
          },
        },
      ],
    })
  );

  // Swap widget
  server.registerResource(
    "swap-widget",
    swapWidget.templateUri,
    {
      title: swapWidget.title,
      description: swapWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": swapWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${swapWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": swapWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": swapWidget.widgetDomain,
          },
        },
      ],
    })
  );

  // Stake widget
  server.registerResource(
    "stake-widget",
    stakeWidget.templateUri,
    {
      title: stakeWidget.title,
      description: stakeWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": stakeWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${stakeWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": stakeWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": stakeWidget.widgetDomain,
          },
        },
      ],
    })
  );

  // Register Tools

  // Homepage tool
  server.registerTool(
    contentWidget.id,
    {
      title: contentWidget.title,
      description: "Display the Aptos ChatGPT Kit homepage with user name",
      inputSchema: {
        name: z.string().describe("The name of the user to display"),
      } as any,
      _meta: widgetMeta(contentWidget),
    },
    async (args: { [x: string]: any }, extra: any) => {
      const { name } = args as { name: string };
      return {
        content: [
          {
            type: "text" as const,
            text: `Welcome to Aptos ChatGPT Kit, ${name}!`,
          },
        ],
        structuredContent: {
          name,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(contentWidget),
      };
    }
  );

  // Transfer APT tool
  server.registerTool(
    transferWidget.id,
    {
      title: transferWidget.title,
      description:
        "Send APT to a wallet address or ANS domain (.apt) with explicit confirmation",
      inputSchema: {
        toAddress: z.string().describe("Destination address or ANS domain (e.g., user.apt)"),
        amount: z.string().describe("Amount of APT to send (e.g., '0.1')"),
      } as any,
      _meta: widgetMeta(transferWidget),
    },
    async (args: { [x: string]: any }, extra: any) => {
      const { toAddress, amount } = args as { toAddress: string; amount: string };
      return {
        content: [
          {
            type: "text" as const,
            text: `Prepare to send ${amount} APT to ${toAddress}`,
          },
        ],
        structuredContent: {
          toAddress,
          amount,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(transferWidget),
      };
    }
  );

  // Check balance tool
  server.registerTool(
    "check_balance",
    {
      title: "Check Balance",
      description:
        "Fetch APT and token balances for a wallet address or ANS domain (.apt)",
      inputSchema: {
        account: z.string().describe("Aptos address or ANS domain (e.g., user.apt)"),
      } as any,
      _meta: {
        "openai/resultCanProduceWidget": false,
      },
    },
    async (args: { [x: string]: any }, extra: any) => {
      const { account } = args as { account: string };
      const res = await fetch(
        `${baseURL}/api/wallet/balance?account=${encodeURIComponent(account)}`
      );
      const data = await res.json();

      if (!res.ok) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${data?.error || "Failed to fetch balance"}`,
            },
          ],
        };
      }

      const tokenSummary = data.tokens && data.tokens.length > 0
        ? `\nOther tokens: ${data.tokens.map((t: any) => `${t.balanceFormatted} ${t.symbol}`).join(", ")}`
        : "";

      return {
        content: [
          {
            type: "text" as const,
            text: `Balance: ${data.apt} APT (${data.octas} octas)${tokenSummary}\nAddress: ${data.resolvedAddress}`,
          },
        ],
        structuredContent: data,
      };
    }
  );

  // Token price tool
  server.registerTool(
    "token_price",
    {
      title: "Token Price",
      description:
        "Fetch token price by symbol (APT, USDC, USDT) or coin type",
      inputSchema: {
        tokenId: z.string().describe("Token symbol (e.g., APT) or coin type"),
      } as any,
      _meta: {
        "openai/resultCanProduceWidget": false,
      },
    },
    async (args: { [x: string]: any }, extra: any) => {
      const { tokenId } = args as { tokenId: string };
      const params = new URLSearchParams({ tokenId: String(tokenId) });
      const res = await fetch(`${baseURL}/api/price?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${data?.error || "Failed to fetch price"}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Price: $${data.priceFormatted} USD (${data.symbol})`,
          },
        ],
        structuredContent: data,
      };
    }
  );

  // Swap tokens tool
  server.registerTool(
    swapWidget.id,
    {
      title: swapWidget.title,
      description:
        "Swap tokens on Aptos using Liquidswap DEX",
      inputSchema: {
        amount: z.string().optional().describe("Amount to swap (e.g., '0.1')"),
        inputToken: z.string().optional().describe("Input token symbol (e.g., APT)"),
        outputToken: z.string().optional().describe("Output token symbol (e.g., USDC)"),
      } as any,
      _meta: widgetMeta(swapWidget),
    },
    async (args: { [x: string]: any }, extra: any) => {
      const { amount, inputToken, outputToken } = args as { amount?: string; inputToken?: string; outputToken?: string };
      const finalAmount = amount || "0.1";
      const finalInput = inputToken || "APT";
      const finalOutput = outputToken || "USDC";

      return {
        content: [
          {
            type: "text" as const,
            text: `Preparing to swap ${finalAmount} ${finalInput} to ${finalOutput}`,
          },
        ],
        structuredContent: {
          initialAmount: finalAmount,
          inputToken: finalInput,
          outputToken: finalOutput,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(swapWidget),
      };
    }
  );

  // Stake APT tool
  server.registerTool(
    stakeWidget.id,
    {
      title: stakeWidget.title,
      description:
        "Stake APT to validators via delegation pools",
      inputSchema: {
        amount: z.string().describe("Amount of APT to stake (e.g., '1.0')"),
      } as any,
      _meta: widgetMeta(stakeWidget),
    },
    async (args: { [x: string]: any }, extra: any) => {
      const { amount } = args as { amount: string };
      return {
        content: [
          {
            type: "text" as const,
            text: `Prepare to stake ${amount} APT`,
          },
        ],
        structuredContent: {
          initialAmount: amount,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(stakeWidget),
      };
    }
  );
});

export const GET = handler;
export const POST = handler;
