"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BridgeMessage, Chains, PathShowViewModel, Tokens } from '@/shared/Models/Common.model';
import { CryptoService } from '@/shared/Services/CryptoService';
import Skeleton from 'react-loading-skeleton';
import { useSelector } from 'react-redux';
import { UtilityService } from '@/shared/Services/UtilityService';
import { Keys } from '@/shared/Enum/Common.enum';
import { SharedService } from '@/shared/Services/SharedService';

type PropsType = {
  Amountpathshow: number;
  sourceChain: Chains;
  destChain: Chains;
  sourceToken: Tokens;
  destToken: Tokens;
  sendInitData: (data: PathShowViewModel[]) => void;
  sendSelectedPath: (data: PathShowViewModel) => void;
  isPathLoadingParent: (status: boolean) => void;
  amountInUsd: number;
};

export default function Pathshow(props: PropsType) {
  const [pathShowSpinner, setPathShowSpinner] = useState<boolean>(false);
  let [availablePaths, setAvailablePaths] = useState<PathShowViewModel[]>([]);
  let [currentSelectedPath, setCurrentSelectedPath] = useState<PathShowViewModel>(new PathShowViewModel());
  const [isShowPathShowTimer, setIsShowPathShowTimer] = useState<boolean>(false);

  // Use refs for timer and abort controller
  const pathReloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const currentAmountRef = useRef<number>(0);

  let bridgeMessage: BridgeMessage = new BridgeMessage();
  const walletData = useSelector((state: any) => state.WalletData);
  const utilityService = new UtilityService();
  const walletAddress = !utilityService.isNullOrEmpty(walletData.address) ? walletData.address : '';

  const cryptoService = new CryptoService();
  const sharedService = SharedService.getSharedServiceInstance();
  const currentTheme = useSelector((state: any) => state.SelectedTheme);
  const apiUrlENV: string = process.env.NEXT_PUBLIC_NODE_API_URL;

  // Clear any existing timer
  const clearExistingTimer = useCallback(() => {
    if (pathReloadTimeoutRef.current) {
      clearTimeout(pathReloadTimeoutRef.current);
      pathReloadTimeoutRef.current = null;
    }
    setIsShowPathShowTimer(false);
  }, []);

  // Cancel any ongoing API calls
  const cancelOngoingRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Create new abort controller for API calls
  const createNewAbortController = useCallback(() => {
    cancelOngoingRequests();
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  }, [cancelOngoingRequests]);

  const fetchData = useCallback((sendAmt: number) => {
    // Clear any existing timer and requests
    clearExistingTimer();
    cancelOngoingRequests();

    // Update current amount ref
    currentAmountRef.current = sendAmt;

    if (!isNaN(sendAmt) && sendAmt > 0) {
      try {
        if (props.amountInUsd < 0.95) {
          props.sendInitData([]);
          setCurrentSelectedPath(new PathShowViewModel());
          setAvailablePaths([]);
          return;
        }

        props.isPathLoadingParent(true);
        setPathShowSpinner(true);
        setIsShowPathShowTimer(false);

        // Create new abort controller for this request
        const abortController = createNewAbortController();
        getAllPathForAmount(sendAmt, abortController.signal);
      } catch (error) {
        props.sendInitData([]);
        setPathShowSpinner(false);
        props.isPathLoadingParent(false);
        console.error('Error fetching path data:', error);
      }
    } else {
      props.sendInitData([]);
      setCurrentSelectedPath(new PathShowViewModel());
      setAvailablePaths([]);
    }
  }, [props, clearExistingTimer, cancelOngoingRequests, createNewAbortController]);

  const getAllPathForAmount = useCallback(async (amt: number, signal: AbortSignal) => {
    try {
      const result = await cryptoService.getBestPathFromChosenChains(
        props.sourceChain,
        props.destChain,
        props.sourceToken,
        props.destToken,
        amt,
        walletAddress,
        { signal } // Pass abort signal to API call
      );

      // Check if component is still mounted and amount hasn't changed
      if (!isMountedRef.current || signal.aborted) {
        return;
      }

      // Only process if this is still the current amount
      if (amt !== currentAmountRef.current) {
        console.log("Amount changed, ignoring stale response");
        return;
      }

      console.log("Result received for amount:", amt);
      console.log("Result length:", result.length);

      if (result && result.length > 0) {
        result.forEach((item, index) => {
          item.pathId = index + 1;
          item.fromAmountUsd = String(props.amountInUsd);
        });

        setPathShowSpinner(false);
        props.isPathLoadingParent(false);

        // Set up timer for next refresh
        invokeTimeOutForReloadPath(amt);

        props.sendInitData(result);
        setCurrentSelectedPath(result[0]);
        setAvailablePaths(result);
      } else if (result && result.length === 0) {
        setPathShowSpinner(false);
        props.isPathLoadingParent(false);
        props.sendInitData([]);
        setIsShowPathShowTimer(false);
        setCurrentSelectedPath(new PathShowViewModel());
        setAvailablePaths([]);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }

      if (isMountedRef.current && amt === currentAmountRef.current) {
        props.isPathLoadingParent(false);
        setPathShowSpinner(false);
        props.sendInitData([]);
        console.error('Error fetching paths:', error);
      }
    }
  }, [props, walletAddress]);

  const invokeTimeOutForReloadPath = useCallback((sendAmt: number) => {
    // Clear any existing timer first
    clearExistingTimer();

    // Only set timer if amount is still current
    if (sendAmt === currentAmountRef.current && isMountedRef.current) {
      setIsShowPathShowTimer(true);

      pathReloadTimeoutRef.current = setTimeout(() => {
        // Double-check amount hasn't changed before fetching
        if (isMountedRef.current && sendAmt === currentAmountRef.current) {
          fetchData(sendAmt);
        }
      }, 60000); // 60 seconds
    }
  }, [clearExistingTimer, fetchData]);

  const sendSelectedPathToParent = useCallback((path: PathShowViewModel) => {
    setCurrentSelectedPath(path);
    props.sendSelectedPath(path);
  }, [props]);

  // Effect for amount changes
  useEffect(() => {
    console.log("Props.Amountpathshow changed:", props.Amountpathshow);

    // Cancel any ongoing operations
    clearExistingTimer();
    cancelOngoingRequests();

    if (props.Amountpathshow > 0) {
      // Small delay to debounce rapid changes
      const debounceTimeout = setTimeout(() => {
        fetchData(props.Amountpathshow);
      }, 300);

      return () => {
        clearTimeout(debounceTimeout);
      };
    } else {
      // Clear everything if amount is 0 or invalid
      props.sendInitData([]);
      setCurrentSelectedPath(new PathShowViewModel());
      setAvailablePaths([]);
      setPathShowSpinner(false);
      props.isPathLoadingParent(false);
    }
  }, [props.Amountpathshow, props.amountInUsd]);

  // Effect for wallet reconnection
  useEffect(() => {
    if (walletData.isReconnected === false && props.Amountpathshow > 0) {
      fetchData(props.Amountpathshow);
    }
  }, [walletData.isReconnected]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      clearExistingTimer();
      cancelOngoingRequests();
    };
  }, []);


  return (
    <>
      <div className="col-lg-5 col-md-12 col-sm-12 col-12 d-none d-lg-block">
        <div className="card">
          <div className="p-24">
            <div className="d-flex justify-content-between align-items-center mb-2 gap-3">
              <div className="card-title">
                Will get at <span className=''>{currentSelectedPath.toChain}</span>
              </div>
              {/* <div className="bar">
                    <div className="in"></div>
                  </div> */}
              <div id="countdown" className={isShowPathShowTimer ? 'd-block' : 'd-none'}>
                <svg>
                  <circle r="18" cx="20" cy="20" className="background-circle"></circle>
                  <circle r="18" cx="20" cy="20" className="animated-circle"></circle>
                </svg>
              </div>
              <div className="card-action-wrapper d-flex align-items-center gap-2">
                {/* <div className="dropdown">
                      <button
                        className="btn primary-btn dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        Maximum Return
                      </button>
                      <ul className="dropdown-menu">
                                        <li><a className="" href="#">Fastest Transfer</a></li>
                                    </ul>
                    </div>
                    <i className="fas fa-redo-alt"></i> */}
              </div>
            </div>
            {
              pathShowSpinner == true &&
              <>
                <div className="d-flex flex-column gap-3 add-scroll-bar mt-4">
                  {Array.from({ length: 2 }, (_, i) => (
                    <div key={i} className="inner-card w-100 py-2">
                      <div className="px-3 d-block justify-content-between py-2 middle-align-card">
                        <div className='d-flex justify-content-between'>
                          <div className="d-flex align-items-center gap-3">
                            <div className="selcet-coin coin-wrapper">
                              <Skeleton width={50} height={50} circle={true} />
                            </div>
                            <div className="d-flex flex-column">
                              <label className="coin-name d-block fw-600">
                                <Skeleton width={90} height={15} />
                              </label>
                              <label className="coin-sub-name">
                                <Skeleton width={50} height={10} />
                              </label>
                            </div>
                          </div>
                          <div className="d-block align-items-center gap-2 flex-wrap">
                            <Skeleton width={90} height={20} />
                          </div>
                        </div>

                      </div>
                      <div className="px-3 py-1 d-flex align-item-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <label className="font-16 d-flex align-items-center gap-2">
                            <Skeleton width={10} height={10} circle={true} />
                            <Skeleton width={90} height={10} />
                          </label>
                          <label className="font-16 d-flex align-items-center gap-2">
                            <Skeleton width={10} height={10} circle={true} />
                            <Skeleton width={90} height={10} />
                          </label>
                        </div>
                        <div className='d-block align-items-end gap-2'>
                          <Skeleton width={90} height={20} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            }
            {pathShowSpinner == false &&
              <>
                <div className="d-flex flex-column gap-3 add-scroll-bar mt-4">
                  {
                    availablePaths.length > 0 &&
                    availablePaths.map((pathshow, index) => (
                      <div key={index} className={`inner-card w-100 py-2 ${pathshow.pathId == currentSelectedPath.pathId ? 'active-card' : ''}`} onClick={() => sendSelectedPathToParent(pathshow)}>
                        <div className="px-3 d-block justify-content-between py-2 middle-align-card">
                          <div className='d-flex justify-content-between'>
                            <div className="d-flex align-items-center gap-3">
                              <div className="selcet-coin coin-wrapper">
                                <img src={props.destChain.logoURI} className="coin" alt="" />
                              </div>
                              <div className="d-flex flex-column">
                                <label className="coin-name price-name d-block fw-600">
                                  {pathshow.toAmount} {pathshow.toToken}
                                </label>
                                <label className="coin-sub-name">
                                  $ {pathshow.toAmountUsd}
                                </label>
                              </div>
                            </div>
                            <div className="d-block align-items-center gap-2 flex-wrap">
                              <label className="best-return fw-600 px-2 py-1 text-capitalize">
                                {pathshow?.aggregatorOrderType}
                              </label>
                              {/* <label className="faster fw-600 px-2 py-1">
                                  {pathshow.aggregatorOrderType}
                                </label> */}
                            </div>
                          </div>

                        </div>
                        <div className="px-3 py-1 d-flex align-item-center justify-content-between">
                          <div className="d-flex align-items-center gap-2">
                            <label className="font-16 d-flex align-items-center gap-2">
                              <i className="fa-regular fa-clock "></i>
                              {pathshow.estTime}
                            </label>
                            <label className="font-16 d-flex align-items-center gap-2">
                              <i className="fa-solid fa-gas-pump"></i>
                              {pathshow.gasafee}
                            </label>
                          </div>
                          {
                            !utilityService.isNullOrEmpty(currentTheme) &&
                            <>
                              <div className='d-flex align-item-center gap-2 aggrigator-box'>
                                <img src={apiUrlENV + '/assets/images/provider-logo/' + pathshow.aggregator + '.svg'} alt="" />
                              </div>
                            </>
                          }

                        </div>
                      </div>
                    ))}
                </div>
              </>
            }
          </div>
        </div>
      </div>
      <div className="offcanvas offcanvas-bottom custom-backgrop offcanvas-cms p-0" id="offcanvasBottom" data-bs-backdrop="true" aria-labelledby="offcanvasBottomLabel" style={{ height: '50%' }}>
        <div className="offcanvas-header">
          <h5 className="offcanvas-title primary-text" id="offcanvasBottomLabel">Showing {availablePaths.length} Routes</h5>
          <button type="button" className="btn-close text-reset primary-text" data-bs-dismiss="offcanvas" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>
          </button>
        </div>
        <div className="offcanvas-body small">
          <div className='d-flex gap-3 flex-column add-scroll-bar'>
            {
              availablePaths.length > 0 &&
              availablePaths.map((pathshow, index) => (
                <div className={`inner-card w-100 py-3 px-3 mt-2 ${pathshow.pathId == currentSelectedPath.pathId ? 'active-card' : ''}`} data-bs-dismiss="offcanvas" aria-label="Close" onClick={() => sendSelectedPathToParent(pathshow)} key={index}>
                  <div className="d-flex gap-3">
                    <div className="selcet-coin coin-wrapper">
                      <img src={props.destChain.logoURI} className="coin" alt="" />
                    </div>
                    <div className="d-flex flex-column w-100">
                      <label className="coin-name d-flex gap-2 justify-content-between">
                        <label className="coin-name d-block ">
                          <span className="d-block fw-600"> {pathshow.toAmount} {pathshow.toToken} </span>
                          <span className="d-block coin-sub-name" >$ {pathshow.toAmountUsd}</span>
                        </label>
                        <p className="faster fw-600 px-2 py-1 text-capitalize">
                          {pathshow?.aggregatorOrderType}
                        </p>
                      </label>
                    </div>
                  </div>
                  <div className="px-2 py-1 d-flex align-item-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <label className="font-16 d-flex align-items-center gap-2">
                        <i className="fa-regular fa-clock "></i>
                        {pathshow.estTime}
                      </label>
                      <label className="font-16 d-flex align-items-center gap-2">
                        <i className="fa-solid fa-gas-pump"></i>
                        {pathshow.gasafee}
                      </label>
                    </div>
                    <div className='d-flex align-item-center gap-2 aggrigator-box'>
                      <img src={apiUrlENV + '/assets/images/provider-logo/' + pathshow.aggregator + '.svg'} alt="" />
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </>
  );
}
