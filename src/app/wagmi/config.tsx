import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { cookieStorage, createStorage } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import * as definedChains from "wagmi/chains";
import type { Chain } from "wagmi/chains"; // Import Chain type
 
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
 
if (!projectId) throw new Error("Project ID is not defined");
 
const metadata = {
  name: "Web3Modal Example",
  description: "Web3Modal Example",
  url: "https://web3modal.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

const getAllChains = (): Chain[] => {
  return Object.values(definedChains).filter((chain) => chain.id !== undefined) as Chain[];
};

// Get all chains
const allChains = getAllChains();

// Ensure there's at least one chain
if (allChains.length === 0) {
  throw new Error("No chains available");
}

// Type assertion to tuple
const chainsTuple = [allChains[0], ...allChains.slice(1)] as const;

 
export const config = defaultWagmiConfig({
  chains: chainsTuple,
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});