import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200',
          height: '630',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          position: 'relative',
        }}
      >
        {/* Gold border */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            bottom: 16,
            border: '3px solid #D4AF37',
            display: 'flex',
          }}
        />

        {/* Red accent line top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 200,
            right: 200,
            height: 4,
            background: 'linear-gradient(90deg, transparent, #C41E3A, transparent)',
            display: 'flex',
          }}
        />

        {/* VP monogram */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: '3px solid #D4AF37',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: '#C41E3A',
              fontFamily: 'serif',
            }}
          >
            VP
          </span>
        </div>

        {/* Title */}
        <span
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: 'serif',
            letterSpacing: '-0.02em',
          }}
        >
          VOX POPULI
        </span>

        {/* Tagline */}
        <span
          style={{
            fontSize: 28,
            color: '#D4AF37',
            marginTop: 12,
            letterSpacing: '0.1em',
          }}
        >
          Earn yield. Fund journalism.
        </span>

        {/* Description */}
        <span
          style={{
            fontSize: 20,
            color: '#a1a1a1',
            marginTop: 16,
          }}
        >
          Stake USDC on Base &bull; Earn via Aave V3 &bull; Fund independent newsrooms
        </span>

        {/* Red accent line bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 200,
            right: 200,
            height: 4,
            background: 'linear-gradient(90deg, transparent, #C41E3A, transparent)',
            display: 'flex',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
