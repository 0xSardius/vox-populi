import { NextResponse } from 'next/server';

// Farcaster Mini App Manifest
// This will be filled in once we have:
// 1. Domain signed with Farcaster account
// 2. Production URL
// 3. App icons/images

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

  const manifest = {
    accountAssociation: {
      // TODO: Sign domain with Farcaster account at
      // https://farcaster.xyz/~/developers/mini-apps/manifest
      header: '',
      payload: '',
      signature: '',
    },
    miniapp: {
      version: '1',
      name: 'Vox Populi',
      iconUrl: `${appUrl}/icon.svg`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/og-image.svg`,
      buttonTitle: 'Open App',
      splashImageUrl: `${appUrl}/splash.svg`,
      splashBackgroundColor: '#0a0a0a',
      // Require Base chain and wallet capabilities
      requiredChains: ['eip155:8453'], // Base mainnet
      requiredCapabilities: [
        'actions.signIn',
        'wallet.getEthereumProvider',
      ],
    },
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
