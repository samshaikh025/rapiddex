export class RequestRangoPath {
    from: string; // The asset X that user likes to swap (e.g., "BSC.BNB")
    to: string; // The asset Y that user wants to swap X into (e.g., "AVAX_CCHAIN.USDT.E--0xc7198437980c041c805a1edcba50c1ce5db95118")
    amount: number; // The machine-readable amount of asset X to be swapped (e.g., 100000000000000000)
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
  }
  