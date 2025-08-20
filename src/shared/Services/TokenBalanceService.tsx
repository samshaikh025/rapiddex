// TokenBalanceService.ts
import { Chains, Tokens } from '@/shared/Models/Common.model';
import { UtilityService } from './UtilityService';
import { SwapProvider } from '../Enum/Common.enum';

interface MobulaAsset {
    contracts_balances: Array<{
        address: string;
        balance: number;
        balanceRaw: string;
        chainId: string;
        decimals: number;
    }>;
    cross_chain_balances?: any;
    estimated_balance: number;
    price: number;
    token_balance: number;
    asset: {
        id: number;
        name: string;
        symbol: string;
        logo: string;
        contracts: string[];
        blockchains: string[];
        decimals?: string[];
    };
}

interface MobulaResponse {
    data: {
        total_wallet_balance: number;
        wallets: string[];
        assets: MobulaAsset[];
        balances_length: number;
    };
}

interface TokenBalance {
    token: Tokens;
    balance: number;
    balanceRaw: string;
    balanceUSD: number;
    price: number;
    chainId: number;
    lastUpdated: number;
}

interface CacheEntry {
    data: TokenBalance[];
    timestamp: number;
    walletAddress: string;
    chainId: number;
}

export class TokenBalanceService {
    private static instance: TokenBalanceService;
    private cache: Map<string, CacheEntry> = new Map();
    private pendingRequests: Map<string, Promise<TokenBalance[]>> = new Map();
    private readonly CACHE_DURATION = 60000; // 60 seconds cache
    private readonly MOBULA_API_URL = process.env.NEXT_PUBLIC_MOBULA_API_URL || 'https://api.mobula.io/api/1';
    private readonly MOBULA_API_KEY = "4ee7370b-89e7-4d74-8b87-38355f2fb37d";
    private readonly utilityService = new UtilityService();

    // Native token address constants
    private readonly SYSTEM_NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';
    private readonly MOBULA_NATIVE_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

    apiUrlENV: string = process.env.NEXT_PUBLIC_NODE_API_URL;

    private constructor() { }

    public static getInstance(): TokenBalanceService {
        if (!TokenBalanceService.instance) {
            TokenBalanceService.instance = new TokenBalanceService();
        }
        return TokenBalanceService.instance;
    }

    /**
     * Normalize native token address for system use
     */
    private normalizeAddressForSystem(address: string): string {
        if (address.toLowerCase() === this.MOBULA_NATIVE_ADDRESS.toLowerCase()) {
            return this.SYSTEM_NATIVE_ADDRESS;
        }
        return address;
    }

    /**
     * Convert system native address to Mobula format
     */
    private convertToMobulaAddress(address: string, isNative: boolean): string {
        if (isNative || address.toLowerCase() === this.SYSTEM_NATIVE_ADDRESS.toLowerCase()) {
            return this.MOBULA_NATIVE_ADDRESS;
        }
        return address;
    }

    /**
     * Check if addresses match (considering native token variations)
     */
    private addressesMatch(addr1: string, addr2: string): boolean {
        const a1 = addr1.toLowerCase();
        const a2 = addr2.toLowerCase();

        // Direct match
        if (a1 === a2) return true;

        // Both are native addresses
        const nativeAddresses = [
            this.MOBULA_NATIVE_ADDRESS.toLowerCase(),
            this.SYSTEM_NATIVE_ADDRESS.toLowerCase()
        ];

        if (nativeAddresses.includes(a1) && nativeAddresses.includes(a2)) {
            return true;
        }

        return false;
    }

    /**
     * Get cache key for wallet and chain combination
     */
    private getCacheKey(walletAddress: string, chainId: number): string {
        return `${walletAddress.toLowerCase()}_${chainId}`;
    }

    /**
     * Get cache key for single token
     */
    private getSingleTokenCacheKey(walletAddress: string, chainId: number, tokenAddress: string): string {
        const normalizedAddress = this.normalizeAddressForSystem(tokenAddress);
        return `${walletAddress.toLowerCase()}_${chainId}_${normalizedAddress.toLowerCase()}`;
    }

    /**
     * Check if cache is still valid
     */
    private isCacheValid(entry: CacheEntry): boolean {
        return Date.now() - entry.timestamp < this.CACHE_DURATION;
    }

