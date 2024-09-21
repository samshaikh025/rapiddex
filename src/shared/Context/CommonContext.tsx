import { createContext } from "react";
import { PreDefinedTokensForChains } from "../Models/Common.model";

export const PredifineTokensContext = createContext<PreDefinedTokensForChains[]>([]);