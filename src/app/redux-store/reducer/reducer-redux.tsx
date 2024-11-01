import { ActionType } from "@/shared/Enum/Common.enum";
import { TransactionRequestoDto, WalletConnectData } from "@/shared/Models/Common.model";

const modalInitialState = false;
const addressInitialState = new WalletConnectData();
const availableChainsInit = [];
const defaultLanguage = 'en';
const preDefineTokensData = [];
const defaultTransactionData = new TransactionRequestoDto();

export function OpenWalletModalStatus(state = modalInitialState, action: any) {
    switch (action.type) {
        case ActionType.OpenWalletModal:
            state = action.data;
            return state;
        default:
            return state;
    }
}

export function WalletData(state = addressInitialState, action: any) {
    switch (action.type) {
        case ActionType.SetWalletData:
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

export function SelectedLanguage(state = defaultLanguage, action: any) {
    switch (action.type) {
        case ActionType.SetSelectedLanguage:
            state = action.data;
            return state;
        default:
            return state;
    }
}

export function PreDefinedTokensForChainsData(state = preDefineTokensData, action: any) {
    switch (action.type) {
        case ActionType.PreDefineTokensForChain:
            state = [...state, action.data];
            return state;
        default:
            return state;
    }
}

export function ActiveTransactionData(state = defaultTransactionData, action: any) {
    switch (action.type) {
        case ActionType.ActiveTransaction:
            state = action.data;
            return state;
        case ActionType.UpdateTransactionGuid:
            state = {...state, transactionId: action.data};
            return state;
        case ActionType.UpdateTransactionStatus:
            state = {...state, transactionStatus: action.data};
            return state;    
        default:
            return state;
    }
}