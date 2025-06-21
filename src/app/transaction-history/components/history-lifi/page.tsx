"use client";
import CommingSoon from "@/shared/Component/coming-soon/page";
import { TransactionHistoryResponse } from "@/shared/Models/Common.model";
import { ResponseLifiPath } from "@/shared/Models/Lifi";
import { UtilityService } from "@/shared/Services/UtilityService";
import { useEffect, useState } from "react";
type propsType = {
    detailViewData: TransactionHistoryResponse;
    hideDetailView: () => void;
}
export default function HistoryLifi(props: propsType) {
    let [quoteDetail, setQuoteDetail] = useState<ResponseLifiPath>();
    let utilityService = new UtilityService();
    let [fromAmount, setFromAmount] = useState<string>();
    let [toAmount, setToAmount] = useState<string>();
    let [totalTransactionCost, setTransactionTotalCost] = useState<string>();

    useEffect(() => {

        const quote: ResponseLifiPath = JSON.parse(props?.detailViewData?.quoteDetail ?? '{}') as ResponseLifiPath;
        setQuoteDetail(quote);

        (async () => {
            console.log(quoteDetail);
            let fromAmount = await utilityService.convertToNumber(quote?.estimate?.fromAmount, quote?.action.fromToken.decimals);
            let toAmount = await utilityService.convertToNumber((quote?.estimate?.toAmount), quote?.action.toToken.decimals);
            setQuoteDetail(quote);
            setFromAmount(fromAmount.toFixed(5));
            setToAmount(toAmount.toFixed(5));
            console.log("aaaaaaa", quote);

            let relayerfeeusd = quote?.estimate.feeCosts.reduce((total, fee) => total + Number(fee.amountUSD), 0);
            let networkcostusd = quote?.estimate.gasCosts.reduce((total, fee) => total + Number(fee.amountUSD), 0);
            let gasafee = (relayerfeeusd + networkcostusd).toFixed(2) + "USD";

            setTransactionTotalCost(gasafee);
        })();



        console.log("aaaaaaa", quote);
    }, []);


    return (
        <>
            <div className="exchange-wrapper">
                <div className="container">
                    <div className="row justify-content-center gap-md-0 gap-3">
                        <div className="col-12">
                            <div className="card shadow-sm">
                                <div
                                    className="card-body p-4"
                                    style={{
                                        height: 'auto',
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}
                                >
                                    <div className="d-flex justify-content-between flex-column flex-md-row align-items-md-center mb-3">
                                        <div className="d-flex align-items-center gap-2">
                                            <i className="fas fa-chevron-left cursor-pointer" onClick={() => props.hideDetailView()}></i>
                                            <h5 className="mb-0 fw-bold">Transaction Detail</h5>
                                        </div>
                                    </div>

                                    {/* Scrollable Content Area */}
                                    <div className="flex-grow-1">
                                        {/* Status Card */}

                                        {
                                            props?.detailViewData?.transactionSubStatus == 2 &&
                                            <>
                                                <div className="inner-card p-3 mb-3 bg-light border rounded">
                                                    <div className="text-center">
                                                        <div className="mb-3">
                                                            <i className="fas fa-check-circle text-success" style={{ fontSize: '3rem' }}></i>
                                                        </div>
                                                        <h6 className="fw-bold text-success mb-2">Transaction Successful</h6>
                                                        <div className="progress" style={{ height: '4px' }}>
                                                            <div className="progress-bar bg-success" style={{ width: '100%' }}></div>
                                                        </div>
                                                        <small className="text-muted">Completed in a few seconds</small>
                                                    </div>
                                                </div>
                                            </>
                                        }
                                        {
                                            props?.detailViewData?.transactionSubStatus == 1 &&
                                            <>
                                                <div className="inner-card p-3 mb-3 bg-light border rounded">
                                                    <div className="text-center">
                                                        <div className="mb-3">
                                                            <i className="fas fa-hourglass-half text-warning" style={{ fontSize: '3rem' }}></i>
                                                        </div>
                                                        <h6 className="fw-bold text-warning mb-2">Transaction Pending</h6>
                                                        <div className="progress" style={{ height: '4px' }}>
                                                            <div className="progress-bar bg-warning progress-bar-striped progress-bar-animated" style={{ width: '100%' }}></div>
                                                        </div>
                                                        <small className="text-muted">Waiting for confirmation...</small>
                                                    </div>
                                                </div>
                                            </>
                                        }
                                        {
                                            props?.detailViewData?.transactionSubStatus == 3 &&
                                            <>
                                                <div className="inner-card p-3 mb-3 bg-light border rounded">
                                                    <div className="text-center">
                                                        <div className="mb-3">
                                                            <i className="fas fa-times-circle text-danger" style={{ fontSize: '3rem' }}></i>
                                                        </div>
                                                        <h6 className="fw-bold text-danger mb-2">Transaction Failed</h6>
                                                        <div className="progress" style={{ height: '4px' }}>
                                                            <div className="progress-bar bg-danger" style={{ width: '100%' }}></div>
                                                        </div>
                                                        <small className="text-muted">An error occurred while processing</small>
                                                    </div>
                                                </div>
                                            </>
                                        }

                                        {/* Transaction Flow Card */}
                                        <div className="inner-card p-3 mb-3 bg-light border rounded">
                                            <h6 className="fw-bold mb-3 text-secondary">
                                                <i className="fas fa-exchange-alt me-2"></i>Token Exchange
                                            </h6>

                                            <div className="row justify-content-center g-3 align-items-center">
                                                <div className="col-md-5">
                                                    <div className="bg-white rounded p-3 text-center h-100">
                                                        <small className="text-muted d-block mb-2">From</small>
                                                        <div className="d-flex align-items-center justify-content-center mb-2">
                                                            <div className="position-relative coin-wrapper me-2"
                                                                style={{ width: '32px', height: '32px' }}>
                                                                {utilityService.isNullOrEmpty(props.detailViewData?.sourceChainLogoUri) && <div className="coin"></div>}
                                                                {utilityService.isNullOrEmpty(props.detailViewData?.sourceTokenLogoUri) && <div className="coin-small"></div>}

                                                                {!utilityService.isNullOrEmpty(props.detailViewData?.sourceChainLogoUri) && (
                                                                    <img src={props.detailViewData?.sourceChainLogoUri} className="coin" alt="chain-logo" />
                                                                )}
                                                                {!utilityService.isNullOrEmpty(props.detailViewData?.sourceTokenLogoUri) && (
                                                                    <img src={props.detailViewData?.sourceTokenLogoUri} className="coin-small" alt="token-logo" />
                                                                )}


                                                            </div>

                                                        </div>
                                                        <strong className="d-block">{fromAmount} {quoteDetail?.action?.fromToken?.symbol}</strong>
                                                        <small className="text-muted">{props?.detailViewData?.sourceTokenSymbol}</small>
                                                        <div><span className="ms-2 badge bg-secondary">{props?.detailViewData?.sourceChainName}</span></div>
                                                    </div>
                                                </div>

                                                <div className="col-md-1 text-center">
                                                    <i className="fas fa-arrow-right text-primary fs-5"></i>
                                                </div>

                                                <div className="col-md-5">
                                                    <div className="bg-white rounded p-3 text-center h-100">
                                                        <small className="text-muted d-block mb-2">To</small>
                                                        <div className="d-flex align-items-center justify-content-center mb-2">
                                                            <div className="position-relative coin-wrapper me-2"
                                                                style={{ width: '32px', height: '32px' }}>



                                                                {utilityService.isNullOrEmpty(props.detailViewData?.destinationChainLogoUri) && <div className="coin"></div>}
                                                                {utilityService.isNullOrEmpty(props.detailViewData?.destinationTokenLogoUri) && <div className="coin-small"></div>}

                                                                {!utilityService.isNullOrEmpty(props.detailViewData?.destinationChainLogoUri) && (
                                                                    <img src={props.detailViewData?.destinationChainLogoUri} className="coin" alt="chain-logo" />
                                                                )}
                                                                {!utilityService.isNullOrEmpty(props.detailViewData?.destinationTokenLogoUri) && (
                                                                    <img src={props.detailViewData?.destinationTokenLogoUri} className="coin-small" alt="token-logo" />
                                                                )}


                                                            </div>

                                                        </div>
                                                        <strong className="d-block">{toAmount} {quoteDetail?.action?.toToken?.symbol}</strong>
                                                        <small className="text-muted">{props?.detailViewData?.destinationTokenSymbol}</small>
                                                        <div><span className="ms-2 badge bg-secondary">{props?.detailViewData?.destinationChainName}</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>


                                        {/* Transaction Details Cards */}
                                        <div className="row g-3 mb-3">
                                            <div className="col-md-6">
                                                <div className="inner-card p-3 bg-light border rounded h-100">
                                                    <h6 className="fw-bold mb-3 text-secondary">
                                                        <i className="fas fa-upload me-2"></i>Source Transaction
                                                    </h6>
                                                    <div className="small">
                                                        <div className="mb-2">
                                                            <span className="text-muted">Amount:</span>
                                                            <span className="float-end fw-semibold">{fromAmount} {quoteDetail?.action?.fromToken?.symbol}</span>
                                                        </div>
                                                        <div className="mb-2">
                                                            <span className="text-muted">Sender:</span>
                                                            {
                                                                utilityService.isNullOrEmpty(quoteDetail?.action?.fromAddress) &&
                                                                <>
                                                                    <span className="float-end font-monospace">-</span>
                                                                </>
                                                            }
                                                            {
                                                                !utilityService.isNullOrEmpty(quoteDetail?.action?.fromAddress) &&
                                                                <>
                                                                    <span className="float-end font-monospace">{`${quoteDetail?.action?.fromAddress.slice(0, 6)}.....${quoteDetail?.action?.fromAddress.slice(-4)}`}</span>
                                                                </>
                                                            }
                                                            <i className="fas fa-copy text-muted ms-1 cursor-pointer"></i>
                                                        </div>
                                                        <div className="mb-2">
                                                            <span className="text-muted">Hash:</span>
                                                            {
                                                                utilityService.isNullOrEmpty(props.detailViewData?.transactionHash) &&
                                                                <>
                                                                    <span className="float-end font-monospace">-</span>
                                                                </>
                                                            }
                                                            {
                                                                !utilityService.isNullOrEmpty(props.detailViewData?.transactionHash) &&
                                                                <>
                                                                    <span className="float-end font-monospace">{`${props.detailViewData?.transactionHash?.slice(0, 6)}.....${props.detailViewData?.transactionHash?.slice(-4)}`}</span>
                                                                </>
                                                            }
                                                            <i className="fas fa-copy text-muted ms-1 cursor-pointer"></i>
                                                        </div>
                                                        {/* <div>
                              <span className="text-muted">Time:</span>
                              <span className="float-end">06/14/2025 4:33 PM</span>
                            </div> */}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="inner-card p-3 bg-light border rounded h-100">
                                                    <h6 className="fw-bold mb-3 text-secondary">
                                                        <i className="fas fa-download me-2"></i>Destination Transaction
                                                    </h6>
                                                    <div className="small">
                                                        <div className="mb-2">
                                                            <span className="text-muted">Amount:</span>
                                                            <span className="float-end fw-semibold">{toAmount} {quoteDetail?.action?.toToken?.symbol}</span>
                                                        </div>
                                                        <div className="mb-2">
                                                            <span className="text-muted">Recipient:</span>
                                                            {
                                                                utilityService.isNullOrEmpty(quoteDetail?.action?.toAddress) &&
                                                                <>
                                                                    <span className="float-end font-monospace">-</span>
                                                                </>
                                                            }
                                                            {
                                                                !utilityService.isNullOrEmpty(quoteDetail?.action?.toAddress) &&
                                                                <>
                                                                    <span className="float-end font-monospace">{`${quoteDetail?.action?.toAddress.slice(0, 6)}.....${quoteDetail?.action?.toAddress.slice(-4)}`}</span>
                                                                </>
                                                            }
                                                            <i className="fas fa-copy text-muted ms-1 cursor-pointer"></i>
                                                        </div>
                                                        <div className="mb-2">
                                                            <span className="text-muted">Hash:</span>
                                                            {
                                                                utilityService.isNullOrEmpty(props.detailViewData?.transactionHash) &&
                                                                <>
                                                                    <span className="float-end font-monospace">-</span>
                                                                </>
                                                            }
                                                            {
                                                                !utilityService.isNullOrEmpty(props.detailViewData?.transactionHash) &&
                                                                <>
                                                                    <span className="float-end font-monospace">{`${props.detailViewData?.transactionHash?.slice(0, 6)}.....${props.detailViewData?.transactionHash?.slice(-4)}`}</span>
                                                                </>
                                                            }
                                                            <i className="fas fa-copy text-muted ms-1 cursor-pointer"></i>
                                                        </div>
                                                        {/* <div>
                              <span className="text-muted">Time:</span>
                              <span className="float-end">06/14/2025 4:33 PM</span>
                            </div> */}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Additional Information Card */}
                                        <div className="inner-card p-3 bg-light border rounded">
                                            <h6 className="fw-bold mb-3 text-secondary">
                                                <i className="fas fa-info-circle me-2"></i>Additional Information
                                            </h6>
                                            <div className="row small">
                                                <div className="col-6 mb-2">
                                                    <span className="text-muted">Route:</span>
                                                </div>
                                                <div className="col-6 mb-2 text-end">
                                                    <span className="badge bg-purple text-white">
                                                        <i className="fas fa-bolt me-1"></i>{props?.detailViewData?.transactiionAggregator}
                                                    </span>
                                                </div>
                                                <div className="col-6 mb-2">
                                                    <span className="text-muted">Gas Fee:</span>
                                                </div>
                                                <div className="col-6 mb-2 text-end">
                                                    <span> $ {totalTransactionCost} </span>
                                                </div>
                                                <div className="col-6 mb-2">
                                                    <span className="text-muted">BNB GreenField:</span>
                                                </div>
                                                <div className="col-6 text-end" role="button">
                                                    <span><a href={`https://greenfield-sp.defibit.io/view/rapidx-sign-storage/${props?.detailViewData?.greenFieldUrl}`} target="_blank">{props?.detailViewData?.greenFieldUrl}</a></span>
                                                </div>
                                                <div className="col-6 mb-2">
                                                    <span className="text-muted">Created on:</span>
                                                </div>
                                                <div className="col-6 text-end mb-2" role="button">
                                                    <span>{utilityService.formatUtcToLocal(props?.detailViewData?.createdOn)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons Card */}
                                        {/* <div className="inner-card p-3 mt-3 bg-light border rounded">
                      <div className="d-flex justify-content-center gap-3">
                        <button className="btn btn-outline-primary btn-sm">
                          <i className="fas fa-external-link-alt me-2"></i>View on Explorer
                        </button>
                        <button className="btn btn-outline-secondary btn-sm">
                          <i className="fas fa-share-alt me-2"></i>Share
                        </button>
                        <button className="btn btn-outline-success btn-sm">
                          <i className="fas fa-download me-2"></i>Download Receipt
                        </button>
                      </div>
                    </div> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
