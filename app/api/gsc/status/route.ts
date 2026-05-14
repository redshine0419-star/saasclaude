import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { getGSCTokens, getValidGSCToken } from '@/lib/gsc-tokens';

interface SiteEntry {
  siteUrl: string;
  permissionLevel: string;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ connected: false });

  const tokens = await getGSCTokens(session.user.email);
  if (!tokens) return NextResponse.json({ connected: false });

  const accessToken = await getValidGSCToken(session.user.email);
  if (!accessToken) return NextResponse.json({ connected: false });

  const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return NextResponse.json({ connected: true, email: tokens.email, sites: [] });

  const data = await res.json();
  const sites = ((data.siteEntry ?? []) as SiteEntry[])
    .filter((s) => s.permissionLevel !== 'siteUnverifiedUser')
    .map((s) => ({
      siteUrl: s.siteUrl,
      label: s.siteUrl.replace(/^sc-domain:/, '').replace(/\/$/, ''),
      isDomain: s.siteUrl.startsWith('sc-domain:'),
    }));

  return NextResponse.json({ connected: true, email: tokens.email, sites });
}
