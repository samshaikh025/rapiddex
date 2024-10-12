import { ActionType } from "@/shared/Enum/Common.enum";

const modalInitialState = false;
const addressInitialState = '';
const availableChainsInit = [];

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

export function AvailableChains(state = availableChainsInit, action: any) {
    switch (action.type) {
        case ActionType.SetAvailableChains:
            state = action.data;
            return state;
        default:
            return state;
    }
}