    /**
     * Get balance for a single token (optimized for single token queries)
     */
    public async getSingleTokenBalance(
        walletAddress: string,
        chain: Chains,
        token: Tokens
    ): Promise<TokenBalance | null> {
        if (!walletAddress || !chain || !token) {
            return null;
        }

        // First check if we have bulk cache for this chain
        const bulkCacheKey = this.getCacheKey(walletAddress, chain.chainId);
        const bulkCache = this.cache.get(bulkCacheKey);

        if (bulkCache && this.isCacheValid(bulkCache)) {
            // Try to find the token in bulk cache
            const foundToken = bulkCache.data.find(b =>
                this.addressesMatch(b.token.address, token.address) ||
                (b.token.symbol === token.symbol && (token.tokenIsNative || b.token.tokenIsNative))
            );

            if (foundToken) {
                console.log('Found token in bulk cache:', foundToken);
                // Return with the requested token's properties merged
                return {
                    ...foundToken,
                    token: {
                        ...token,
                        balance: foundToken.balance,
                        balanceUSD: foundToken.balanceUSD
                    }
                };
            }
        }

        // Check single token cache
        const singleCacheKey = this.getSingleTokenCacheKey(walletAddress, chain.chainId, token.address);
        const cachedEntry = this.cache.get(singleCacheKey);

        if (cachedEntry && this.isCacheValid(cachedEntry) && cachedEntry.data.length > 0) {
            console.log('Returning cached single token balance');
            const cached = cachedEntry.data[0];
            return {
                ...cached,
                token: {
                    ...token,
                    balance: cached.balance,
                    balanceUSD: cached.balanceUSD
                }
            };
        }

        // Check if there's already a pending request for this specific token
        const pendingKey = `${singleCacheKey}_pending`;
        const pendingRequest = this.pendingRequests.get(pendingKey);
        if (pendingRequest) {
            console.log('Returning pending single token request');
            const result = await pendingRequest;
            return result && result.length > 0 ? result[0] : null;
        }

        // Create new request
        const requestPromise = this.fetchSingleTokenBalance(walletAddress, chain, token).then(balance => {
            if (balance) {
                // Cache the single token result
                this.cache.set(singleCacheKey, {
                    data: [balance],
                    timestamp: Date.now(),
                    walletAddress,
                    chainId: chain.chainId
                });
                return [balance];
            }
            return [];
        });

        this.pendingRequests.set(pendingKey, requestPromise);

        try {
            const result = await requestPromise;
            this.pendingRequests.delete(pendingKey);

            if (result && result.length > 0) {
                return result[0];
            }

            // If Mobula didn't return anything, fallback to RPC
            console.log('Mobula returned no data, falling back to RPC');
            return await this.fetchViaRPC(walletAddress, chain, token);

        } catch (error) {
            this.pendingRequests.delete(pendingKey);
            console.error('Error fetching single token balance:', error);

            // Fallback to RPC call
            return await this.fetchViaRPC(walletAddress, chain, token);
        }
    }

    /**
     * Fallback to RPC for fetching balance
     */
    private async fetchViaRPC(
        walletAddress: string,
        chain: Chains,
        token: Tokens
    ): Promise<TokenBalance | null> {
        try {
            console.log('Fetching balance via RPC');
            const balance = await this.utilityService.getBalance(
                token.tokenIsNative,
                token,
                walletAddress,
                chain.rpcUrl[0]
            );

            const balanceNum = Number(balance[1]) || 0;
            const balanceUSD = balanceNum * (token.price || 0);

            const tokenBalance: TokenBalance = {
                token: {
                    ...token,
                    balance: balanceNum,
                    balanceUSD: balanceUSD
                },
                balance: balanceNum,
                balanceRaw: balance[0] || '0',
                balanceUSD: balanceUSD,
                price: token.price || 0,
                chainId: chain.chainId,
                lastUpdated: Date.now()
            };

            // Cache the RPC result
            const cacheKey = this.getSingleTokenCacheKey(walletAddress, chain.chainId, token.address);
            this.cache.set(cacheKey, {
                data: [tokenBalance],
                timestamp: Date.now(),
                walletAddress,
                chainId: chain.chainId
            });

            return tokenBalance;
        } catch (rpcError) {
            console.error('RPC fallback also failed:', rpcError);

            // Return zero balance as last resort
            return {
                token: {
                    ...token,
                    balance: 0,
                    balanceUSD: 0
                },
                balance: 0,
                balanceRaw: '0',
                balanceUSD: 0,
                price: token.price || 0,
                chainId: chain.chainId,
                lastUpdated: Date.now()
            };
        }
    }

