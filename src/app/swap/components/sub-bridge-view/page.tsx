"use client"
import { SetActiveTransactionA } from "@/app/redux-store/action/action-redux";
import { Keys, TransactionStatus, TransactionSubStatus } from "@/shared/Enum/Common.enum";
import { TransactionRequestoDto } from "@/shared/Models/Common.model";
import { CryptoService } from "@/shared/Services/CryptoService";
import { SharedService } from "@/shared/Services/SharedService";
import { UtilityService } from "@/shared/Services/UtilityService";
import { useEffect } from "react";
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
                            clearInterval(intervalInit);
                        }
                    }, 10000)
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
        <div className="col-lg-5 col-md-12 col-sm-12 col-12" id="swap-wrapper">
            <div className="card">
                <div className="p-24">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="card-action-wrapper cursor-pointer" id="back-to-swap">
                            <i className="fas fa-chevron-left"></i>
                        </div>
                        <div className="card-title">
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
                                        <><span className="alert alert-success px-2 p-0 mx-1"><a href=""></a>Done</span> <button className="btn-primary" onClick={() => closeSubBridgeView()}>X</button></>
                                    }
                                    {
                                        activeTransactionData.transactionSubStatus == TransactionSubStatus.PENDING &&
                                        <><span className="alert alert-warning px-2 p-0 mx-1"><a href="" onClick={() => props.openBridgeView()}>Pending</a></span></>
                                    }
                                    {
                                        activeTransactionData.transactionSubStatus == TransactionSubStatus.FAILED &&
                                        <><span className="alert alert-danger px-2 p-0 mx-1"><a href=""></a>Failed</span> <button className="btn-primary" onClick={() => closeSubBridgeView()}>X</button></>
                                    }
                                </>
                            }
                        </div>
                        <div className="card-action-wrapper">
                            <i className="fas fa-cog cursor-pointer"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}