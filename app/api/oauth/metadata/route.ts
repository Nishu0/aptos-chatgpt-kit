import { NextResponse } from 'next/server';
import { baseURL } from '@/baseUrl';

// OAuth metadata endpoint (discovery)
export async function GET() {
  return NextResponse.json({
    issuer: baseURL,
    authorization_endpoint: `${baseURL}/api/oauth/authorize`,
    token_endpoint: `${baseURL}/api/oauth/token`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
    scopes_supported: ['read', 'write'],
  });
}
