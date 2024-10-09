import { ethers } from 'ethers';

import { BigNumberish } from 'ethers';
import { Chain } from 'viem';
import { Chains, TokenBase, Tokens } from '../Models/Common.model';

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

    async  formatDuration(seconds) {
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
async  hexToDecimal(hexValue) {
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

async checkCoinNative(chain:Chains,token:Tokens)
{
    let value = await this.hexToDecimal(token.address)

    if (value === BigInt(0)) {
        return true;
    }
    return false;
}

async getBalance(tokenAddress: string, userAddress: string, providerUrl: string): Promise<string> {
    try {
        // Create a provider using the passed provider URL
        const provider = new ethers.JsonRpcProvider(providerUrl);

        // Define the minimal ABI for balance and decimals
        const tokenABI = [
            "function balanceOf(address owner) view returns (uint256)",
            "function decimals() view returns (uint8)"
        ];

        // Create a contract instance
        const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);

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

isNullOrEmpty(str:any){
    return (str == null || str == '' || str == undefined || str?.length == 0) ? true : false;
}
}



