export class RequestRangoPath {
  from: string; // The asset X that user likes to swap (e.g., "BSC.BNB")
  to: string; // The asset Y that user wants to swap X into (e.g., "AVAX_CCHAIN.USDT.E--0xc7198437980c041c805a1edcba50c1ce5db95118")
  amount: string; // The machine-readable amount of asset X to be swapped (e.g., 100000000000000000)
  slippage?: number; // Optional: User's preferred slippage in percent, default is 0.5%
  swappers?: string[]; // List of all accepted swappers, empty list means no filter is required
  swappersExclude?: boolean; // Defines the provided swappers as include/exclude list, default is false (include)
  swapperGroups?: string[]; // List of included/excluded swappers based on tag, empty list means no filter is required
  swappersGroupsExclude?: boolean; // Defines provided swappers' tags as include/exclude list, default is false (include)
  messagingProtocols?: string[]; // Message protocols used to call message before or after swap
  imMessage?: string; // Message to call after or before swap transaction
  sourceContract?: string; // Contract address to be called before swap transaction
  destinationContract?: string; // Contract address to be called after swap transaction
  contractCall?: boolean; // Set to true if transactions should be sent through a contract
  referrerCode?: string; // Referrer code
  referrerFee?: number; // Referrer fee in percent
  avoidNativeFee?: boolean; // If true, swappers with native tokens as fee must be excluded
  enableCentralizedSwappers?: boolean; // Specify if centralized swappers must be included or not, default is false
  fromAddress: string;
  toAddress: string;
  disableEstimate: string;
}

type Blockchain = 'ETH' | 'BSC' | 'ARBITRUM' | 'POLYGON' | 'ZKSYNC' | 'STARKNET' | 'OPTIMISM' | 'AVAX_CCHAIN' | 'POLYGONZK' | 'BASE' | 'LINEA' | 'MODE' | 'TRON' | 'BTC' | 'SCROLL' | 'BLAST' | 'COSMOS' | 'OSMOSIS' | 'NEUTRON' | 'NOBLE' | 'DYDX' | 'SOLANA' | 'CRONOS' | 'BNB' | 'FANTOM' | 'AURORA' | 'MAYA' | 'THOR' | 'BOBA' | 'MOONBEAM' | 'MOONRIVER' | 'OKC' | 'BOBA_BNB' | 'BOBA_AVALANCHE' | 'LTC' | 'BCH' | 'HARMONY' | 'EVMOS' | 'HECO' | 'METIS' | 'SIF' | 'BRISE' | 'STARGAZE' | 'FUSE' | 'CRYPTO_ORG' | 'CHIHUAHUA' | 'BANDCHAIN' | 'COMDEX' | 'REGEN' | 'IRIS' | 'EMONEY' | 'GNOSIS' | 'JUNO' | 'AXELAR' | 'STRIDE' | 'KCC' | 'MARS' | 'TERRA' | 'TELOS' | 'BITSONG' | 'AKASH' | 'KI' | 'PERSISTENCE' | 'MEDIBLOC' | 'KUJIRA' | 'SENTINEL' | 'INJECTIVE' | 'SECRET' | 'KONSTELLATION' | 'STARNAME' | 'BITCANNA' | 'UMEE' | 'DESMOS' | 'LUMNETWORK' | 'TERRA_CLASSIC' | 'CELO' | 'DASH' | 'XLAYER' | 'POLKADOT' | 'DOGE' | 'GOERLI' | 'GOERLI_ARBITRUM' | 'GOERLI_OPTIMISM';

export class ResponseRangoPath {
  requestId: string;
  resultType: 'OK' | 'HIGH_IMPACT' | 'INPUT_LIMIT_ISSUE' | 'NO_ROUTE';
  route: Route;
  error?: ErrorInfo;
  tx?: BasicApiEvmTransaction;
}

class BasicApiEvmTransaction {
  /** Type of blockchain transaction */
  type: 'EVM' | 'TRANSFER' | 'COSMOS' | 'SOLANA' | 'ZK_ROLLUP' | 'TRON' | 'STARKNET';

