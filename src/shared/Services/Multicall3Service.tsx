// Multicall3Service.tsx
import { Chains, Tokens } from '@/shared/Models/Common.model';
import { ethers } from 'ethers';

interface MulticallResult {
    success: boolean;
    returnData: string;
}

interface TokenBalance {
    token: Tokens;
    balance: number;
    balanceRaw: string;
}

interface ProgressCallback {
    (balances: TokenBalance[]): void;
}

export class Multicall3Service {
    private static instance: Multicall3Service;

    // Multicall3 is deployed at the same address on all major chains
    private readonly MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';

    // Minimal Multicall3 ABI - only what we need
    private readonly MULTICALL3_ABI = [
        {
            "inputs": [
                {
                    "components": [
                        { "internalType": "address", "name": "target", "type": "address" },
                        { "internalType": "bool", "name": "allowFailure", "type": "bool" },
                        { "internalType": "bytes", "name": "callData", "type": "bytes" }
                    ],
                    "internalType": "struct Multicall3.Call3[]",
                    "name": "calls",
                    "type": "tuple[]"
                }
            ],
            "name": "aggregate3",
            "outputs": [
                {
                    "components": [
                        { "internalType": "bool", "name": "success", "type": "bool" },
                        { "internalType": "bytes", "name": "returnData", "type": "bytes" }
                    ],
                    "internalType": "struct Multicall3.Result[]",
                    "name": "returnData",
                    "type": "tuple[]"
                }
            ],
            "stateMutability": "payable",
            "type": "function"
        }
    ];

