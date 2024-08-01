import { DataSource } from "@/shared/Enum/Common.enum";
import { ChainBase, Chains } from "@/shared/Models/Common.model";
import { CryptoService } from "@/shared/Services/CryptoService";
import { SharedService } from "@/shared/Services/SharedService";
import { useEffect, useState } from "react";

type propsType = {
    sourceChain: Chains,
    destChain: Chains,
    dataSource: string,
    closeChainUI: (chain: ChainBase) => void
}
export default function Chainui(props: propsType) {

    let cryptoService = new CryptoService();
    let [AvailableChains, setAvailableChains] = useState<Chains[]>([]);
    let [masterAvailableChains, setMasterAvailableChains] = useState<Chains[]>([]);
    
    async function getInitData()
    {
        let chains = await cryptoService.GetAvailableChains();
        setAvailableChains(chains);
        setMasterAvailableChains(chains);
       
        let lifiCoins = await cryptoService.GetCoinsForLifi();
        let owltoCoins = await cryptoService.GetCoinsForOwlto();
    }

    function backFromChain(){
        let chain = props.dataSource == DataSource.From ? props.sourceChain : props.destChain;
        props.closeChainUI(chain)
    }

    function filterChain(chainValue: string)
    {
        setAvailableChains([]);
        if(chainValue == '')
        {
            setAvailableChains(masterAvailableChains);
        }else{
            let filter = masterAvailableChains.filter(x=> x.chainName?.toLowerCase()?.includes(chainValue));
            setAvailableChains(filter);
        }
    }

    useEffect(() => {
        getInitData();
      }, []);

    return (
        <div className="exchange-section gap-top-setion coin-change">
                <div className="section-top">
                    <h3 className="section_title">
                    <i className="fa-solid fa-arrow-left" role="button" onClick={()=> backFromChain()}></i> &nbsp;
                        Available Chains
                    </h3>
                </div>

                <div className="searching-section input-with-text">
                    <span className="icon select-chain select"><i className="fa-solid fa-magnifying-glass"></i></span>
                    <input type="text" placeholder="search chain" onKeyUp={(e)=>filterChain(e.currentTarget.value)}/>
                </div>
                <div className="coin-list">
                    {
                        AvailableChains.map((chain: Chains, index) => (
                            <div className="coin-item" onClick={()=> props.closeChainUI(chain)}>
                                <span className="icon">
                                <img src="https://coin-images.coingecko.com/coins/images/35494/large/Blast.jpg?1719385662" alt="" />
                                </span>
                                <div className="icon-detail">
                                    <h6 className="coin-text">{chain.chainName}</h6>
                                </div>
                            </div>
                        ))
                    }
                </div>
                <div className="coin-list">
                    master: {
                         
                        masterAvailableChains.length
                    }
                    avail : {
                        AvailableChains.length
                    }
                </div>
            </div>
    );
  }
  