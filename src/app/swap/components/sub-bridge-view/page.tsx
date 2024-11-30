"use client"
import { SetActiveTransactionA } from "@/app/redux-store/action/action-redux";
import { Keys, TransactionStatus, TransactionSubStatus } from "@/shared/Enum/Common.enum";
import { TransactionRequestoDto } from "@/shared/Models/Common.model";
import { CryptoService } from "@/shared/Services/CryptoService";
import { SharedService } from "@/shared/Services/SharedService";
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
                            let requestPayload = getPayloadForTransaction(activeTransactionData, tx, utilityService.uuidv4(), TransactionStatus.COMPLETED, TransactionSubStatus.DONE);
                            //addTransactionLog(requestPayload);
                            clearInterval(statusIntervalId.current);
                        }
                    }, 10000)
                    statusIntervalId.current = (intervalInit as unknown as number);
                }
            }
        }

        transactionSteps();

    }, [activeTransactionData.transactionStatus]);

    async function GetTransactionStatus(tx: string) {
        let status = 0;
        if (!utilityService.isNullOrEmpty(tx)) {
            if (activeTransactionData.transactiionAggregator == 'lifi') {
                // check lifi transaction status
                let response = await cryptoService.TransactionStatusLIFI(tx, activeTransactionData.sourceChainId, activeTransactionData.destinationChainId)
                console.log(activeTransactionData);
            }
            else if (activeTransactionData.transactiionAggregator == 'rango') {
                // chack rango
                let response = await cryptoService.TransactionStatusRango(activeTransactionData.transactionAggregatorRequestId, tx, 1);
                console.log(activeTransactionData);
            }
            else if (activeTransactionData.transactiionAggregator == 'owlto') {
                // cheack owlto
                let response = await cryptoService.TransactionStatusOwlto(activeTransactionData.sourceChainId, tx);
                console.log(activeTransactionData);
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
        if (activeTransactionData.transactionSubStatus == TransactionSubStatus.DONE || activeTransactionData.transactionSubStatus == TransactionSubStatus.FAILED) {
            sharedService.removeData(Keys.ACTIVE_TRANASCTION_DATA);
            dispatch(SetActiveTransactionA(new TransactionRequestoDto()));
        }
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
                <div className="d-flex flex-column w-100">
                    <label className="coin-name d-flex gap-2 justify-content-between">
                        <label className="coin-name d-block ">
                            <span className="d-block fw-600"> {activeTransactionData.amount} {activeTransactionData.sourceTokenName} </span>
                            <span className="d-block coin-sub-name" >$ {activeTransactionData.amount}</span>
                        </label>
                        <p className="faster fw-600 px-2 py-1">
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
                        </p>
                    </label>
                </div>
            </div>
            <div className=" py-1  py-1 d-flex align-item-center justify-content-between">
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
            </div>
        </>
    )
}