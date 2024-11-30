import { combineReducers } from "redux";
import { ActiveTransactionData, AvailableChains, OpenWalletModalStatus, PreDefinedTokensForChainsData, SelectedLanguage, WalletData, WalletDisconnected } from "./reducer-redux";

const rootReducer = combineReducers({
    OpenWalletModalStatus,
    WalletData,
    AvailableChains,
    SelectedLanguage,
    PreDefinedTokensForChainsData,
    ActiveTransactionData,
    WalletDisconnected
});

export default rootReducer;