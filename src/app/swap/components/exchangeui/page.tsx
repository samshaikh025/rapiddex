"use client"
import { DataSource, Keys } from "@/shared/Enum/Common.enum";
import { BridgeMessage, Chains, PathShowViewModel, Tokens } from "@/shared/Models/Common.model";
import { SharedService } from "@/shared/Services/SharedService";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useEffect, useRef, useState } from "react";
import { useAccount, useSwitchAccount,useSwitchChain } from "wagmi";
import Pathshow from "../pathshow/page";
import { UtilityService } from "@/shared/Services/UtilityService";
import Skeleton from "react-loading-skeleton";
import { useDispatch, useSelector } from "react-redux";
import { OpenWalletModalA } from "@/app/redux-store/action/action-redux";
import { mainnet, sepolia } from 'wagmi/chains';
import { config } from '../../../wagmi/config';// Go up a level if needed
import { Chain } from "wagmi/chains";




type propsType = {
    sourceChain: Chains,
    destChain: Chains,
    sourceToken: Tokens,
    destToken: Tokens,
    dataSource: string | null,
    sourceTokenAmount: number,
    destTokenAmount: number,
    openTokenUI: (dataSource: string) => void;
    interChangeData: () => void
}

export default function Exchangeui(props: propsType) {
    let [sendAmount, setSendAmount] = useState<number | null>();
    let [equAmountUSD, setequAmountUSD] = useState<number | null>(null);
    let sharedService = SharedService.getSharedServiceInstance();
    let walletData = useSelector((state: any) => state.WalletData);
    let utilityService = new UtilityService();
    let [totalAvailablePath, setTotalAvailablePath] = useState<number>(0);
    let [isPathShow, setIsPathShow] = useState<boolean>(false);
    let [selectedPath, setSelectedPath] = useState<PathShowViewModel>(new PathShowViewModel());
    let amountTextBoxRef = useRef<HTMLInputElement>(null);
    let dispatch = useDispatch();
    const { open } = useWeb3Modal();
    let account = useAccount();
    const {
        switchChain,
        error,
        isPending,
        isSuccess,
        reset,
        data,
        failureCount,
        failureReason,
      } = useSwitchChain();
      const initialChains: Chain[] = []; // Start with an empty array
      const [dynamicChains, setDynamicChains] = useState<Chains[]>([]);
    
    
    
    

    const [pathshow,setpathshow] = useState<boolean>(false);

    let bridgeMessage:BridgeMessage = new BridgeMessage();
    let [isBridgeMessageVisible,setIsBridgeMessageVisible] = useState<boolean>(false);

    async function updateAmount(amount)
    {
        try
        {
            if(!utilityService.isNullOrEmpty(amount) && !isNaN(amount))
            {
                setSendAmount(Number(amount));
                setequAmountUSD(null);
                if(props.sourceTokenAmount > 0 && Number(amount) > 0)
                {
                    let eq = (amount * props.sourceTokenAmount);
                    setequAmountUSD(eq);
                }
            }else {
                setSendAmount(null);
                setequAmountUSD(null);
            }
             
        }catch(error)
        {

        }
    }

    function interChangeFromTo(){
        setSendAmount(null);
        setequAmountUSD(null);
        amountTextBoxRef.current.value = '';
        props.interChangeData();
    }

    function getInitData(data: PathShowViewModel[]){
        setTotalAvailablePath(data.length);
        if(data.length > 0){
            setSelectedPath(data[0]);
        }
    }

    function getSelectedPath (data: PathShowViewModel){
        setSelectedPath(data);
    }

    function setIsPathLoading(status:boolean){
        setIsPathShow(status);
    }


    
    

    async function exchange()
    {
        if(!utilityService.isNullOrEmpty(walletData.address))
        {
            let workingRpc = await utilityService.setupProviderForChain(props.sourceChain.chainId,props.sourceChain.rpcUrl);



            if(workingRpc != undefined && workingRpc != null)
            {
                

                
                 
                 
                 

                console.log(error);
      

                if(walletData.chainId != props.sourceChain.chainId)
                {
                       console.log("Need switch chain");

                       try
                       {
                         await switchChain({ chainId:props.sourceChain.chainId }) // Call switchChain with only chainId
                       }
                       catch(error)
                       {

                        console.log("rejected switch chain");

                       }

                       
                       
                       let checkNativeCoin = await utilityService.checkCoinNative(props.sourceChain,props.sourceToken)

                       // check balance

                       let balance = await utilityService.getBalance(checkNativeCoin,props.sourceToken,walletData.address,workingRpc);

                       if(Number(balance) < Number(sendAmount))
                       {

                         bridgeMessage.message = "You don't have enough "+ props.sourceToken.symbol +" to complete the transaction.";
                         setIsBridgeMessageVisible(true);

                       }
                       else
                       {

                        
                         
                       }


                       



                       
                       
                       
                    

                }
                else
                {
                    console.log("No Need to switch chain")
                }

                
                

                

                
            }


            
        }

        
    }

    return (
        <>
            <div className="col-lg-5 col-md-12 col-sm-12 col-12" id="swap-wrapper">
                <div className="card">
                    <div className="p-24">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="card-title">
                                Exchange
                            </div>
                            <div className="card-action-wrapper">
                                <i className="fas fa-cog cursor-pointer"></i>
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-3 position-relative">
                            <div className="inner-card w-100 py-2 px-3" id="select-coin" onClick={() =>
                                props.openTokenUI(DataSource.From)}>
                                <label className="mb-2 fw-600">From</label>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="position-relative coin-wrapper">
                                        { utilityService.isNullOrEmpty(props.sourceChain.logoURI) && <div className="coin"></div> }
                                        { utilityService.isNullOrEmpty(props.sourceToken.logoURI) && <div className="coin-small"></div> }
                                        
                                        { !utilityService.isNullOrEmpty(props.sourceChain.logoURI) && <img src={props.sourceChain.logoURI}
                                            className="coin" alt="coin" /> }
                                        { !utilityService.isNullOrEmpty(props.sourceToken.logoURI) && <img src={props.sourceToken.logoURI}
                                            className="coin-small" alt="coin" /> }
                                    </div>
                                    <div className="d-flex flex-column">
                                        <label className="coin-name d-block fw-600">{props.sourceChain.chainId > 0 ?
                                            props.sourceChain.chainName : 'Chain'}</label>
                                        <label className="coin-sub-name">{props.sourceToken.name != '' ? props.sourceToken.name :
                                            'Token'}</label>
                                    </div>
                                </div>
                            </div>
                            <div className="change-btn position-absolute cursor-pointer inner-card d-flex align-items-center justify-content-center"
                                onClick={() => interChangeFromTo()}>
                                <i className="fas fa-exchange-alt"></i>
                            </div>
                            <div className="inner-card w-100 py-2 px-3" onClick={() => props.openTokenUI(DataSource.To)}>
                                <label className="mb-2 fw-600">To</label>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="position-relative coin-wrapper">

                                        {utilityService.isNullOrEmpty(props.destChain.logoURI) && <div className="coin"></div>}
                                        {utilityService.isNullOrEmpty(props.destToken.logoURI) && <div className="coin-small"></div>}

                                        {!utilityService.isNullOrEmpty(props.destChain.logoURI) && <img src={props.destChain.logoURI}
                                            className="coin" alt="coin" />}
                                        {!utilityService.isNullOrEmpty(props.destToken.logoURI) && <img src={props.destToken.logoURI}
                                            className="coin-small" alt="coin" />}
                                    </div>
                                    <div className="d-flex flex-column">
                                        <label className="coin-name d-block fw-600">{props.destChain.chainId > 0 ?
                                            props.destChain.chainName : 'Chain'}</label>
                                        <label className="coin-sub-name">{props.destToken.name != '' ? props.destToken.name :
                                            'Token'}</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="inner-card w-100 py-2 px-3 mt-3">
                            <label className="mb-2 fw-600">Send</label>
                            <div className="d-flex align-items-center gap-3">
                                <div className="position-relative coin-wrapper">
                                    {utilityService.isNullOrEmpty(props.sourceChain.logoURI) && <div className="coin"></div>}
                                    {utilityService.isNullOrEmpty(props.sourceToken.logoURI) && <div className="coin-small"></div>}

                                    {!utilityService.isNullOrEmpty(props.sourceChain.logoURI) && <img src={props.sourceChain.logoURI}
                                        className="coin" alt="coin" />}
                                    {!utilityService.isNullOrEmpty(props.sourceToken.logoURI) && <img src={props.sourceToken.logoURI}
                                        className="coin-small" alt="coin" />}
                                </div>
                                <div className="d-flex flex-column pb-2">
                                    <input type="text" ref={amountTextBoxRef} className="transparent-input" onKeyUp={(e) =>
                                        updateAmount(e.currentTarget.value)} placeholder="0"/>
                                    {(equAmountUSD != null && equAmountUSD > 0) && <label className="coin-sub-name">$ {equAmountUSD}</label>} 
                                    {(!utilityService.isNullOrEmpty(sendAmount) && isNaN(Number(sendAmount))) && <label className="text-danger">Only Numeric Value Allowed</label>}
                                </div>
                            </div>
                        </div>

                        {
                            totalAvailablePath > 0 && 
                            <>
                                <label className="d-block d-lg-none text-end mt-2 primary-text text-bold" data-bs-toggle="offcanvas" data-bs-target="#offcanvasBottom" aria-controls="offcanvasBottom">View All {totalAvailablePath} Routes <i className="fa-solid fa-chevron-right"></i></label>
                            </>
                        }
                        {
                            sendAmount != null && sendAmount > 0 &&
                            <>
                                <div className="inner-card w-100 py-2 px-3 mt-2">
                                    <div className="d-flex align-items-center gap-3">
                                        {isPathShow &&
                                            <>
                                            <div className="selcet-coin coin-wrapper">
                                                <Skeleton circle={true} width={50} height={50} />
                                            </div>
                                            <div className="d-flex flex-column">
                                                <Skeleton width={50} height={10} />
                                                <Skeleton width={250} height={10} />
                                            </div>
                                            </>
                                        }
                                        {
                                            (!isPathShow && totalAvailablePath == 0) &&
                                            <><span>No Routes Availabe</span></>
                                        }
                                        {
                                            (!isPathShow && totalAvailablePath == 0) &&
                                            <><span>No Routes Availabe</span></>
                                        }
                                        {
                                            (!isPathShow && totalAvailablePath > 0) &&
                                            <>
                                                <div className="selcet-coin coin-wrapper">
                                                    <img src="https://movricons.s3.ap-south-1.amazonaws.com/CCTP.svg" className="coin" alt="" />
                                                </div>
                                                <div className="d-flex flex-column">
                                                    <label className="coin-name d-block fw-600">{selectedPath.aggregator} <span className="pl-2 fw-400">~ {selectedPath.estTime} mins </span> <label className="faster fw-600 px-2 py-1">
                                                        faster
                                                    </label></label>
                                                    <div className="mt-0.5 d-flex items-center text-sm">
                                                        <p className="m-0 flex p-0 font-medium primary-text">Est. Output:
                                                            <span className="">
                                                                <span><span className="px-1 fw-400">{selectedPath.receivedAmount} </span>
                                                                </span>
                                                                USDC</span>
                                                        </p><span className="">&nbsp;</span><p className="m-0 p-0 font-medium primary-text"><span>Gas Fees: </span> <span className="fw-400">${selectedPath.gasafee}</span></p></div>
                                                </div>
                                            </>
                                        }
                                    </div>
                                </div>
                            </>
                        }
                        
                        {
                            !utilityService.isNullOrEmpty(walletData.address) &&
                            <>
                                <button className="btn primary-btn w-100 mt-3" onClick={() => exchange()}>
                                    Exchange
                                </button>
                            </>
                        }
                        {
                            utilityService.isNullOrEmpty(walletData.address) &&
                            <>
                                <button className="btn primary-btn w-100 mt-3" onClick={() => dispatch(OpenWalletModalA(true))}>
                                    Connect Wallet
                                </button>
                            </>
                        }
                        
                        
                    </div>
                </div>
            </div>
           
                {(sendAmount != null && sendAmount > 0) &&
                    <Pathshow Amountpathshow={sendAmount}
                    destChain={props.destChain}
                    sourceChain={props.sourceChain}
                    sourceToken={props.sourceToken}
                    destToken={props.destToken} 
                    sendInitData={(result: PathShowViewModel[]) => getInitData(result)}
                    sendSelectedPath={(result: PathShowViewModel) => getSelectedPath(result)}
                    isPathLoadingParent = {(status: boolean) => setIsPathLoading(status)}/>
                } 
        </>
    );
  }
  