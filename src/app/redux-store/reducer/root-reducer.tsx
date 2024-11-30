import { combineReducers } from "redux";
import { ActiveTransactionData, AvailableChains, OpenWalletModalStatus, PreDefinedTokensForChainsData, SelectedLanguage, SelectedTheme, WalletData, WalletDisconnected } from "./reducer-redux";

const rootReducer = combineReducers({
    OpenWalletModalStatus,
    WalletData,
    AvailableChains,
    SelectedLanguage,
    PreDefinedTokensForChainsData,
    ActiveTransactionData,
    WalletDisconnected,
    SelectedTheme
});

export default rootReducer;