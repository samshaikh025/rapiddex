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
    let sharedService = new SharedService();
    let [walletAddress, setWalletAddress] = useState<string>(null);
    const { open } = useWeb3Modal();
    let account = useAccount();

    function openWallet() {
        open();
    } 

    async function getWalletAddressFromStorage()
    {
        let address = await sharedService.getIndexDbItem(Keys.Wallet_Address);
        if(address){
            setWalletAddress(address);
        }
    }

    async function setWalletAddressInStorage(){
        let response = await sharedService.setIndexDbItem(Keys.Wallet_Address, account.address);
    }

    useEffect(()=>{
        console.log('exchange Ui loaded');
        getWalletAddressFromStorage();
        getAvailableBalanceInWallet();
    }, []);

    useEffect(()=>{
        sharedService.walletAddress$.next(account.address);
        setWalletAddressInStorage();
    }, [account]);

    useEffect(() => {
        let walletSub = sharedService.walletAddress.subscribe((res) => {
          setWalletAddress(res);
          getAvailableBalanceInWallet();
        });
        return () => {
          walletSub.unsubscribe();
        }
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
        <div className="exchange-section gap-top-setion">
            <div className="section-top">
                <h3 className="section_title">Exchange</h3>
                <span className="icon-small"><i className="fa-solid fa-gear"></i></span>
            </div>
            <div className="theme-card exchange-box">
                <small className="exchange-text">From</small>
                <div className="exchange-input exchange-from" onClick={()=>props.openTokenUI(DataSource.From)}>
                    {/* <div className="exchange-info-box"> */}
                        <div className="exchange-icon">
                            <div className="icon-box">
                                <span className="icon">
                                    <img src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png" alt=""/>
                                </span>
                                <span className="icon  max-small-icon">
                                    <img src="https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/arbitrum.svg" alt=""/>
                                </span>
                            </div>
                        </div>
                        <div className="exchange-info">
                        <h5 className="exchange-info-heading">{props.sourceChain.chainId > 0 ? props.sourceChain.chainName : 'Select Chain'} </h5>
                        <h5 className="exchange-info-heading">{props.sourceToken.name != '' ? props.sourceToken.name : 'Select Token'} </h5>
                        <h5 className="exchange-info-heading">{props.sourceTokenAmount} </h5>
                        </div>
                         {/* </div> */}
                </div>
            </div>
            <div className="text-center">
            <i className="fa-solid fa-arrows-rotate text-center" onClick={() => interChangeFromTo()}></i>
            </div>
            <div className="theme-card exchange-box" onClick={()=>props.openTokenUI(DataSource.To)}>
                <small className="exchange-text">To</small>
                <div className="exchange-input exchange-from">
                   {/* <div className="exchange-info-box">  */}
                        <div className="exchange-icon">
                            <div className="icon-box">
                                <span className="icon">
                                    <img src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png" alt=""/>
                                </span>
                                <span className="icon  max-small-icon">
                                    <img src="https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/arbitrum.svg" alt=""/>
                                </span>
                            </div>
                        </div>
                        <div className="exchange-info">
                        <h5 className="exchange-info-heading">{props.destChain.chainId > 0 ? props.destChain.chainName : 'Select Chain'} </h5>
                        <h5 className="exchange-info-heading">{props.destToken.name != '' ? props.destToken.name : 'Select Token'} </h5>
                        <h5 className="exchange-info-heading">{props.destTokenAmount} </h5>
                        </div>
                         {/* </div> */}
                </div>
            </div>
            <div className="theme-card exchange-box">
                <small className="exchange-text">send</small>
                <div className="exchange-input exchange-from">
                   {/* <div className="exchange-info-box"> */}
                        <div className="exchange-icon">
                            <div className="icon-box">
                                <span className="icon">
                                    <img src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png" alt=""/>
                                </span>
                                <span className="icon  max-small-icon">
                                    <img src="https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/arbitrum.svg" alt=""/>
                                </span>
                            </div>
                        </div>
                        <div className="exchange-info">
                            <input type="number" value={sendAmount} onKeyUp={(e) => updateAmount(parseFloat(e.currentTarget.value))} onChange={(e) => updateAmount(parseFloat(e.currentTarget.value))}/>
                            <br></br>
                            $ {equAmountUSD}
                        </div>
                        {/* </div>  */}
                </div>
            </div>

            <div className="button-icon">
                {walletAddress != null && <button className="theme-card btn">Excahnge</button>}
                {walletAddress == null && <button className="theme-card btn" onClick={()=> openWallet()}>Connect Wallet</button>}
            </div>
        </div>
    );
  }
  