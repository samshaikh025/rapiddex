"use client"
import { config } from "@/app/wagmi/config";
import { DataSource, Keys } from "@/shared/Enum/Common.enum";
import { Chains, PathShowViewModel, Tokens } from "@/shared/Models/Common.model";
import { SharedService } from "@/shared/Services/SharedService";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useEffect, useRef, useState } from "react";
import { useAccount, useBalance, useDisconnect } from "wagmi";
import { getBalance } from "wagmi/actions";

import { CryptoService } from "@/shared/Services/CryptoService";
import Pathshow from "../pathshow/page";
import { UtilityService } from "@/shared/Services/UtilityService";
import { stat } from "fs";
import Skeleton from "react-loading-skeleton";

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
    let [walletAddress, setWalletAddress] = useState<string>('');
    let utilityService = new UtilityService();
    let [totalAvailablePath, setTotalAvailablePath] = useState<number>(0);
    let [isPathShow, setIsPathShow] = useState<boolean>(false);
    let [selectedPath, setSelectedPath] = useState<PathShowViewModel>(new PathShowViewModel());
    let amountTextBoxRef = useRef<HTMLInputElement>(null);

    const { open } = useWeb3Modal();
    let account = useAccount();

    const [pathshow,setpathshow] = useState<boolean>(false);

    function openWallet() {
        sharedService.openWalletModal$.next(true);
    } 

    async function getWalletAddressFromStorage()
    {
        let address = await sharedService.getIndexDbItem(Keys.Wallet_Address);
        if(address){
            setWalletAddress(address);
        }
    }

    // async function setWalletAddressInStorage(){
    //     let response = await sharedService.setIndexDbItem(Keys.Wallet_Address, account.address);
    // }

    useEffect(()=>{
        //getWalletAddressFromStorage();
        //getAvailableBalanceInWallet();
    }, []);

    // useEffect(()=>{
    //     sharedService.walletAddress$.next(account.address);
    //     setWalletAddressInStorage();
    // }, [account]);

    useEffect(() => {
        let walletSub = sharedService.walletAddress.subscribe((res) => {
                //if(res != null){
                    setWalletAddress(res);
                //}
                //getAvailableBalanceInWallet();
        });
        // return () => {
        //   walletSub.unsubscribe();
        // }
      }, [sharedService.walletAddress$]);

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

    async function getAvailableBalanceInWallet(){
        const balance = getBalance(config,{
            address: walletAddress as `0x${string}`,//or as Address(viem) 
          });
          let amount = await balance;
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
                            walletAddress != '' &&
                            <>
                                <button className="btn primary-btn w-100 mt-3">
                                    Exchange
                                </button>
                            </>
                        }
                        {
                            walletAddress == '' &&
                            <>
                                <button className="btn primary-btn w-100 mt-3" onClick={() => openWallet()}>
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
  