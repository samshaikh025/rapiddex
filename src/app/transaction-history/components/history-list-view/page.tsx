"use client";
import { TransactionHistoryResponse } from "@/shared/Models/Common.model";
import { UtilityService } from "@/shared/Services/UtilityService";
import Skeleton from "react-loading-skeleton";
type propsType = {
    transactionData: TransactionHistoryResponse[];
    walletAddress: string;
    showDetailView: (object : TransactionHistoryResponse) => void;
    showLoader : boolean
}
export default function ListView(props: propsType) {

    let utilityService = new UtilityService();
    
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
                                      height: '550px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                  }}
                              >
                                  <div className="d-flex justify-content-between flex-column flex-md-row align-items-md-center mb-3">
                                      <h5 className="mb-3 mb-md-0 fw-bold">Latest Transfers</h5>
                                      <div className="input-group search-bar">
                                          <span className="input-group-text bg-light border-end-0">
                                              <i className="bi bi-search text-muted"></i>
                                          </span>
                                          <input
                                              type="text"
                                              className="form-control border-start-0"
                                              placeholder="Search transfers or wallets"
                                          />
                                      </div>
                                  </div>
                                  {
                                    props.showLoader == true && 
                                      <>
                                          <div>
                                              <>
                                                  {Array.from({ length: 4 }).map((_, index) => (
                                                      <div key={index} className="inner-card mb-3 p-3 rounded-3">
                                                          <div className="d-flex align-items-center">
                                                              {/* Txn Hash */}
                                                              <div className="text-center me-3" style={{ width: '150px' }}>
                                                                  <Skeleton circle={true} width={20} height={20} className="mb-1" />
                                                                  <Skeleton width={100} height={10} />
                                                              </div>

                                                              {/* Wallet Address */}
                                                              <div className="me-3" style={{ width: '150px' }}>
                                                                  <Skeleton width={100} height={10} />
                                                              </div>

                                                              {/* Source Chain & Token */}
                                                              <div className="d-flex align-items-center me-3" style={{ width: '200px' }}>
                                                                  <div className="position-relative coin-wrapper me-2">
                                                                      <Skeleton circle={true} width={32} height={32} className="me-1" />
                                                                      <Skeleton circle={true} width={16} height={16} />
                                                                  </div>
                                                                  <div className="d-flex flex-column">
                                                                      <Skeleton width={80} height={10} />
                                                                      <Skeleton width={60} height={10} />
                                                                  </div>
                                                              </div>

                                                              {/* Destination Chain & Token */}
                                                              <div className="d-flex align-items-center me-3" style={{ width: '200px' }}>
                                                                  <div className="position-relative coin-wrapper me-2">
                                                                      <Skeleton circle={true} width={32} height={32} className="me-1" />
                                                                      <Skeleton circle={true} width={16} height={16} />
                                                                  </div>
                                                                  <div className="d-flex flex-column">
                                                                      <Skeleton width={80} height={10} />
                                                                      <Skeleton width={60} height={10} />
                                                                  </div>
                                                              </div>

                                                              {/* USD Amount */}
                                                              <div className="me-3" style={{ width: '150px' }}>
                                                                  <Skeleton width={70} height={10} />
                                                              </div>

                                                              {/* Aggregator */}
                                                              <div className="d-flex align-items-center" style={{ width: '150px' }}>
                                                                  <Skeleton width={100} height={10} />
                                                              </div>

                                                              {/* Status */}
                                                              <div className="d-flex align-items-center" style={{ width: '150px' }}>
                                                                  <Skeleton width={60} height={10} />
                                                              </div>
                                                          </div>
                                                      </div>
                                                  ))}
                                              </>

                                          </div>
                                      </>
                                  }
                                  {
                                    (!props.showLoader && props?.transactionData?.length === 0) &&
                                    <>
                                          <div className="inner-card py-5 text-center flex-grow-1 d-flex justify-content-center align-items-center">
                                              <h1 className="display-6">No Data Available</h1>
                                          </div>
                                    </>
                                  }
                                  {(!props.showLoader && props?.transactionData?.length > 0) &&
                                      <div className="scroll-wrapper-history flex-grow-1">
                                          {/* Table Header */}
                                          <div className="header-row-history d-flex align-items-center mb-2">
                                              <div className="text-center me-3 fw-bold" style={{ width: '150px' }}>
                                                  Txn Hash
                                              </div>
                                              <div className="me-3 fw-bold" style={{ width: '150px' }}>
                                                  Wallet Address
                                              </div>
                                              <div className="me-3 fw-bold" style={{ width: '200px' }}>
                                                  From
                                              </div>
                                              <div className="me-3 fw-bold" style={{ width: '200px' }}>
                                                  To
                                              </div>
                                              <div className="me-3 fw-bold" style={{ width: '150px' }}>
                                                  Amount
                                              </div>
                                              <div className="fw-bold" style={{ width: '150px' }}>Via</div>
                                              <div className="fw-bold" style={{ width: '150px' }}>Status</div>
                                          </div>

                                          {/* Table Body */}
                                          <div className="table-body-history">
                                              {props.transactionData?.map((item, index) => (
                                                  <div key={index} className="inner-card mb-3 p-3 rounded-3" onClick={()=> props.showDetailView(item)} role="button">
                                                      <div className="d-flex align-items-center">
                                                          <div className="text-center me-3" style={{ width: '150px' }}>
                                                              <i className="bi bi-check-circle-fill text-success fs-5"></i>
                                                              {
                                                                  utilityService.isNullOrEmpty(item?.transactionHash) &&
                                                                  <>
                                                                      <div className="fw-semibold small">&nbsp;-&nbsp;</div>
                                                                  </>
                                                              }
                                                              {
                                                                  !utilityService.isNullOrEmpty(item?.transactionHash) &&
                                                                  <>
                                                                      <div className="fw-semibold small">{`${item?.transactionHash?.slice(0, 6)}.....${item?.transactionHash?.slice(-4)}`}</div>
                                                                  </>
                                                              }
                                                          </div>
                                                          <div className="me-3" style={{ width: '150px' }}>
                                                              {
                                                                  utilityService.isNullOrEmpty(item?.walletAddress) &&
                                                                  <>
                                                                      <div className="fw-semibold small">&nbsp;-&nbsp;</div>
                                                                  </>
                                                              }
                                                              {
                                                                  !utilityService.isNullOrEmpty(item?.walletAddress) &&
                                                                  <>
                                                                      <div className="fw-semibold small">{`${item?.walletAddress?.slice(0, 6)}.....${item?.walletAddress?.slice(-4)}`}</div>
                                                                  </>
                                                              }
                                                          </div>
                                                          <div className="d-flex align-items-center me-3" style={{ width: '200px' }}>
                                                              <div className="position-relative coin-wrapper me-2">
                                                                  {utilityService.isNullOrEmpty(item?.sourceChainLogoUri) && <div className="coin"></div>}
                                                                  {utilityService.isNullOrEmpty(item?.sourceTokenLogoUri) && <div className="coin-small"></div>}

                                                                  {!utilityService.isNullOrEmpty(item?.sourceChainLogoUri) && (
                                                                      <img src={item?.sourceChainLogoUri} className="coin" alt="chain-logo" />
                                                                  )}
                                                                  {!utilityService.isNullOrEmpty(item?.sourceTokenLogoUri) && (
                                                                      <img src={item?.sourceTokenLogoUri} className="coin-small" alt="token-logo" />
                                                                  )}
                                                              </div>

                                                              <div className="d-flex flex-column">
                                                                  <label className="coin-name d-block fw-600">
                                                                      {item?.sourceChainId > 0 ? item?.sourceChainName : 'Chain'}
                                                                  </label>
                                                                  <label className="coin-sub-name">
                                                                      {item?.sourceTokenSymbol !== '' ? item?.sourceTokenSymbol : 'Token'}
                                                                  </label>
                                                              </div>
                                                          </div>

                                                          <div className="d-flex align-items-center me-3" style={{ width: '200px' }}>
                                                              <div className="position-relative coin-wrapper me-2">
                                                                  {utilityService.isNullOrEmpty(item?.destinationChainLogoUri) && <div className="coin"></div>}
                                                                  {utilityService.isNullOrEmpty(item?.destinationTokenLogoUri) && <div className="coin-small"></div>}

                                                                  {!utilityService.isNullOrEmpty(item?.destinationChainLogoUri) && (
                                                                      <img src={item?.destinationChainLogoUri} className="coin" alt="chain-logo" />
                                                                  )}
                                                                  {!utilityService.isNullOrEmpty(item?.destinationTokenLogoUri) && (
                                                                      <img src={item?.destinationTokenLogoUri} className="coin-small" alt="token-logo" />
                                                                  )}
                                                              </div>

                                                              <div className="d-flex flex-column">
                                                                  <label className="coin-name d-block fw-600">
                                                                      {item?.destinationChainId > 0 ? item?.destinationChainName : 'Chain'}
                                                                  </label>
                                                                  <label className="coin-sub-name">
                                                                      {item?.destinationTokenSymbol !== '' ? item?.destinationTokenSymbol : 'Token'}
                                                                  </label>
                                                              </div>
                                                          </div>
                                                          <div className="me-3" style={{ width: '150px' }}>
                                                              <div className="fw-semibold small">{item?.amountUsd}</div>
                                                          </div>
                                                          <div className="d-flex align-items-center" style={{ width: '150px' }}>
                                                              {/* <div className="selcet-coin coin-wrapper me-2">
                                        {utilityService.isNullOrEmpty(item?.transactiionAggregator) ? (
                                            <div className="coin"></div>
                                        ) : (
                                            <img src={item?.transactiionAggregator} className="coin" alt="Aggregator Logo" />
                                        )}
                                    </div> */}
                                                              <span className="fw-semibold small">{item?.transactiionAggregator}</span>
                                                          </div>
                                                          <div className="d-flex align-items-center fw-semibold" style={{ width: '150px' }}>
                                                              {
                                                                  item?.transactionSubStatus == 1 ? 'PENDING' : (item?.transactionSubStatus == 2 ? 'DONE' : (item?.transactionSubStatus == 3 ? 'FAILED' : '-'))
                                                              }
                                                          </div>
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  }
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          
      </>


  );
}
