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
     * Get token balances using Multicall3
     * This is the main function that handles RPC rotation and fallback
     */
    public async getTokenBalances(
        walletAddress: string,
        chain: Chains,
        tokens: Tokens[]
    ): Promise<TokenBalance[]> {
        if (!walletAddress || !chain || !tokens || tokens.length === 0) {
            return [];
        }

        console.log(`[Multicall3] Fetching ${tokens.length} token balances for chain ${chain.chainId}`);

        // Get RPC URLs from chain config
        const rpcUrls = chain.rpcUrl || [];

        if (rpcUrls.length === 0) {
            console.error('[Multicall3] No RPC URLs available for chain', chain.chainId);
            return [];
        }

        // Try each RPC endpoint until one succeeds
        for (let i = 0; i < rpcUrls.length; i++) {
            const rpcUrl = rpcUrls[i];
            console.log(`[Multicall3] Trying RPC ${i + 1}/${rpcUrls.length}: ${rpcUrl.substring(0, 30)}...`);

            try {
                const balances = await this.fetchBalancesWithRPC(
                    walletAddress,
                    chain,
                    tokens,
                    rpcUrl
                );

                console.log(`[Multicall3] Successfully fetched ${balances.length} balances using RPC ${i + 1}`);
                return balances;

            } catch (error) {
                console.error(`[Multicall3] RPC ${i + 1} failed:`, error);

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
     */
    private async fetchBalancesWithRPC(
        walletAddress: string,
        chain: Chains,
        tokens: Tokens[],
        rpcUrl: string
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

        for (const token of tokens) {
            if (token.tokenIsNative) {
                // For native tokens, we'll fetch separately using eth_getBalance
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

        const results: TokenBalance[] = [];

        // Fetch native token balance separately if needed
        const nativeToken = tokens.find(t => t.tokenIsNative);
        if (nativeToken) {
            try {
                const nativeBalance = await provider.getBalance(walletAddress);
                const balanceFormatted = Number(ethers.formatUnits(nativeBalance, nativeToken.decimal || 18));

                results.push({
                    token: nativeToken,
                    balance: balanceFormatted,
                    balanceRaw: nativeBalance.toString()
                });

                console.log(`[Multicall3] Native token balance: ${balanceFormatted} ${nativeToken.symbol}`);
            } catch (error) {
                console.error('[Multicall3] Failed to fetch native balance:', error);
            }
        }

        // If no ERC20 tokens to check, return early
        if (calls.length === 0) {
            return results;
        }

        // Execute multicall in batches of 100 to avoid RPC limits
        const batchSize = 100;

        for (let i = 0; i < calls.length; i += batchSize) {
            const batchCalls = calls.slice(i, i + batchSize);
            const batchTokens = tokensList.slice(i, i + batchSize);

            try {
                console.log(`[Multicall3] Executing batch ${Math.floor(i / batchSize) + 1}, calls: ${batchCalls.length}`);

                const batchResults: MulticallResult[] = await multicall.aggregate3(batchCalls);

                // Process results
                batchResults.forEach((result, index) => {
                    const token = batchTokens[index];

                    if (result.success && result.returnData !== '0x') {
                        try {
                            // Decode the balance
                            const balance = ethers.toBigInt(result.returnData);
                            const balanceFormatted = Number(ethers.formatUnits(balance, token.decimal || 18));

                            // Only include tokens with non-zero balance
                            if (balanceFormatted > 0) {
                                results.push({
                                    token: token,
                                    balance: balanceFormatted,
                                    balanceRaw: balance.toString()
                                });

                                console.log(`[Multicall3] ${token.symbol}: ${balanceFormatted}`);
                            }
                        } catch (error) {
                            console.error(`[Multicall3] Failed to decode balance for ${token.symbol}:`, error);
                        }
                    }
                });

            } catch (error) {
                console.error(`[Multicall3] Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
                // Continue with next batch instead of failing completely
            }
        }

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