    // ERC20 balanceOf ABI
    private readonly ERC20_BALANCE_ABI = [
        {
            "constant": true,
            "inputs": [{ "name": "_owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "name": "balance", "type": "uint256" }],
            "type": "function"
        }
    ];

    private constructor() {}

    public static getInstance(): Multicall3Service {
        if (!Multicall3Service.instance) {
            Multicall3Service.instance = new Multicall3Service();
        }
        return Multicall3Service.instance;
    }

    /**
     * Validate if address is a valid Ethereum address
     */
    private isValidAddress(address: string): boolean {
        if (!address) return false;

        // Filter out addresses with colons (invalid for EVM chains)
        if (address.includes(':')) {
            console.log(`[Multicall3] Skipping invalid address with colon: ${address}`);
            return false;
        }

        // Check if it's a valid hex address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            console.log(`[Multicall3] Skipping invalid address format: ${address}`);
            return false;
        }

        return true;
    }

    /**
     * Get token balances using Multicall3
     * This is the main function that handles RPC rotation and fallback
     */
    public async getTokenBalances(
        walletAddress: string,
        chain: Chains,
        tokens: Tokens[],
        onProgress?: ProgressCallback
    ): Promise<TokenBalance[]> {
        if (!walletAddress || !chain || !tokens || tokens.length === 0) {
            return [];
        }

        console.log(`[Multicall3] Fetching ${tokens.length} token balances for chain ${chain.chainId}`);

        // Check if native token is in the input
        const nativeTokenInput = tokens.find(t => t.tokenIsNative === true);
        console.log(`[Multicall3] Native token in input: ${nativeTokenInput ? 'YES (' + nativeTokenInput.symbol + ')' : 'NO'}`);

        // Note: Address validation happens in fetchBalancesWithRPC during call preparation

        // Get RPC URLs from chain config
        let rpcUrls = chain.rpcUrl || [];

        // Ensure rpcUrls is an array
        if (!Array.isArray(rpcUrls)) {
            console.warn('[Multicall3] rpcUrl is not an array, converting:', rpcUrls);
            rpcUrls = [rpcUrls];
        }

        if (rpcUrls.length === 0) {
            console.error('[Multicall3] No RPC URLs available for chain', chain.chainId);
            return [];
        }

        console.log(`[Multicall3] Chain ${chain.chainId} has ${rpcUrls.length} RPC URLs:`, rpcUrls.map(url => url.substring(0, 50)));

        // Try each RPC endpoint until one succeeds
        for (let i = 0; i < rpcUrls.length; i++) {
            const rpcUrl = rpcUrls[i];
            console.log(`[Multicall3] Trying RPC ${i + 1}/${rpcUrls.length}: ${rpcUrl.substring(0, 50)}...`);

            try {
                // Pass ORIGINAL tokens array (includes native), not validTokens (filtered)
                const balances = await this.fetchBalancesWithRPC(
                    walletAddress,
                    chain,
                    tokens,  // Pass original tokens, not validTokens
                    rpcUrl,
                    onProgress
                );

                console.log(`[Multicall3] Successfully fetched ${balances.length} balances using RPC ${i + 1}`);
                return balances;

            } catch (error: any) {
                console.error(`[Multicall3] RPC ${i + 1} failed:`, error.message || error);

                // If this is the last RPC, throw the error
                if (i === rpcUrls.length - 1) {
                    console.error('[Multicall3] All RPC endpoints failed');
                    throw error;
                }

                // Otherwise, try next RPC
                console.log(`[Multicall3] Trying next RPC...`);
            }
        }

        return [];
    }

    /**
     * Fetch balances using a specific RPC endpoint
     * Now with parallel batch processing and progress callbacks
     */
    private async fetchBalancesWithRPC(
        walletAddress: string,
        chain: Chains,
        tokens: Tokens[],
        rpcUrl: string,
        onProgress?: ProgressCallback
    ): Promise<TokenBalance[]> {
        // Create provider
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // Create multicall contract instance
        const multicall = new ethers.Contract(
            this.MULTICALL3_ADDRESS,
            this.MULTICALL3_ABI,
            provider
        );

        // Prepare multicall calls
        const calls: any[] = [];
        const tokensList: Tokens[] = []; // Track tokens for non-native only
        let nativeTokenIncluded = false;

        for (const token of tokens) {
            if (token.tokenIsNative) {
                nativeTokenIncluded = true;
                // For native tokens, we'll fetch separately using eth_getBalance
                continue;
            }

            // Validate address before adding to multicall
            if (!this.isValidAddress(token.address)) {
                // Skip invalid addresses silently
                continue;
            }

            // Encode balanceOf call
            const erc20Interface = new ethers.Interface(this.ERC20_BALANCE_ABI);
            const callData = erc20Interface.encodeFunctionData('balanceOf', [walletAddress]);

            calls.push({
                target: token.address,
                allowFailure: true, // Don't revert entire batch if one token fails
                callData: callData
            });

            tokensList.push(token);
        }

        console.log(`[Multicall3] Prepared ${calls.length} ERC20 calls, native token: ${nativeTokenIncluded ? 'yes' : 'no'}`);

        const results: TokenBalance[] = [];

        // Fetch native token balance separately if needed
        const nativeToken = tokens.find(t => t.tokenIsNative);
        if (nativeToken) {
            try {
                console.log(`[Multicall3] Fetching native token ${nativeToken.symbol} balance...`);
                const nativeBalance = await provider.getBalance(walletAddress);
                const balanceFormatted = Number(ethers.formatUnits(nativeBalance, nativeToken.decimal || 18));

                console.log(`[Multicall3] Native token balance: ${balanceFormatted} ${nativeToken.symbol}`);

                // ALWAYS include native token, even if balance is 0
                const nativeResult = {
                    token: nativeToken,
                    balance: balanceFormatted,
                    balanceRaw: nativeBalance.toString()
                };

                results.push(nativeResult);

                // Immediately notify progress with native token
                if (onProgress) {
                    onProgress([nativeResult]);
                }
            } catch (error) {
                console.error('[Multicall3] Failed to fetch native balance:', error);
            }
        }

        // If no ERC20 tokens to check, return early
        if (calls.length === 0) {
            return results;
        }

        // Execute multicall in batches - process batches in PARALLEL for speed
        // Larger batches for better efficiency with thousands of tokens
        const batchSize = 200; // 200 tokens per batch (increased from 100)
        const batches: { calls: any[], tokens: Tokens[], index: number }[] = [];

        for (let i = 0; i < calls.length; i += batchSize) {
            batches.push({
                calls: calls.slice(i, i + batchSize),
                tokens: tokensList.slice(i, i + batchSize),
                index: Math.floor(i / batchSize)
            });
        }

        console.log(`[Multicall3] Processing ${batches.length} batches (${calls.length} tokens total) with maximum concurrency`);

        // Process batches with high concurrency for maximum speed
        const maxConcurrent = 30; // Process 30 batches at a time (increased from 20)
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // Function to process a single batch with 4-second timeout
        const processBatch = async (batch: { calls: any[], tokens: Tokens[], index: number }) => {
            try {
                console.log(`[Multicall3] Executing batch ${batch.index + 1}/${batches.length}, tokens: ${batch.calls.length}`);

                // Use staticCall with 4-second timeout
                const batchPromise = multicall.aggregate3.staticCall(batch.calls);
                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Batch timeout (4s)')), 4000)
                );

                const batchResults: MulticallResult[] = await Promise.race([batchPromise, timeoutPromise]);

                const batchBalances: TokenBalance[] = [];

                // Process results
                batchResults.forEach((result, index) => {
                    const token = batch.tokens[index];

                    // Check if call succeeded and returned data
                    if (result.success && result.returnData && result.returnData !== '0x' && result.returnData.length > 2) {
                        try {
                            // Decode the balance
                            const balance = ethers.toBigInt(result.returnData);
                            const balanceFormatted = Number(ethers.formatUnits(balance, token.decimal || 18));

                            // Only include tokens with non-zero balance
                            if (balanceFormatted > 0) {
                                batchBalances.push({
                                    token: token,
                                    balance: balanceFormatted,
                                    balanceRaw: balance.toString()
                                });
                            }
                        } catch (decodeError) {
                            // Silently skip tokens that fail to decode (invalid contracts)
                            // This is normal for tokens that don't exist on this chain
                        }
                    }
                    // If result.success is false, the token contract doesn't exist or doesn't support balanceOf
                    // This is expected for many tokens, so we just skip them silently
                });

                if (batchBalances.length > 0) {
                    console.log(`[Multicall3] ✅ Batch ${batch.index + 1} completed with ${batchBalances.length} valid balances`);
                    console.log(`[Multicall3] Tokens found:`, batchBalances.map(b => b.token.symbol).join(', '));
                } else {
                    console.log(`[Multicall3] Batch ${batch.index + 1} completed with 0 balances`);
                }

                // Notify progress IMMEDIATELY when this batch completes
                if (onProgress && batchBalances.length > 0) {
                    console.log(`[Multicall3] 📢 Calling progress callback with ${batchBalances.length} tokens`);
                    onProgress(batchBalances);
                } else if (!onProgress) {
                    console.warn(`[Multicall3] ⚠️ No progress callback provided!`);
                }

                return { success: true, balances: batchBalances };

            } catch (error: any) {
                // Log error but don't fail the entire process
                const errorMsg = error.message || error.toString();
                if (errorMsg.includes('Batch timeout')) {
                    console.warn(`[Multicall3] ⏱️ Batch ${batch.index + 1} timeout (4s) - skipping and continuing...`);
                } else if (errorMsg.includes('Too Many Requests') || errorMsg.includes('429')) {
                    console.warn(`[Multicall3] Batch ${batch.index + 1} hit rate limit, continuing...`);
                } else {
                    console.warn(`[Multicall3] Batch ${batch.index + 1} failed:`, errorMsg.substring(0, 100));
                }
                return { success: false, balances: [] };
            }
        };

        // Process batches in chunks with controlled concurrency
        const allResults: any[] = [];

        for (let i = 0; i < batches.length; i += maxConcurrent) {
            const chunk = batches.slice(i, i + maxConcurrent);
            console.log(`[Multicall3] Processing chunk ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(batches.length / maxConcurrent)}`);

            const chunkPromises = chunk.map(batch => processBatch(batch));
            const chunkResults = await Promise.allSettled(chunkPromises);
            allResults.push(...chunkResults);

            // Minimal delay between chunks for maximum speed
            if (i + maxConcurrent < batches.length) {
                await delay(20); // 20ms delay between chunks (reduced from 50ms)
            }
        }

        const batchResultsSettled = allResults;

        // Collect all successful results
        batchResultsSettled.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.success) {
                results.push(...result.value.balances);
            }
        });

        console.log(`[Multicall3] ✅ All batches completed!`);
        console.log(`[Multicall3] Total tokens checked: ${calls.length}`);
        console.log(`[Multicall3] Total balances found: ${results.length}`);
        console.log(`[Multicall3] Success rate: ${((results.length / calls.length) * 100).toFixed(2)}%`);

        return results;
    }

    /**
     * Check if Multicall3 is available on the chain
     */
    public async isMulticallAvailable(rpcUrl: string): Promise<boolean> {
        try {
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            const code = await provider.getCode(this.MULTICALL3_ADDRESS);
            return code !== '0x';
        } catch (error) {
            console.error('[Multicall3] Failed to check availability:', error);
            return false;
        }
    }
}
