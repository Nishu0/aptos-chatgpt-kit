import { NextRequest, NextResponse } from 'next/server';

// OAuth token endpoint
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const grantType = formData.get('grant_type');
  const code = formData.get('code');
  const redirectUri = formData.get('redirect_uri');
  const clientId = formData.get('client_id');

  if (grantType === 'authorization_code') {
    try {
      // Validate the authorization code
      const codeData = JSON.parse(
        Buffer.from(code as string, 'base64url').toString('utf-8')
      );

      // Generate access token
      const accessToken = Buffer.from(
        JSON.stringify({
          clientId: codeData.clientId,
          issued: Date.now(),
          scope: codeData.scope,
        })
      ).toString('base64url');

      return NextResponse.json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600, // 1 hour
        scope: codeData.scope || 'read write',
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid authorization code' },
        { status: 400 }
      );
    }
  }

  return NextResponse.json(
    { error: 'unsupported_grant_type' },
    { status: 400 }
  );
}
