import { ethers } from 'ethers';

import { BigNumberish } from 'ethers';
//import { Chain } from 'viem';
import { Chains, RequestTransaction, ResponseTransaction, TokenBase, Tokens } from '../Models/Common.model';
import type { Chain } from "wagmi/chains"; // Import Chain type
import * as definedChains from "wagmi/chains";
import { i18n } from '../Const/i18n';
import { JsonRpcProvider } from 'ethers/providers';


export class TransactionService {




    async sendTransaction(
        requestTransaction: RequestTransaction, workingRPC: string

    ): Promise<ResponseTransaction> {
        try {
            // Initial validation and preparation


            const provider = new JsonRpcProvider(workingRPC);

            const signer = await provider.getSigner(); // Get the signer from the provider





            // Create transaction object
            const transaction = {
                to: requestTransaction.to,
                value: ethers.parseEther(requestTransaction.value.toString()),

            };

            // Send transaction
            const tx = await signer.sendTransaction(transaction);

            // Wait for confirmation
            const receipt = await tx.wait();

            return {
                success: true,
                hash: tx.hash,
                receipt,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

}



