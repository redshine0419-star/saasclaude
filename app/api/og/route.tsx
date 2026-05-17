import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') ?? 'GrowWeb.me';
  const tag = searchParams.get('tag') ?? 'AI 마케팅 플랫폼';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0d1117',
          padding: '60px 70px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 상단 태그 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span
            style={{
              backgroundColor: '#21262d',
              color: '#8b949e',
              fontSize: '18px',
              padding: '6px 16px',
              borderRadius: '20px',
              border: '1px solid #30363d',
            }}
          >
            {tag}
          </span>
        </div>

        {/* 제목 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <p
            style={{
              fontSize: title.length > 40 ? '42px' : '52px',
              fontWeight: 700,
              color: '#e6edf3',
              lineHeight: 1.3,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </p>
        </div>

        {/* 하단 브랜드 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff' }}>
            GrowWeb.me
          </span>
          <span style={{ fontSize: '18px', color: '#57606a' }}>
            SEO · GEO · AI Marketing
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
