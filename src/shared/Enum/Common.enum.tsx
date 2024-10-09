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
    Wallet_Address = 'Wallet_Address',
    THEME = 'Theme' 
}

export enum SwapProvider {
    LIFI = 0,
    RANGO = 1,
    OWLTO = 2,
    MOBULA = 3
}

export enum ActionType {
    OpenWalletModal = "OPEN_WALLET_MODAL",
    SetWalletAddress = "SET_WALLET_ADDRESS"
}