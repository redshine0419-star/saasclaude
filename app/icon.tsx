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
          background: '#0f0f0f',
          borderRadius: 7,
        }}
      >
        {/* Lightning bolt — SVG path via img trick not available, use div shapes */}
        <svg
          width="18"
          height="22"
          viewBox="0 0 18 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.5 1L1 13h7.5L7 21l10-12h-7L10.5 1z"
            fill="white"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
