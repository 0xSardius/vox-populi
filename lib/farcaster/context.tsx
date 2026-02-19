'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useAccount, useConnect } from 'wagmi';
import { sdk, isInFarcasterClient, getAuthToken } from './sdk';

interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface MiniAppContext {
  user: FarcasterUser;
  client?: {
    clientFid: number;
    added: boolean;
    notificationDetails?: {
      url: string;
      token: string;
    };
  };
  location?: {
    type: string;
    cast?: unknown;
  };
}

interface FarcasterContextValue {
  isReady: boolean;
  isInClient: boolean;
  context: MiniAppContext | null;
  authToken: string | null;
  refreshToken: () => Promise<string | null>;
  fid: number | null;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
}

const FarcasterContext = createContext<FarcasterContextValue | null>(null);

interface FarcasterProviderProps {
  children: ReactNode;
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isInClient, setIsInClient] = useState(false);
  const [context, setContext] = useState<MiniAppContext | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Wagmi hooks for auto-connect
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  const refreshToken = useCallback(async () => {
    const token = await getAuthToken();
    setAuthToken(token);
    return token;
  }, []);

  useEffect(() => {
    const init = async () => {
      const inClient = isInFarcasterClient();
      setIsInClient(inClient);

      if (inClient) {
        try {
          await sdk.actions.ready();
        } catch (error) {
          console.error('Failed to initialize Farcaster SDK:', error);
        }
        // Unblock rendering immediately after ready() — don't wait for context/auth
        setIsReady(true);

        // Load context and auth token in the background
        try {
          const ctx = await sdk.context;
          setContext(ctx);
        } catch {
          // Context unavailable — app still works without it
        }
        refreshToken().catch(() => {});
      } else {
        setIsReady(true);
      }
    };

    init();
  }, [refreshToken]);

  // Auto-connect Farcaster wallet once SDK is ready
  useEffect(() => {
    if (isReady && isInClient && !isConnected) {
      const farcasterConnector = connectors.find((c) => c.id === 'farcaster');
      if (farcasterConnector) {
        connect(
          { connector: farcasterConnector },
          {
            onError: (err) =>
              console.warn('Farcaster wallet auto-connect failed:', err),
          }
        );
      }
    }
  }, [isReady, isInClient, isConnected, connect, connectors]);

  const user = context?.user;
  const fid = user?.fid ?? null;
  const username = user?.username ?? null;
  const displayName = user?.displayName ?? null;
  const pfpUrl = user?.pfpUrl ?? null;

  const value: FarcasterContextValue = {
    isReady,
    isInClient,
    context,
    authToken,
    refreshToken,
    fid,
    username,
    displayName,
    pfpUrl,
  };

  return (
    <FarcasterContext.Provider value={value}>
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (!context) {
    throw new Error('useFarcaster must be used within a FarcasterProvider');
  }
  return context;
}
