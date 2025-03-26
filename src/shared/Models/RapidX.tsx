import { Tokens } from "./Common.model";

export class RequestRapidXPath {
    chainIdFrom: number;
    chainIdTo: number;
    fromToken: string;
    toToken: string;
    walletAddress: string;
    amountIn: string;
}



export class GasCost {
    name: string;
    desctiption: string;  // Note: Keeping the typo as it's in the original data
    price: string;
    estimate: string;
    limit: string;
    amount: string;
    amountUSD: string;
    token: Tokens;
}


export class feeCost {
    name: string;
    desctiption: string;  // Note: Keeping the typo as it's in the original data
    price: string;
    estimate: string;
    limit: string;
    amount: string;
    amountUSD: string;
    token: Tokens;
}


export class ReceivableAmount {
    token: Tokens;
    amountInWei: string;
    amountInUSD?: string;
}

export class DexTransaction {
    dexName: string;
    fromToken: Tokens;
    toToken: Tokens;
    gasCosts: GasCost[];
    feeCosts: feeCost[];
    approvalAddress: string;
    callData: string;
    receviableAmountByDex: ReceivableAmount;
    alreadySupportedToken: boolean;
}

export class Route {
    sourceTransaction: DexTransaction;
    destinationTransaction: DexTransaction;
}

export class Quote {
    fromAmount: string;
    toAmount: string;
    totalCostInUSD: string;
    approvalAddress: string;
    recevableAmoutAtDestination: ReceivableAmount;
}

export class TransactionData {
    data: string;
    to: string;
    value: string;
    from: string;
    chainId: number;
    gasPrice: string;
    gasLimit: string;
}

export class ExecutorTransactionData {
    data: string;
    to: string;
    value: string;
    from: string;
    chainId: number;
    gasPrice: string;
    gasLimit: string;
}

export class Data {
    id: string;
    isMultiChain: boolean;
    route: Route;
    quote: Quote;
    transactionData: TransactionData;
    executorTransactionData: TransactionData;
}

export class ResponseRapidXPath {
    success: boolean;
    message: string;
    data: Data;
    timestamp: string;
}