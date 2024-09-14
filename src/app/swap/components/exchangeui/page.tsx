import { config } from "@/app/wagmi/config";
import { DataSource, Keys } from "@/shared/Enum/Common.enum";
import { Chains, Tokens } from "@/shared/Models/Common.model";
import { SharedService } from "@/shared/Services/SharedService";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useEffect, useState } from "react";
import { useAccount, useBalance, useDisconnect } from "wagmi";
import { getBalance } from "wagmi/actions";

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

    let [sendAmount, setSendAmount] = useState<number>(0);
    let [equAmountUSD, setequAmountUSD] = useState<number>(0);
    let sharedService = SharedService.getSharedServiceInstance();
    let [walletAddress, setWalletAddress] = useState<string>('');
    const { open } = useWeb3Modal();
    let account = useAccount();

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
        console.log('exchange Ui loaded');
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

    function updateAmount(amount: number)
    {
        try{
            setSendAmount(amount);
            setequAmountUSD(0);
            if(props.sourceTokenAmount > 0 && amount > 0)
            {
                let eq = (amount * props.sourceTokenAmount);
                setequAmountUSD(eq);
            } 
        }catch(error)
        {

        }
       
    }

    function interChangeFromTo(){
        setSendAmount(0);
        setequAmountUSD(0);
        props.interChangeData();
    }

    async function getAvailableBalanceInWallet(){
        const balance = getBalance(config,{
            address: walletAddress as `0x${string}`,//or as Address(viem) 
          });
          let amount = await balance;
          console.log('wallet address:',amount)
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
                                        <img src={props.sourceChain.logoURI}
                                            className="coin" alt="coin" />
                                        <img src={props.sourceToken.logoURI}
                                            className="coin-small" alt="coin" />
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
                                        <img src={props.destChain.logoURI}
                                            className="coin" alt="coin" />
                                        <img src={props.destToken.logoURI}
                                            className="coin-small" alt="coin" />
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
                                    <img src={props.sourceChain.logoURI}
                                        className="coin" alt="coin" />
                                    <img src={props.sourceToken.logoURI}
                                        className="coin-small" alt="coin" />
                                </div>
                                <div className="d-flex flex-column pb-2">
                                    <input type="number" className="transparent-input" value={sendAmount} onKeyUp={(e) =>
                                        updateAmount(parseFloat(e.currentTarget.value))} onChange={(e) =>
                                            updateAmount(parseFloat(e.currentTarget.value))} />
                                    <label className="coin-sub-name">$ {equAmountUSD}</label>
                                </div>
                            </div>
                        </div>
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
            <div className="col-lg-7 col-md-12 col-sm-12 col-12">
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
                                    <button className="btn primary-btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        Maximum Return
                                    </button>
                                    {/* <ul className="dropdown-menu">
                                        <li><a className="" href="#">Fastest Transfer</a></li>
                                    </ul> */}
                                </div>
                                <i className="fas fa-redo-alt"></i>
                            </div>
                        </div>
                        <div className="d-flex flex-column gap-1">

                            <div className="inner-card w-100 py-2 mt-3">
                                <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap px-3 pb-2 bottom-border-line">
                                    <div className="d-flex align-items-center gap-2">
                                        <label className="font-16"><span className="fw-600">Est:</span> 18 mins</label>
                                        <label className="font-16"><span className="fw-600">Gas Fees:</span> $0.542</label>
                                    </div>
                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                        <label className="best-return fw-600 px-2 py-1">Best Return</label>
                                        <label className="faster fw-600 px-2 py-1">Faster</label>
                                    </div>
                                </div>
                                <div className="px-3 d-flex justify-content-between py-2 middle-align-card">
                                    <div>
                                        <label className="fw-600">From</label>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="position-relative coin-wrapper">
                                                <img src="" className="coin" alt="coin"/>
                                                <img src="" className="coin-small" alt="coin"/>
                                            </div>
                                            <div className="d-flex flex-column">
                                                <label className="coin-name d-block fw-600">Ethereum</label>
                                                <label className="coin-sub-name">0.5 USDC</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative center-card-with-line d-flex align-items-center gap-2 inner-card px-3 py-2 my-3">
                                        <img src="https://movricons.s3.ap-south-1.amazonaws.com/CCTP.svg" width="100%" height="100%"/>
                                        <label className="font-16 fw-600">Cricle CCTP</label>
                                    </div>
                                    <div>
                                        <label className="fw-600 d-block">To</label>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="d-flex flex-column">
                                                <label className="coin-name d-block fw-600">Ethereum</label>
                                                <label className="coin-sub-name">0.5 USDC</label>
                                            </div>
                                            <div className="position-relative coin-wrapper">
                                                <img src="" className="coin" alt="coin"/>
                                                <img src="" className="coin-small" alt="coin"/>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap px-3 pt-2 top-border-line">
                                    <i className="fas fa-bolt primary-text"></i>  <label className="font-16"><span className="fw-600">$0.708</span> higher output than any other route</label>
                                </div>
                            </div>
                            <div className="inner-card w-100 py-2 mt-3">
                                <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap px-3 pb-2 bottom-border-line">
                                    <div className="d-flex align-items-center gap-2">
                                        <label className="font-16"><span className="fw-600">Est:</span> 18 mins</label>
                                        <label className="font-16"><span className="fw-600">Gas Fees:</span> $0.542</label>
                                    </div>
                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                        <label className="best-return fw-600 px-2 py-1">Best Return</label>
                                        <label className="faster fw-600 px-2 py-1">Faster</label>
                                    </div>
                                </div>
                                <div className="px-3 d-flex justify-content-between py-2 middle-align-card">
                                    <div>
                                        <label className="fw-600">From</label>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="position-relative coin-wrapper">
                                                <img src="" className="coin" alt="coin"/>
                                                <img src="" className="coin-small" alt="coin"/>
                                            </div>
                                            <div className="d-flex flex-column">
                                                <label className="coin-name d-block fw-600">Ethereum</label>
                                                <label className="coin-sub-name">0.5 USDC</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative center-card-with-line d-flex align-items-center gap-2 inner-card px-3 py-2 my-3">
                                        <img src="https://movricons.s3.ap-south-1.amazonaws.com/CCTP.svg" width="100%" height="100%"/>
                                        <label className="font-16 fw-600">Cricle CCTP</label>
                                    </div>
                                    <div>
                                        <label className="fw-600 d-block">To</label>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="d-flex flex-column">
                                                <label className="coin-name d-block fw-600">Ethereum</label>
                                                <label className="coin-sub-name">0.5 USDC</label>
                                            </div>
                                            <div className="position-relative coin-wrapper">
                                                <img src="" className="coin" alt="coin"/>
                                                <img src="" className="coin-small" alt="coin"/>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap px-3 pt-2 top-border-line">
                                    <i className="fas fa-bolt primary-text"></i>  <label className="font-16"><span className="fw-600">$0.708</span> higher output than any other route</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
  }
  