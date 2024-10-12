import { ActionType } from "@/shared/Enum/Common.enum";
import { Chains } from "@/shared/Models/Common.model";

export function OpenWalletModalA(data: boolean){
    return {
        type: ActionType.OpenWalletModal,
        data: data
    }
}

export function SetWalletAddressA(address: string){
    return {
        type: ActionType.SetWalletAddress,
        data: address
    }
}

export function SetAllAvailableChainsA(chains: Chains[]){
    return {
        type: ActionType.SetAvailableChains,
        data: chains
    }
}