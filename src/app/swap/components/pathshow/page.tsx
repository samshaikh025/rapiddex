"use client"
import React, { useState, useEffect } from 'react';
import { Chains, PathShowViewModel, Tokens } from '@/shared/Models/Common.model';
import { CryptoService } from '@/shared/Services/CryptoService';
import Skeleton from 'react-loading-skeleton';

type PropsType = {
  Amountpathshow: number;
  sourceChain: Chains;
  destChain: Chains;
  sourceToken: Tokens;
  destToken: Tokens;
  sendInitData: (data: PathShowViewModel[]) => void;
  sendSelectedPath: (data: PathShowViewModel) => void;
  isPathLoadingParent: (status:boolean) => void;
};

export default function Pathshow(props: PropsType) {
  const [pathShowSpinner, setPathShowSpinner] = useState<boolean>(false);
  let [availablePaths, setAvailablePaths] = useState<PathShowViewModel[]>([]);
  let [currentSelectedPath, setCurrentSelectedPath] = useState<PathShowViewModel>(new PathShowViewModel());

  useEffect(() => {
    const fetchData = async () => {
      if (!isNaN(props.Amountpathshow) && props.Amountpathshow > 0) {
        const cryptoService = new CryptoService();
        setPathShowSpinner(true);
        props.isPathLoadingParent(true);
        try {
          let result = await cryptoService.getBestPathFromChosenChains(
            props.sourceChain,
            props.destChain,
            props.sourceToken,
            props.destToken,
            props.Amountpathshow
          );
          if(result && result.length > 0){
            //result = result.slice(0,2);
            result.forEach((item, index)=>{
              item.pathId = index + 1;
            });
            props.sendInitData(result);
            setCurrentSelectedPath(result[0]);
            setAvailablePaths(result);
            setPathShowSpinner(false);
            props.isPathLoadingParent(false);
          }
          
        } catch (error) {
          setPathShowSpinner(false);
          props.isPathLoadingParent(false);
          console.error('Error fetching path data:', error);
        }
      }
    };

    fetchData();
  }, [props.Amountpathshow, props.sourceChain, props.destChain, props.sourceToken, props.destToken]);

  function sendSelectedPathToParent(path: PathShowViewModel){
    setCurrentSelectedPath(path);
    props.sendSelectedPath(path);
    //close offcanvas
    //document.getElementById('offcanvasBottom').classList.remove('show')
  }
  return (
    <>
    { availablePaths.length > 0 && 
        <>
          <div className="col-lg-7 col-md-12 col-sm-12 col-12 d-none d-lg-block">
            <div className="card">
              <div className="p-24">
                <div className="d-flex justify-content-between align-items-center mb-2 gap-3 flex-wrap-reverse">
                  <div className="card-title">
                    Select route
                    <p className="mt-2 font-16 mb-0">
                      Sorted by estimated output minus gas fees
                    </p>
                  </div>
                  <div className="card-action-wrapper d-flex align-items-center gap-2">
                    <div className="dropdown">
                      <button
                        className="btn primary-btn dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        Maximum Return
                      </button>
                      {/* <ul className="dropdown-menu">
                                        <li><a className="" href="#">Fastest Transfer</a></li>
                                    </ul> */}
                    </div>
                    <i className="fas fa-redo-alt"></i>
                  </div>
                </div>
                {
                  pathShowSpinner == true &&
                  <>
                    <div className="d-flex flex-column gap-3 add-scroll-bar mt-4">

                    </div>
                    {Array.from({ length: 2 }, (_, i) => (
                      <div className="inner-card w-100 py-2 active-card" key={i}>
                        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap px-3 pb-2 bottom-border-line">
                          <div className="d-flex align-items-center gap-2">
                            <Skeleton width={50} height={10} />
                            <Skeleton width={50} height={10} />
                            <Skeleton width={50} height={10} />
                            <Skeleton width={50} height={10} />
                          </div>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <Skeleton width={60} height={20} />
                            <Skeleton width={60} height={20} />
                          </div>
                        </div>
                        <div className="px-3 d-flex justify-content-between py-2 middle-align-card">
                          <div>
                            <Skeleton width={50} height={10} />
                            <div className="d-flex align-items-center gap-3">
                              <div className="position-relative coin-wrapper">
                                <Skeleton width={50} height={50} circle={true} />
                              </div>
                              <div className="d-flex flex-column">
                                <label className="coin-name d-block fw-600">
                                  <Skeleton width={50} height={10} />
                                </label>
                                <label className="coin-sub-name">
                                  <Skeleton width={30} height={10} />
                                </label>
                              </div>
                            </div>
                          </div>
                          <div className="relative center-card-with-line d-flex align-items-center gap-2 inner-card px-3 py-2 my-3">
                            <Skeleton width={30} height={30} circle={true} />
                            <label className="font-16 fw-600">
                              <Skeleton width={30} height={10} />
                            </label>
                          </div>
                          <div>
                            <Skeleton width={50} height={10} />
                            <div className="d-flex align-items-center gap-3">
                              <div className="d-flex flex-column">
                                <label className="coin-name d-block fw-600">
                                  <Skeleton width={50} height={10} />
                                </label>
                                <label className="coin-sub-name">
                                  <Skeleton width={30} height={10} />
                                </label>
                              </div>
                              <div className="position-relative coin-wrapper">
                                <Skeleton width={50} height={50} circle={true} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap px-3 pt-2 top-border-line">
                          <Skeleton width={25} height={25} circle={true} />
                          <Skeleton width={50} height={10} />
                          <Skeleton width={90} height={10} />
                        </div>
                      </div>
                    ))}
                  </>
                }
                {pathShowSpinner == false && (
                  <>
                    <div className="d-flex flex-column gap-3 add-scroll-bar mt-4">
                      {
                        availablePaths.length > 0 &&
                        availablePaths.map((pathshow, index) => (
                          <div key={index} className={`inner-card w-100 py-2 ${pathshow.pathId == currentSelectedPath.pathId ? 'active-card' : ''}`}  onClick={() => sendSelectedPathToParent(pathshow)}>
                            <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap px-3 pb-2 bottom-border-line">
                              <div className="d-flex align-items-center gap-2">
                                <label className="font-16">
                                  <span className="fw-600">Est:</span>{" "}
                                  {pathshow.estTime}
                                </label>
                                <label className="font-16">
                                  <span className="fw-600">Gas Fees:</span> $
                                  {pathshow.gasafee}
                                </label>
                              </div>
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                <label className="best-return fw-600 px-2 py-1">
                                  Best Return
                                </label>
                                <label className="faster fw-600 px-2 py-1">
                                  {pathshow.aggregatorOrderType}
                                </label>
                              </div>
                            </div>
                            <div className="px-3 d-flex justify-content-between py-2 middle-align-card">
                              <div>
                                <label className="fw-600">From</label>
                                <div className="d-flex align-items-center gap-3">
                                  <div className="position-relative coin-wrapper">
                                    <img
                                      src={props.sourceChain.logoURI}
                                      className="coin"
                                      alt="coin"
                                    />
                                    <img
                                      src={props.sourceToken.logoURI}
                                      className="coin-small"
                                      alt="coin"
                                    />
                                  </div>
                                  <div className="d-flex flex-column">
                                    <label className="coin-name d-block fw-600">
                                      {pathshow.fromChain}
                                    </label>
                                    <label className="coin-sub-name">
                                      {pathshow.fromToken}
                                    </label>
                                  </div>
                                </div>
                              </div>
                              <div className="relative center-card-with-line d-flex align-items-center gap-2 inner-card px-3 py-2 my-3">
                                <img
                                  src="https://movricons.s3.ap-south-1.amazonaws.com/CCTP.svg"
                                  width="100%"
                                  height="100%"
                                />
                                <label className="font-16 fw-600">
                                  {pathshow.aggregator}
                                </label>
                              </div>
                              <div>
                                <label className="fw-600 d-block">To</label>
                                <div className="d-flex align-items-center gap-3">
                                  <div className="d-flex flex-column">
                                    <label className="coin-name d-block fw-600">
                                      {pathshow.toChain}
                                    </label>
                                    <label className="coin-sub-name">
                                      {pathshow.toToken}
                                    </label>
                                  </div>
                                  <div className="position-relative coin-wrapper">
                                    <img
                                      src={props.destChain.logoURI}
                                      className="coin"
                                      alt="coin"
                                    />
                                    <img
                                      src={props.destToken.logoURI}
                                      className="coin-small"
                                      alt="coin"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap px-3 pt-2 top-border-line">
                              <i className="fas fa-bolt primary-text"></i>{" "}
                              <label className="font-16">
                                <span className="fw-600">$0.708</span> higher output
                                than any other route
                              </label>
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
    }
    <div className="offcanvas offcanvas-bottom custom-backgrop" id="offcanvasBottom"  data-bs-backdrop="true" aria-labelledby="offcanvasBottomLabel" style={{height: '50%'}}>
      <div className="offcanvas-header">
        <h5 className="offcanvas-title primary-text" id="offcanvasBottomLabel">Showing {availablePaths.length} Routes</h5>
        <button type="button" className="btn-close text-reset primary-text" data-bs-dismiss="offcanvas" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>
        </button>
      </div>
      <div className="offcanvas-body small">
            <div className='d-flex gap-3 flex-column add-scroll-bar'>
            {
              availablePaths.length > 0 &&
              availablePaths.map((pathshow, index) => (
                <div className={`inner-card w-100 py-2 px-3 mt-2 ${pathshow.pathId == currentSelectedPath.pathId ? 'active-card' : ''}`} data-bs-dismiss="offcanvas" aria-label="Close" onClick={() => sendSelectedPathToParent(pathshow)}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="selcet-coin coin-wrapper">
                      <img src="https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/ethereum.svg" className="coin" alt="" />
                    </div>
                    <div className="d-flex flex-column">
                      <label className="coin-name d-block fw-600">{pathshow.aggregator} <span className="pl-2 fw-400">~ {pathshow.estTime} mins </span> <label className="faster fw-600 px-2 py-1">
                        faster
                      </label></label>
                      <div className="mt-0.5 d-flex items-center text-sm">
                        <p className="m-0 flex p-0 font-medium primary-text">Est. Output:
                          <span className="">
                            <span><span className="px-1 fw-400">0.3 </span>
                            </span>
                            USDC</span>
                        </p><span className="">&nbsp;</span><p className="m-0 p-0 font-medium primary-text"><span>Gas Fees: </span> <span className="fw-400">${pathshow.gasafee}</span></p></div>
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
