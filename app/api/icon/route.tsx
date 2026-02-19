import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 200,
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: '50%',
            border: '6px solid #D4AF37',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: '#C41E3A',
              fontFamily: 'serif',
            }}
          >
            VP
          </span>
        </div>
      </div>
    ),
    {
      width: 200,
      height: 200,
    }
  );
}
