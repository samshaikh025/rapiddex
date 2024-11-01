import { combineReducers } from "redux";
import { ActiveTransactionData, AvailableChains, OpenWalletModalStatus, PreDefinedTokensForChainsData, SelectedLanguage, WalletData } from "./reducer-redux";

const rootReducer = combineReducers({
    OpenWalletModalStatus,
    WalletData,
    AvailableChains,
    SelectedLanguage,
    PreDefinedTokensForChainsData,
    ActiveTransactionData
});

export default rootReducer;