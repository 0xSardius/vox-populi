'use client';

import { useFarcaster } from '@/lib/farcaster';

export default function Home() {
  const { isReady, isInClient, fid, username, displayName, pfpUrl } =
    useFarcaster();

  if (!isReady) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo/Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Vox Populi</h1>
          <p className="text-lg text-secondary">
            Earn yield. Fund journalism.
          </p>
          <p className="text-sm text-muted">Voice of the people.</p>
        </div>

        {/* Status Card */}
        <div className="bg-surface rounded-xl p-6 border border-border space-y-4">
          <h2 className="text-lg font-semibold text-foreground">SDK Status</h2>

          <div className="space-y-3 text-left">
            <StatusRow
              label="SDK Ready"
              value={isReady ? 'Yes' : 'No'}
              success={isReady}
            />
            <StatusRow
              label="In Farcaster Client"
              value={isInClient ? 'Yes' : 'No'}
              success={isInClient}
            />

            {isInClient && (
              <>
                <StatusRow label="FID" value={fid?.toString() ?? 'N/A'} />
                <StatusRow label="Username" value={username ?? 'N/A'} />
                <StatusRow
                  label="Display Name"
                  value={displayName ?? 'N/A'}
                />
              </>
            )}
          </div>

          {pfpUrl && (
            <div className="pt-4 border-t border-border flex justify-center">
              <img
                src={pfpUrl}
                alt="Profile"
                className="w-16 h-16 rounded-full border-2 border-secondary"
              />
            </div>
          )}
        </div>

        {/* Test Instructions */}
        {!isInClient && (
          <div className="bg-surface/50 rounded-lg p-4 border border-border">
            <p className="text-sm text-muted">
              Open this app in Warpcast or a Farcaster client to test the SDK
              integration.
            </p>
          </div>
        )}

        {/* Theme Test */}
        <div className="flex gap-3 justify-center">
          <div className="w-12 h-12 rounded-lg bg-primary" title="Primary (Cardinal Red)" />
          <div className="w-12 h-12 rounded-lg bg-secondary" title="Secondary (Roman Gold)" />
          <div className="w-12 h-12 rounded-lg bg-surface border border-border" title="Surface" />
        </div>
      </div>
    </main>
  );
}

function StatusRow({
  label,
  value,
  success,
}: {
  label: string;
  value: string;
  success?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted">{label}</span>
      <span
        className={
          success === undefined
            ? 'text-foreground'
            : success
              ? 'text-success'
              : 'text-muted'
        }
      >
        {value}
      </span>
    </div>
  );
}
