import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)',
          color: '#0d1a14',
          fontSize: 20,
          fontWeight: 800,
          fontFamily: 'system-ui',
          borderRadius: 6,
        }}
      >
        L
      </div>
    ),
    { ...size },
  );
}
