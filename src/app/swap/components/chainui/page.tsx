import { DataSource } from "@/shared/Enum/Common.enum";
import { ChainBase, Chains } from "@/shared/Models/Common.model";
import { CryptoService } from "@/shared/Services/CryptoService";
import { SharedService } from "@/shared/Services/SharedService";
import { useEffect, useState } from "react";

type propsType = {
    sourceChain: Chains,
    destChain: Chains,
    dataSource: string,
    closeChainUI: (chain: ChainBase) => void,
    chains: Chains[]
}
export default function Chainui(props: propsType) {

    let cryptoService = new CryptoService();
    let [AvailableChains, setAvailableChains] = useState<Chains[]>([]);
    let [masterAvailableChains, setMasterAvailableChains] = useState<Chains[]>([]);
    let [showChainSpinner, setShowChainSpinner] = useState<boolean>(true);
    
    async function setInitData(chains: Chains[])
    {
        //let chains = await cryptoService.GetAvailableChains();
        setShowChainSpinner(false);
        setAvailableChains(chains);
        setMasterAvailableChains(chains);
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
        setInitData(props.chains);
      }, []);

    return (
        <div className="col-lg-5 col-md-12 col-sm-12 col-12" id="swap-coin-wrapper">
            <div className="card">
                <div className="p-24">
                    <div className="d-flex align-items-center gap-3 mb-2">
                        <div className="card-action-wrapper cursor-pointer" id="back-to-swap" onClick={() => backFromChain()}>
                            <i className="fas fa-chevron-left"></i>
                        </div>
                        <div className="card-title">
                            Available Chains
                        </div>
                    </div>
                    {
                        showChainSpinner == true && 
                        <>
                            <div className="text-center">
                                <div className="spinner-border" role="status">
                                    <span className="sr-only">Loading...</span>
                                </div>
                            </div>
                        </>
                    }
                    {
                        showChainSpinner == false && 
                        <>
                            <div className="inner-card w-100 py-3 px-3 d-flex flex-column gap-3">

                                <div className="search-bar position-relative">
                                    <i className="fas fa-search"></i>
                                    <input type="text" className="w-100" placeholder="Search here"
                                        onKeyUp={(e) => filterChain(e.currentTarget.value)} />
                                </div>
                                <div className="mt-2">
                                    <div className="card-title mb-3">
                                        Chain List
                                    </div>
                                    <div className="coin-list-wrapper d-flex flex-column gap-2">
                                        {
                                            AvailableChains.map((chain: Chains, index) => (
                                                <div className="inner-card d-flex align-items-center justify-content-between w-100 py-2 px-3"
                                                    onClick={() => props.closeChainUI(chain)}>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="position-relative coin-wrapper">
                                                            <img src={chain.logoURI}
                                                                alt="" className="coin" />
                                                        </div>
                                                        <div className="d-flex flex-column">
                                                            <label className="coin-name d-block fw-600">{chain.chainName}</label>
                                                            <label className="coin-sub-name">Coin Info</label>
                                                        </div>
                                                    </div>
                                                    <label className=" fw-600">$ 0.5</label>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            </div>
                        </>
                    }
                </div>
            </div>
        </div>
    );
  }
  