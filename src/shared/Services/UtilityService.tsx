import { ethers } from 'ethers';

import { BigNumberish } from 'ethers';
//import { Chain } from 'viem';
import { Chains, TokenBase, Tokens } from '../Models/Common.model';
import type { Chain } from "wagmi/chains"; // Import Chain type
import * as definedChains from "wagmi/chains";
import { i18n } from '../Const/i18n';


export class UtilityService {
    async convertToDecimals(amount: number, decimals: number): Promise<string> {
        try {
            // Use ethers.js to handle the conversion
            const parsedAmount = ethers.parseUnits(amount.toString(), decimals);
            return parsedAmount.toString();
        } catch (error) {
            console.error("Error converting amount to decimals:", error);
            return '0';
        }
    }

    async convertToNumber(decimalString: string, decimals: number): Promise<number> {
        try {
            // Use ethers.js to handle the conversion
            const formattedAmount = ethers.formatUnits(decimalString, decimals);
            return parseFloat(formattedAmount);
        } catch (error) {
            console.error("Error converting decimal string to number:", error);
            return 0;
        }
    }

    async formatDuration(seconds) {
        let result;
        if (seconds < 1) {
            // Convert to milliseconds
            const milliseconds = Math.round(seconds * 1000);
            result = `${milliseconds} milliseconds`;
        } else if (seconds < 60) {
            // Show in seconds
            result = `${seconds} seconds`;
        } else {
            // Convert to minutes and seconds
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            result = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
            if (remainingSeconds > 0) {
                result += ` ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
            }
        }

        return result;
    }
    // Function to convert hexadecimal to decimal
    async hexToDecimal(hexValue) {
        try {
            // Convert the hex value to BigNumber
            const decimalValue = BigInt(hexValue);
            // Return the decimal value as a string
            return decimalValue;
        } catch (error) {
            console.error('Invalid hexadecimal value:', error);
            return null;
        }
    }

    async checkCoinNative(chain: Chains, token: Tokens) {
        let value = await this.hexToDecimal(token.address)

        if (value === BigInt(0)) {
            return true;
        }
        return false;
    }

    async getBalance(tokenIsNative, token: Tokens, userAddress: string, providerUrl: string): Promise<string> {
        try {
            // Create a provider using the passed provider URL
            const provider = new ethers.JsonRpcProvider(providerUrl);

            // Define the minimal ABI for balance and decimals
            const tokenABI = [
                "function balanceOf(address owner) view returns (uint256)",
                "function decimals() view returns (uint8)"
            ];


            if (tokenIsNative == true) {
                const balance = await provider.getBalance(userAddress);

                const formattedBalance = ethers.formatUnits(balance, token.decimal);

                console.log(`Balance: ${formattedBalance} tokens`);

                return formattedBalance;



            }

            // Create a contract instance
            const tokenContract = new ethers.Contract(token.address, tokenABI, provider);

            // Fetch balance and decimals
            const balance = await tokenContract.balanceOf(userAddress);
            const decimals = await tokenContract.decimals();

            // Convert balance to a human-readable format
            const formattedBalance = ethers.formatUnits(balance, decimals);

            console.log(`Balance: ${formattedBalance} tokens`);
            return formattedBalance;
        } catch (error) {
            console.error('Error fetching balance:', error);
            return '0';
        }
    }

    async findWorkingRPC(chainId: number, rpcUrls: string[], timeout = 3000): Promise<string | null> {
        const checkRPC = async (rpcUrl: string): Promise<string | null> => {
            return new Promise((resolve) => {
                const provider = new ethers.JsonRpcProvider(rpcUrl);
                const timeoutId = setTimeout(() => {
                    resolve(null);
                }, timeout);

                provider.getNetwork().then((network) => {
                    clearTimeout(timeoutId);
                    if (Number(network.chainId) === chainId) {
                        resolve(rpcUrl);
                    } else {
                        resolve(null);
                    }
                }).catch(() => {
                    clearTimeout(timeoutId);
                    resolve(null);
                });
            });
        };

        const results = await Promise.all(rpcUrls.map(url => checkRPC(url)));
        const workingRPC = results.find(result => result !== null);

        if (workingRPC) {
            console.log(`Working RPC found: ${workingRPC}`);
            return workingRPC;
        } else {
            console.error(`No working RPC found for chain ID ${chainId}`);
            return null;
        }
    }

    // Example usage within another method
    async setupProviderForChain(chainId: number, rpcUrls: string[]): Promise<string | null> {
        const workingRPC = await this.findWorkingRPC(chainId, rpcUrls);
        if (workingRPC) {
            //return new ethers.JsonRpcProvider(workingRPC);

            return workingRPC;
        }
        return null;
    }

    isNullOrEmpty(str: any) {
        return (str == null || str == '' || str == undefined || str?.length == 0) ? true : false;
    }

    async isNativeCurrency(chainDe: Chains, token: Tokens): Promise<boolean> {

        const getAllChains = (): Chain[] => {
            return Object.values(definedChains).filter((chain) => chain.id !== undefined) as Chain[];
        };

        // Get all chains
        const allChains = getAllChains();

        // Ensure there's at least one chain
        if (allChains.length === 0) {
            throw new Error("No chains available");
        }

        // Type assertion to tuple
        const chainsTuple = [allChains[0], ...allChains.slice(1)] as const;


        const chain = allChains.find(chain => chain.id === chainDe.chainId);

        let coinAddress = token.address != undefined ? token.address : '';

        if (chain?.nativeCurrency.symbol === token.symbol) {
            return true;
        }
        else {
            return false;
        }
    }

    async getNativeCurrency(chainDe: Chains): Promise<Chain> {

        const getAllChains = (): Chain[] => {
            return Object.values(definedChains).filter((chain) => chain.id !== undefined) as Chain[];
        };

        // Get all chains
        const allChains = getAllChains();

        // Ensure there's at least one chain
        if (allChains.length === 0) {
            throw new Error("No chains available");
        }

        // Type assertion to tuple
        const chainsTuple = [allChains[0], ...allChains.slice(1)] as const;


        const chain = allChains.find(chain => chain.id === chainDe.chainId);

        return chain;


    }

    Translate(language: string, key: string) {
        return (!this.isNullOrEmpty(language) && !this.isNullOrEmpty(key) && i18n) ? i18n[language][key] : '';
    }

    async getTokenAllowance(tokenIsNative, token: Tokens, userAddress: string, approvalAddress: string, providerUrl: string): Promise<string> {
        try {
            // Create a provider using the passed provider URL
            const provider = new ethers.JsonRpcProvider(providerUrl);

            // Define the minimal ABI for balance and decimals
            const tokenABI = [
                "function allowance(address owner, address spender) view returns (uint256)",

            ];




            // Define the token contract address
            const tokenAddress = token.address;

            // Instantiate the token contract
            const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);

            // Define the addresses
            const ownerAddress = userAddress;  // The token holder
            const spenderAddress = approvalAddress;  // The address you want to check allowance for

            const allowance = await tokenContract.allowance(ownerAddress, spenderAddress);

            console.log(`Allowance: ${ethers.formatUnits(allowance, 18)} tokens`);





        } catch (error) {
            console.error('Error fetching balance:', error);
            return '0';
        }
    }

    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
            .replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
    }
}



