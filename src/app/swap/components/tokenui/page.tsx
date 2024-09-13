import { DataSource } from "@/shared/Enum/Common.enum";
import { ChainBase, Chains, TokenBase, Tokens } from "@/shared/Models/Common.model";
import { CryptoService } from "@/shared/Services/CryptoService";
import { useEffect, useState } from "react";
import Skeleton from 'react-loading-skeleton'

type propsType = {
    sourceChain: Chains ,
    destChain: Chains,
    dataSource: string,
    sourceToken: Tokens,
    destToken: Tokens,
    openChainUI: (isShow: boolean) => void,
    closeTokenUI: (token: Tokens) => Promise<void>
}
export default function Tokenui(props: propsType) {

    let cryptoService = new CryptoService();
    let [AvailableToken, setAvailableToken] = useState<Tokens[]>([]);
    let [masterAvailableToken, setMasterAvailableToken] = useState<Tokens[]>([]);
    let [showCoinSpinner, setShowCoinSpinner] = useState<boolean>(false);
    async function getCoinsByChain(){
        let tokens: Tokens[] = [];
        let chainDataSource = new Chains();
        try{
            chainDataSource = props.dataSource == DataSource.From ? props.sourceChain : props.destChain;
            if(chainDataSource.chainId > 0)
            {
                setShowCoinSpinner(true);
                tokens = await cryptoService.GetAvailableTokens(chainDataSource);
                setShowCoinSpinner(false);
                setAvailableToken(tokens);
                setMasterAvailableToken(tokens);
            }
        }catch(error){

        }
        
        
    }
    
    async function backCloseTokenUI()
    {
        let token = props.dataSource == DataSource.From ? props.sourceToken : props.destToken;
        await props.closeTokenUI(token);
    }

    async function handleCloseTokenUI(token: Tokens){
        await props.closeTokenUI(token)
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
        <div className="col-lg-5 col-md-12 col-sm-12 col-12" id="swap-coin-wrapper">
            <div className="card">
                <div className="p-24">
                    <div className="d-flex align-items-center gap-3 mb-2">
                        <div className="card-action-wrapper cursor-pointer" id="back-to-swap" onClick={() => backCloseTokenUI()}>
                            <i className="fas fa-chevron-left"></i>
                        </div>
                        <div className="card-title">
                            Exchange {props.dataSource == DataSource.From ? 'From' : 'To'}
                        </div>
                    </div>

                    <div className="inner-card w-100 py-3 px-3 d-flex flex-column gap-3">
                        <div className="d-flex gap-3 w-100 align-items-center">
                            <div className="selcet-coin">
                                <img src={props.dataSource == DataSource.From ? props.sourceChain.logoURI : props.destChain.logoURI} alt="" />
                            </div>
                            <button className="btn primary-btn w-100" onClick={() => props.openChainUI(true)}>
                                {props.dataSource == DataSource.From ? (props.sourceChain.chainName == '' ? 'Select Chain' :
                                    props.sourceChain.chainName) : (props.destChain.chainName == '' ? 'Select Chain' :
                                        props.destChain.chainName)}
                            </button>
                        </div>
                        <div className="search-bar position-relative">
                            <i className="fas fa-search"></i>
                            <input type="text" className="w-100" placeholder="Search here" onKeyUp={(e) =>
                                filterToken(e.currentTarget.value)} />
                        </div>
                        <div className="mt-2">
                            <div className="card-title mb-3">
                                Coin List
                            </div>
                            {
                                showCoinSpinner == true && 
                                <>
                                    {Array.from({ length: 3 }, (_, i) => (
                                        <div className="inner-card d-flex align-items-center justify-content-between w-100 py-2 px-3 mb-2">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="position-relative coin-wrapper">
                                                    <Skeleton circle={true} width={50} height={50} />
                                                </div>
                                                <div className="d-flex flex-column">
                                                    <Skeleton width={100} height={10} />
                                                    <Skeleton width={100} height={10} />
                                                </div>
                                            </div>
                                            <Skeleton width={50} height={10} />
                                        </div>
                                    ))}
                                </>
                            }
                            {
                              showCoinSpinner == false && 
                              <>
                                    <div className="coin-list-wrapper d-flex flex-column gap-2">
                                        {
                                            AvailableToken.map((token: Tokens, index) => (
                                                <div className="inner-card d-flex align-items-center justify-content-between w-100 py-2 px-3"
                                                    onClick={() => handleCloseTokenUI(token)}>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="position-relative coin-wrapper">
                                                            <img src={token.logoURI} className="coin" alt="coin" />
                                                        </div>
                                                        <div className="d-flex flex-column">
                                                            <label className="coin-name d-block fw-600">{token.name}</label>
                                                            <label className="coin-sub-name">Coin Info</label>
                                                        </div>
                                                    </div>
                                                    <label className=" fw-600">$ 0.5</label>
                                                </div>
                                            ))
                                        }
                                    </div>
                              </> 
                            }
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  }
  