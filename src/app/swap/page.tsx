import { CryptoService } from "@/shared/Services/CryptoService";
import Swapui from "./components/swapui/page";

export default async function Swap() {

    let cryptoService = new CryptoService();
    let chains = await cryptoService.GetAvailableChains();
    
    return (
        <Swapui chains={JSON.parse(JSON.stringify(chains))}/>
    );
  }
  