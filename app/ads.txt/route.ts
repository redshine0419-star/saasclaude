import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse(
    'google.com, ca-pub-5240608264303390, DIRECT, f08c47fec0942fa0\n',
    {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400',
      },
    }
  );
}
