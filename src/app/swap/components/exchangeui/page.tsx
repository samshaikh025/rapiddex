import { DataSource } from "@/shared/Enum/Common.enum";
import { Chains, Tokens } from "@/shared/Models/Common.model";

type propsType = {
    sourceChain: Chains,
    destChain: Chains,
    sourceToken: Tokens,
    destToken: Tokens,
    dataSource: string | null,
    openTokenUI: (dataSource: string) => void;
}

export default function Exchangeui(props: propsType) {
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
                        </div>
                         {/* </div> */}
                </div>
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
                            <h5 className="exchange-info-heading">select chain and token </h5>
                        </div>
                        {/* </div>  */}
                </div>
            </div>

            <div className="button-icon">
                <button className="theme-card btn">connect to wallet</button>
                <span className="icon"><i className="fa-solid fa-wallet"></i></span>
            </div>
        </div>
    );
  }
  