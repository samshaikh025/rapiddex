export enum DataSource {
    From = 'From',
    To = 'To'
}

export enum Keys {
    All_RANGO_COINS = 'All_Rango_Coins',
    All_LIFI_COINS = 'All_Lifi_Coins',
    All_OWLTO_COINS = 'All_Owlto_Coins',
    All_AVAILABLE_CHAINS = 'All_Available_Chains',
    All_DLN_CHAINS = 'All_DLN_Chains',
    WALLET_CONNECT_DATA = 'Wallet_Connect_Data',
    THEME = 'Theme',
    SELECTED_LANG = 'Selected_Lang',
    IS_LOGGED_IN = 'Is_Logged_In',
    ACTIVE_TRANASCTION_DATA = 'Active_Transaction_Data'
}

export enum SwapProvider {
    LIFI = 0,
    RANGO = 1,
    OWLTO = 2,
    MOBULA = 3,
    DOTNET = 4,
    RAPIDDEX = 5,
    DOTNETPAYMENTAPI = 6
}

export enum ActionType {
    OpenWalletModal = "OPEN_WALLET_MODAL",
    SetWalletData = "SET_WALLET_DATA",
    SetAvailableChains = "SET_AVAILABLE_CHAINS",
    SetSelectedLanguage = "SET_SELECTED_LANGUAGE",
    PreDefineTokensForChain = "PRE_DEFINE_TOKENS_FOR_CHAIN",
    ActiveTransaction = "ACTIVE_TRANSACTION",
    UpdateTransactionGuid = "UPDATE_TRANSACTION_GUID",
    UpdateTransactionStatus = "UPDATE_TRANSACTION_STATUS",
    WalletDisconnected = "WALLET_DISCONNECTED",
    SetSelectedTheme = "SET_SELECTED_THEME",
}

export enum TransactionStatus {
    ALLOWANCSTATE = 1,
    PENDING = 2,
    COMPLETED = 3,
    // DONE = 3,
    // FAILED = 4,
    // NOT_FOUND = 5
}

export enum TransactionSubStatus {
    PENDING = 1,
    DONE = 2,
    FAILED = 3,
    // NOT_FOUND = 4
}

export enum TransactionSubStatusLIFI {
    PENDING = 1,
    DONE = 2,
    FAILED = 3,
    NOT_FOUND = 3
}

export enum TransactionSubStatusRango {
    running = 1,
    failed = 3,
    success = 2
}

export enum AggregatorProvider {
    LIFI = "lifi",
    RANGO = "rango",
    OWLTO = "owlto",
    RAPID_DEX = "rapid_dex"
}

