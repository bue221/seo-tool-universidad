import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/**
 * Favicon generado dinámicamente — Next.js lo expone como /icon en build.
 * Cero binarios en el repo.
 */
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
          background: '#0f172a',
          color: '#22d3ee',
          fontSize: 22,
          fontWeight: 800,
          fontFamily: 'system-ui',
          borderRadius: 6,
        }}
      >
        S
      </div>
    ),
    { ...size },
  );
}
