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
          background: '#0f0f0f',
          borderRadius: 40,
        }}
      >
        <svg
          width="100"
          height="124"
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
