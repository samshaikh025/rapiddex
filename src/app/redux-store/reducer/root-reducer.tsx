import { combineReducers } from "redux";
import { AvailableChains, OpenWalletModalStatus, SelectedLanguage, WalletData } from "./reducer-redux";

const rootReducer = combineReducers({
    OpenWalletModalStatus,
    WalletData,
    AvailableChains,
    SelectedLanguage
});

export default rootReducer;