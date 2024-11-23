'use client'
import { useEffect } from "react";
import { useDispatch, useSelector, } from "react-redux";
import { Chain, parseEther } from "viem";
import { config } from '../../../wagmi/config';// Go up a level if needed
import { readContract, writeContract } from '@wagmi/core';
import * as definedChains from "wagmi/chains";
import { useSendTransaction } from "wagmi";
import { Keys, TransactionStatus, TransactionSubStatus, TransactionSubStatusLIFI, TransactionSubStatusRango } from "@/shared/Enum/Common.enum";
import { SetActiveTransactionA, UpdateTransactionStatusA } from "@/app/redux-store/action/action-redux";
import { UtilityService } from "@/shared/Services/UtilityService";
import { Chains, TransactionRequestoDto } from "@/shared/Models/Common.model";
import { TransactionService } from "@/shared/Services/TransactionService";
import { SharedService } from "@/shared/Services/SharedService";
import { CryptoService } from "@/shared/Services/CryptoService";
import { stat } from "fs";
import { LiFiTransactionResponse } from "@/shared/Models/Lifi";
import { OwltoTransactionResponse } from "@/shared/Models/Owlto";
import { OwltoSubStatus } from "@/shared/Const/Common.const";
import { ActiveTransactionData } from "@/app/redux-store/reducer/reducer-redux";

