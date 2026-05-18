import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/**
 * apple-touch-icon (iOS "Add to Home Screen"). 180x180 maskable.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#22d3ee',
          fontSize: 120,
          fontWeight: 800,
          fontFamily: 'system-ui',
          borderRadius: 36,
        }}
      >
        S
      </div>
    ),
    { ...size },
  );
}
