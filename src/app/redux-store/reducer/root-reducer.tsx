import { combineReducers } from "redux";
import { AvailableChains, OpenWalletModalStatus, WalletAddress } from "./reducer-redux";

const rootReducer = combineReducers({
    OpenWalletModalStatus,
    WalletAddress,
    AvailableChains
});

export default rootReducer;