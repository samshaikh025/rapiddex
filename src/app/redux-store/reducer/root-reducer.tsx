import { combineReducers } from "redux";
import { AvailableChains, OpenWalletModalStatus, WalletData } from "./reducer-redux";

const rootReducer = combineReducers({
    OpenWalletModalStatus,
    WalletData,
    AvailableChains
});

export default rootReducer;