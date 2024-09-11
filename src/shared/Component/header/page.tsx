'use client'
import { Keys } from "@/shared/Enum/Common.enum";
import { SharedService } from "@/shared/Services/SharedService";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useEffect, useState } from "react";
import { BehaviorSubject, Subject } from "rxjs";
import { useAccount, useAccountEffect, useDisconnect } from "wagmi";
import { config } from "../../../app/wagmi/config"
import headerLogoDesktop from '../../../assets/images/logo.png';
import headerLogoMobile from '../../../assets/images/logoIocn.png';

export default function Header() {

  const { open } = useWeb3Modal();
  let account = useAccount();
  let sharedService = SharedService.getSharedServiceInstance();
  const { disconnect, isSuccess } = useDisconnect();
  let [walletAddress, setWalletAddress] = useState<string>('');

  // useAccountEffect({
  //   config,
  //   async onConnect(data) {
  //     console.log('Connected!', data)
  //     if(account.address){
  //       setWalletAddress(account.address)
  //       await setWalletAddressInStorage();
  //       sharedService.walletAddress$.next(account.address);
  //     }
  //   },
  //   onDisconnect() {
  //     console.log('Disconnected!')
  //   },
  // })

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
    let openWalletConnectModal = sharedService.openWalletModal.subscribe((res) => {
      if(res){
        openWallet();
      }
    });
    
  }, [sharedService.openWalletModal$]);

  useEffect(() => {
    console.log('account info: ' + account);
    if(account.address){
      sharedService.abc = 10;
      setWalletAddress(account.address)
      sharedService.walletAddress$.next(account.address);
      //setWalletAddressInStorage();
    }
  }, [account]);

  function openWallet()
  {
    open();
  }
  
  function diconnectWallet(){
    disconnect()
    setWalletAddress('');
    sharedService.walletAddress$.next('');
    sharedService.removeIndexDbItem(Keys.Wallet_Address);
  }
    return(
        <section className="header">
        <div className="container">
            <div className="header-wrapper d-flex align-items-center justify-content-between gap-3">
                <div className="site-logo">
                    <a href="index.html">
                        <img src={headerLogoDesktop.src} className="desktop-logo" alt="site-logo"/>
                        <img src={headerLogoMobile.src} className="mobile-logo" alt="site-logo"/>
                    </a>
                </div>
                <div className="menu-wrapper d-flex align-items-center">
                    <a href="#" className="active">Swap</a>
                    <a href="#">Loans</a>
                    <a href="#">Liquidity</a>
                    <a href="#">Stak</a>
                </div>
                <div className="btn-wrapper d-flex align-items-center gap-2">
                    <div className="theme-mode">
                        <input type="checkbox" className="checkbox" id="checkbox"/>
                        <label htmlFor="checkbox" className="checkbox-label">
                          <i className="fas fa-moon"></i>
                          <i className="fas fa-sun"></i>
                          <span className="ball"></span>
                        </label>
                    </div>
                    <div className="dropdown">
                        {
                          walletAddress == '' && 
                          <>
                            <button className="btn primary-btn" onClick={()=> openWallet()}>
                              Connect Wallet</button>
                          </>
                        }
                        {
                          walletAddress != '' && 
                          <>
                            <button className="btn primary-btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                              {walletAddress && walletAddress?.length > 0 ? walletAddress.substring(0,4) + '...' + walletAddress.substring(37,42) : ''}
                            </button>
                            <ul className="dropdown-menu dropdown-menu-right">
                              <div className="d-flex align-items-center user-profile">
                                <img src="assets/images/avatar.svg" alt="avatar" />
                                <div className="d-flex flex-column">
                                  <label>John Carter</label>
                                  <a href="#">
                                    <span>View Profile</span>
                                  </a>
                                </div>
                              </div>
                              <li><a href="#" className="dropdown-item">Action</a></li>
                              <li><a href="#" className="dropdown-item">Another action</a></li>
                              <li><a role="button" className="dropdown-item" onClick={()=> diconnectWallet()}>Diconnect</a></li>
                            </ul>
                          </>
                          }
                        
                    </div>                    
                    <div className="dropdown">
                        <button className="btn primary-btn dropdown-toggle w-48" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i className="fas fa-bars"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-right">
                            <div className="d-flex align-items-center user-profile">
                                <img src="assets/images/avatar.svg" alt="avatar"/>
                                <div className="d-flex flex-column">
                                    <label>John Carter</label>
                                    <a href="#">
                                        <span>View Profile</span>
                                    </a>
                                </div>
                            </div>
                            <li className="mobile-menu"><a href="#" className="dropdown-item active">Swap</a></li>
                            <li className="mobile-menu"><a href="#" className="dropdown-item">Loans</a></li>
                            <li className="mobile-menu"><a href="#" className="dropdown-item">Liquidity</a></li>
                            <li className="mobile-menu"><a href="#" className="dropdown-item">Stak</a></li>
                            <li><a href="#" className="dropdown-item">Action</a></li>
                            <li><a href="#" className="dropdown-item">Another action</a></li>
                            <li><a href="#" className="dropdown-item">Something else here</a></li>
                        </ul>
                    </div>                    
                </div>
            </div>
        </div>
        </section>
    )
}