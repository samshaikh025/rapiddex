import { ActionType } from "@/shared/Enum/Common.enum";
import { Chains, WalletConnectData } from "@/shared/Models/Common.model";

export function OpenWalletModalA(data: boolean){
    return {
        type: ActionType.OpenWalletModal,
        data: data
    }
}

export function SetWalletDataA(address: WalletConnectData){
    return {
        type: ActionType.SetWalletData,
        data: address
    }
}

export function SetAllAvailableChainsA(chains: Chains[]){
    return {
        type: ActionType.SetAvailableChains,
        data: chains
    }
}