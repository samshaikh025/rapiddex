
import { CryptoService } from "@/shared/Services/CryptoService";
import Swapui from "./components/swapui/page";
import { PreDefinedTokensForChains } from "@/shared/Models/Common.model";
import { PredefineChains } from "@/shared/Const/PredefineChains";

export default async function Swap() {

    let cryptoService = new CryptoService();
    let chains = await cryptoService.GetAvailableChains();
    //let preDefinedTokensForChains: PreDefinedTokensForChains[] = [];
    //let predefineChains = PredefineChains;
    
    // for(let i=0; i< predefineChains.length ; i++){
    //     let coins = await cryptoService.GetAvailableTokens(predefineChains[i]);
    //     preDefinedTokensForChains.push({
    //         chainId: predefineChains[i].chainId,
    //         tokens: JSON.parse(JSON.stringify(coins))
    //     })
    // }
    return (
            <Swapui chains={JSON.parse(JSON.stringify(chains))}></Swapui>
    );
  }
  