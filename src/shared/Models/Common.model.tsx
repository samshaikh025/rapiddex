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
  price?: number = 0;
  chainId: number = 0;
  tokenIsNative?: boolean = false;
  tokenIsStable?: boolean = false;
  amount?: string = '';
  balance?: number = 0;
  isbalance?: boolean = false;
  amountInUsd?: string = '0';

  balanceUSD?: number;
  isLoadingBalance?: boolean;
}

export class PathShowViewModel {
  pathId: number;
  estTime: string;
  gasafee: string;
  fromChain: string;
  fromToken: string;
  fromAmount: string;
  fromAmountUsd: string;
  fromAmountWei: string;
  toChain: string;
  toToken: string;
  toAmount: string;
  toAmountUsd: string;
  receivedAmount: string;
  aggregator: string;
  aggregatorOrderType: string;
  relayerfeeusd: number;
  networkcostusd: number;
  approvalAddress: string;
  entire: any;
  aggergatorRequestId: string;
  gasafeeRequiredTransaction: string;
  gasPrice: string;
  gasLimit: string;
  data: string;
  isMultiChain: boolean;
  sourceTransactionData: RapidQuoteTransactionDto;
  destinationTransactionData: RapidQuoteTransactionDto;
  suggestedPath: number;
  declaration: string;  
}

export class RapidQuoteTransactionDto {
  isNativeToken: boolean;
  amountinWei: string;
  approvalAddress: string;
  callData: string;
  rpcUrl: string;
  tokenAddress: string;
  contractAddress: string;
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
  isReconnected: boolean;
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
  value?: string;


}

export class ResponseTransaction {

  success: boolean;
  hash?: string;
  receipt?: TransactionReceipt;
  error?: string;

}

export class TransactionRequestoDto {
  transactionId: number = 0;
  transactionGuid: string = '';
  walletAddress: string = '';
  amount: string;
  amountUsd: string = '';
  approvalAddress: string = '';
  transactionHash: string = '';
  transactionStatus: number = 0;
  transactionSubStatus: number = 0;
  quoteDetail: string = '';
  sourceChainId: number = 0;
  sourceChainName: string = '';
  sourceChainLogoUri: string = '';
  destinationChainId: number = 0;
  destinationChainName: string = '';
  destinationChainLogoUri: string = '';
  sourceTokenName: string = '';
  sourceTokenAddress: string = '';
  sourceTokenSymbol: string = '';
  sourceTokenLogoUri: string = '';
  destinationTokenName: string = '';
  destinationTokenAddress: string = '';
  destinationTokenSymbol: string = '';
  destinationTokenLogoUri: string = '';
  sourceChain: Chains;
  destinationChain: Chains;
  isNativeToken: boolean = false;
  transactiionAggregator: string;
  transactionAggregatorRequestId: string;
  transactionAggregatorRequestData: string;
  transactionAggregatorGasPrice: string;
  transactionAggregatorGasLimit: string;
  isMultiChain: boolean;
  sourceTransactionData: RapidQuoteTransactionDto;
  destinationTransactionData: RapidQuoteTransactionDto;
  transactionSourceHash: string = '';
  transactionSourceStatus: number = 0;
  transactionSourceSubStatus: number = 0;
}

export class InsertTransactionRequestoDto {
  transactionGuid: string = '';
  walletAddress: string = '';
  amount: number;
  amountUsd: number;
  approvalAddress: string = '';
  transactionHash: string = '';
  transactionStatus: number = 0;
  transactionSubStatus: number = 0;
  quoteDetail: string = '';
  sourceChainId: number = 0;
  sourceChainName: string = '';
  sourceChainLogoUri: string = '';
  destinationChainId: number = 0;
  destinationChainName: string = '';
  destinationChainLogoUri: string = '';
  sourceTokenName: string = '';
  sourceTokenAddress: string = '';
  sourceTokenSymbol: string = '';
  sourceTokenLogoUri: string = '';
  destinationTokenName: string = '';
  destinationTokenAddress: string = '';
  destinationTokenSymbol: string = '';
  destinationTokenLogoUri: string = '';
  sourceChain: string = '';//store chains object as stringify
  destinationChain: string; //store chains object as stringify
  isNativeToken: boolean = false;
  transactiionAggregator: string;
  transactionAggregatorRequestId: string;
  transactionAggregatorRequestData: string;
  transactionAggregatorGasPrice: string;
  transactionAggregatorGasLimit: string;
  isMultiChain: boolean;
  sourceTransactionData: string = '';//RapidQuoteTransactionDto store as stringify
  destinationTransactionData: string = '';//RapidQuoteTransactionDto store as stringify
  transactionSourceHash: string = '';
  transactionSourceStatus: number = 0;
  transactionSourceSubStatus: number = 0;
  greenFieldTxnHash: string = '';
  greenFieldUrl: string = '';
  // sourceChain: Chains;
  // destinationChain: Chains;
  // isNativeToken: boolean = false;
  // transactiionAggregator: string;
  // transactionAggregatorRequestId: string;
  // transactionAggregatorRequestData: string;
  // transactionAggregatorGasPrice: string;
  // transactionAggregatorGasLimit: string;
}

