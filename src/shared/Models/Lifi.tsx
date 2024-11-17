export class RequestLifiPath {

  fromChain: string = '';
  toChain: string = '';
  fromToken: string = '';
  toToken: string = '';
  fromAddress: string = '';
  toAddress?: string = '';
  fromAmount: string = '';
  order?: 'FASTEST' | 'CHEAPEST';
  slippage?: number;
  integrator?: string;
  fee?: number;
  referrer?: string;
  allowBridges?: string[];
  allowExchanges?: string[];
  denyBridges?: string[];
  denyExchanges?: string[];
  preferBridges?: string[];
  preferExchanges?: string[];
  allowDestinationCall?: boolean;
  fromAmountForGas?: string;
  maxPriceImpact?: number;
}

export class ResponseLifiPath {
  id: string;
  type: 'swap' | 'cross' | 'lifi';
  tool: string;
  toolDetails?: {
    key: string;
    name: string;
    logoURI: string;
  };
  action: {
    fromChainId: number;
    fromAmount: string;
    toChainId: number;
    fromToken: {
      address: string;
      decimals: number;
      symbol: string;
      chainId: number;
      coinKey?: string;
      name: string;
      logoURI?: string;
      priceUSD?: string;
    };
    toToken: {
      address: string;
      decimals: number;
      symbol: string;
      chainId: number;
      coinKey?: string;
      name: string;
      logoURI?: string;
      priceUSD?: string;
    };
    slippage?: number;
    fromAddress?: string;
    toAddress?: string;
  };
  estimate: {
    tool: string;
    fromAmount: string;
    fromAmountUSD?: string;
    toAmount: string;
    toAmountMin: string;
    toAmountUSD?: string;
    approvalAddress: string;
    feeCosts?: Array<{
      name: string;
      description?: string;
      percentage: string;
      token: {
        address: string;
        decimals: number;
        symbol: string;
        chainId: number;
        coinKey?: string;
        name: string;
        logoURI?: string;
        priceUSD?: string;
      };
      amount?: string;
      amountUSD: string;
      included: boolean;
    }>;
    gasCosts?: Array<{
      type: 'SUM' | 'APPROVE' | 'SEND';
      price?: string;
      estimate?: string;
      limit?: string;
      amount: string;
      amountUSD?: string;
      token: {
        address: string;
        decimals: number;
        symbol: string;
        chainId: number;
        coinKey?: string;
        name: string;
        logoURI?: string;
        priceUSD?: string;
      };
    }>;
    executionDuration?: number;
  };
  data?: {
    bid?: {
      user: string;
      router: string;
      initiator: string;
      sendingChainId: number;
      sendingAssetId: string;
      amount: string;
      receivingChainId: number;
      receivingAssetId: string;
      amountReceived: string;
      receivingAddress: string;
      transactionId: string;
      expiry: number;
      callDataHash: string;
      callTo: string;
      encryptedCallData: string;
      sendingChainTxManagerAddress: string;
      receivingChainTxManagerAddress: string;
      bidExpiry: number;
      bidSignature: string;
      gasFeeInReceivingToken: string;
      totalFee: string;
      metaTxRelayerFee: string;
      routerFee: string;
      integrator: string;
      referrer: string;
    };
    execution?: string;
  };
  transactionRequest?: TransactionRequest;


}

export class TransactionRequest {
  data: string;
  to: string;
  value: string;
  from: string;
  chainId: number;
  gasPrice: string;
  gasLimit: string;
}

//lifi response modal


export class TokenModal {
  address: string;
  chainId: number;
  symbol: string;
  decimals: number;
  name: string;
  coinKey: string;
  logoURI: string;
  priceUSD: string;
}

export class GasCost {
  type: string;
  price: string;
  estimate: string;
  limit: string;
  amount: string;
  amountUSD: string;
  token: TokenModal;
}

export class StepTransactionEstimate {
  tool: string;
  fromAmount: string;
  fromAmountUSD: string;
  toAmount: string;
  toAmountMin: string;
  toAmountUSD: string;
  approvalAddress: string;
  feeCosts: any[];
  gasCosts: GasCost[];
  executionDuration: number;
}

export class StepTransaction {
  estimate: StepTransactionEstimate;
}

export class ToolDetails {
  key: string;
  name: string;
  logoURI: string;
  webUrl: string;
}

export class IncludedStep {
  tool: string;
  toolDetails: ToolDetails;
  fromAmount: string;
  fromToken: TokenModal;
  toToken: TokenModal;
  toAmount: string;
  bridgedAmount: string | null;
}

export class TransactionDetails {
  txHash: string;
  txLink: string;
  amount: string;
  token: TokenModal;
  chainId: number;
  gasPrice: string;
  gasUsed: string;
  gasToken: TokenModal;
  gasAmount: string;
  gasAmountUSD: string;
  amountUSD: string;
  value: string;
  includedSteps?: IncludedStep[];
  timestamp: number;
}

export class Metadata {
  integrator: string;
}

export class LiFiTransactionResponse {
  transactionId: string;
  stepTransaction: StepTransaction;
  sending: TransactionDetails;
  receiving: TransactionDetails;
  lifiExplorerLink: string;
  fromAddress: string;
  toAddress: string;
  tool: string;
  status: string;
  substatus: string;
  substatusMessage: string;
  metadata: Metadata;
}