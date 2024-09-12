import { CryptoService } from "@/shared/Services/CryptoService";
import Swapui from "./swap/components/swapui/page";

export default async function Home() {
  let cryptoService = new CryptoService();
  let chains = await cryptoService.GetAvailableChains();
  return (
    <Swapui chains={JSON.parse(JSON.stringify(chains))}/>
  );
}
