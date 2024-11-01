import { ActionType } from "@/shared/Enum/Common.enum";
import { Chains, PreDefinedTokensForChains, TransactionRequestoDto, WalletConnectData } from "@/shared/Models/Common.model";

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

export function SetSelectedLanguageA(lang: string){
    return {
        type: ActionType.SetSelectedLanguage,
        data: lang
    }
}

export function SetPredineTokensForChainA(obj: PreDefinedTokensForChains){
    return {
        type: ActionType.PreDefineTokensForChain,
        data: obj
    }
}

export function SetActiveTransactionA(obj: TransactionRequestoDto){
    return {
        type: ActionType.ActiveTransaction,
        data: obj
    }
}

export function UpdateTransactionGuid(guid: string){
    return {
        type: ActionType.UpdateTransactionGuid,
        data: guid
    }
}

export function UpdateTransactionStatusA(status: number){
    return {
        type: ActionType.UpdateTransactionStatus,
        data: status
    }
}