    /**
     * Fetch single token balance from Mobula
     */
    private async fetchSingleTokenBalance(
        walletAddress: string,
        chain: Chains,
        token: Tokens
    ): Promise<TokenBalance | null> {
        // Convert address for Mobula API if native
        const mobulaAddress = this.convertToMobulaAddress(token.address, token.tokenIsNative);

        const params = new URLSearchParams({
            wallet: walletAddress,
            blockchains: chain.chainId.toString(),
            asset: token.tokenIsNative ? token.symbol : mobulaAddress.toLowerCase(),
            cache: 'true',
            stale: '60',
            filterSpam: 'true',
            minliq: '100'
        });

        try {
            console.log('Fetching from Mobula with params:', params.toString());

            let payLoad = {
                apiType: 'GET',
                apiUrl: `/wallet/portfolio?${params.toString()}`,
                apiData: null,
                apiProvider: SwapProvider.MOBULA,

            }

            const response = await fetch(this.apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Authorization': this.MOBULA_API_KEY || '',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),

            });


            if (!response.ok) {
                throw new Error(`Mobula API error: ${response.status}`);
            }

            let data = await response.json();

            data = data.Data as MobulaResponse;
            console.log('Mobula single token response:', data);

            if (!data.data.assets || data.data.assets.length === 0) {
                return null; // Will trigger RPC fallback
            }

            const asset = data.data.assets[0];

            // Find the correct contract balance for the chain
            let contractBalance = asset.contracts_balances?.find(cb => {
                const cbChainId = cb.chainId.includes(':')
                    ? cb.chainId.split(':')[1]
                    : cb.chainId;
                return cbChainId === chain.chainId.toString();
            });

            const balance = contractBalance?.balance || asset.token_balance || 0;
            const balanceRaw = contractBalance?.balanceRaw || '0';
            const balanceUSD = asset.estimated_balance || (balance * (asset.price || token.price || 0));

            const tokenBalance: TokenBalance = {
                token: {
                    ...token,
                    address: this.normalizeAddressForSystem(token.address),
                    balance: balance,
                    balanceUSD: balanceUSD
                },
                balance: balance,
                balanceRaw: balanceRaw,
                balanceUSD: balanceUSD,
                price: asset.price || token.price || 0,
                chainId: chain.chainId,
                lastUpdated: Date.now()
            };

            return tokenBalance;
        } catch (error) {
            console.error('Error fetching from Mobula:', error);
            return null; // Will trigger RPC fallback
        }
    }

    /**
     * Fetch token balances for specific tokens only
     */
    public async getTokenBalances(
        walletAddress: string,
        chain: Chains,
        tokens: Tokens[]
    ): Promise<TokenBalance[]> {
        if (!walletAddress || !chain || tokens.length === 0) {
            return [];
        }

        const cacheKey = this.getCacheKey(walletAddress, chain.chainId);

        // Check cache first
        const cachedEntry = this.cache.get(cacheKey);
        if (cachedEntry && this.isCacheValid(cachedEntry)) {
            console.log('Returning cached balances');
            return this.filterTokensFromCache(cachedEntry.data, tokens);
        }

        // Check if there's already a pending request
        const pendingRequest = this.pendingRequests.get(cacheKey);
        if (pendingRequest) {
            console.log('Returning pending request');
            const result = await pendingRequest;
            return this.filterTokensFromCache(result, tokens);
        }

        // Create new request
        const requestPromise = this.fetchBalancesFromMobula(walletAddress, chain);
        this.pendingRequests.set(cacheKey, requestPromise);

        try {
            const balances = await requestPromise;
            this.pendingRequests.delete(cacheKey);
            return this.filterTokensFromCache(balances, tokens);
        } catch (error) {
            this.pendingRequests.delete(cacheKey);
            throw error;
        }
    }

    /**
     * Fetch all balances from Mobula API
     */
    private async fetchBalancesFromMobula(
        walletAddress: string,
        chain: Chains
    ): Promise<TokenBalance[]> {
        const params = new URLSearchParams({
            wallet: walletAddress,
            blockchains: chain.chainId.toString(),
            cache: 'true',
            stale: '300',
            filterSpam: 'true',
            unlistedAssets: 'false',
            minliq: '1000'
        });
        try {


            let payLoad = {
                apiType: 'GET',
                apiUrl: `/wallet/portfolio?${params.toString()}`,
                apiData: null,
                apiProvider: SwapProvider.MOBULA,

            }

            const response = await fetch(this.apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Authorization': this.MOBULA_API_KEY || '',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),

            });



            if (!response.ok) {
                throw new Error(`Mobula API error: ${response.status}`);
            }

            let data = await response.json();

            data = data.Data as MobulaResponse

            console.log('Mobula bulk response:', data.Data as MobulaResponse);

            const balances = this.transformMobulaResponse(data, chain.chainId);

            // Update cache
            const cacheKey = this.getCacheKey(walletAddress, chain.chainId);
            this.cache.set(cacheKey, {
                data: balances,
                timestamp: Date.now(),
                walletAddress,
                chainId: chain.chainId
            });

            // Also cache individual tokens for quick single token lookups
            balances.forEach(balance => {
                const singleCacheKey = this.getSingleTokenCacheKey(
                    walletAddress,
                    chain.chainId,
                    balance.token.address
                );
                this.cache.set(singleCacheKey, {
                    data: [balance],
                    timestamp: Date.now(),
                    walletAddress,
                    chainId: chain.chainId
                });
            });

            return balances;
        } catch (error) {
            console.error('Error fetching from Mobula:', error);
            throw error;
        }
    }

    /**
     * Transform Mobula response to our TokenBalance format
     */
    private transformMobulaResponse(
        response: MobulaResponse,
        chainId: number
    ): TokenBalance[] {
        const balances: TokenBalance[] = [];

        response.data.assets.forEach(asset => {
            // Find contract balance for this chain
            const contractBalance = asset.contracts_balances?.find(cb => {
                const cbChainId = cb.chainId.includes(':')
                    ? cb.chainId.split(':')[1]
                    : cb.chainId;
                return cbChainId === chainId.toString();
            });

            // Skip if no balance on this chain
            if (!contractBalance) return;

            const token: Tokens = new Tokens();

            // Normalize address for system use
            token.address = this.normalizeAddressForSystem(contractBalance.address);
            token.symbol = asset.asset.symbol;
            token.name = asset.asset.name;
            token.logoURI = asset.asset.logo;
            token.decimal = contractBalance.decimals || 18;
            token.tokenIsNative = this.addressesMatch(contractBalance.address, this.MOBULA_NATIVE_ADDRESS);

            const balance = contractBalance.balance || 0;
            const balanceRaw = contractBalance.balanceRaw || '0';
            const balanceUSD = asset.estimated_balance || (balance * asset.price);

            // Only add tokens with balance
            if (balance > 0 || asset.token_balance > 0) {
                balances.push({
                    token: {
                        ...token,
                        balance: balance,
                        balanceUSD: balanceUSD
                    },
                    balance: balance,
                    balanceRaw: balanceRaw,
                    balanceUSD: balanceUSD,
                    price: asset.price || 0,
                    chainId: chainId,
                    lastUpdated: Date.now()
                });
            }
        });

        return balances.sort((a, b) => b.balanceUSD - a.balanceUSD);
    }

    /**
     * Filter tokens from cached data
     */
    private filterTokensFromCache(
        cachedBalances: TokenBalance[],
        requestedTokens: Tokens[]
    ): TokenBalance[] {
        const found: TokenBalance[] = [];

        requestedTokens.forEach(requestedToken => {
            // Find matching balance in cache
            const matchingBalance = cachedBalances.find(b => {
                // Check address match
                if (this.addressesMatch(b.token.address, requestedToken.address)) {
                    return true;
                }

                // For native tokens, also match by symbol
                if ((requestedToken.tokenIsNative || b.token.tokenIsNative) &&
                    b.token.symbol === requestedToken.symbol) {
                    return true;
                }

                return false;
            });

            if (matchingBalance) {
                // Found in cache - merge with requested token properties
                found.push({
                    ...matchingBalance,
                    token: {
                        ...requestedToken,
                        address: this.normalizeAddressForSystem(requestedToken.address),
                        balance: matchingBalance.balance,
                        balanceUSD: matchingBalance.balanceUSD
                    }
                });
            } else {
                // Not found - return zero balance
                found.push({
                    token: {
                        ...requestedToken,
                        balance: 0,
                        balanceUSD: 0
                    },
                    balance: 0,
                    balanceRaw: '0',
                    balanceUSD: 0,
                    price: requestedToken.price || 0,
                    chainId: requestedToken.chainId || 0,
                    lastUpdated: Date.now()
                });
            }
        });

        return found;
    }

    /**
     * Clear cache for specific wallet or all
     */
    public clearCache(walletAddress?: string, chainId?: number): void {
        if (walletAddress && chainId) {
            // Clear all caches for this wallet/chain combination
            const baseKey = this.getCacheKey(walletAddress, chainId);
            Array.from(this.cache.keys()).forEach(key => {
                if (key.startsWith(baseKey)) {
                    this.cache.delete(key);
                }
            });
        } else if (walletAddress) {
            // Clear all entries for this wallet
            Array.from(this.cache.keys()).forEach(key => {
                if (key.includes(walletAddress.toLowerCase())) {
                    this.cache.delete(key);
                }
            });
        } else {
            // Clear all cache
            this.cache.clear();
        }
        // Clear pending requests as well
        this.pendingRequests.clear();
    }

    /**
     * Prefetch balances for better UX
     */
    public async prefetchBalances(
        walletAddress: string,
        chains: Chains[]
    ): Promise<void> {
        const promises = chains.map(chain =>
            this.fetchBalancesFromMobula(walletAddress, chain).catch(err => {
                console.error(`Failed to prefetch for chain ${chain.chainId}:`, err);
                return [];
            })
        );

        await Promise.all(promises);
    }
}