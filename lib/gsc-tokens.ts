import { put, list, del } from '@vercel/blob';
import crypto from 'crypto';

export interface GSCTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  connectedAt: string;
  email: string;
}

function blobKey(email: string): string {
  const hash = crypto
    .createHmac('sha256', process.env.NEXTAUTH_SECRET ?? 'gsc-secret')
    .update(email)
    .digest('hex');
  return `gsc-tokens/${hash}.json`;
}

export async function getGSCTokens(email: string): Promise<GSCTokens | null> {
  try {
    const { blobs } = await list({ prefix: blobKey(email) });
    if (!blobs.length) return null;
    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function saveGSCTokens(email: string, data: Omit<GSCTokens, 'email'>): Promise<void> {
  await put(blobKey(email), JSON.stringify({ ...data, email }), {
    access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
  });
}

export async function deleteGSCTokens(email: string): Promise<void> {
  try {
    const { blobs } = await list({ prefix: blobKey(email) });
    for (const blob of blobs) await del(blob.url);
  } catch { /* ignore */ }
}

export async function getValidGSCToken(email: string): Promise<string | null> {
  const tokens = await getGSCTokens(email);
  if (!tokens) return null;
  if (tokens.expiresAt > Date.now() + 5 * 60 * 1000) return tokens.accessToken;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: tokens.refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    await saveGSCTokens(email, {
      accessToken: data.access_token,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
      connectedAt: tokens.connectedAt,
    });
    return data.access_token;
  } catch { return null; }
}
