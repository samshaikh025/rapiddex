'use client'
import { Keys } from "@/shared/Enum/Common.enum";
import { SharedService } from "@/shared/Services/SharedService";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useEffect, useState } from "react";
import { useAccount, useAccountEffect, useConnect, useDisconnect } from "wagmi";
import headerLogoDesktop from '../../../assets/images/logo.png';
import headerLogoMobile from '../../../assets/images/logoIocn.png';
import { useDispatch, useSelector } from "react-redux";
import { SetWalletAddressA } from "@/app/redux-store/action/action-redux";
import { UtilityService } from "@/shared/Services/UtilityService";

export default function Header() {

  const { open } = useWeb3Modal();
  let account = useAccount();
  let sharedService = SharedService.getSharedServiceInstance();
  const { disconnect, isSuccess } = useDisconnect();
  const walletAddress = useSelector((state: any) => state.WalletAddress);
  const openModalStatus = useSelector((state: any) => state.OpenWalletModalStatus);
  let dispatch = useDispatch();
  let utilityService = new UtilityService();

  function toggleTheme(status: boolean)
  {
    let mode = status == false ? 'light' : 'dark';
    document.getElementsByTagName('html')[0]?.setAttribute('data-theme', mode);
    sharedService.setData(Keys.THEME, mode);   
  };

  useAccountEffect({
    onConnect(data) {
      if(data.address){
        dispatch(SetWalletAddressA(data.address));
        sharedService.setData(Keys.Wallet_Address, data.address);
      }
    }
  })

  useEffect(() => {
    getWalletAddressFromStorageAndSet();
    let theme = sharedService.getData(Keys.THEME);
    if(theme && theme == 'DARK'){
    }
  }, []);

  function getWalletAddressFromStorageAndSet(){
    let address = sharedService.getData(Keys.Wallet_Address);
    if(address){
      dispatch(SetWalletAddressA(address));
    }
  }

  useEffect(() =>{
    if(openModalStatus){
      open();
    }
  }, [openModalStatus])

  
  function diconnectWallet(){
    disconnect();
    sharedService.removeData(Keys.Wallet_Address);
    dispatch(SetWalletAddressA(''));
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
                    <a href="#">{openModalStatus}</a>
                </div>
                <div className="btn-wrapper d-flex align-items-center gap-2">
                    <div className="theme-mode">
                      <input type="checkbox" className="checkbox" id="checkbox" onChange={(e)=>toggleTheme(e.currentTarget.checked)} />
                      <label htmlFor="checkbox" className="checkbox-label"> 
                        <i className="fas fa-sun"></i>
                        <i className="fas fa-moon"></i>
                        <span className="ball"></span>
                      </label>
                    </div>
                    <div className="dropdown">
                        {
                          utilityService.isNullOrEmpty(walletAddress) && 
                          <>
                            <button className="btn primary-btn" onClick={()=> open()}>
                              Connect Wallet</button>
                          </>
                        }
                        {
                          !utilityService.isNullOrEmpty(walletAddress) && 
                          <>
                            <button className="btn primary-btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                              { walletAddress.substring(0,4) + '...' + walletAddress.substring(37,42)}
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