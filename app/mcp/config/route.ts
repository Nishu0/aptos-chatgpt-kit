import { NextResponse } from 'next/server';
import { baseURL } from '@/baseUrl';

// MCP Server Configuration/Manifest
export async function GET() {
  return NextResponse.json({
    schema_version: '1.0',
    name: 'Aptos ChatGPT Kit',
    description: 'MCP server for Aptos blockchain operations',
    version: '1.0.0',
    endpoint: `${baseURL}/mcp`,
    oauth: {
      authorization_endpoint: `${baseURL}/api/oauth/authorize`,
      token_endpoint: `${baseURL}/api/oauth/token`,
      scopes: ['read', 'write'],
      client_id: 'chatgpt',
    },
    capabilities: {
      tools: true,
      resources: true,
    },
  });
}
