import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6366f1 0%, #3730a3 100%)',
          borderRadius: 7,
          position: 'relative',
        }}
      >
        {/* Bold G */}
        <span
          style={{
            color: 'white',
            fontSize: 21,
            fontWeight: 900,
            fontFamily: 'Arial Black, Arial, sans-serif',
            lineHeight: 1,
            marginTop: -2,
          }}
        >
          G
        </span>
        {/* Sparkline accent — bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            width: 10,
            height: 6,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1.5,
          }}
        >
          {[4, 2, 5, 1, 6].map((h, i) => (
            <div
              key={i}
              style={{
                width: 1.2,
                height: h,
                background: '#a5b4fc',
                borderRadius: 1,
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
