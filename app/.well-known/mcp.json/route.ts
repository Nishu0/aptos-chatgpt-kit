import { NextResponse } from 'next/server';
import { baseURL } from '@/baseUrl';

// MCP Discovery endpoint
export async function GET() {
  return NextResponse.json({
    mcp_endpoint: `${baseURL}/mcp`,
    oauth: {
      authorization_endpoint: `${baseURL}/api/oauth/authorize`,
      token_endpoint: `${baseURL}/api/oauth/token`,
      scopes_supported: ['read', 'write'],
    },
  });
}