  /** Blockchain metadata */
  blockChain: any;

  /** Source wallet address */
  from: string;

  /** Target contract address */
  txTo: string;

  /** Token approval contract address */
  approveTo?: string;

  /** Token approval transaction data */
  approveData?: string;

  /** Contract call data */
  txData?: string;

  /** Native token transfer amount */
  value?: string;

  /** Recommended gas limit */
  gasLimit?: string;

  /** Base gas price (non-EIP1559) */
  gasPrice?: number;

  /** Priority gas price (tip to validator) */
  priorityGasPrice?: number;

  /** Maximum priority fee per gas */
  maxPriorityFeePerGas?: number;

  /** Maximum total gas price */
  maxGasPrice?: number;

  /** Maximum fee per gas (includes base fee and priority fee) */
  maxFeePerGas?: number;
}

class Route {
  outputAmount: number;
  outputAmountMin: number;
  outputAmountUsd?: number;
  swapper: SwapperMetadata;
  fee: Fee[];
  amountRestriction?: AmountRestriction;
  estimatedTimeInSeconds: number;
  path: SwapStep[];
  feeUsd: number;
}

class SwapperMetadata {
  id: string;
  title: string;
  logo: string;
  swapperGroup: string;
  types: string[];
  enabled: boolean;
  from: Token;
  to: Token;
}

class Token {
  blockchain: Blockchain;
  symbol: string;
  name?: string;
  isPopular: boolean;
  chainId?: string;
  address: string;
  decimals: number;
  image: string;
  blockchainImage?: string;
  usdPrice: number;
  supportedSwappers: string[];
}

class Fee {
  token: Token;
  expenseType: 'FROM_SOURCE_WALLET' | 'DECREASE_FROM_OUTPUT' | 'FROM_DESTINATION_WALLET';
  amount: number;
  name: string;
  meta?: EvmNetworkFeeMeta;
  feeUsd?: number;
}

class EvmNetworkFeeMeta {
  type: string;
  gasLimit: number;
  gasPrice: number;
}

class AmountRestriction {
  min?: number;
  max?: number;
  type: 'INCLUSIVE' | 'EXCLUSIVE';
}

class SwapStep {
  swapper: {
    id: string;
    title: string;
    logo: string;
    swapperGroup: string;
    types: string[];
    enabled: boolean;
    swapperType: 'BRIDGE' | 'DEX' | 'AGGREGATOR' | 'OFF_CHAIN';
  };
  from: Token;
  to: Token;
  inputAmount: number;
  expectedOutput: number;
  estimatedTimeInSeconds: number;
}

class ErrorInfo {
  errorCode: number;
  traceId: number;
  [key: string]: any; // For additional fields
}


//response modal

export class LiFiTransactionResponse {
  status: string; // Example: "success"
  error: string | null; // Null if no error, else an error message
  diagnosisUrl: string | null; // URL for diagnosis, if applicable
  explorerUrl: ExplorerUrl[]; // Array of URLs with descriptions
  output: any | null; // Output data if present, otherwise null
  bridgeData: BridgeData | null; // Details about the bridge transaction
}

export class ExplorerUrl {
  url: string; // Example: "https://polygonscan.com/tx/..."
  description: string; // Description of the explorer link, e.g., "swap"
}

export class BridgeData {
  srcChainId: number; // Source chain ID, e.g., 137 for Polygon
  srcTxHash: string; // Transaction hash on source chain
  srcToken: string; // Source token contract address
  srcTokenAmt: string; // Amount of the source token, e.g., "100000"
  srcTokenDecimals: number; // Number of decimals for the source token
  srcTokenPrice: string; // Price of the source token
  destChainId: number; // Destination chain ID
  destTxHash: string | null; // Transaction hash on destination chain, if available
  destToken: string; // Destination token contract address
  destTokenDecimals: number; // Number of decimals for the destination token
  destTokenAmt: string | null; // Amount of the destination token, if available
  destTokenPrice: string; // Price of the destination token
}