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
    SELECTED_LANG = 'Selected_Lang' 
}

export enum SwapProvider {
    LIFI = 0,
    RANGO = 1,
    OWLTO = 2,
    MOBULA = 3,
    DOTNET = 4
}

export enum ActionType {
    OpenWalletModal = "OPEN_WALLET_MODAL",
    SetWalletData = "SET_WALLET_DATA",
    SetAvailableChains = "SET_AVAILABLE_CHAINS",
    SetSelectedLanguage = "SET_SELECTED_LANGUAGE",
    PreDefineTokensForChain = "PRE_DEFINE_TOKENS_FOR_CHAIN"
}