import { ActionType } from "@/shared/Enum/Common.enum";

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