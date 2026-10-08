import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ slug: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug, status: 'active' },
    select: { name: true, subjects: true, targetGrades: true, address: true },
  });

  const name = tenant?.name ?? slug;
  const sub = [tenant?.subjects, tenant?.targetGrades].filter(Boolean).join(' · ');
  const addr = tenant?.address ?? '';

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F4F2EE',
          gap: 20,
          padding: '60px 80px',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: '#1B2430',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {name}
        </div>
        {sub && (
          <div style={{ fontSize: 36, color: '#1E5645', fontWeight: 600, textAlign: 'center' }}>
            {sub}
          </div>
        )}
        {addr && (
          <div style={{ fontSize: 28, color: '#5A6270', textAlign: 'center', marginTop: 8 }}>
            {addr}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
