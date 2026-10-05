'use client';

type Props = {
  slug: string;
  phone: string | null;
  kakaoChannelUrl: string | null;
};

export default function MobileBar({ slug, phone, kakaoChannelUrl }: Props) {
  return (
    <>
      {/* spacer so content isn't hidden behind the bar */}
      <div className="h-[84px] md:hidden" aria-hidden="true" />

      <div
        className="md:hidden"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          padding: '12px 16px 28px',
          background: 'var(--surface)',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          gap: 8,
        }}
      >
        {/* 전화 */}
        {phone && (
          <a
            href={`tel:${phone.replace(/[^0-9]/g, '')}`}
            aria-label="전화 걸기"
            style={{
              width: 52,
              height: 52,
              flexShrink: 0,
              border: '1px solid var(--input-line)',
              borderRadius: 12,
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
            </svg>
          </a>
        )}

        {/* 카카오톡 */}
        {kakaoChannelUrl && (
          <a
            href={kakaoChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="카카오톡 채널 상담"
            style={{
              width: 52,
              height: 52,
              flexShrink: 0,
              border: '1px solid var(--input-line)',
              borderRadius: 12,
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Kakao bubble icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.8-.8L3 21l1.9-4.6A8.1 8.1 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" />
            </svg>
          </a>
        )}

        {/* 무료 레벨테스트 신청 */}
        <a
          href={`/${slug}/consult`}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 12,
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          무료 레벨테스트 신청
        </a>
      </div>
    </>
  );
}