type propsType = {
    closeBridgeView: () => void;
}
export default function BridgeView(props: propsType) {
    let activeTransactionData: TransactionRequestoDto = useSelector((state: any) => state.ActiveTransactionData);
    let dispatch = useDispatch();
    let utilityService = new UtilityService();
    let transactionService = new TransactionService();
    let cryptoService = new CryptoService();
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

    // useEffect(()=>{
    //     processTransaction();
    // },[])
    function getPayloadForTransaction(transactionData: TransactionRequestoDto, tx: string, transactionGuid: string, transactionStatus: number, transactionSubStatus: number) {
        let payLoad = {
            TransactionGuid: transactionGuid,
            WalletAddress: transactionData.walletAddress,
            Amount: transactionData.amount,
            ApprovalAddress: transactionData.approvalAddress,
            TransactionHash: tx,
            TransactionStatus: transactionStatus,
            TransactionSubStatus: transactionSubStatus,
            QuoteDetail: transactionData.quoteDetail,
            SourceChainId: transactionData.sourceChainId,
            SourceChainName: transactionData.sourceChainName,
            SourceChainLogoUri: transactionData.sourceChainLogoUri,
            DestinationChainId: transactionData.destinationChainId,
            DestinationChainName: transactionData.destinationChainName,
            DestinationChainLogoUri: transactionData.destinationChainLogoUri,
            SourceTokenName: transactionData.sourceTokenName,
            SourceTokenAddress: transactionData.sourceTokenAddress,
            SourceTokenSymbol: transactionData.sourceTokenSymbol,
            SourceTokenLogoUri: transactionData.sourceTokenLogoUri,
            DestinationTokenName: transactionData.destinationTokenName,
            DestinationTokenAddress: transactionData.destinationTokenAddress,
            DestinationTokenSymbol: transactionData.destinationTokenSymbol,
            DestinationTokenLogoUri: transactionData.destinationTokenLogoUri
        }
        return payLoad;
    }

    async function GetTransactionStatus(tx: string) {
        let status = 0;
        if (!utilityService.isNullOrEmpty(tx)) {
            if (activeTransactionData.transactiionAggregator == 'lifi') {
                // check lifi transaction status
                let response: LiFiTransactionResponse = await cryptoService.TransactionStatusLIFI(tx, activeTransactionData.sourceChainId, activeTransactionData.destinationChainId)
                if (response && response.status) {
                    status = TransactionSubStatusLIFI[response.status];
                }
            }
            else if (activeTransactionData.transactiionAggregator == 'rango') {
                // chack rango
                let response: LiFiTransactionResponse = await cryptoService.TransactionStatusRango(activeTransactionData.transactionAggregatorRequestId, tx, 1);
                if (response && response.status) {
                    status = TransactionSubStatusRango[response.status];
                }
            }
            else if (activeTransactionData.transactiionAggregator == 'owlto') {
                // cheack owlto
                let response: OwltoTransactionResponse = await cryptoService.TransactionStatusOwlto(activeTransactionData.sourceChainId, tx);
                if (response && response.status) {
                    status = OwltoSubStatus[String(response.status.code)];
                }
            }
        }

        return status;
    }
    useEffect(() => {
        const SPENDER_ADDRESS = activeTransactionData.approvalAddress;
        const amountToSend = parseEther(activeTransactionData.amount.toString());
        let tx = '';

        async function transactionSteps() {

            if (activeTransactionData.transactionStatus == TransactionStatus.ALLOWANCSTATE) {

                if (activeTransactionData.isNativeToken) {
                    dispatch(UpdateTransactionStatusA(TransactionStatus.PENDING));
                }
                else {
                    let allowanceAmount = await checkAllowance();
                    if (allowanceAmount >= Number(amountToSend)) {
                        dispatch(UpdateTransactionStatusA(TransactionStatus.PENDING));
                    }
                }

            }
            if (activeTransactionData.transactionStatus == TransactionStatus.PENDING) {
                sharedService.setData(Keys.ACTIVE_TRANASCTION_DATA, activeTransactionData);
                let transactionStatus = '';
                //Proceed with the main transaction
                try {
                    console.log(activeTransactionData);

                    var transactionRequest = {
                        to: SPENDER_ADDRESS,

                        data: activeTransactionData.transactionAggregatorRequestData,
                        gas: null,
                        chainId: activeTransactionData.sourceChainId,
                    }

                    if (activeTransactionData.isNativeToken) {
                        transactionRequest["value"] = amountToSend;
                    }




                    tx = await sendTransactionAsync(transactionRequest);
                    let status = await GetTransactionStatus(tx);


                    let requestPayload = getPayloadForTransaction(activeTransactionData, tx, utilityService.uuidv4(), TransactionStatus.COMPLETED, TransactionSubStatus.DONE);
                    //addTransactionLog(requestPayload);
                    let updateTransactionData = {
                        ...activeTransactionData,
                        transactionHash: tx ? tx : null,
                        transactionGuid: utilityService.uuidv4(),
                        transactionStatus: TransactionStatus.COMPLETED,
                        transactionSubStatus: status
                    }
                    dispatch(SetActiveTransactionA(updateTransactionData));
                }
                catch (error) {

                    console.log(error);

                }
            }
            if (activeTransactionData.transactionStatus == TransactionStatus.COMPLETED) {
                //set interval to check status in 10 sec
                //sharedService.setData(Keys.ACTIVE_TRANASCTION_DATA, activeTransactionData);
                //sharedService.removeData(Keys.ACTIVE_TRANASCTION_DATA);
                if (activeTransactionData.transactionSubStatus == TransactionSubStatus.PENDING) {
                    // set time out for checking status
                    // break if failed or done 
                    // update status in API
                    const intervalId = setInterval(async () => {
                        let status = await GetTransactionStatus(activeTransactionData.transactionHash);
                        if (status == TransactionSubStatus.DONE || status == TransactionSubStatus.FAILED) {
                            let updateTransactionData = {
                                ...activeTransactionData,
                                transactionSubStatus: status
                            }
                            dispatch(SetActiveTransactionA(updateTransactionData));
                            let requestPayload = getPayloadForTransaction(activeTransactionData, tx, utilityService.uuidv4(), TransactionStatus.COMPLETED, TransactionSubStatus.DONE);
                            //addTransactionLog(requestPayload);
                            clearInterval(intervalId);
                        }
                    }, 10000)
                }
            }
        }

        transactionSteps();

    }, [activeTransactionData.transactionStatus])

    function addTransactionLog(payLoad: TransactionRequestoDto) {
        transactionService.AddTransactionLog(payLoad).then((response) => {
            if (response?.data && response.data.transactionGuid) {
                //dispatch(SetActiveTransactionA(response.data));
                //sharedService.setData(Keys.ACTIVE_TRANASCTION_DATA, response.data);
                console.log('transaction added successfully');
            }
        }).catch((error) => {
            console.log(error);
        });;
    }

    async function checkAllowance() {
        const SPENDER_ADDRESS = activeTransactionData.approvalAddress;
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
        try {
            const allowance = await readContract(config, {
                address: activeTransactionData.sourceTokenAddress as `0x${string}`,
                abi: tokenAbi,
                functionName: 'allowance',
                args: [activeTransactionData.walletAddress, SPENDER_ADDRESS],
                chainId: activeTransactionData.sourceChainId
            });
            allowanceAmount = Number(allowance);

            // If allowance is insufficient, request approval
            if (Number(allowanceAmount) <= Number(amountToSend)) {
                console.log("Requesting token approval...");

                try {
                    const approvalAllowance = await writeContract(config, {
                        address: activeTransactionData.sourceTokenAddress as `0x${string}`,
                        abi: tokenAbi,
                        functionName: 'approve',
                        args: [SPENDER_ADDRESS, amountToSend],
                        chain: chainsTuple.find(a => a.id == activeTransactionData.sourceChainId), // Add chain
                        account: activeTransactionData.walletAddress as `0x${string}`, // Add account
                        chainId: activeTransactionData.sourceChainId
                    });
                    allowanceAmount = Number(approvalAllowance);
                    console.log("Approval successful:", approvalAllowance);
                }
                catch (error) {
                    console.error('Transaction error:', error);
                    alert('Transaction failed. Please try again.');
                }
            }
        } catch (error) {
            console.error('Transaction error:', error);
            alert('Transaction failed. Please try again.');
        }

        return allowanceAmount;
    }

    function closeBridgeView() {
        if (activeTransactionData.transactionSubStatus == TransactionSubStatus.DONE || activeTransactionData.transactionSubStatus == TransactionSubStatus.FAILED) {
            sharedService.removeData(Keys.ACTIVE_TRANASCTION_DATA);
            dispatch(SetActiveTransactionA(new TransactionRequestoDto()));
        }
        props.closeBridgeView();
    }

    return (
        <div className="col-lg-5 col-md-12 col-sm-12 col-12" id="swap-wrapper">
            <div className="card">
                <div className="p-24">
                    <div className="d-block gap-3 align-items-center mb-2">
                        <div className="card-action-wrapper cursor-pointer left-arrow" id="back-to-swap" onClick={() => closeBridgeView()}>
                            <i className="fas fa-chevron-left"></i>
                        </div>
                        <div className="card-title">
                            Swap
                        </div>
                        {/* <div className="card-action-wrapper">
                            <i className="fas fa-cog cursor-pointer"></i>
                        </div> */}
                    </div>

                    <div className="inner-card w-100 p-4 mt-3 swap-card">
                        <div className={`step ${activeTransactionData.transactionStatus == TransactionStatus.ALLOWANCSTATE ? 'step-active' : ''}`}>
                            <div>
                                <div className="circle">
                                    {
                                        activeTransactionData.transactionStatus > TransactionStatus.ALLOWANCSTATE &&
                                        <>
                                            <i className="fa fa-check"></i>
                                        </>
                                    }
                                    {
                                        activeTransactionData.transactionStatus <= TransactionStatus.ALLOWANCSTATE &&
                                        <>
                                            <span>1</span>
                                        </>
                                    }
                                </div>
                            </div>
                            <div>
                                <div className="title">Token Allowance</div>
                                <div className="caption">Allowance To Non Native Token</div>
                            </div>
                        </div>
                        <div className={`step ${activeTransactionData.transactionStatus == TransactionStatus.PENDING ? 'step-active' : ''}`}>
                            <div>
                                <div className="circle">
                                    {
                                        activeTransactionData.transactionStatus > TransactionStatus.PENDING &&
                                        <>
                                            <i className="fa fa-check"></i>
                                        </>
                                    }
                                    {
                                        activeTransactionData.transactionStatus <= TransactionStatus.PENDING &&
                                        <>
                                            <span>2</span>
                                        </>
                                    }
                                </div>
                            </div>
                            <div>
                                <div className="title">Swap Transaction</div>
                                <div className="caption">Transaction Swap Via Bridge</div>
                            </div>
                        </div>
                        <div className={`step ${activeTransactionData.transactionStatus == TransactionStatus.COMPLETED ? 'step-active' : ''}`}>
                            <div>
                                <div className="circle">
                                    {
                                        activeTransactionData.transactionStatus > TransactionStatus.COMPLETED &&
                                        <>
                                            <i className="fa fa-check"></i>
                                        </>
                                    }
                                    {
                                        activeTransactionData.transactionStatus <= TransactionStatus.COMPLETED &&
                                        <>
                                            <span>3</span>
                                        </>
                                    }
                                </div>
                            </div>
                            <div>
                                <div className="title">Transaction Status</div>
                                <div className="caption">
                                    Swap Transaction
                                    {
                                        activeTransactionData.transactionSubStatus == 0 &&
                                        <>
                                            <span className="alert alert-secondary px-2 p-0 mx-1" role="alert">
                                                Not Started
                                            </span>
                                        </>

                                    }
                                    {
                                        activeTransactionData.transactionSubStatus == TransactionSubStatus.PENDING &&
                                        <>
                                            <span className="alert alert-warning px-2 p-0 mx-1" role="alert">
                                                Pending
                                            </span>
                                        </>

                                    }
                                    {
                                        activeTransactionData.transactionSubStatus == TransactionSubStatus.FAILED &&
                                        <>
                                            <span className="alert alert-danger px-2 mx-1" role="alert">
                                                Failed
                                            </span>
                                        </>

                                    }
                                    {
                                        activeTransactionData.transactionSubStatus == TransactionSubStatus.DONE &&
                                        <>
                                            <span className="alert alert-success px-2 p-0 mx-1" role="alert">
                                                Success
                                            </span>
                                        </>

                                    }
                                </div>
                            </div>
                        </div>
                        <div className="swap-btn-box">
                            {/* {
                                        (activeTransactionData.transactionSubStatus == TransactionSubStatus.DONE || activeTransactionData.transactionSubStatus == TransactionSubStatus.FAILED) &&
                                        <>
                                            <button className="btn btn-primary" onClick={() => props.closeBridgeView()}>Swap More</button>
                                        </>
                        } */}
                            {/* <button className="btn btn-primary swap-btn mt-4" onClick={() => props.closeBridgeView()}>Swap More</button> */}
                        </div>
                    </div>
                    <div className="inner-card swap-card-btn mt-2">
                        <label><a href="#" role="button" onClick={() => props.closeBridgeView()}>Swap More</a></label>
                    </div>
                </div>
            </div>
        </div>
    )
}

