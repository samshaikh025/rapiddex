import { DataSource } from "@/shared/Enum/Common.enum";
import { ChainBase, Chains, TokenBase, Tokens } from "@/shared/Models/Common.model";
import { CryptoService } from "@/shared/Services/CryptoService";
import { useEffect, useState } from "react";

type propsType = {
    sourceChain: Chains ,
    destChain: Chains,
    dataSource: string,
    sourceToken: Tokens,
    destToken: Tokens,
    openChainUI: (isShow: boolean) => void,
    closeTokenUI: (token: Tokens) => void
}
export default function Tokenui(props: propsType) {

    let cryptoService = new CryptoService();
    let [AvailableToken, setAvailableToken] = useState<Tokens[]>([]);
    let [masterAvailableToken, setMasterAvailableToken] = useState<Tokens[]>([]);

    async function getCoinsByChain(){
        let tokens: Tokens[] = [];
        let chainDataSource = new Chains();
        debugger
        try{
            chainDataSource = props.dataSource == DataSource.From ? props.sourceChain : props.destChain;
            if(chainDataSource.chainId > 0)
            {
                tokens = await cryptoService.GetAvailableTokens(chainDataSource);
                setAvailableToken(tokens);
                setMasterAvailableToken(tokens);
            }
        }catch(error){

        }
        
        
    }
    
    function backFromTokenUI()
    {
        let token = props.dataSource == DataSource.From ? props.sourceToken : props.destToken;
        props.closeTokenUI(token);
    }

    function filterToken(tokenValue: string)
    {
        setAvailableToken([]);
        if(tokenValue == '')
        {
            setAvailableToken(masterAvailableToken);
        }else{
            let filter = masterAvailableToken.filter(x=> x.name?.toLowerCase()?.includes(tokenValue));
            setAvailableToken(filter);
        }
    }

    useEffect(() => {
        getCoinsByChain();
      }, []);

    return (
        <div className="exchange-section gap-top-setion swap-coin-section">
            <div className="section-top">
                <i className="fa-solid fa-arrow-left" role="button" onClick={()=> backFromTokenUI()}></i> &nbsp;
                <h3 className="section_title">Swap coin</h3>
            </div>
            <div className="searching-section button-with-icon" onClick={()=> props.openChainUI(true)}>
                <span className="icon select-chain select"><i className="fa-solid fa-dice-d6"></i></span>
                <button className="select-chain select">
                    {props.dataSource == DataSource.From ? (props.sourceChain.chainName == '' ? 'Select Chain' : props.sourceChain.chainName) : (props.destChain.chainName == '' ? 'Select Chain' : props.destChain.chainName)}
                </button>
            </div>
            <div className="searching-section input-with-text">
                <span className="icon select-chain select"><i className="fa-solid fa-magnifying-glass"></i></span>
                <input type="text" placeholder="select coin" onKeyUp={(e) => filterToken(e.currentTarget.value)}/>
            </div>
            <h6 className="section-heading small-heaading">coin list</h6>
            <div className="coin-list">
                {
                    AvailableToken.map((token: Tokens, index) => (
                        <div>
                            <div className="coin-item" onClick={() => props.closeTokenUI(token)}>
                                <span className="icon">
                                    <img src={token.logoURI} alt="" />
                                </span>
                                <div className="icon-detail-box">
                                    <div className="icon-detail">
                                        <h6 className="coin-text">{token.name}</h6>
                                        <p className="coin-price">$0.5</p>
                                    </div>
                                    <a href="#" target="_blank" className="coin-info">Coin info</a>
                                </div>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
  }
  