'use client'
import { Keys } from "@/shared/Enum/Common.enum";
import { SharedService } from "@/shared/Services/SharedService";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useEffect, useState } from "react";
import { BehaviorSubject, Subject } from "rxjs";
import { useAccount, useDisconnect } from "wagmi";

export default function Header() {

  const { open } = useWeb3Modal();
  let account = useAccount();
  let sharedService = new SharedService();
  let { disconnect } = useDisconnect()
  let [walletAddress, setWalletAddress] = useState<string | null>(null);

  async function setWalletAddressInStorage(){
    let response = await sharedService.setIndexDbItem(Keys.Wallet_Address, account.address);
  }

  async function getWalletAddressFromStorage()
  {
      let address = await sharedService.getIndexDbItem(Keys.Wallet_Address);
      if(address){
        setWalletAddress(address);
      }
  }

  useEffect(() => {
    getWalletAddressFromStorage();
  }, []);

  useEffect(() => {
    let walletSub = sharedService.walletAddress.subscribe((res) => {
      setWalletAddress(res);
    });
    return () => {
      walletSub.unsubscribe();
    }
  }, [sharedService.walletAddress$]);

  useEffect(() => {
    console.log('account info: ' + account);
    setWalletAddressInStorage();
    sharedService.walletAddress$.next(account.address);
  }, [account]);

  function openWallet()
  {
    open();
  }
  
  function diconnectWallet(){
    disconnect();
    sharedService.walletAddress$.next(null);
    sharedService.removeIndexDbItem(Keys.Wallet_Address);
  }
    return(
        <nav className="navbar navbar-expand-lg navbar-light ">
          <div className="container">
            <a className="navbar-brand" href="#">
              <h2 className="icon">SwapDex</h2>
            </a>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse justify-content-center" id="navbarSupportedContent">
              <ul className="navbar-nav justify-content-cente mb-2 mb-lg-0">
                <li className="nav-item">
                  <a className="nav-link active" aria-current="page" href="/swap">Swap</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#">loans</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#">liqididy</a>
                </li>

                <li className="nav-item">
                  <a className="nav-link" href="#">Stak</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#">Stak</a>
                </li>
              </ul>
            </div>
            <div>
              {walletAddress != null && <button>{walletAddress}</button>}
              {walletAddress == null && <button onClick={()=> openWallet()}>Connect Wallet</button>}
            </div>
            <button onClick={()=> diconnectWallet()}>diconnect</button>
          </div>
        </nav>
    )
}