export class UpdateTransactionRequestoDto {
  transactionGuid: string = '';
  transactionSubStatus: number = 0;
}

export class GetSignPayload {
  txnHash: string;
  rpcUrl: string;
}

export class SignatureResponseRapid {
  txnHash: string;
  signValid: boolean;
  validators: ValidatorSign[] = [];
  validatedBy: number;
  validSignatureCount: number
}

export class ValidatorSign {
  name: string;
  data: SignatureResponseAws;
}

export class SignatureResponseAws {
  txnHash: string;
  sign: string = '';
  message: string;
}

export class GetPaymentRequest {
  chainIdFrom: number;
  chainIdTo: number;
  fromToken: string;
  toToken: string;
  fromWalletAddress: string;
  toWalletAddress: string;
  amountIn: number;
  toChainJSon: string;
  toTokenJSon: string;
}

export class GreenFieldResponse {
  greenFieldTxnHash: string = '';
  greenFieldUrl: string = '';
}

export class TransactionHistoryPayload {
  walletAddress: string;
}

export class TransactionHistoryResponse {
  transactionId: number;
  transactionGuid: string;
  walletAddress: string;
  amount: number;
  amountUsd: number;

  approvalAddress: string;
  transactionHash: string;
  transactionStatus: number;
  transactionSubStatus: number;

  quoteDetail: string;
  sourceChainId: number;
  sourceChainName: string;
  sourceChainLogoUri: string;
  destinationChainId: number;
  destinationChainName: string;
  destinationChainLogoUri: string;

  sourceTokenName: string;
  sourceTokenAddress: string;
  sourceTokenSymbol: string;
  sourceTokenLogoUri: string;
  destinationTokenName: string;
  destinationTokenAddress: string;
  destinationTokenSymbol: string;
  destinationTokenLogoUri: string;

  sourceChain: string; // JSON string
  destinationChain: string; // JSON string
  isNativeToken: boolean;

  transactiionAggregator: string;
  transactionAggregatorRequestId: string;
  transactionAggregatorRequestData: string;
  transactionAggregatorGasPrice: string;
  transactionAggregatorGasLimit: string;

  isMultiChain: boolean;
  sourceTransactionData: string; // JSON string
  destinationTransactionData: string; // JSON string

  transactionSourceHash: string;
  transactionSourceStatus: number;
  transactionSourceSubStatus: number;

  greenFieldTxnHash: string;
  greenFieldUrl: string;

  createdOn: string
}

export class ZkProofPayload {
  sign: string[] = [];
}

export class ZkProofResponse {
  success: boolean;
  proofHash: string;
  proof: {
    pi_a: [string, string, string];
    pi_b: [[string, string], [string, string], [string, string]];
    pi_c: [string, string, string];
    protocol: string;
    curve: string;
  };
  publicSignals: string[];
  validatorCount: number;
  isValid: boolean;
  verified: boolean;
  generationTime: number;
}

export class ChatBotResponse {
  message:string;
  object:SwapRequest;
}

export class SwapRequest {
  sourceChain: string;
  sourceTokenAddress: string;
  destChain: string;
  destTokenAddress: string;
  amount: string;
  allDone: number;
}

export class AISuggestedRouteParams {
  pathId: number;
  aggregator: string;
  gasafee: string;
  estTime: string;
  toAmountUsd: string; 
}

export class BestPathFromGPTOss{
  pathId: number;
  aggregator: string;
  gasafee: string;
  estTime: string;
  toAmountUsd: string;
  suggestedPath: number;
  declaration: string;  
}