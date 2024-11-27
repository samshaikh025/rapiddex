"use client"
import React, { useState, useEffect, useRef } from 'react';
import { BridgeMessage, Chains, PathShowViewModel, Tokens } from '@/shared/Models/Common.model';
import { CryptoService } from '@/shared/Services/CryptoService';
import Skeleton from 'react-loading-skeleton';
import { useSelector } from 'react-redux';
import { UtilityService } from '@/shared/Services/UtilityService';

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
  let bridgeMessage: BridgeMessage = new BridgeMessage();
  let [isShowPathShowTimer, setIsShowPathShowTimer] = useState<boolean>(false);
  let pathReloadIntervalId = useRef<number | null>(null);
  let pathShowInvokedForAmount = useRef<number | null>(null);
  let abc = useRef<number>(5);
 
  let walletData = useSelector((state: any) => state.WalletData);
  let walletAddress = "";
  let utilityService = new UtilityService();
  const cryptoService = new CryptoService();

  function fetchData(){

    if (!isNaN(props.Amountpathshow) && props.Amountpathshow > 0) {
      props.isPathLoadingParent(true);
      setPathShowSpinner(true);
      setIsShowPathShowTimer(false);
      if(pathReloadIntervalId.current != null){
        clearInterval(pathReloadIntervalId.current);
        pathReloadIntervalId.current = null;
      }
      try {
        walletAddress = !utilityService.isNullOrEmpty(walletData.address) ? walletData.address : '';
        pathShowInvokedForAmount.current = props.Amountpathshow;
        cryptoService.getBestPathFromChosenChains(
          props.sourceChain,
          props.destChain,
          props.sourceToken,
          props.destToken,
          props.Amountpathshow,
          walletAddress
        ).then((result) => {
          if (result && result.length > 0 && props.Amountpathshow == pathShowInvokedForAmount.current) {
            //result = result.slice(0,2);
            result.forEach((item, index) => {
              item.pathId = index + 1;
              item.fromAmountUsd = String(props.amountInUsd);
            });
            props.sendInitData(result);
            setCurrentSelectedPath(result[0]);
            setAvailablePaths(result);
            setPathShowSpinner(false);
            props.isPathLoadingParent(false);
            abc.current = 10;
            setIsShowPathShowTimer(true);
            //call time out for realod path
              invokeTimeOutForReloadPath();
          }
        }).catch((error) => {
          setPathShowSpinner(false);
          bridgeMessage.message = "No path found";
          props.isPathLoadingParent(false);
        })
      } catch (error) {
        setPathShowSpinner(false);
        props.isPathLoadingParent(false);
        console.error('Error fetching path data:', error);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [props.Amountpathshow]);

  useEffect(() => {
    if(walletData.isReconnected == false){
      fetchData();
    }
  }, [walletData.isReconnected]);
  
  function sendSelectedPathToParent(path: PathShowViewModel) {
    setCurrentSelectedPath(path);
    props.sendSelectedPath(path);
    //close offcanvas
    //document.getElementById('offcanvasBottom').classList.remove('show')
  }
  
  function invokeTimeOutForReloadPath(){
    let reloadPathShow = setTimeout(() => {
      fetchData();    
    }, 60000);
    pathReloadIntervalId.current = (reloadPathShow as unknown as number);
  }

  useEffect(()=>{
    // Cleanup function to clear the interval
    return () => {
      clearInterval(pathReloadIntervalId.current);
    };
  }, [])
  return (
    <>
        <>
          <div className="col-lg-5 col-md-12 col-sm-12 col-12 d-none d-lg-block">
            <div className="card">
              <div className="p-24">
                <div className="d-flex justify-content-between align-items-center mb-2 gap-3">
                  <div className="card-title">
                    Well Get At Chain Name
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
                        <div className="px-4 py-1">
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
                        </div>
                      </div>
                    ))}
                  </div>
                  </>
                }
                {pathShowSpinner == false && (
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
                                    <img src="https://movricons.s3.ap-south-1.amazonaws.com/CCTP.svg" className="coin" alt="" />
                                  </div>
                                  <div className="d-flex flex-column">
                                    <label className="coin-name d-block fw-600">
                                      {pathshow.fromAmount} {pathshow.fromToken}
                                    </label>
                                    <label className="coin-sub-name">
                                      $ {pathshow.fromAmountUsd}
                                    </label>
                                  </div>
                                </div>
                                <div className="d-block align-items-center gap-2 flex-wrap">
                                  <label className="best-return fw-600 px-2 py-1">
                                    Best Return
                                  </label>
                                  {/* <label className="faster fw-600 px-2 py-1">
                                  {pathshow.aggregatorOrderType}
                                </label> */}
                                </div>
                              </div>

                            </div>
                            <div className="px-4 py-1">
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
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      <div className="offcanvas offcanvas-bottom custom-backgrop" id="offcanvasBottom" data-bs-backdrop="true" aria-labelledby="offcanvasBottomLabel" style={{ height: '50%' }}>
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
                      <img src="https://movricons.s3.ap-south-1.amazonaws.com/CCTP.svg" className="coin" alt="" />
                    </div>
                    <div className="d-flex flex-column w-100">
                      <label className="coin-name d-flex gap-2 justify-content-between">
                        <label className="coin-name d-block ">
                          <span className="d-block fw-600"> {pathshow.fromAmount} {pathshow.fromToken} </span>
                          <span className="d-block coin-sub-name" >$ {pathshow.fromAmountUsd}</span>
                        </label>
                        <p className="faster fw-600 px-2 py-1">
                          Faster
                        </p>
                      </label>
                    </div>
                  </div>
                  <div className="px-2 py-1">
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
