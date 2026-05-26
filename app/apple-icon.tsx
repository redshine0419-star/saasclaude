import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6366f1 0%, #3730a3 100%)',
          borderRadius: 40,
          position: 'relative',
        }}
      >
        {/* Bold G */}
        <span
          style={{
            color: 'white',
            fontSize: 120,
            fontWeight: 900,
            fontFamily: 'Arial Black, Arial, sans-serif',
            lineHeight: 1,
            marginTop: -8,
          }}
        >
          G
        </span>
        {/* Sparkline accent — bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 22,
            width: 52,
            height: 28,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 6,
          }}
        >
          {[18, 10, 24, 6, 28].map((h, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: h,
                background: '#a5b4fc',
                borderRadius: 3,
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
