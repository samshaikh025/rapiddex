import { combineReducers } from "redux";
import { AvailableChains, OpenWalletModalStatus, PreDefinedTokensForChainsData, SelectedLanguage, WalletData } from "./reducer-redux";

const rootReducer = combineReducers({
    OpenWalletModalStatus,
    WalletData,
    AvailableChains,
    SelectedLanguage,
    PreDefinedTokensForChainsData
});

export default rootReducer;