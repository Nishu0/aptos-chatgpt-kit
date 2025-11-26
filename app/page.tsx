"use client";

import Link from "next/link";
import {
  useWidgetProps,
  useMaxHeight,
  useDisplayMode,
  useRequestDisplayMode,
  useIsChatGptApp,
} from "./hooks";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function Home() {
  const toolOutput = useWidgetProps<{
    name?: string;
    result?: { structuredContent?: { name?: string } };
  }>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();
  const requestDisplayMode = useRequestDisplayMode();
  const isChatGptApp = useIsChatGptApp();

  const name = toolOutput?.result?.structuredContent?.name || toolOutput?.name || "Guest";

  return (
    <div
      className="font-sans p-6 sm:p-8"
      style={{
        maxHeight,
        height: displayMode === "fullscreen" ? maxHeight : undefined,
        overflow: "auto",
      }}
    >
      {displayMode !== "fullscreen" && (
        <button
          aria-label="Enter fullscreen"
          className="fixed top-4 right-4 z-50 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-lg ring-1 ring-slate-900/10 dark:ring-white/10 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          onClick={() => requestDisplayMode("fullscreen")}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        </button>
      )}

      <main className="max-w-4xl mx-auto space-y-6">
        {!isChatGptApp && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                This app requires ChatGPT integration. No window.openai detected.
              </p>
            </div>
          </div>
        )}

        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Aptos ChatGPT Kit</h1>
          <p className="text-lg text-muted-foreground">Welcome, {name}!</p>
          <p className="text-sm text-muted-foreground">Blockchain interactions powered by Aptos</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>Available tools for interacting with Aptos blockchain</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-semibold">Send APT</h3>
              <p className="text-sm text-muted-foreground">Transfer APT to addresses or ANS domains</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Check Balance</h3>
              <p className="text-sm text-muted-foreground">Query APT and token balances</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Swap Tokens</h3>
              <p className="text-sm text-muted-foreground">Trade on Liquidswap (coming soon)</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Token Prices</h3>
              <p className="text-sm text-muted-foreground">Real-time USD prices</p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>MCP Server: <code className="bg-muted px-2 py-1 rounded">/mcp</code></p>
        </div>
      </main>
    </div>
  );
}
