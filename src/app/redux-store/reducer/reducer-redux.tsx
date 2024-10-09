import { ActionType } from "@/shared/Enum/Common.enum";

const modalInitialState = false;
const addressInitialState = '';
export function OpenWalletModalStatus(state = modalInitialState, action: any) {
    switch (action.type) {
        case ActionType.OpenWalletModal:
            state = action.data;
            return state;
        default:
            return state;
    }
}

export function WalletAddress(state = addressInitialState, action: any) {
    switch (action.type) {
        case ActionType.SetWalletAddress:
            state = action.data;
            return state;
        default:
            return state;
    }
}
