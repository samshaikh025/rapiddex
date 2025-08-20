// hooks/useTokenBalance.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Chains, Tokens } from '@/shared/Models/Common.model';
import { TokenBalanceService } from '@/shared/Services/TokenBalanceService';
import { useSelector } from 'react-redux';

interface TokenBalance {
    token: Tokens;
    balance: number;
    balanceRaw: string;
    balanceUSD: number;
    price: number;
    chainId: number;
    lastUpdated: number;
}

interface UseTokenBalanceOptions {
    autoRefresh?: boolean;
    refreshInterval?: number;
    prefetchChains?: Chains[];
    cacheOnly?: boolean;
}

interface UseTokenBalanceReturn {
    balances: Map<string, TokenBalance>;
    loading: boolean;
    error: Error | null;
    getBalance: (token: Tokens, chain: Chains) => TokenBalance | null;
    getBalanceAsync: (token: Tokens, chain: Chains) => Promise<TokenBalance | null>;
    refreshBalances: () => Promise<void>;
    clearCache: () => void;
    totalBalanceUSD: number;
}

export function useTokenBalance(options: UseTokenBalanceOptions = {}): UseTokenBalanceReturn {
    const {
        autoRefresh = false,
        refreshInterval = 60000, // 1 minute default
        prefetchChains = [],
        cacheOnly = false
    } = options;

    // State
    const [balances, setBalances] = useState<Map<string, TokenBalance>>(new Map());
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [totalBalanceUSD, setTotalBalanceUSD] = useState<number>(0);

    // Redux
    const walletData = useSelector((state: any) => state.WalletData);

    // Refs
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const tokenBalanceService = useRef(TokenBalanceService.getInstance());

    /**
     * Get balance key for map
     */
    const getBalanceKey = useCallback((token: Tokens, chain: Chains): string => {
        return `${chain.chainId}_${token.address.toLowerCase()}`;
    }, []);

    /**
     * Get balance from state
     */
    const getBalance = useCallback((token: Tokens, chain: Chains): TokenBalance | null => {
        const key = getBalanceKey(token, chain);
        return balances.get(key) || null;
    }, [balances, getBalanceKey]);

    /**
     * Get balance async (fetches if not in cache)
     */
    const getBalanceAsync = useCallback(async (
        token: Tokens,
        chain: Chains
    ): Promise<TokenBalance | null> => {
        if (!walletData.address) return null;

        const key = getBalanceKey(token, chain);

        // Check if already in state
        const existing = balances.get(key);
        if (existing && (Date.now() - existing.lastUpdated) < 30000) {
            return existing;
        }

        // Fetch from service
        try {
            setLoading(true);
            const balance = await tokenBalanceService.current.getSingleTokenBalance(
                walletData.address,
                chain,
                token
            );

            if (balance) {
                setBalances(prev => {
                    const newMap = new Map(prev);
                    newMap.set(key, balance);
                    return newMap;
                });
            }

            setLoading(false);
            return balance;
        } catch (err) {
            setError(err as Error);
            setLoading(false);
            return null;
        }
    }, [walletData.address, balances, getBalanceKey]);

    /**
     * Refresh all balances
     */
    const refreshBalances = useCallback(async () => {
        if (!walletData.address || balances.size === 0) return;

        setLoading(true);
        setError(null);

        try {
            // Group tokens by chain
            const tokensByChain = new Map<number, Tokens[]>();

            balances.forEach((balance) => {
                const chainTokens = tokensByChain.get(balance.chainId) || [];
                chainTokens.push(balance.token);
                tokensByChain.set(balance.chainId, chainTokens);
            });

            // Fetch balances for each chain
            const promises = Array.from(tokensByChain.entries()).map(async ([chainId, tokens]) => {
                // Find chain object (you might need to pass chains as parameter)
                const chain = new Chains();
                chain.chainId = chainId;

                return tokenBalanceService.current.getTokenBalances(
                    walletData.address,
                    chain,
                    tokens
                );
            });

            const results = await Promise.all(promises);

            // Update balances
            const newBalances = new Map<string, TokenBalance>();
            let totalUSD = 0;

            results.flat().forEach(balance => {
                if (balance) {
                    const key = `${balance.chainId}_${balance.token.address.toLowerCase()}`;
                    newBalances.set(key, balance);
                    totalUSD += balance.balanceUSD;
                }
            });

            setBalances(newBalances);
            setTotalBalanceUSD(totalUSD);
            setLoading(false);
        } catch (err) {
            setError(err as Error);
            setLoading(false);
        }
    }, [walletData.address, balances]);

    /**
     * Clear cache
     */
    const clearCache = useCallback(() => {
        tokenBalanceService.current.clearCache(walletData.address);
        setBalances(new Map());
        setTotalBalanceUSD(0);
    }, [walletData.address]);

    /**
     * Prefetch balances for chains
     */
    useEffect(() => {
        if (walletData.address && prefetchChains.length > 0) {
            tokenBalanceService.current.prefetchBalances(walletData.address, prefetchChains);
        }
    }, [walletData.address, prefetchChains]);

    /**
     * Setup auto refresh
     */
    useEffect(() => {
        if (autoRefresh && walletData.address) {
            refreshIntervalRef.current = setInterval(() => {
                refreshBalances();
            }, refreshInterval);

            return () => {
                if (refreshIntervalRef.current) {
                    clearInterval(refreshIntervalRef.current);
                }
            };
        }
    }, [autoRefresh, refreshInterval, walletData.address, refreshBalances]);

    /**
     * Clear cache when wallet changes
     */
    useEffect(() => {
        if (walletData.address) {
            clearCache();
        }
    }, [walletData.address]);

    return {
        balances,
        loading,
        error,
        getBalance,
        getBalanceAsync,
        refreshBalances,
        clearCache,
        totalBalanceUSD
    };
}

/**
 * Hook for single token balance
 */
export function useSingleTokenBalance(
    token: Tokens | null,
    chain: Chains | null,
    options: { autoFetch?: boolean; refreshInterval?: number } = {}
): {
    balance: TokenBalance | null;
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
} {
    const { autoFetch = true, refreshInterval = 60000 } = options;

    const [balance, setBalance] = useState<TokenBalance | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const walletData = useSelector((state: any) => state.WalletData);
    const tokenBalanceService = TokenBalanceService.getInstance();
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchBalance = useCallback(async () => {
        if (!token || !chain || !walletData.address) {
            setBalance(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await tokenBalanceService.getSingleTokenBalance(
                walletData.address,
                chain,
                token
            );
            setBalance(result);
            setLoading(false);
        } catch (err) {
            setError(err as Error);
            setLoading(false);
        }
    }, [token, chain, walletData.address]);

    // Auto fetch on mount and when dependencies change
    useEffect(() => {
        if (autoFetch) {
            fetchBalance();
        }
    }, [token?.address, chain?.chainId, walletData.address, autoFetch]);

    // Setup refresh interval
    useEffect(() => {
        if (refreshInterval > 0 && balance) {
            refreshIntervalRef.current = setInterval(() => {
                fetchBalance();
            }, refreshInterval);

            return () => {
                if (refreshIntervalRef.current) {
                    clearInterval(refreshIntervalRef.current);
                }
            };
        }
    }, [refreshInterval, balance, fetchBalance]);

    return {
        balance,
        loading,
        error,
        refresh: fetchBalance
    };
}