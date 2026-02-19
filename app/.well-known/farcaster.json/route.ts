import { NextResponse } from 'next/server';

export async function GET() {
  const appUrl =
    process.env.NEXT_PUBLIC_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://vox-populi-five.vercel.app');

  const manifest = {
    accountAssociation: {
      header:
        'eyJmaWQiOjIzODgxNCwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDYyNjUyMkI1OGI5MmRBRjUzNTk2RjEzNzhiZDI1Qjc2NTNjMWZDNDkifQ',
      payload: 'eyJkb21haW4iOiJ2b3gtcG9wdWxpLWZpdmUudmVyY2VsLmFwcCJ9',
      signature:
        'gtcEE0WJKXstbSLCvAAk8jRLJYCm8YHE1eFvxFtqim1AY6vksSuCK+028bxwK9M26BzKXlF3HG/i/ahhgO3imxs=',
    },
    miniapp: {
      version: '1',
      name: 'Vox Populi',
      subtitle: 'Earn yield. Fund journalism.',
      description:
        'Stake USDC on Base, earn yield via Aave V3, and share a portion with independent journalism. Longer locks = more yield for you.',
      tagline: 'Voice of the people.',
      primaryCategory: 'finance',
      tags: ['defi', 'yield', 'journalism', 'usdc', 'base'],
      iconUrl: `${appUrl}/icon.svg`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/api/og`,
      buttonTitle: 'Open App',
      splashImageUrl: `${appUrl}/splash.svg`,
      splashBackgroundColor: '#0a0a0a',
      heroImageUrl: `${appUrl}/api/og`,
      ogTitle: 'Vox Populi',
      ogDescription:
        'Stake USDC on Base. Earn yield via Aave V3. Fund independent journalism.',
      ogImageUrl: `${appUrl}/api/og`,
      requiredChains: ['eip155:8453'],
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
