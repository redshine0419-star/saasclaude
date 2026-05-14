import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { saveGSCTokens } from '@/lib/gsc-tokens';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error');

  if (oauthError) return NextResponse.redirect(new URL('/app?gsc_error=' + oauthError, req.url));
  if (!code || !state) return NextResponse.redirect(new URL('/app?gsc_error=missing_params', req.url));

  let expectedEmail: string;
  try { expectedEmail = Buffer.from(state, 'base64url').toString(); }
  catch { return NextResponse.redirect(new URL('/app?gsc_error=invalid_state', req.url)); }

  const session = await auth();
  if (session?.user?.email !== expectedEmail) {
    return NextResponse.redirect(new URL('/app?gsc_error=session_mismatch', req.url));
  }

  const redirectUri = new URL('/api/gsc/callback', req.url).toString();
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    console.error('[GSC callback]', await tokenRes.text());
    return NextResponse.redirect(new URL('/app?gsc_error=token_failed', req.url));
  }

  const tokens = await tokenRes.json();
  if (!tokens.refresh_token) {
    return NextResponse.redirect(new URL('/app?gsc_error=no_refresh_token', req.url));
  }

  await saveGSCTokens(expectedEmail, {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    connectedAt: new Date().toISOString(),
  });

  return NextResponse.redirect(new URL('/app?gsc_connected=1', req.url));
}
