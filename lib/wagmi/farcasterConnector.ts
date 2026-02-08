import { createConnector, type CreateConnectorFn } from 'wagmi';

/**
 * Wagmi connector for Farcaster miniapp wallet.
 * Uses sdk.wallet.getEthereumProvider() from @farcaster/miniapp-sdk.
 * Dynamic import prevents SSR issues.
 */
export function farcaster(): CreateConnectorFn {
  type Provider = {
    request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  };

  let cachedProvider: Provider | null = null;

  async function getProvider(): Promise<Provider> {
    if (cachedProvider) return cachedProvider;
    const { sdk } = await import('@farcaster/miniapp-sdk');
    cachedProvider = sdk.wallet.getEthereumProvider() as unknown as Provider;
    return cachedProvider;
  }

  return createConnector((config) => ({
    id: 'farcaster',
    name: 'Farcaster',
    type: 'farcaster' as const,

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async connect(_params?: any): Promise<any> {
      const provider = await getProvider();
      const accounts = (await provider.request({
        method: 'eth_requestAccounts',
      })) as readonly `0x${string}`[];
      const chainId = (await provider.request({
        method: 'eth_chainId',
      })) as string;
      return { accounts, chainId: Number(chainId) };
    },

    async disconnect() {
      cachedProvider = null;
    },

    async getAccounts() {
      const provider = await getProvider();
      return (await provider.request({
        method: 'eth_accounts',
      })) as readonly `0x${string}`[];
    },

    async getChainId() {
      const provider = await getProvider();
      const chainId = (await provider.request({
        method: 'eth_chainId',
      })) as string;
      return Number(chainId);
    },

    async getProvider() {
      return getProvider();
    },

    async isAuthorized() {
      try {
        const provider = await getProvider();
        const accounts = (await provider.request({
          method: 'eth_accounts',
        })) as string[];
        return accounts.length > 0;
      } catch {
        return false;
      }
    },

    onAccountsChanged(accounts) {
      config.emitter.emit('change', {
        accounts: accounts as readonly `0x${string}`[],
      });
    },

    onChainChanged(chainId) {
      config.emitter.emit('change', { chainId: Number(chainId) });
    },

    onDisconnect() {
      config.emitter.emit('disconnect');
    },
  }));
}
