"use client"
import { SetActiveTransactionA } from "@/app/redux-store/action/action-redux";
import { OwltoSubStatus } from "@/shared/Const/Common.const";
import { Keys, TransactionStatus, TransactionSubStatus, TransactionSubStatusLIFI, TransactionSubStatusRango } from "@/shared/Enum/Common.enum";
import { TransactionRequestoDto, UpdateTransactionRequestoDto } from "@/shared/Models/Common.model";
import { LiFiTransactionResponse } from "@/shared/Models/Lifi";
import { OwltoTransactionResponse } from "@/shared/Models/Owlto";
import { CryptoService } from "@/shared/Services/CryptoService";
import { SharedService } from "@/shared/Services/SharedService";
import { TransactionService } from "@/shared/Services/TransactionService";
import { UtilityService } from "@/shared/Services/UtilityService";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { parseEther } from "viem";
type propsType = {
    openBridgeView: () => void;
    closeSubBridgeView: () => void;
}
export default function SubBridgeView(props: propsType) {


    let activeTransactionData: TransactionRequestoDto = useSelector((state: any) => state.ActiveTransactionData);
    let utilityService = new UtilityService();
    let dispatch = useDispatch();
    let cryptoService = new CryptoService();
    let sharedService = SharedService.getSharedServiceInstance();
    let statusIntervalId = useRef<number>();
    let transactionService = new TransactionService();

    useEffect(() => {
        //clean up function
        return () => {
            clearInterval(statusIntervalId.current);
        }
    }, [])
    useEffect(() => {
        const SPENDER_ADDRESS = activeTransactionData.approvalAddress;
        const amountToSend = parseEther(activeTransactionData.amount.toString());
        let tx = '';

        async function transactionSteps() {

            if (activeTransactionData.transactionStatus == TransactionStatus.COMPLETED) {
                //set interval to check status in 10 sec
                //sharedService.setData(Keys.ACTIVE_TRANASCTION_DATA, activeTransactionData);
                //sharedService.removeData(Keys.ACTIVE_TRANASCTION_DATA);
                if (activeTransactionData.transactionSubStatus == TransactionSubStatus.DONE || activeTransactionData.transactionSubStatus == TransactionSubStatus.FAILED) {
                    //sharedService.removeData(Keys.ACTIVE_TRANASCTION_DATA);
                    //dispatch(SetActiveTransactionA(new TransactionRequestoDto()));
                } else if (activeTransactionData.transactionSubStatus == TransactionSubStatus.PENDING) {
                    // set time out for checking status
                    // break if failed or done 
                    // update status in API
                    let intervalInit = setInterval(async () => {
                        let status = await GetTransactionStatus(activeTransactionData.transactionHash);
                        if (status == TransactionSubStatus.DONE || status == TransactionSubStatus.FAILED) {
                            let updateTransactionData = {
                                ...activeTransactionData,
                                transactionSubStatus: status
                            }
                            dispatch(SetActiveTransactionA(updateTransactionData));
                            let requestPayload : UpdateTransactionRequestoDto = {
                                transactionGuid: activeTransactionData.transactionGuid,
                                transactionSubStatus: status
                            };
                            UpdateTransactionLog(requestPayload);
                            clearInterval(statusIntervalId.current);
                        }
                    }, 10000)
                    statusIntervalId.current = (intervalInit as unknown as number);
                }
            }
        }

        transactionSteps();

    }, [activeTransactionData.transactionStatus]);

    function UpdateTransactionLog(payLoad: UpdateTransactionRequestoDto) {
        transactionService.UpdateTransactionLog(payLoad).then((response) => {
            if (response?.data && response.data == 1) {
                //dispatch(SetActiveTransactionA(response.data));
                //sharedService.setData(Keys.ACTIVE_TRANASCTION_DATA, response.data);
                console.log('transaction updated successfully');
            }
        }).catch((error) => {
            console.log(error);
        });;
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

    function closeSubBridgeView() {
        if (activeTransactionData.transactionStatus == TransactionStatus.COMPLETED) {
            sharedService.removeData(Keys.ACTIVE_TRANASCTION_DATA);
            dispatch(SetActiveTransactionA(new TransactionRequestoDto()));
        }
        props.closeSubBridgeView();
    }

    function removeTransaction() {
        sharedService.removeData(Keys.ACTIVE_TRANASCTION_DATA);
        dispatch(SetActiveTransactionA(new TransactionRequestoDto()));
        props.closeSubBridgeView();
    }

    return (
        <>
            {/* <div className="card-action-wrapper cursor-pointer" id="back-to-swap">
                            <i className="fas fa-chevron-left"></i>
                        </div> */}
            
            {/* try two */}
            {/* <div className="card-title w-100">
                Previous Swap
                {
                    (activeTransactionData.transactionStatus == TransactionStatus.ALLOWANCSTATE
                        || activeTransactionData.transactionStatus == TransactionStatus.PENDING) &&
                    <><span className="alert alert-warning px-2 p-0 mx-1"><a role="button" onClick={() => props.openBridgeView()}>Incomplete</a></span></>
                }
                {
                    (!utilityService.isNullOrEmpty(activeTransactionData.transactionHash) && activeTransactionData.transactionStatus == TransactionStatus.COMPLETED) &&
                    <>
                        {
                            activeTransactionData.transactionSubStatus == TransactionSubStatus.DONE &&
                            <><span className="alert alert-success px-2 p-0 mx-1"><a href=""></a>Done</span></>
                        }
                        {
                            activeTransactionData.transactionSubStatus == TransactionSubStatus.PENDING &&
                            <><span className="alert alert-warning px-2 p-0 mx-1"><a href="" onClick={() => props.openBridgeView()}>Pending</a></span></>
                        }
                        {
                            activeTransactionData.transactionSubStatus == TransactionSubStatus.FAILED &&
                            <><span className="alert alert-danger px-2 p-0 mx-1"><a href=""></a>Failed</span></>
                        }
                    </>
                }
            </div>
            {
                (activeTransactionData.transactionSubStatus == TransactionSubStatus.DONE || activeTransactionData.transactionSubStatus == TransactionSubStatus.FAILED) &&
                <>
                    <div className="card-action-wrapper">
                        <button className="btn-primary" onClick={() => closeSubBridgeView()}>X</button>
                    </div>
                </>
            } */}
            {/* try three */}
            <div className="d-flex gap-3">
                <div className="selcet-coin coin-wrapper">
                    <img src="https://movricons.s3.ap-south-1.amazonaws.com/CCTP.svg" className="coin" alt="" />
                </div>
                <div className="d-flex justify-content-between w-100">
                    <div className="coin-name d-flex gap-4 justify-content-between">
                        <div className="d-block ">
                            <span className="d-block fw-600"> {activeTransactionData.amountInEther} {activeTransactionData.sourceTokenName} </span>
                            <span className="d-block coin-sub-name" >$ {activeTransactionData.amountUsd}</span>
                            {/* <div className="base-coin-box d-flex mt-1 gap-2 align-items-center">
                                <div className="base-coin">
                                    <label className="coin-name d-block fw-600">{activeTransactionData.sourceChainName}</label>
                                    <label className="coin-sub-name">{activeTransactionData.sourceTokenName}</label>
                                </div>
                                <div className="active-txn-swap cursor-pointer d-flex justify-content-center">
                                    <i className="fa-solid fa-arrows-left-right"></i>
                                </div>
                                <div className="base-coin">
                                    <label className="coin-name d-block fw-600">{activeTransactionData.destinationChainName}</label>
                                    <label className="coin-sub-name">{activeTransactionData.destinationTokenName}</label>
                                </div>
                            </div> */}
                        </div>
                        <div className="txn-tag-box">
                            <label className="coin-name d-block"><span className="fw-600">Transaction:</span>&nbsp;
                            {
                                (activeTransactionData.transactionStatus == TransactionStatus.PENDING 
                                    || activeTransactionData.transactionStatus == TransactionStatus.ALLOWANCSTATE) &&
                                    <>
                                     Incomplete
                                    </>
                            }
                            {
                                (activeTransactionData.transactionStatus == TransactionStatus.COMPLETED) &&
                                    <>
                                     Completed
                                    </>
                            }
                            </label>
                            <label className="coin-name d-block"><span className="fw-600">Status:</span> &nbsp;
                            {
                                (activeTransactionData.transactionSubStatus == 0) &&
                                <>
                                Not Started
                                </>
                            }
                            {
                                (activeTransactionData.transactionSubStatus == TransactionSubStatus.PENDING) &&
                                <>
                                Pending
                                </>
                            }
                            {
                                (activeTransactionData.transactionSubStatus == TransactionSubStatus.DONE) &&
                                <>
                                Success
                                </>
                            }
                            {
                                (activeTransactionData.transactionSubStatus == TransactionSubStatus.FAILED) &&
                                <>
                                Failed
                                </>
                            }
                            </label>
                        </div>
                        {/* <p className="faster fw-600 px-2 py-1">
                            {
                                (activeTransactionData.transactionSubStatus == TransactionSubStatus.DONE || activeTransactionData.transactionSubStatus == TransactionSubStatus.FAILED) &&
                                <>
                                    <div className="card-action-wrapper">
                                        <button className="btn-primary" onClick={() => closeSubBridgeView()}>X</button>
                                    </div>
                                </>
                            }
                            {
                                (activeTransactionData.transactionSubStatus == TransactionSubStatus.PENDING) &&
                                <>
                                    <div className="card-action-wrapper">
                                        <button className="btn-primary" onClick={() => closeSubBridgeView()}>
                                        <i className="fa-solid fa-chevron-right"></i>
                                        </button>
                                    </div>
                                </>
                            }
                        </p> */}
                    </div>
                    {
                        (activeTransactionData.transactionStatus == TransactionStatus.PENDING 
                            || activeTransactionData.transactionStatus == TransactionStatus.ALLOWANCSTATE) && 
                        <>
                            <div className="d-block">
                                <div className="right-arrow cursor-pointer d-flex justify-content-center"
                                    onClick={() => props.openBridgeView()}>
                                    <i className="fa-solid fa-circle-chevron-right"></i>
                                </div>
                                <div className="right-arrow cursor-pointer d-flex justify-content-center"
                                    onClick={() => removeTransaction()}>
                                    <i className="fa-regular fa-trash-can"></i>
                                </div>
                            </div>
                        </>
                    }
                    {
                        activeTransactionData.transactionStatus == TransactionStatus.COMPLETED && 
                        <>
                            <div className="right-arrow cursor-pointer d-flex justify-content-center"
                                onClick={() => closeSubBridgeView()}>
                               <i className="fa-regular fa-circle-xmark"></i>
                            </div>
                        </>
                    }
                </div>
            </div>
            {/* <div className=" py-1  py-1 d-flex align-item-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                    <label className="font-16 d-flex align-items-center gap-2">
                        Status &nbsp;
                    </label>
                    {
                            (activeTransactionData.transactionStatus == TransactionStatus.ALLOWANCSTATE
                                || activeTransactionData.transactionStatus == TransactionStatus.PENDING) &&
                            <><span className="alert alert-warning px-2 p-0 mx-1"><a role="button" onClick={() => props.openBridgeView()}>Incomplete</a></span></>
                        }
                        {
                            (!utilityService.isNullOrEmpty(activeTransactionData.transactionHash) && activeTransactionData.transactionStatus == TransactionStatus.COMPLETED) &&
                            <>
                                {
                                    activeTransactionData.transactionSubStatus == TransactionSubStatus.DONE &&
                                    <><span className="alert alert-success px-2 p-0 mx-1"><a href=""></a>Done</span></>
                                }
                                {
                                    activeTransactionData.transactionSubStatus == TransactionSubStatus.PENDING &&
                                    <><span className="alert alert-warning px-2 p-0 mx-1"><a href="" onClick={() => props.openBridgeView()}>Pending</a></span></>
                                }
                                {
                                    activeTransactionData.transactionSubStatus == TransactionSubStatus.FAILED &&
                                    <><span className="alert alert-danger px-2 p-0 mx-1"><a href=""></a>Failed</span></>
                                }
                            </>
                        }
                </div>
            </div> */}
        </>
    )
}