import { combineReducers } from "redux";
import { OpenWalletModalStatus, WalletAddress } from "./reducer-redux";

const rootReducer = combineReducers({
    OpenWalletModalStatus,
    WalletAddress
});

export default rootReducer;