import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { getTokens, getValidAccessToken } from '@/lib/ga4-tokens';

interface PropertySummary {
  property: string;
  displayName: string;
}

interface AccountSummary {
  displayName: string;
  propertySummaries?: PropertySummary[];
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ connected: false });

  const email = session.user.email;
  const tokens = await getTokens(email);
  if (!tokens) return NextResponse.json({ connected: false });

  const accessToken = await getValidAccessToken(email);
  if (!accessToken) return NextResponse.json({ connected: false });

  const res = await fetch(
    'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    return NextResponse.json({ connected: true, email: tokens.email, properties: [] });
  }

  const data = await res.json();
  const properties = ((data.accountSummaries ?? []) as AccountSummary[]).flatMap((account) =>
    (account.propertySummaries ?? []).map((p) => ({
      id: p.property.replace('properties/', ''),
      displayName: p.displayName,
      account: account.displayName,
    }))
  );

  return NextResponse.json({ connected: true, email: tokens.email, properties });
}
