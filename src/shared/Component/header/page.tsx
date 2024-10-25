'use client'
import { Keys } from "@/shared/Enum/Common.enum";
import { SharedService } from "@/shared/Services/SharedService";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useEffect, useState } from "react";
import { useAccount, useAccountEffect, useConnect, useDisconnect } from "wagmi";
import headerLogoDesktop from '../../../assets/images/logo.png';
import headerLogoMobile from '../../../assets/images/logoIocn.png';
import { useDispatch, useSelector } from "react-redux";
import { OpenWalletModalA, SetSelectedLanguageA, SetWalletDataA,  } from "@/app/redux-store/action/action-redux";
import { UtilityService } from "@/shared/Services/UtilityService";
import { WalletConnectData } from "@/shared/Models/Common.model";
import { UserService } from "@/shared/Services/UserService";
import { error } from "console";
import { SupportedLang } from "@/shared/Const/Common.const";

export default function Header() {

  const { open } = useWeb3Modal();
  let account = useAccount();
  let sharedService = SharedService.getSharedServiceInstance();
  const { disconnect, isSuccess } = useDisconnect();
  const openModalStatus = useSelector((state: any) => state.OpenWalletModalStatus);
  let [walletChainId, setWalletChainId] = useState<number>(0);
  let walletData:WalletConnectData = useSelector((state: any) => state.WalletData);
  let dispatch = useDispatch();
  const allAvailableChains = useSelector((state: any) => state.AvailableChains);
  let utilityService = new UtilityService();
  let userService = new UserService();
  let SupportedLanguage = SupportedLang;
  const selectedLang = useSelector((state: any) => state.SelectedLanguage);

  function toggleTheme(status: boolean)
  {
    let mode = status == false ? 'light' : 'dark';
    document.getElementsByTagName('html')[0]?.setAttribute('data-theme', mode);
    sharedService.setData(Keys.THEME, mode);   
  };

  useAccountEffect({
    onConnect(data) {
      if(data.address){
        let obj = new WalletConnectData();
        obj.address = data.address;
        obj.providerImgPath = data?.connector?.icon;
        obj.providerName = data?.connector?.name;
        obj.chainId = data.chain?.id;
        obj.chainName = data.chain?.name;
        obj.chainLogo = allAvailableChains.length > 0 ? allAvailableChains?.find(x => x.chainId == data.chain?.id)?.logoURI : '';
        obj.blockExplorer = data.chain.blockExplorers.default;
        dispatch(SetWalletDataA(obj));
        sharedService.setData(Keys.WALLET_CONNECT_DATA,obj);
        userService.AddLog(obj).then((response)=>{
          if(response?.data && response.data == 1){
            console.log('logged successfully');
          }
        }).catch((error)=>{
          console.log(error);
        });
      }
    }
  })

  useEffect(() => {
    console.log(walletData);
    getWalletAddressFromStorageAndSet();
    let theme = sharedService.getData(Keys.THEME);
    if(theme && theme == 'DARK'){
    }
    let lang = sharedService.getData(Keys.SELECTED_LANG);
    if(lang){
      dispatch(SetSelectedLanguageA(lang));
    }
  }, []);

  function getWalletAddressFromStorageAndSet(){
    let data = sharedService.getData(Keys.WALLET_CONNECT_DATA);
    if(data){
      dispatch(SetWalletDataA(data));
    }
  }

  useEffect(() =>{
    if(Boolean(openModalStatus) == true){
      open();
    }
  }, [openModalStatus])

  
  function diconnectWallet(){
    disconnect();
    sharedService.removeData(Keys.WALLET_CONNECT_DATA);
    dispatch(SetWalletDataA(new WalletConnectData()));
    dispatch(OpenWalletModalA(false))
  }

  function openBlockExplorer(){
    window.open(walletData.blockExplorer.url + '/address/' + walletData?.address, '_blank');
  }

  function changeLanguage(lang:string){
    dispatch(SetSelectedLanguageA(lang));
    sharedService.setData(Keys.SELECTED_LANG, lang);
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
                    <a href="#" className="active">{utilityService.Translate(selectedLang,'SWAP')}</a>
                    <a href="#">{utilityService.Translate(selectedLang,'LOAN')}</a>
                    <a href="#">{utilityService.Translate(selectedLang,'LIQUIDITY')}</a>
                    <a href="#">{utilityService.Translate(selectedLang,'STACK')}</a>
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
                          utilityService.isNullOrEmpty(walletData.address) && 
                          <>
                            <button className="btn primary-btn" onClick={()=> open()}>
                              {utilityService.Translate(selectedLang,'CONNECT_WALLET')}</button>
                          </>
                        }
                        {
                          !utilityService.isNullOrEmpty(walletData.address) && 
                          <>
                            {/* button for small screen */}
                            <button className="btn primary-btn dropdown-toggle d-block d-lg-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasWalletData" aria-controls="offcanvasWalletData">
                            <div className="position-relative coin-wrapper">
                                    {!utilityService.isNullOrEmpty(walletData.providerImgPath) && <img src={walletData.providerImgPath}
                                        className="coin" alt="coin" />}
                                    {!utilityService.isNullOrEmpty(walletData.chainLogo) && <img src={walletData.chainLogo}
                                        className="coin-small" alt="coin" />}
                            </div>
                            { walletData.address.substring(0,4) + '...' + walletData.address.substring(37,42)}
                            </button>

                            {/* button for large screen */}
                            <button className="btn primary-btn dropdown-toggle d-none d-lg-block" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <div className="position-relative coin-wrapper">
                                    {!utilityService.isNullOrEmpty(walletData.providerImgPath) && <img src={walletData.providerImgPath}
                                        className="coin" alt="coin" />}
                                    {!utilityService.isNullOrEmpty(walletData.chainLogo) && <img src={walletData.chainLogo}
                                        className="coin-small" alt="coin" />}
                            </div>
                            { walletData.address.substring(0,4) + '...' + walletData.address.substring(37,42)}
                            </button>
                            <ul className="dropdown-menu dropdown-menu-right">
                              <div className="d-flex align-items-center user-profile">
                                <div className="position-relative coin-wrapper">
                                  {!utilityService.isNullOrEmpty(walletData.providerImgPath) && <img src={walletData.providerImgPath}
                                    className="coin" alt="coin" />}
                                  {!utilityService.isNullOrEmpty(walletData.chainLogo) && <img src={walletData.chainLogo}
                                    className="coin-small" alt="coin" />}
                                </div>
                                <div className="d-flex flex-column">
                                  <label>{ walletData.address.substring(0,4) + '...' + walletData.address.substring(37,42)}</label>
                                  <a href="#">
                                    <span>{ walletData.chainName }</span>
                                  </a>
                                  <i className="fa-regular fa-clipboard px-2" onClick={()=> navigator.clipboard.writeText(walletData.address)}></i>
                                </div>
                              </div>
                              <li><a href="#" className="dropdown-item">View Transaction</a></li>
                              <li><a className="dropdown-item" role="button" onClick={()=> openBlockExplorer()}>View On Block Explorer</a></li>
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
                            {
                              (SupportedLanguage && SupportedLanguage.length > 0) &&
                              <>
                                {
                                  SupportedLanguage.map((item, index) => (
                                    <li key={index}><a className="dropdown-item" onClick={() => changeLanguage(item)}>{item}</a></li>
                                  ))
                                }
                              </>
                            }
                        </ul>
                    </div>                    
                </div>
            </div>
        </div>
        <div className="offcanvas offcanvas-bottom custom-backgrop"  id="offcanvasWalletData" data-bs-backdrop="true" aria-labelledby="offcanvasWalletDataLabel" style={{ height: '50%' }}>
          <div className="offcanvas-header">
            <h5 className="offcanvas-title primary-text" id="offcanvasWalletDataLabel">Wallet Detail</h5>
            <button type="button" className="btn-close text-reset primary-text" data-bs-dismiss="offcanvas" aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>
            </button>
          </div>
          <div className="offcanvas-body small">
            <div className='d-flex gap-3 flex-column add-scroll-bar'>
              <ul>
                <div className="d-flex align-items-center user-profile">
                  <div className="position-relative coin-wrapper">
                    {!utilityService.isNullOrEmpty(walletData.providerImgPath) && <img src={walletData.providerImgPath}
                      className="coin" alt="coin" />}
                    {!utilityService.isNullOrEmpty(walletData.chainLogo) && <img src={walletData.chainLogo}
                      className="coin-small" alt="coin" />}
                  </div>
                  <div className="d-flex flex-column">
                    <label>{walletData.address.substring(0, 4) + '...' + walletData.address.substring(37, 42)}</label>
                    <a href="#">
                      <span>{walletData.chainName}</span>
                    </a>
                  </div>
                </div>
                <li><a href="#" className="dropdown-item">View Transaction</a></li>
                <li><a className="dropdown-item" role="button" onClick={() => openBlockExplorer()} data-bs-dismiss="offcanvas">View On Block Explorer</a></li>
                <li><a role="button" className="dropdown-item" onClick={() => diconnectWallet()} data-bs-dismiss="offcanvas">Diconnect</a></li>
              </ul>
            </div>
          </div>
        </div>
        </section>
    )
}