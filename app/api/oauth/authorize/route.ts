import { NextRequest, NextResponse } from 'next/server';
import { baseURL } from '@/baseUrl';

// Simple OAuth authorization endpoint
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const scope = searchParams.get('scope');

  // For development, we'll auto-approve
  // In production, you'd show an authorization page

  // Generate a simple authorization code
  const code = Buffer.from(
    JSON.stringify({
      clientId,
      timestamp: Date.now(),
      scope,
    })
  ).toString('base64url');

  // Redirect back to ChatGPT with the authorization code
  const redirectUrl = new URL(redirectUri!);
  redirectUrl.searchParams.set('code', code);
  if (state) redirectUrl.searchParams.set('state', state);

  return NextResponse.redirect(redirectUrl.toString());
}
