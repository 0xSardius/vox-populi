'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { sdk, isInFarcasterClient, getAuthToken } from './sdk';

// Type for the Farcaster context returned by sdk.context
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
  /** Whether the SDK is ready */
  isReady: boolean;
  /** Whether we're inside a Farcaster client */
  isInClient: boolean;
  /** User context from the SDK */
  context: MiniAppContext | null;
  /** Current auth token */
  authToken: string | null;
  /** Refresh the auth token */
  refreshToken: () => Promise<string | null>;
  /** User's FID if available */
  fid: number | null;
  /** User's username if available */
  username: string | null;
  /** User's display name if available */
  displayName: string | null;
  /** User's pfp URL if available */
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
          // Signal that the app is ready to display
          await sdk.actions.ready();

          // Get user context (sdk.context is a Promise)
          const ctx = await sdk.context;
          setContext(ctx);

          // Get initial auth token
          await refreshToken();

          setIsReady(true);
        } catch (error) {
          console.error('Failed to initialize Farcaster SDK:', error);
          setIsReady(true); // Still mark as ready so app doesn't hang
        }
      } else {
        // Not in Farcaster client, still mark as ready
        setIsReady(true);
      }
    };

    init();
  }, [refreshToken]);

  // Extract user info from context
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
