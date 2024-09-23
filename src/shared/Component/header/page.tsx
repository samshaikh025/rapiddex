'use client'
import { Keys } from "@/shared/Enum/Common.enum";
import { SharedService } from "@/shared/Services/SharedService";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useEffect, useState } from "react";
import { BehaviorSubject, Subject } from "rxjs";
import { useAccount, useAccountEffect, useConnect, useDisconnect } from "wagmi";
import { config } from "../../../app/wagmi/config"
import headerLogoDesktop from '../../../assets/images/logo.png';
import headerLogoMobile from '../../../assets/images/logoIocn.png';


const toggleTheme = () => {
  const root = document.documentElement;

  if (document.getElementById('checkbox').checked) {
    // Dark Theme
    root.style.setProperty('--body-bg', 'radial-gradient(123.22% 129.67% at 100.89% -5.6%, #05040B 0%, #060316 100%');
    root.style.setProperty('--primary-color', '#fff');
    root.style.setProperty('--primary-color-8', '#322C4B');
    root.style.setProperty('--primary-icon-color', '#BC9FED');
    root.style.setProperty('--white-color', '#ffffff');
    root.style.setProperty('--black-color', '#ffffff');
    root.style.setProperty('--border-color', '#d5d5ee');
    root.style.setProperty('--border-color-40', '#BC9FED');
    root.style.setProperty('--outer-card-bg', 'linear-gradient(210.96deg, rgba(32, 20, 96, 0.61) 0.01%, rgba(49, 30, 95, 0.7) 42.05%, rgba(57, 33, 113, 0.1) 104.81%)');
    root.style.setProperty('--inner-card-bg', '#372A77');
    root.style.setProperty('--header-card', '#0f0d1d');
    root.style.setProperty('--box-shadow', '0px 20px 69px 0px #080711D8');
    root.style.setProperty('--inner-card-box-shadow', '50px 38px 102.37px 0px #78769424');
  } else {
    // Light Theme
    root.style.setProperty('--body-bg', 'radial-gradient(123.22% 129.67% at 100.89% -5.6%,#fbfbfd 0%,#f2f2ff 100%)');
    root.style.setProperty('--primary-color', '#5244d2');
    root.style.setProperty('--primary-color-8', '#5244d214');
    root.style.setProperty('--primary-icon-color', '#7851bc');
    root.style.setProperty('--white-color', '#ffffff');
    root.style.setProperty('--black-color', '#151231');
    root.style.setProperty('--border-color', '#d5d5ee');
    root.style.setProperty('--border-color-40', '#d5d5ee66');
    root.style.setProperty('--outer-card-bg', 'linear-gradient(210.96deg,rgba(245, 242, 255, 0.8) 0.01%,#f5f1ff 42.05%,rgba(247, 243, 255, 0.06) 104.81%)');
    root.style.setProperty('--inner-card-bg', 'linear-gradient(241.25deg,rgba(255, 255, 255, 0.45) 4.4%,rgba(255, 255, 255, 0.65) 61.77%,rgba(255, 255, 255, 0.54) 119.94%)');
    root.style.setProperty('--header-card', 'linear-gradient(90deg, #f3f3ff 29.59%, #f2f2ff 100%)');
    root.style.setProperty('--box-shadow', '0px 20px 69px 0px #dfdcffd8');
    root.style.setProperty('--inner-card-box-shadow', '50px 38px 102.37px 0px #78769424');
  }
};


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

  useAccountEffect({
    onConnect(data) {
      let addressExist = sharedService.getData(Keys.Wallet_Address);
      if(!addressExist && data.address){
        sharedService.setData(Keys.Wallet_Address, data.address);
        setWalletAddress(data.address)
        sharedService.walletAddress$.next(data.address);
      }
    }
    // onDisconnect() {
    //   console.log('Disconnected!')
    //   sharedService.removeData(Keys.Wallet_Address);
    //   setWalletAddress('');
    //   sharedService.walletAddress$.next('');
    // },
  })

  function setWalletAddressInStorage(address: string){
    sharedService.setData(Keys.Wallet_Address, address);
  }

  function getWalletAddressFromStorage()
  {
      return sharedService.getData(Keys.Wallet_Address);
  }

  useEffect(() => {
    getWalletAddressFromStorageAndSet();
  }, []);

  function getWalletAddressFromStorageAndSet(){
    let addressExist = sharedService.getData(Keys.Wallet_Address);
    if(addressExist){
      setWalletAddress(addressExist)
      sharedService.walletAddress$.next(addressExist);
    }
  }

  useEffect(() => {
    let openWalletConnectModal = sharedService.openWalletModal.subscribe((res) => {
      if(res){
        openWallet();
      }
    });
    
  }, [sharedService.openWalletModal$]);

  // useEffect(() => {
  //   console.log('account info: ' + account);
  //   if(account.address){
  //     setWalletAddress(account.address)
  //     sharedService.walletAddress$.next(account.address);
  //     //setWalletAddressInStorage();
  //   }
  // }, [account]);

  function openWallet()
  {
    open();
  }
  
  function diconnectWallet(){
    disconnect();
    sharedService.removeData(Keys.Wallet_Address);
    setWalletAddress('');
    sharedService.walletAddress$.next('');
    //sharedService.removeIndexDbItem(Keys.Wallet_Address);
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
                    <input type="checkbox" className="checkbox" id="checkbox" onChange={toggleTheme} />
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