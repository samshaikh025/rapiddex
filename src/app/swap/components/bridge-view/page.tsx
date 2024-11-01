'use client'
import { useEffect } from "react";
import { useDispatch, useSelector,  } from "react-redux";
import { Chain, parseEther } from "viem";
import { config } from '../../../wagmi/config';// Go up a level if needed
import { readContract, writeContract } from '@wagmi/core';
import * as definedChains from "wagmi/chains";
import { useSendTransaction } from "wagmi";
import { Keys, TransactionStatus } from "@/shared/Enum/Common.enum";
import { SetActiveTransactionA, UpdateTransactionStatusA } from "@/app/redux-store/action/action-redux";
import { UtilityService } from "@/shared/Services/UtilityService";
import { TransactionRequestoDto } from "@/shared/Models/Common.model";
import { TransactionService } from "@/shared/Services/TransactionService";
import { ActiveTransactionData } from "@/app/redux-store/reducer/reducer-redux";
import { SharedService } from "@/shared/Services/SharedService";

type propsType = {
    closeBridgeView: () => void;
}
export default function BridgeView(props: propsType) {
    let activeTransactionData = useSelector((state: any) => state.ActiveTransactionData);
    let dispatch = useDispatch();
    let utilityService = new UtilityService();
    let transactionService = new TransactionService();
    let sharedService = SharedService.getSharedServiceInstance();
    const { sendTransactionAsync, isPending: isTransactionPending, isError: isTransactionError } = useSendTransaction();
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

    useEffect(()=>{
        processTransaction();
    },[])

    function addTransactionLog()
    {
         transactionService.AddTransactionLog(activeTransactionData).then((response) => {
            if (response?.data && response.data.transactionGuid) {
              dispatch(SetActiveTransactionA(response.data));
              sharedService.setData(Keys.ACTIVE_TRANASCTION_DATA, response.data);
              console.log('transaction added successfully');
            }
          }).catch((error) => {
            console.log(error);
          });;
    }

    async function checkAllowance(){
        const SPENDER_ADDRESS = "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE";
        const amountToSend = parseEther(activeTransactionData.amount.toString());
        let allowanceAmount = 0;
        // Token approval logic
        const tokenAbi = [
            {
                type: 'function',
                name: 'allowance',
                stateMutability: 'view',
                inputs: [
                    { name: 'owner', type: 'address' },
                    { name: 'spender', type: 'address' },
                ],
                outputs: [{ name: 'remaining', type: 'uint256' }],
            },
            {
                type: 'function',
                name: 'approve',
                stateMutability: 'nonpayable',
                inputs: [
                    { name: 'spender', type: 'address' },
                    { name: 'amount', type: 'uint256' },
                ],
                outputs: [{ name: 'success', type: 'bool' }],
            },
        ];
        try{
            const allowance = await readContract(config, {
                address: activeTransactionData.sourceTokenAddress as `0x${string}`,
                abi: tokenAbi,
                functionName: 'allowance',
                args: [activeTransactionData.address, SPENDER_ADDRESS],
            });
            allowanceAmount = Number(allowance);
            
            // If allowance is insufficient, request approval
            if (Number(allowanceAmount) <= Number(amountToSend)) {
                console.log("Requesting token approval...");
    
                try{
                    const approvalAllowance = await writeContract(config, {
                        address: activeTransactionData.sourceTokenAddress as `0x${string}`,
                        abi: tokenAbi,
                        functionName: 'approve',
                        args: [SPENDER_ADDRESS, amountToSend],
                        chain: chainsTuple.find(a => a.id == activeTransactionData.sourceChainId), // Add chain
                        account: activeTransactionData.address as `0x${string}`, // Add account
                    });
                    allowanceAmount = Number(approvalAllowance);
                     console.log("Approval successful:", approvalAllowance);
                }
                catch(error){
                    console.error('Transaction error:', error);
                    alert('Transaction failed. Please try again.');
                }
            }
        }catch(error){
            console.error('Transaction error:', error);
            alert('Transaction failed. Please try again.');
        }

        return allowanceAmount;
    }
    async function processTransaction() {
        
        const SPENDER_ADDRESS = "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE";
        const amountToSend = parseEther(activeTransactionData.amount.toString());
        
        try {
            if(activeTransactionData.transactionStatus == TransactionStatus.ALLOWANCSTATE){
                // Check allowance
                 let allowanceAmount = await checkAllowance();
                 if(allowanceAmount >= Number(amountToSend)){
                    dispatch(UpdateTransactionStatusA(TransactionStatus.PENDING));
                    //store updated active transaction in local storage and use when realod page
                    sharedService.setData(Keys.ACTIVE_TRANASCTION_DATA, activeTransactionData);
                 }
            }
            if(utilityService.isNullOrEmpty(activeTransactionData.transactionHash) && activeTransactionData.transactionStatus == TransactionStatus.PENDING){
                // Proceed with the main transaction
                const tx = await sendTransactionAsync({
                    to: SPENDER_ADDRESS,
                    value: amountToSend,
                });
                addTransactionLog();
                console.log('Transaction successful:', tx);
                alert('Transaction sent successfully!');
            }
            if(!utilityService.isNullOrEmpty(activeTransactionData.transactionHash) && activeTransactionData.transactionStatus == TransactionStatus.PENDING){
                //set interval to check status in 10 sec
            }
            

        } catch (error) {
            console.error('Transaction error:', error);
            alert('Transaction failed. Please try again.');
        }
    }

    return (
        <div className="col-lg-5 col-md-12 col-sm-12 col-12" id="swap-wrapper">
            <div className="card">
                <div className="p-24">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="card-action-wrapper cursor-pointer" id="back-to-swap" onClick={() => props.closeBridgeView()}>
                            <i className="fas fa-chevron-left"></i>
                        </div>
                        <div className="card-title">
                            Transaction Details
                        </div>
                        <div className="card-action-wrapper">
                            <i className="fas fa-cog cursor-pointer"></i>
                        </div>
                    </div>

                    <div className="inner-card w-100 py-2 px-3 mt-3">
                        <label className="mb-2 fw-600">Bridge</label>
                        <div className="">
                            <div className="m-5 text-center">Chain Switch Successfully</div>
                            <div className="m-5 text-center">Setting Token Allowance</div>
                            <div className="m-5 text-center">Transaction Status</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

