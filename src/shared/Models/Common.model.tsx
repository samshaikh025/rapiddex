export class ChainBase {
    chainId: number;
    chainName: string;
}

export class TokenBase {
    tokenId: number;
    tokenName: string;
}

export class Chains{
    chainId: number = 0;
    chainName: string = '';
    lifiName: string = '';
    rangoName: string = '';
    logoURI: string = '';
}

export class DLNChainResponse {
    chainId: number = 0;
    originalChainId: number = 0;
    chainName: string = ''
}

export class Tokens{
    address: string = '';
    symbol: string = '';
    logoURI: string = '';
    name: string = '';
}