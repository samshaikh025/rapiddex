import { TransactionReceipt } from "ethers";

export class ChainBase {
  chainId: number;
  chainName: string;
}

export class TokenBase {
  tokenId: number;
  tokenName: string;
}

export class Chains {
  chainId: number = 0;
  chainName: string = '';
  lifiName: string = '';
  rangoName: string = '';
  owltoName: string = '';
  logoURI: string = '';
  rpcUrl?: string[] = [];
}

export class DLNChainResponse {
  chainId: number = 0;
  originalChainId: number = 0;
  chainName: string = ''
}

export class Tokens {
  address: string = '';
  symbol: string = '';
  logoURI: string = '';
  name: string = '';
  decimal: number = 0;
}

export class PathShowViewModel {
  pathId: number;
  estTime: string;
  gasafee: string;
  fromChain: string;
  fromToken: string;
  fromAmount: string;
  toChain: string;
  toToken: string;
  toAmount: string;
  receivedAmount: string;
  aggregator: string;
  aggregatorOrderType: string;
  relayerfeeusd: number;
  networkcostusd: number;
  approvalAddress: string;
  entire: any;
}

export class ResponseMobulaPricing {
  data: {
    id: number;
    market_cap: number;
    market_cap_diluted: number;
    liquidity: number;
    price: number;
    off_chain_volume: number;
    volume: number;
    volume_change_24h: number;
    volume_7d: number;
    is_listed: boolean;
    price_change_24h: number;
    price_change_1h: number;
    price_change_7d: number;
    price_change_1m: number;
    price_change_1y: number;
    ath: number;
    atl: number;
    name: string;
    symbol: string;
    logo: string;
    rank: number;
    contracts: Array<{
      address: string;
      blockchain: string;
      blockchainId: string;
      decimals: number;
    }>;
    total_supply: string;
    circulating_supply: string;
  }
}

export class PreDefinedTokensForChains {
  chainId: number = 0;
  tokens: Tokens[] = [];
}

export class WalletConnectData {
  address: string = '';
  providerImgPath: string = '';
  providerName: string = '';
  chainId: number = 0;
  chainName: string = '';
  chainLogo: string = '';
  blockExplorer: WalletDataBlockExplorer = new WalletDataBlockExplorer();
}

export class WalletDataBlockExplorer {
  apiUrl?: string = '';
  name: string = '';
  url: string = '';
}


export class BridgeMessage {
  message: string = '';

}

export class OperationResult {
  data?: any = '';
  successMessage: string = '';
  errorMessage: string = '';
  statusCode: number = 0;
}

export class LoggedParams {
  LoggedId: number = 0;
  WalletAddress: string = '';
  WalletProvider: string = '';
  ChainName: string = '';
  ChainId: number = 0;
  LoggedDate: string;
  LoggedTime: string;
}

export class RequestTransaction {

  to: string;
  value?: string | number;


}

export class ResponseTransaction {

  success: boolean;
  hash?: string;
  receipt?: TransactionReceipt;
  error?: string;

}

export class TransactionRequestoDto{
  transactionId : number = 0;
  transactionGuid: string = '';
  walletAddress : string = '';
  amount : number = 0;
  approvalAddress : string = '';
  transactionHash : string = '';
  transactionStatus : number  = 0;
  quoteDetail : string = '';
  sourceChainId : number = 0;
  sourceChainName : string = '';
  sourceChainLogoUri : string = '';
  destinationChainId : number = 0;
  destinationChainName : string = '';
  destinationChainLogoUri : string = '';
  sourceTokenName : string = '';
  sourceTokenAddress : string = '';
  sourceTokenSymbol : string = '';
  sourceTokenLogoUri : string = '';
  destinationTokenName : string = '';
  destinationTokenAddress : string = '';
  destinationTokenSymbol : string = '';
  destinationTokenLogoUri : string = '';
}

