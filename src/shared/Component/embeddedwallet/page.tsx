'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { TokenBalanceService } from '@/shared/Services/TokenBalanceService';
import { UtilityService } from '@/shared/Services/UtilityService';
import { CryptoService } from '@/shared/Services/CryptoService';
import { Chains, Tokens, TransactionRequestoDto, WalletConnectData } from '@/shared/Models/Common.model';
import { SupportedChains } from '@/shared/Static/SupportedChains';

import { SharedService } from "@/shared/Services/SharedService";
import { Keys } from '@/shared/Enum/Common.enum';
import { OpenWalletModalA, SetActiveTransactionA, SetWalletDataA, SetWalletDisconnectedA } from '@/app/redux-store/action/action-redux';

interface TokenBalance {
    token: Tokens;
    balance: number;
    balanceRaw: string;
    balanceUSD: number;
    price: number;
    chainId: number;
    lastUpdated: number;
}

interface EmbeddedWalletProps {
    isOpen: boolean;
    onClose: () => void;
    walletAddress?: string;
    className?: string;
}

export default function EmbeddedWallet({ isOpen, onClose, walletAddress, className = '' }: EmbeddedWalletProps) {
    const account = useAccount();
    const walletData: WalletConnectData = useSelector((state: any) => state.WalletData);
    const selectedLang = useSelector((state: any) => state.SelectedLanguage);

    const [currentView, setCurrentView] = useState<'main' | 'tokenDetail' | 'qr'>('main');
    const [activeTab, setActiveTab] = useState<'tokens' | 'nfts' | 'pools' | 'activity'>('tokens');
    const [allTokenBalances, setAllTokenBalances] = useState<TokenBalance[]>([]);
    const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
    const [loading, setLoading] = useState(false);
    const [totalBalance, setTotalBalance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    // Store selected chain in localStorage to persist across opens/closes
    const [currentChain, setCurrentChain] = useState<any>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('embeddedWallet_selectedChain');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    return SupportedChains.find((c: any) => c.chainId === parsed.chainId) || null;
                } catch (e) {
                    return null;
                }
            }
        }
        return null;
    });
    const [isChainSupported, setIsChainSupported] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showChainSelector, setShowChainSelector] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [availableTokens, setAvailableTokens] = useState<Tokens[]>([]); // All available tokens for current chain
    const [loadingTokens, setLoadingTokens] = useState(false);

    // AbortController to cancel ongoing requests when switching chains
    const abortControllerRef = useRef<AbortController | null>(null);

    const tokenBalanceService = TokenBalanceService.getInstance();
    const utilityService = new UtilityService();
    const cryptoService = new CryptoService();
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);

    // Use passed walletAddress or fall back to Redux walletData
    const activeWalletAddress = walletAddress || walletData.address;

    const { disconnect, isSuccess } = useDisconnect();

    let sharedService = SharedService.getSharedServiceInstance();

    let dispatch = useDispatch();

    const {
        switchChain
    } = useSwitchChain();
    const allAvailableChains = useSelector((state: any) => state.AvailableChains);
    
    // Save selected chain to localStorage whenever it changes
    useEffect(() => {
        if (currentChain && typeof window !== 'undefined') {
            localStorage.setItem('embeddedWallet_selectedChain', JSON.stringify({ chainId: currentChain.chainId }));
        }
    }, [currentChain]);

    // Load chain data when wallet opens
    useEffect(() => {
        const loadChainData = async () => {
            // Don't run if wallet is not open
            if (!isOpen) {
                return;
            }

            console.log('[EmbeddedWallet] Wallet opened');

            // Priority 1: Use currentChain if already set (from localStorage or previous selection)
            if (currentChain) {
                console.log(`[EmbeddedWallet] Using remembered chain: ${currentChain.name} (${currentChain.chainId})`);
                console.log(`[EmbeddedWallet] Active wallet address: ${activeWalletAddress || 'NOT SET'}`);

                const tokens = await getCoinsByChain(currentChain);
                console.log(`[EmbeddedWallet] Loaded ${tokens.length} tokens`);

                if (!activeWalletAddress) {
                    console.warn('[EmbeddedWallet] No wallet address - skipping balance fetch');
                    return;
                }

                if (tokens.length > 0) {
                    console.log(`[EmbeddedWallet] Calling loadAllTokenBalances with ${tokens.length} tokens`);
                    await loadAllTokenBalances(tokens, currentChain);
                } else {
                    console.warn('[EmbeddedWallet] No tokens loaded - skipping balance fetch');
                }
                return;
            }

            // Priority 2: Use wallet's connected chain
            if (walletData.chainId && walletData.chainId > 0) {
                let supportedChain = SupportedChains.find((chain: any) => chain.chainId === walletData.chainId);

                if (supportedChain) {
                    console.log(`[EmbeddedWallet] Using wallet's connected chain: ${supportedChain.name} (${supportedChain.chainId})`);
                    console.log(`[EmbeddedWallet] Active wallet address: ${activeWalletAddress || 'NOT SET'}`);
                    setCurrentChain(supportedChain);
                    setIsChainSupported(true);

                    const tokens = await getCoinsByChain(supportedChain);

                    if (!activeWalletAddress) {
                        console.warn('[EmbeddedWallet] No wallet address - skipping balance fetch');
                        return;
                    }

                    if (tokens.length > 0) {
                        await loadAllTokenBalances(tokens, supportedChain);
                    }
                    return;
                }
            }

            // Priority 3: Use first supported chain as fallback
            console.log('[EmbeddedWallet] Using default chain (first supported)');
            console.log(`[EmbeddedWallet] Active wallet address: ${activeWalletAddress || 'NOT SET'}`);
            const defaultChain = SupportedChains[0];
            setCurrentChain(defaultChain);
            setIsChainSupported(true);

            const tokens = await getCoinsByChain(defaultChain);

            if (!activeWalletAddress) {
                console.warn('[EmbeddedWallet] No wallet address - skipping balance fetch');
                return;
            }

            if (tokens.length > 0) {
                await loadAllTokenBalances(tokens, defaultChain);
            }
        };

        loadChainData();
    }, [isOpen, activeWalletAddress]);

    // Balances are loaded in the main useEffect when wallet opens
    // No need for a separate effect here

    // Reset view when wallet closes
    useEffect(() => {
        if (!isOpen) {
            setCurrentView('main');
            setSelectedToken(null);
            setActiveTab('tokens');
        }
    }, [isOpen]);

    // Add click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const walletElement = document.querySelector('.wallet-container');
            if (walletElement && !walletElement.contains(event.target as Node) && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Auto-refresh balances every 60 seconds when wallet is open
    useEffect(() => {
        if (!isOpen || !activeWalletAddress || !currentChain) {
            return;
        }

        console.log('[EmbeddedWallet] Starting 60-second auto-refresh');

        const refreshInterval = setInterval(async () => {
            console.log('[EmbeddedWallet] Auto-refreshing balances...');

            // Don't refresh if already loading or manually refreshing
            if (loading || refreshing) {
                console.log('[EmbeddedWallet] Skipping auto-refresh (already loading)');
                return;
            }

            // Clear cache to get fresh balances
            tokenBalanceService.clearCache(activeWalletAddress, currentChain.chainId);

            // Reload balances with current tokens
            if (availableTokens.length > 0) {
                await loadAllTokenBalances(availableTokens, currentChain);
            }
        }, 60000); // 60 seconds

        return () => {
            console.log('[EmbeddedWallet] Stopping auto-refresh');
            clearInterval(refreshInterval);
        };
    }, [isOpen, activeWalletAddress, currentChain?.chainId, availableTokens.length]);

    // Load all available tokens for the current chain (similar to Token UI)
    const getCoinsByChain = async (chain: any): Promise<Tokens[]> => {
        if (!chain || chain.chainId <= 0) {
            console.log('[EmbeddedWallet] Invalid chain provided to getCoinsByChain');
            return [];
        }

        // Check cache first
        const cacheKey = `tokenList_chain_${chain.chainId}`;
        const cacheExpiry = 3600000; // 1 hour cache

        if (typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const { tokens, timestamp } = JSON.parse(cached);
                    const age = Date.now() - timestamp;

                    if (age < cacheExpiry) {
                        console.log(`[EmbeddedWallet] Using cached token list for ${chain.name} (age: ${Math.round(age / 1000)}s)`);
                        console.log(`[EmbeddedWallet] Cached token count: ${tokens?.length || 0}`);

                        // If cache is empty or invalid, don't use it - fetch fresh
                        if (!tokens || tokens.length === 0) {
                            console.warn(`[EmbeddedWallet] ⚠️ Cache is empty! Clearing and fetching fresh...`);
                            localStorage.removeItem(cacheKey);
                        } else {
                            setAvailableTokens(tokens);
                            return tokens;
                        }
                    } else {
                        console.log(`[EmbeddedWallet] Cache expired for ${chain.name} (age: ${Math.round(age / 1000)}s)`);
                    }
                }
            } catch (e) {
                console.warn('[EmbeddedWallet] Failed to read token cache:', e);
            }
        }

        setLoadingTokens(true);
        console.log(`[EmbeddedWallet] Fetching fresh token list for chain: ${chain.name} (${chain.chainId})`);

        try {
            const chainForService = new Chains();
            chainForService.chainId = chain.chainId;
            chainForService.chainName = chain.name;
            chainForService.rpcUrl = chain.supportedRPC;

            // Fetch all available tokens for this chain
            const tokens = await cryptoService.GetAllAvailableCoinsRapidX(chainForService);
            console.log(`[EmbeddedWallet] GetAllAvailableCoinsRapidX returned ${tokens?.length || 0} tokens`);

            if (!tokens || tokens.length === 0) {
                console.error(`[EmbeddedWallet] ❌ No tokens returned from GetAllAvailableCoinsRapidX for ${chain.name}`);
                setAvailableTokens([]);
                setLoadingTokens(false);
                return [];
            }

            // CRITICAL: Filter to only include tokens that belong to this chain
            const correctChainTokens = tokens.filter(token => {
                // If token has chainId, it must match
                if (token.chainId && token.chainId !== chain.chainId) {
                    return false;
                }
                // Set chainId if not present
                if (!token.chainId) {
                    token.chainId = chain.chainId;
                }
                return true;
            });

            console.log(`[EmbeddedWallet] Filtered ${tokens.length} → ${correctChainTokens.length} tokens for chain ${chain.chainId}`);

            // Use ALL tokens - we'll check all of them for balances
            // Multicall3 can handle thousands of tokens efficiently with batching
            const tokensToUse = correctChainTokens;

            console.log(`[EmbeddedWallet] Will check balances for ALL ${tokensToUse.length} tokens`);

            // Debug: Check if native token is in the list
            const hasNative = tokensToUse.some(t => t.tokenIsNative === true);
            const nativeToken = tokensToUse.find(t => t.tokenIsNative === true);
            console.log(`[EmbeddedWallet] Native token in list: ${hasNative ? 'YES' : 'NO'}`, nativeToken ? `(${nativeToken.symbol})` : '');
            console.log(`[EmbeddedWallet] First 3 tokens:`, tokensToUse.slice(0, 3).map(t => ({symbol: t.symbol, native: t.tokenIsNative, addr: t.address?.substring(0, 10)})));

            // Save to cache (only if we have tokens)
            if (tokensToUse.length > 0 && typeof window !== 'undefined') {
                try {
                    localStorage.setItem(cacheKey, JSON.stringify({
                        tokens: tokensToUse,
                        timestamp: Date.now()
                    }));
                    console.log(`[EmbeddedWallet] ✅ Cached ${tokensToUse.length} tokens for ${chain.name}`);
                } catch (e) {
                    console.warn('[EmbeddedWallet] Failed to cache token list:', e);
                }
            } else if (tokensToUse.length === 0) {
                console.warn(`[EmbeddedWallet] ⚠️ Not caching empty token list for ${chain.name}`);
            }

            setAvailableTokens(tokensToUse);
            return tokensToUse;
        } catch (error) {
            console.error('[EmbeddedWallet] Error loading tokens:', error);
            setAvailableTokens([]);
            return [];
        } finally {
            setLoadingTokens(false);
        }
    };

    const loadAllTokenBalances = async (tokensToUse?: Tokens[], chainToUse?: any) => {
        // Use provided chain or fall back to currentChain
        const targetChain = chainToUse || currentChain;

        if (!activeWalletAddress || !targetChain) {
            console.log('[EmbeddedWallet] Cannot load balances - missing wallet or chain');
            return;
        }

        console.log(`[EmbeddedWallet] ════════════════════════════════════════`);
        console.log(`[EmbeddedWallet] LOADING BALANCES FOR: ${targetChain.name}`);
        console.log(`[EmbeddedWallet] Chain ID: ${targetChain.chainId}`);
        console.log(`[EmbeddedWallet] Wallet: ${activeWalletAddress}`);
        console.log(`[EmbeddedWallet] Tokens passed: ${tokensToUse ? tokensToUse.length : 'none (will use availableTokens)'}`);
        console.log(`[EmbeddedWallet] Available tokens in state: ${availableTokens.length}`);
        console.log(`[EmbeddedWallet] RPC Count: ${targetChain.supportedRPC?.length || 0}`);
        console.log(`[EmbeddedWallet] ════════════════════════════════════════`);

        // Try to load cached balances first for instant display
        let cacheLoaded = false;
        if (typeof window !== 'undefined') {
            try {
                const balanceCacheKey = `balances_${activeWalletAddress}_chain_${targetChain.chainId}`;
                const cached = localStorage.getItem(balanceCacheKey);
                if (cached) {
                    const { balances, timestamp } = JSON.parse(cached);
                    const age = Date.now() - timestamp;
                    const cacheExpiry = 60000; // 1 minute cache for balances

                    if (age < cacheExpiry) {
                        console.log(`[EmbeddedWallet] 📦 Loading cached balances (${Math.round(age / 1000)}s old)`);
                        setAllTokenBalances(balances);
                        const total = balances.reduce((sum: number, token: any) => sum + (token.balanceUSD || 0), 0);
                        setTotalBalance(total);
                        cacheLoaded = true;
                        console.log(`[EmbeddedWallet] ✅ Displayed ${balances.length} cached tokens, now fetching fresh data...`);
                    } else {
                        console.log(`[EmbeddedWallet] Cache expired (${Math.round(age / 1000)}s old), fetching fresh...`);
                    }
                }
            } catch (e) {
                console.warn('[EmbeddedWallet] Failed to load cached balances:', e);
            }
        }

        setLoading(true);

        // Validate that tokensToUse (if provided) match the target chain
        if (tokensToUse && tokensToUse.length > 0) {
            const firstToken = tokensToUse[0];
            if (firstToken.chainId && firstToken.chainId !== targetChain.chainId) {
                console.error(`[EmbeddedWallet] ❌ CHAIN MISMATCH! Tokens are for chain ${firstToken.chainId}, but target is ${targetChain.chainId}!`);
                setLoading(false);
                return;
            }
        }

        // Keep track of all balances as they come in
        const accumulatedBalances: TokenBalance[] = [];

        try {
            // Create chain object for TokenBalanceService
            const chainForService = new Chains();
            chainForService.chainId = targetChain.chainId;
            chainForService.chainName = targetChain.name;
            chainForService.rpcUrl = targetChain.supportedRPC; // This is the RPC array from SupportedChains

            console.log(`[EmbeddedWallet] Chain for balance fetch:`, {
                name: chainForService.chainName,
                chainId: chainForService.chainId,
                rpcCount: Array.isArray(chainForService.rpcUrl) ? chainForService.rpcUrl.length : 'NOT ARRAY',
                firstRpc: Array.isArray(chainForService.rpcUrl) ? chainForService.rpcUrl[0] : chainForService.rpcUrl
            });

            // First, get the native token
            const nativeToken = new Tokens();
            nativeToken.address = targetChain.nativeToken.address;
            nativeToken.symbol = targetChain.nativeToken.symbol;
            nativeToken.name = targetChain.nativeToken.name;
            nativeToken.tokenIsNative = targetChain.nativeToken.tokenIsNative;
            nativeToken.decimal = targetChain.nativeToken.decimal;
            nativeToken.chainId = targetChain.chainId;
            nativeToken.logoURI = targetChain.nativeToken.logoURI;

            // Progress callback - updates UI as balances come in
            const handleProgressUpdate = (newBalances: TokenBalance[]) => {
                console.log(`[EmbeddedWallet] 🔄 PROGRESS UPDATE: +${newBalances.length} tokens`);
                console.log(`[EmbeddedWallet] New tokens:`, newBalances.map(t => t.token.symbol));

                // Merge new balances with accumulated ones (avoid duplicates)
                newBalances.forEach(newBal => {
                    const exists = accumulatedBalances.find(b =>
                        b.token.address.toLowerCase() === newBal.token.address.toLowerCase() &&
                        b.token.symbol === newBal.token.symbol
                    );
                    if (!exists) {
                        accumulatedBalances.push(newBal);
                    }
                });

                // Sort tokens by balance USD
                const sortedTokens = [...accumulatedBalances].sort((a, b) => b.balanceUSD - a.balanceUSD);

                // Calculate total balance
                const total = sortedTokens.reduce((sum, token) => sum + (token.balanceUSD || 0), 0);

                console.log(`[EmbeddedWallet] 📊 Current totals: ${accumulatedBalances.length} tokens, $${total.toFixed(2)}`);

                // STOP LOADING SKELETON on first balance arrival
                if (newBalances.length > 0) {
                    console.log('[EmbeddedWallet] ✅ First balances arrived - stopping skeleton loader');
                    setLoading(false);
                }

                // Update token list immediately - PROGRESSIVE DISPLAY
                setAllTokenBalances(sortedTokens);

                // Update total balance
                setTotalBalance(total);

                console.log(`[EmbeddedWallet] ✅ UI updated with ${accumulatedBalances.length} total tokens displayed`);
            };

            let allTokens: TokenBalance[] = [];

            // STRATEGY: Try Mobula first (gets ALL tokens with balances), then fallback to Multicall3
            try {
                // Create new AbortController for this chain
                abortControllerRef.current = new AbortController();

                // Method 1: Try Mobula API first with 2-second timeout
                console.log(`[EmbeddedWallet] Trying Mobula API (2s timeout)...`);

                const mobulaPromise = tokenBalanceService.getTokenBalances(
                    activeWalletAddress,
                    chainForService,
                    [] // Empty array = fetch ALL tokens with balances from Mobula
                );

                const timeoutPromise = new Promise<any[]>((resolve) =>
                    setTimeout(() => {
                        console.log('[EmbeddedWallet] ⏱️ Mobula timeout (2s) - switching to Multicall3');
                        resolve([]);
                    }, 2000)
                );

                allTokens = await Promise.race([mobulaPromise, timeoutPromise]);

                if (allTokens && allTokens.length > 0) {
                    console.log(`[EmbeddedWallet] ✅ Mobula succeeded with ${allTokens.length} balances`);

                    // Update UI with Mobula results and STOP LOADING immediately
                    handleProgressUpdate(allTokens);
                    setLoading(false); // Stop loading skeleton
                } else {
                    console.log(`[EmbeddedWallet] Mobula returned no balances, falling back to Multicall3...`);

                    // Method 2: Fallback to Multicall3 with token list
                    let tokensToCheck = tokensToUse || availableTokens;

                    // ALWAYS ensure native token is included
                    const hasNativeToken = tokensToCheck.some(t =>
                        t.tokenIsNative === true ||
                        (t.address && t.address.toLowerCase() === nativeToken.address.toLowerCase())
                    );

                    if (!hasNativeToken) {
                        console.log(`[EmbeddedWallet] ⚠️ Native token ${nativeToken.symbol} NOT in token list, adding it`);
                        tokensToCheck = [nativeToken, ...tokensToCheck];
                    } else {
                        console.log(`[EmbeddedWallet] ✅ Native token ${nativeToken.symbol} already in token list`);
                    }

                    // Fallback to native token only if no tokens at all
                    if (tokensToCheck.length === 0) {
                        tokensToCheck = [nativeToken];
                    }

                    console.log(`[EmbeddedWallet] Using Multicall3 with ${tokensToCheck.length} tokens (including native: ${nativeToken.symbol})`);
                    console.log(`[EmbeddedWallet] Chain RPC URLs:`, chainForService.rpcUrl);

                    allTokens = await tokenBalanceService.getTokenBalancesWithFallback(
                        activeWalletAddress,
                        chainForService,
                        tokensToCheck,
                        handleProgressUpdate // Pass progress callback for real-time updates
                    );
                    console.log(`[EmbeddedWallet] Multicall3 returned ${allTokens.length} balances`);
                }
            } catch (fallbackError) {
                console.error('[EmbeddedWallet] Balance fetch failed:', fallbackError);
                allTokens = [];
            }

            // Final update (in case progress wasn't called)
            if (allTokens.length > 0 && accumulatedBalances.length === 0) {
                handleProgressUpdate(allTokens);
            }

            if (accumulatedBalances.length === 0 && allTokens.length === 0) {
                console.log('[EmbeddedWallet] No tokens with balances found');
                setAllTokenBalances([]);
                setTotalBalance(0);
            }

            // Cache balances in localStorage for instant loading next time
            if (allTokens.length > 0 && typeof window !== 'undefined') {
                try {
                    const balanceCacheKey = `balances_${activeWalletAddress}_chain_${targetChain.chainId}`;
                    const cacheData = {
                        balances: allTokens,
                        timestamp: Date.now()
                    };
                    localStorage.setItem(balanceCacheKey, JSON.stringify(cacheData));
                    console.log(`[EmbeddedWallet] Cached ${allTokens.length} balances for quick reload`);
                } catch (e) {
                    console.warn('[EmbeddedWallet] Failed to cache balances:', e);
                }
            }
        } catch (error) {
            console.error('[EmbeddedWallet] Error loading token balances:', error);
            setAllTokenBalances([]);
            setTotalBalance(0);
        } finally {
            setLoading(false);
        }
    };

    const refreshBalance = async () => {
        if (!activeWalletAddress || !currentChain) return;

        console.log('[EmbeddedWallet] Manual refresh triggered - clearing all caches...');
        setRefreshing(true);

        // Clear balance cache
        tokenBalanceService.clearCache(activeWalletAddress, currentChain.chainId);

        // Clear token list cache from localStorage
        const tokenCacheKey = `tokenList_chain_${currentChain.chainId}`;
        const balanceCacheKey = `balances_${activeWalletAddress}_chain_${currentChain.chainId}`;
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem(tokenCacheKey);
                localStorage.removeItem(balanceCacheKey);
                console.log('[EmbeddedWallet] Cleared token list and balance caches');
            } catch (e) {
                console.warn('[EmbeddedWallet] Failed to clear caches:', e);
            }
        }

        // Clear current balances
        setAllTokenBalances([]);
        setTotalBalance(0);

        // Reload fresh token list and balances
        try {
            console.log('[EmbeddedWallet] Reloading fresh token list...');
            const tokens = await getCoinsByChain(currentChain);

            console.log('[EmbeddedWallet] Reloading fresh balances...');
            await loadAllTokenBalances(tokens, currentChain);

            displayToast('Balances refreshed!');
        } catch (error) {
            console.error('[EmbeddedWallet] Refresh failed:', error);
            displayToast('Refresh failed');
        } finally {
            setRefreshing(false);
        }
    };

    const switchChainSelectedByUSer = async (newChain: any) => {
        if (!newChain || !newChain.chainId) {
            console.error('[EmbeddedWallet] Invalid chain provided');
            return;
        }

        if (newChain.chainId === currentChain?.chainId) {
            console.log(`[EmbeddedWallet] Already on ${newChain.name}, skipping`);
            setShowChainSelector(false);
            return;
        }

        console.log(`[EmbeddedWallet] ========== CHAIN SWITCH: ${currentChain?.name || 'none'} → ${newChain.name} (${newChain.chainId}) ==========`);

        // CRITICAL: Abort all ongoing requests from previous chain
        if (abortControllerRef.current) {
            console.log('[EmbeddedWallet] ⚠️ Aborting previous chain requests');
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // STEP 1: Clear ALL old data IMMEDIATELY and set new chain FIRST
        setShowChainSelector(false);
        setAllTokenBalances([]);
        setTotalBalance(0);
        setAvailableTokens([]);
        setLoading(true);

        // Clear cache for both old and new chains
        if (activeWalletAddress) {
            if (currentChain) {
                console.log(`[EmbeddedWallet] Clearing cache for old chain ${currentChain.chainId}`);
                tokenBalanceService.clearCache(activeWalletAddress, currentChain.chainId);
            }
            console.log(`[EmbeddedWallet] Clearing cache for new chain ${newChain.chainId}`);
            tokenBalanceService.clearCache(activeWalletAddress, newChain.chainId);
        }

        // CRITICAL: Set new chain BEFORE any async operations
        setCurrentChain(newChain);
        setIsChainSupported(true);

        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 50));

        if (!activeWalletAddress) {
            console.warn('[EmbeddedWallet] No wallet connected');
            setLoading(false);
            displayToast(`Switched to ${newChain.name}`);
            return;
        }

        try {
            // STEP 2: Load tokens for NEW chain
            console.log(`[EmbeddedWallet] Loading ${newChain.name} tokens...`);
            const tokens = await getCoinsByChain(newChain);
            console.log(`[EmbeddedWallet] ✓ Loaded ${tokens.length} tokens for ${newChain.name}`);
            console.log(`[EmbeddedWallet] Token chainIds check:`, tokens.slice(0, 5).map(t => ({ symbol: t.symbol, chainId: t.chainId })));

            if (tokens.length === 0) {
                console.warn('[EmbeddedWallet] No tokens loaded');
                setLoading(false);
                displayToast(`Switched to ${newChain.name}`);
                return;
            }

            // STEP 3: Fetch balances using NEW chain explicitly
            console.log(`[EmbeddedWallet] Fetching balances on ${newChain.name} (chainId: ${newChain.chainId})...`);
            console.log(`[EmbeddedWallet] Passing ${tokens.length} tokens to loadAllTokenBalances`);
            await loadAllTokenBalances(tokens, newChain);
            console.log(`[EmbeddedWallet] ✓ Balance fetch complete`);
            displayToast(`Switched to ${newChain.name}`);

        } catch (error) {
            console.error('[EmbeddedWallet] Chain switch failed:', error);
            displayToast(`Error: ${error.message}`);
            setLoading(false);
        }
    };

    const generateQRCode = () => {
        if (qrCanvasRef.current && typeof window !== 'undefined' && activeWalletAddress) {
            import('qrious').then(({ default: QRious }) => {
                new QRious({
                    element: qrCanvasRef.current,
                    value: activeWalletAddress,
                    size: 200,
                    foreground: '#000',
                    background: '#fff'
                });
            }).catch(console.error);
        }
    };

    const copyAddress = async () => {
        if (navigator.clipboard && activeWalletAddress) {
            try {
                await navigator.clipboard.writeText(activeWalletAddress);
                displayToast('Address copied!');
            } catch (error) {
                displayToast('Copy failed');
            }
        }
    };

    const openQRView = () => {
        generateQRCode();
        setCurrentView('qr');
    };

    const openBlockExplorer = () => {
        if (currentChain && walletData.blockExplorer) {
            const url = `${walletData.blockExplorer.url}/address/${activeWalletAddress}`;
            window.open(url, '_blank');
        }
    };

    const displayToast = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const formatBalance = (balance: number): string => {
        if (balance === 0) return '0';
        if (balance < 0.0001) return '< 0.0001';
        if (balance < 1) return balance.toFixed(4);
        if (balance < 1000) return balance.toFixed(2);
        return balance.toLocaleString();
    };

    const formatUSD = (value: number): string => {
        if (value === 0) return '$0.00';
        if (value < 0.01) return '< $0.01';
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatPercentage = (value: number): string => {
        const prefix = value >= 0 ? '+' : '';
        return `${prefix}${value.toFixed(2)}%`;
    };

    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
        displayToast(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    };

    function diconnectWallet() {
        disconnect();
        onClose();
        //clearWalletData();
    }

    function clearWalletData() {
        sharedService.removeData(Keys.WALLET_CONNECT_DATA);
        sharedService.removeData(Keys.ACTIVE_TRANASCTION_DATA);
        dispatch(SetActiveTransactionA(new TransactionRequestoDto()));
        dispatch(SetWalletDataA(new WalletConnectData()));
        dispatch(SetWalletDisconnectedA(true));
        dispatch(OpenWalletModalA(false))
    }


    if (!isOpen) return null;

    return (
        <>
            {/* Modern Wallet Container */}
            <div className="wallet-wrapper">
                <div className="wallet-container">

                    {/* Main View */}
                    <div className={`wallet-view ${currentView === 'main' ? 'active' : ''}`}>
                        {/* Header */}
                        <div className="wallet-header">
                            <div className="wallet-address" onClick={openQRView}>
                                <div className="address-avatar">
                                    <div className="avatar-gradient"></div>
                                </div>
                                <span className="address-text">
                                    {activeWalletAddress?.substring(0, 6)}...{activeWalletAddress?.substring(activeWalletAddress.length - 4)}
                                </span>
                            </div>

                            <div className="header-actions">
                                <button className="chain-selector" onClick={() => setShowChainSelector(!showChainSelector)}>
                                    {currentChain?.logoURI ? (
                                        <img src={currentChain.logoURI} alt="" className="chain-icon" />
                                    ) : (
                                        <div className="chain-icon-placeholder"></div>
                                    )}
                                    {/* <span className="chain-name">{currentChain?.name || 'Select'}</span> */}
                                    <i className="fas fa-chevron-down"></i>
                                </button>

                                <button className="icon-button" onClick={onClose}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>

                        {/* Chain Selector Dropdown */}
                        {showChainSelector && (
                            <div className="chain-dropdown">
                                {SupportedChains.map((chain: any) => (
                                    <div
                                        key={chain.chainId}
                                        className={`chain-option ${currentChain?.chainId === chain.chainId ? 'active' : ''}`}
                                        onClick={() => switchChainSelectedByUSer(chain)}
                                    >
                                        {chain.logoURI && (
                                            <img src={chain.logoURI} alt="" className="chain-icon" />
                                        )}
                                        <span>{chain.name}</span>
                                        {currentChain?.chainId === chain.chainId && (
                                            <i className="fas fa-check"></i>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Balance Section */}
                        <div className="balance-section">
                            <div className="total-balance">
                                <div className="balance-header">
                                    <span className="balance-label">Portfolio Balance</span>
                                    <button className="icon-button-sm" onClick={refreshBalance}>
                                        <i className={`fas fa-sync-alt ${refreshing ? 'spinning' : ''}`}></i>
                                    </button>
                                    <button className="icon-button-sm" onClick={toggleFavorite}>
                                        <i className={`${isFavorite ? 'fas' : 'far'} fa-star`}></i>
                                    </button>
                                </div>
                                <div className="balance-amount">
                                    {formatUSD(totalBalance)}
                                </div>
                                <div className="balance-change positive">
                                    <i className="fas fa-arrow-up"></i>
                                    <span>$4.67 (0.82%)</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="action-buttons">
                                <button className="action-btn" onClick={openQRView}>
                                    <div className="action-icon">

                                        <i className="fas fa-qrcode"></i>
                                    </div>
                                    <span>Qr Code</span>
                                </button>
                                <button className="action-btn" onClick={() => window.open("/transaction-history", "_blank", "noopener,noreferrer")}>
                                    <div className="action-icon">
                                        <i className="fas fa-history"></i>

                                    </div>
                                    <span>Transaction</span>
                                </button>

                                <button className="action-btn" onClick={openBlockExplorer}>
                                    <div className="action-icon">
                                        <i className="fas fa-external-link-alt"></i>
                                    </div>
                                    <span>Explorer</span>
                                </button>
                                <button className="action-btn" onClick={() => diconnectWallet()}>
                                    <div className="action-icon">

                                        <i className="fa-solid fa-power-off"></i>
                                    </div>
                                    <span>Disconnet</span>
                                </button>

                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="wallet-tabs">
                            <button
                                className={`tab ${activeTab === 'tokens' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tokens')}
                            >
                                <i className="fas fa-coins"></i>
                                <span>Tokens</span>
                            </button>
                            {/* <button
                                className={`tab ${activeTab === 'nfts' ? 'active' : ''}`}
                                onClick={() => setActiveTab('nfts')}
                            >
                                <i className="fas fa-images"></i>
                                <span>NFTs</span>
                            </button>
                            <button
                                className={`tab ${activeTab === 'pools' ? 'active' : ''}`}
                                onClick={() => setActiveTab('pools')}
                            >
                                <i className="fas fa-water"></i>
                                <span>Pools</span>
                            </button> */}
                            <button
                                className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
                                onClick={() => window.open("/transaction-history", "_blank", "noopener,noreferrer")}
                            >
                                <i className="fas fa-history"></i>
                                <span>Activity</span>
                            </button>
                        </div>

                        {/* Token List */}
                        <div className={`tab-content ${activeTab === 'tokens' ? 'active' : ''}`}>
                            {loading ? (
                                <div className="loading-state">
                                    <div className="skeleton-loader"></div>
                                    <div className="skeleton-loader"></div>
                                    <div className="skeleton-loader"></div>
                                </div>
                            ) : allTokenBalances.length > 0 ? (
                                <div className="token-list">
                                    {allTokenBalances.map((tokenBalance, index) => (
                                        <div
                                            key={`${tokenBalance.token.address}-${index}`}
                                            className="token-item"
                                            onClick={() => { setSelectedToken(tokenBalance); setCurrentView('tokenDetail'); }}
                                        >
                                            <div className="token-info">
                                                <div className="token-icon">
                                                    {tokenBalance.token.logoURI ? (
                                                        <img src={tokenBalance.token.logoURI} alt="" />
                                                    ) : (
                                                        <div className="token-icon-placeholder">
                                                            {tokenBalance.token.symbol?.substring(0, 2)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="token-details">
                                                    <div className="token-name">{tokenBalance.token.symbol}</div>
                                                    <div className="token-network">{tokenBalance.token.name || currentChain?.name}</div>
                                                </div>
                                            </div>
                                            <div className="token-balance">
                                                <div className="token-amount">{formatBalance(tokenBalance.balance)}</div>
                                                <div className="token-value">
                                                    <span>{formatUSD(tokenBalance.balanceUSD)}</span>
                                                    <span className={`token-change ${tokenBalance.price > 0 ? 'positive' : 'negative'}`}>
                                                        {formatPercentage(0)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-coins"></i>
                                    <p>No tokens found</p>
                                </div>
                            )}
                        </div>

                        {/* NFTs Tab */}
                        <div className={`tab-content ${activeTab === 'nfts' ? 'active' : ''}`}>
                            <div className="nft-grid">
                                <div className="nft-item">
                                    <div className="nft-image">
                                        <div className="nft-placeholder">
                                            <i className="fas fa-image"></i>
                                        </div>
                                    </div>
                                    <div className="nft-info">
                                        <span className="nft-name">CryptoPunk #1234</span>
                                        <span className="nft-price">45.2 ETH</span>
                                    </div>
                                </div>
                                <div className="nft-item">
                                    <div className="nft-image">
                                        <div className="nft-placeholder">
                                            <i className="fas fa-image"></i>
                                        </div>
                                    </div>
                                    <div className="nft-info">
                                        <span className="nft-name">Bored Ape #5678</span>
                                        <span className="nft-price">28.1 ETH</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pools Tab */}
                        <div className={`tab-content ${activeTab === 'pools' ? 'active' : ''}`}>
                            <div className="empty-state">
                                <i className="fas fa-water"></i>
                                <p>No liquidity positions</p>
                            </div>
                        </div>

                        {/* Activity Tab */}
                        <div className={`tab-content ${activeTab === 'activity' ? 'active' : ''}`}>
                            <div className="activity-list">
                                <div className="activity-item">
                                    <div className="activity-icon send">
                                        <i className="fas fa-arrow-up"></i>
                                    </div>
                                    <div className="activity-details">
                                        <span className="activity-type">Sent</span>
                                        <span className="activity-time">2 hours ago</span>
                                    </div>
                                    <div className="activity-amount negative">
                                        -0.005 ETH
                                    </div>
                                </div>
                                <div className="activity-item">
                                    <div className="activity-icon receive">
                                        <i className="fas fa-arrow-down"></i>
                                    </div>
                                    <div className="activity-details">
                                        <span className="activity-type">Received</span>
                                        <span className="activity-time">1 day ago</span>
                                    </div>
                                    <div className="activity-amount positive">
                                        +0.001 ETH
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* QR Code View */}
                    <div className={`wallet-view qr-view ${currentView === 'qr' ? 'active' : ''}`}>
                        <div className="detail-header">
                            <button className="back-button" onClick={() => setCurrentView('main')}>
                                <i className="fas fa-arrow-left"></i>
                            </button>
                            <div className="detail-title">
                                <span>Wallet Address</span>
                                <span className="detail-network">Scan or Copy</span>
                            </div>
                            <button className="icon-button" onClick={() => setCurrentView('main')}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="detail-content">
                            <div className="qr-section">
                                <div className="qr-container inline">
                                    <canvas ref={qrCanvasRef}></canvas>
                                </div>
                                <div className="address-display inline">
                                    <span>{activeWalletAddress}</span>
                                </div>
                                <div className="qr-actions">
                                    <button className="primary-button full-width" onClick={copyAddress}>
                                        <i className="fas fa-copy"></i>
                                        Copy Address
                                    </button>
                                    <button className="secondary-button full-width" onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({
                                                title: 'My Wallet Address',
                                                text: activeWalletAddress || ''
                                            });
                                        } else {
                                            copyAddress();
                                        }
                                    }}>
                                        <i className="fas fa-share"></i>
                                        Share Address
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Token Detail View */}
                    <div className={`wallet-view token-detail-view ${currentView === 'tokenDetail' ? 'active' : ''}`}>
                        {selectedToken && (
                            <>
                                <div className="detail-header">
                                    <button className="back-button" onClick={() => setCurrentView('main')}>
                                        <i className="fas fa-arrow-left"></i>
                                    </button>
                                    <div className="detail-title">
                                        <span>{selectedToken.token.symbol}</span>
                                        <span className="detail-network">{currentChain?.name}</span>
                                    </div>
                                    <button className="icon-button">
                                        <i className="fas fa-ellipsis-v"></i>
                                    </button>
                                </div>

                                <div className="detail-content">
                                    <div className="token-detail-balance">
                                        <div className="detail-token-icon">
                                            {selectedToken.token.logoURI ? (
                                                <img src={selectedToken.token.logoURI} alt="" />
                                            ) : (
                                                <div className="token-icon-placeholder large">
                                                    {selectedToken.token.symbol?.substring(0, 2)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="detail-balance-amount">
                                            {formatBalance(selectedToken.balance)} {selectedToken.token.symbol}
                                        </div>
                                        <div className="detail-balance-value">
                                            {formatUSD(selectedToken.balanceUSD)}
                                        </div>
                                    </div>

                                    <div className="price-chart">
                                        <div className="chart-placeholder">
                                            <i className="fas fa-chart-line"></i>
                                            <span>Price Chart</span>
                                        </div>
                                    </div>

                                    <div className="token-stats">
                                        <div className="stat-item">
                                            <span className="stat-label">Price</span>
                                            <span className="stat-value">{formatUSD(selectedToken.price)}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">24h Change</span>
                                            <span className="stat-value positive">+0.00%</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Market Cap</span>
                                            <span className="stat-value">$555.2B</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Volume</span>
                                            <span className="stat-value">$12.4B</span>
                                        </div>
                                    </div>

                                    <div className="detail-actions">
                                        <button className="primary-button">
                                            <i className="fas fa-paper-plane"></i>
                                            Send
                                        </button>
                                        <button className="secondary-button">
                                            <i className="fas fa-exchange-alt"></i>
                                            Swap
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Toast */}
                {showToast && (
                    <div className="toast-notification">
                        <i className="fas fa-check-circle"></i>
                        <span>{toastMessage}</span>
                    </div>
                )}
            </div >


        </>
    );
}