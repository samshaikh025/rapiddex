
import { useSelector } from "react-redux";
import { AggregatorProvider, Keys, SwapProvider } from "../Enum/Common.enum";
import { Chains, Tokens, DLNChainResponse, ResponseMobulaPricing, PathShowViewModel, RapidQuoteTransactionDto } from '../Models/Common.model';
import { RequestLifiPath, ResponseLifiPath } from "../Models/Lifi";
import { RequestOwltoDTC, RequestOwltoPath, ResponseOwltoDTC, ResponseOwltoPath } from "../Models/Owlto";
import { RequestRangoPath, ResponseRangoPath } from "../Models/Rango";
import { SharedService } from "./SharedService";
import { UtilityService } from "./UtilityService";
import { RequestRapidXPath, ResponseRapidXPath } from "../Models/RapidX";
export class CryptoService {

    AvailableChains: Chains[] = [];
    SetLifiChains: any[] = [];
    SetDlnChains: DLNChainResponse[] = [];
    SetRangoChains: any[] = [];
    SetOwltoChains: any[] = [];
    AvailableCoins: Tokens[] = [];
    SetLifiCoins: any[] = [];
    SetDlnCoins: any[] = [];
    SetRangoCoins: any[] = [];
    SetOwltoCoins: any[] = [];
    SharedService = new SharedService();
    constructor() {
    }
    utilityService = new UtilityService();

    apiUrlENV: string = process.env.NEXT_PUBLIC_NODE_ENV == 'production' ? process.env.NEXT_PUBLIC_NODE_API_URL_PRODUCTION : process.env.NEXT_PUBLIC_NODE_API_URL;
    async GetAvailableTokens(selectedChain: Chains) {
        this.SetLifiCoins = [];
        //this.SetDlnCoins = [];
        this.SetRangoCoins = [];
        this.SetOwltoCoins = [];
        this.AvailableCoins = [];

        // Fetch all coins concurrently for better performance
        const [lifiCoins, rangoCoins, owltoCoins] = await Promise.all([
            this.GetCoinsForLifi(selectedChain),
            this.GetCoinsForRango(selectedChain),
            this.GetCoinsForOwlto(selectedChain)
        ]);

        this.SetLifiCoins = lifiCoins;
        this.SetRangoCoins = rangoCoins;
        this.SetOwltoCoins = owltoCoins;

        try {
            this.SetLifiCoins?.map((coin: any) => {
                let obj = new Tokens();
                obj.name = coin.name;
                obj.address = coin.address;
                obj.symbol = coin.symbol;
                obj.logoURI = coin.logoURI;
                obj.decimal = coin.decimals;
                obj.price = Number(coin.priceUSD);
                obj.chainId = selectedChain.chainId;
                this.AvailableCoins.push(obj);
            })
        }
        catch (error) {

        }

        // this.SetDlnCoins?.map((coin: any)=>{

        //     if(this.AvailableCoins.filter(x => x.address == coin.address).length == 0)
        //     {
        //         let obj = new Tokens();
        //         obj.name = coin.name;
        //         obj.address = coin.address;
        //         obj.symbol = coin.symbol;
        //         obj.logoURI = coin.logoURI;

        //         this.AvailableCoins.push(obj);
        //     }    
        // })

        try {



            this.SetRangoCoins?.map((coin: any) => {

                if (this.AvailableCoins.filter(x => x.address == coin.address).length == 0) {
                    let obj = new Tokens();
                    obj.name = coin.name;
                    obj.address = coin.address;
                    obj.symbol = coin.symbol;
                    obj.logoURI = coin.image;
                    obj.decimal = coin.decimals;
                    obj.price = Number(coin.usdPrice);
                    obj.chainId = selectedChain.chainId;
                    this.AvailableCoins.push(obj);
                }
            })
        }
        catch (error) {

        }


        if (this.SetOwltoChains != undefined && this.SetOwltoChains.length > 0) {



            // this.SetOwltoCoins?.map((coin: any)=>{

            //     if(this.AvailableCoins.filter(x => x.address == coin.address).length == 0)
            //     {
            //         let obj = new Tokens();
            //         obj.name = coin.text;
            //         obj.address = coin.address;
            //         obj.symbol = coin.symbol;
            //         obj.logoURI = coin.icon;
            //         obj.decimal = coin.decimal;
            //         this.AvailableCoins.push(obj);
            //     }    
            // })
        }

        let chainList = await this.getAvailableChainList();
        chainList?.forEach((chain) => {
            let index = this.AvailableChains.findIndex(x => x.chainId == chain.chainId);
            if (index > -1) {
                this.AvailableChains[index].rpcUrl = chain.rpc;
            }
        });

        return this.AvailableCoins;
    }

    async getAvailableChainList() {
        let ChainListAPIResponseData = [];
        try {
            let ChainListAPIResponse = await fetch('https://chainid.network/chains.json');
            ChainListAPIResponseData = await ChainListAPIResponse.json();
            //let data = await this.SharedService.setIndexDbItem(Keys.All_LIFI_COINS, lifiCoins);
        } catch (error) {
            console.log(error);
        }
        return ChainListAPIResponseData;
    }

    async GetCoinsForLifi(chain: Chains) {
        let lifiCoins = [];
        let payLoad = {
            apiType: 'GET',
            apiUrl: `tokens?chains=${chain.lifiName}`,
            apiData: null,
            apiProvider: SwapProvider.LIFI
        }
        try {
            let LIFICoinResult = await fetch(this.apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),

            });
            const LIFICoinData = await LIFICoinResult.json();
            lifiCoins = LIFICoinData?.Data?.tokens[chain.chainId];
            //let data = await this.SharedService.setIndexDbItem(Keys.All_LIFI_COINS, lifiCoins);
        } catch (error) {
            console.log(error);
        }
        return lifiCoins;
    }

    async GetCoinsForDln(id: number) {
        let dlnCoins: any[] = [];
        let dlnId = 0;
        let dlnChains: DLNChainResponse[] = await this.SharedService.getIndexDbItem(Keys.All_DLN_CHAINS);
        if (dlnChains && dlnChains?.length > 0) {
            dlnId = dlnChains.find(x => x.originalChainId == id)?.chainId;
        }
        try {
            let payLoad = {
                apiType: 'GET',
                apiUrl: `https://api.dln.trade/v1.0/token-list?chainId=${dlnId}`,
                apiData: null
            }
            let DlnCoinResult = await fetch(this.apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),

            });
            const DLnCoinData = await DlnCoinResult.json();
            let keys = Object.keys(DLnCoinData.Data.tokens);
            keys.map((index) => {
                dlnCoins.push(DLnCoinData.Data.tokens[index])
            })
        } catch (error) {
            console.log(error);
        }

        return dlnCoins;
    }

    async GetCoinsForRango(chain: Chains) {
        let rangoCoins = [];
        //let checkLifiCoins = await this.SharedService.getIndexDbItem(Keys.All_LIFI_COINS);
        let payLoad = {
            apiType: 'GET',
            apiUrl: `basic/meta?blockchains=${chain.rangoName}`,
            apiData: null,
            apiProvider: SwapProvider.RANGO
        }
        try {
            let RangoCoinResult = await fetch(this.apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),

            });
            const RangoCoinData = await RangoCoinResult.json();
            rangoCoins = RangoCoinData?.Data?.tokens;
            //let data = await this.SharedService.setIndexDbItem(Keys.All_LIFI_COINS, lifiCoins);
        } catch (error) {
            console.log(chain.rangoName, error);
        }

        return rangoCoins;
    }

    async GetCoinsForOwlto(chain: Chains) {
        let owltCoins = [];
        let payLoad = {
            apiType: 'GET',
            apiUrl: `api/config/all-tokens`,
            apiData: null,
            apiProvider: SwapProvider.OWLTO
        }
        try {
            let LIFICoinResult = await fetch(this.apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),

            });
            const OwltoCoinData = await LIFICoinResult.json();
            owltCoins = OwltoCoinData?.Data?.msg?.filter((x) => x.chainId == chain.chainId);
            //let data = await this.SharedService.setIndexDbItem(Keys.All_OWLTO_COINS, owltCoins);
        } catch (error) {
            console.log(error);
        }

        return owltCoins;
    }


    async GetAvailableChains() {
        this.AvailableChains = [];
        // Fetch all chains concurrently
        const [lifiChains, rangoChains, owltoChains] = await Promise.all([
            this.GetLifiChains(),
            this.GetRangoChains(),
            this.GetOwltoChains()
        ]);

        this.SetLifiChains = lifiChains;
        this.SetRangoChains = rangoChains;
        this.SetOwltoChains = owltoChains;

        this.SetLifiChains?.map((chain) => {

            let obj = new Chains();
            obj.chainId = chain.id;
            obj.lifiName = chain.key;
            obj.chainName = chain.name;
            obj.rangoName = '';
            obj.logoURI = chain.logoURI;


            this.AvailableChains.push(obj);
        });

        // this.SetDlnChains?.map((chain) => {
        //     if (this.AvailableChains?.filter(x => x.chainId == chain.originalChainId).length == 0) {
        //         let obj = new Chains();
        //         obj.chainId = chain.originalChainId
        //         obj.chainName = chain.chainName;
        //         this.AvailableChains.push(obj);
        //     }
        // });

        this.SetRangoChains?.map((chain) => {
            let includeLength = this.AvailableChains.filter(x => x.chainId == parseInt(chain.chainId)).length;
            if (includeLength == 0) {
                let obj = new Chains();
                obj.chainId = parseInt(chain.chainId)
                obj.chainName = chain.displayName;
                obj.rangoName = chain.name;
                obj.lifiName = '';
                obj.logoURI = chain.logo;

                this.AvailableChains.push(obj);
            } else if (includeLength == 1) {
                let index = this.AvailableChains?.findIndex(x => x.chainId == parseInt(chain.chainId));
                this.AvailableChains[index].rangoName = chain.name;
            }
        });

        if (this.SetOwltoChains != undefined && this.SetOwltoChains.length > 0) {



            this.SetOwltoChains?.map((chain) => {
                let includeLength = this.AvailableChains.filter(x => x.chainId == parseInt(chain.chainId)).length;
                // if (this.AvailableChains.filter(x => x.chainId == chain.chainId).length == 0) {
                //     let obj = new Chains();
                //     obj.chainId = chain.chainId;
                //     obj.chainName = chain.aliasName;
                //     obj.lifiName = '';
                //     obj.rangoName = '';
                //     obj.logoURI = chain.icon;


                //     this.AvailableChains.push(obj);
                // }
                // else if (includeLength == 1) {
                //     let index = this.AvailableChains?.findIndex(x => x.chainId == parseInt(chain.chainId));
                //     this.AvailableChains[index].owltoName = chain.name;
                // }

                if (includeLength == 1) {
                    let index = this.AvailableChains?.findIndex(x => x.chainId == parseInt(chain.chainId));
                    this.AvailableChains[index].owltoName = chain.name;
                }
            });
        }

        //let res = await this.SharedService.setIndexDbItem(Keys.All_AVAILABLE_CHAINS, this.AvailableChains)
        let chainList = await this.getAvailableChainList();
        chainList?.forEach((chain) => {
            let index = this.AvailableChains.findIndex(x => x.chainId == chain.chainId);
            if (index > -1) {
                this.AvailableChains[index].rpcUrl = chain.rpc;
            }
        });

        return this.AvailableChains;
    }

    async GetLifiChains() {
        console.log('env' + this.apiUrlENV);
        let lifiChains = [];
        let payLoad = {
            apiType: 'GET',
            apiUrl: 'chains',
            apiData: null,
            apiProvider: SwapProvider.LIFI
        }
        try {
            let LIFIChainResult = await fetch(this.apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),
            });
            const LIFIChainData = await LIFIChainResult.json();
            lifiChains = LIFIChainData.Data?.chains;
        } catch (error) {
            console.log(error);
        }
        return lifiChains;
    }

    async GetDlnChains() {
        let dlnChains = [];
        let payLoad = {
            apiType: 'GET',
            apiUrl: 'https://api.dln.trade/v1.0/supported-chains-info',
            apiData: null
        }
        try {
            let DlnChainResult = await fetch(this.apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),

            });
            const DlnChainData = await DlnChainResult.json();
            dlnChains = DlnChainData.Data?.chains;
            let res = this.SharedService.setIndexDbItem(Keys.All_DLN_CHAINS, dlnChains);
        } catch (error) {
            console.log(error);
        }
        return dlnChains;
    }

    async GetRangoChains() {
        let rangoChains = [];
        let payLoad = {
            apiType: 'GET',
            apiUrl: 'basic/meta',
            apiData: null,
            apiProvider: SwapProvider.RANGO
        }
        try {
            let RangoChainResult = await fetch(this.apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),

            });
            const RangoChainData = await RangoChainResult.json();
            rangoChains = RangoChainData.Data.blockchains.filter((x: any) => x.type == 'EVM');
        } catch (error) {
            console.log(error);
        }

        return rangoChains;
    }

    async GetOwltoChains() {
        let owltoChains = [];
        let payLoad = {
            apiType: 'GET',
            apiUrl: 'api/config/all-chains',
            apiData: null,
            apiProvider: SwapProvider.OWLTO
        }
        try {
            let OwltoChainResult = await fetch(this.apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad)
            });
            const OwltoChainData = await OwltoChainResult.json();
            owltoChains = OwltoChainData.Data.msg;
        } catch (error) {
            console.log(error);
        }

        return owltoChains;
    }

    async GetTokenData(token: Tokens) {
        let amountUSD = 0;
        let TokenData: ResponseMobulaPricing;
        let query = token.address == '0x0000000000000000000000000000000000000000' ? 'symbol=' + token.symbol : 'asset=' + token.address;
        let payLoad = {
            apiType: 'GET',
            apiUrl: `market/data?${query}`,
            apiData: null,
            apiProvider: SwapProvider.MOBULA
        }
        try {
            let tokenExec = await fetch(this.apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),

            });
            const TokenResponse = await tokenExec.json();

            TokenData = TokenResponse?.Data;
        } catch (error) {
            console.log(error);
        }

        return TokenData;
    }





    async getBestPathFromChosenChains(
        sourceChain: Chains,
        destChain: Chains,
        sourceToken: Tokens,
        destToken: Tokens,
        amount: number,
        walletAddress: string
    ) {
        try {
            // Assign default wallet address if not provided
            if (this.utilityService.isNullOrEmpty(walletAddress)) {
                walletAddress = "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0";
            }

            // Set a 5-second timeout for each API call
            const apiTimeout = 10000; // 5 seconds

            const withTimeout = (promise: Promise<any>, ms: number, apiName: string) => {
                return Promise.race([
                    promise,
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error(`${apiName} API timed out after ${ms} ms`)), ms)
                    ),
                ]);
            };

            // Fetch paths concurrently with timeout
            // same param for wallet address because this method called from swap within same account so from and to are same
            const [rapidXPath, fastestPath, cheapestPath, rangoPath, owltoPath] = await Promise.all([
                withTimeout(this.getRapidXPath(sourceChain, destChain, sourceToken, destToken, amount, walletAddress, walletAddress, "CHEAPEST"), apiTimeout, 'RapidX'),
                withTimeout(this.getLifiPath(sourceChain, destChain, sourceToken, destToken, amount, walletAddress, "FASTEST"), apiTimeout, 'Lifi (Fastest)'),
                withTimeout(this.getLifiPath(sourceChain, destChain, sourceToken, destToken, amount, walletAddress, "CHEAPEST"), apiTimeout, 'Lifi (Cheapest)'),
                withTimeout(this.getRangoPath(sourceChain, destChain, sourceToken, destToken, amount, walletAddress, "CHEAPEST"), apiTimeout, 'Rango'),
                withTimeout(this.getOwltoPath(sourceChain, destChain, sourceToken, destToken, amount, walletAddress, "CHEAPEST"), apiTimeout, 'Owlto'),
            ]);

            // Log message if the default wallet address is used
            if (walletAddress === "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0") {
                //console.log("Wallet is not connected");
            }

            // Create PathShowViewModel concurrently with timeout
            const [subrapidXPath, subfastestPath, subcheapestPath, subrangoPath, subowltoPath] = await Promise.all([
                rapidXPath ? this.createRapidXPathShowViewModel(rapidXPath, sourceChain, destChain, sourceToken, destToken, amount, "CHEAPEST") : null,
                fastestPath ? this.createPathShowViewModel(fastestPath, sourceChain, destChain, sourceToken, destToken, amount, "FASTEST") : null,
                cheapestPath ? this.createPathShowViewModel(cheapestPath, sourceChain, destChain, sourceToken, destToken, amount, "CHEAPEST") : null,
                rangoPath ? this.createRangoPathShowViewModel(rangoPath, sourceChain, destChain, sourceToken, destToken, amount, "Rango") : null,
                owltoPath ? this.createOwltoPathShowViewModel(owltoPath, sourceChain, destChain, sourceToken, destToken, amount, "Owlto") : null
            ]);


            // Filter non-null paths
            const bestpath = [subrapidXPath, subfastestPath, subcheapestPath, subrangoPath, subowltoPath].filter(path => path != null);

            // Return bestpath if any valid paths, otherwise return null
            return bestpath.length > 0 ? bestpath : [];

        } catch (error) {
            console.error("Error in getBestPathFromChosenChains:", error);
            throw error;
        }
    }

    async getBestPathFromChosenChainsRapidX(
        sourceChain: Chains,
        destChain: Chains,
        sourceToken: Tokens,
        destToken: Tokens,
        amount: number,
        fromWalletAddress: string,
        toWalletAddress: string
    ) {
        try {
            // Assign default wallet address if not provided
            if (this.utilityService.isNullOrEmpty(fromWalletAddress)) {
                fromWalletAddress = "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0";
            }

            // Fetch paths concurrently with timeout
            const rapidXPath = await this.getRapidXPath(sourceChain, destChain, sourceToken, destToken, amount, fromWalletAddress, toWalletAddress, "CHEAPEST")

            // Log message if the default wallet address is used
            if (fromWalletAddress === "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0") {
                //console.log("Wallet is not connected");
            }

            // Create PathShowViewModel concurrently with timeout
            const subrapidXPath = await this.createRapidXPathShowViewModel(rapidXPath, sourceChain, destChain, sourceToken, destToken, amount, "CHEAPEST");

            // Return bestpath if any valid paths, otherwise return null
            return subrapidXPath;

        } catch (error) {
            console.error("Error in getBestPathFromChosenChains:", error);
            throw error;
        }
    }

    async getRapidXPath(sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, fromWalletAddress: string, toWalletAddress: string, order: "FASTEST" | "CHEAPEST"): Promise<ResponseRapidXPath> {
        try {
            const requestRapidXPath = await this.createRapidXPathRequest(
                sourceChain,
                destChain,
                sourceToken,
                destToken,
                amount,
                fromWalletAddress,
                toWalletAddress,
                order
            );

            console.log("aaaaaaaaa");
            console.log(requestRapidXPath);
            //const params = this.createRapidXUrlParams(requestRapidXPath);
            const url = 'rapidquote';

            const payLoad = {
                apiType: "POST",
                apiUrl: url,
                apiData: requestRapidXPath,
                apiProvider: SwapProvider.RAPIDDEX,
            };

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(this.apiUrlENV + '/api/common', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payLoad),
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(
                    `LiFi API error: ${response.status} ${response.statusText}`
                );
            }

            const jsonResponse = await response.json();
            if (!jsonResponse?.Data) {
                throw new Error("Invalid response structure from LiFi API");
            }

            return jsonResponse.Data.Data;
        } catch (error) {

            console.error('Error in getLifiPath:', error);
            return null;


        }
    }








    async getLifiPath(sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, walletAddress: string, order: "FASTEST" | "CHEAPEST"): Promise<ResponseLifiPath> {
        try {
            const requestLifiPath = await this.createLifiPathRequest(
                sourceChain,
                destChain,
                sourceToken,
                destToken,
                amount,
                walletAddress,
                order
            );
            const params = this.createLifiUrlParams(requestLifiPath);
            const url = `quote?${params.toString()}`;

            const payLoad = {
                apiType: "GET",
                apiUrl: url,
                apiData: null,
                apiProvider: SwapProvider.LIFI,
            };

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(this.apiUrlENV + '/api/common', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payLoad),
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(
                    `LiFi API error: ${response.status} ${response.statusText}`
                );
            }

            const jsonResponse = await response.json();
            if (!jsonResponse?.Data) {
                throw new Error("Invalid response structure from LiFi API");
            }

            return jsonResponse.Data;
        } catch (error) {

            console.error('Error in getLifiPath:', error);
            return null;


        }
    }

    async getRangoPath(sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, walletAddress: string, order: "FASTEST" | "CHEAPEST"): Promise<ResponseRangoPath | null> {
        try {
            const requestRangoPath = await this.createRangoPathRequest(sourceChain, destChain, sourceToken, destToken, amount, walletAddress, order);
            const params = this.createRangoUrlParams(requestRangoPath);
            const url = `basic/swap?${params.toString()}`;

            const payLoad = {
                apiType: "GET",
                apiUrl: url,
                apiData: null,
                apiProvider: SwapProvider.RANGO
            };

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(this.apiUrlENV + '/api/common', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payLoad),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`Rango API error: ${response.status} ${response.statusText}`);
            }

            const jsonResponse = await response.json();
            if (!jsonResponse?.Data) {
                throw new Error('Invalid response structure from Rango API');
            }

            return jsonResponse.Data;
        } catch (error) {
            console.error('Error in getRangoPath:', error);
            return null;
        }
    }

    async getOwltoPath(sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, walletAddress: string, order: "FASTEST" | "CHEAPEST"): Promise<ResponseOwltoPath | null> {
        try {

            if (sourceToken.symbol == "ETH" && destToken.symbol == "ETH") {



                const requestOwltoPath = await this.createOwltoPathRequest(sourceChain, destChain, sourceToken, destToken, amount, walletAddress, order);
                const params = this.createOwltoUrlParams(requestOwltoPath);
                const url = `api/lp-info?${params.toString()}`;

                const payLoad = {
                    apiType: "GET",
                    apiUrl: url,
                    apiData: null,
                    apiProvider: SwapProvider.OWLTO
                };

                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                const response = await fetch(this.apiUrlENV + '/api/common', {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payLoad),
                    signal: controller.signal
                });

                clearTimeout(timeout);

                if (!response.ok) {
                    throw new Error(`Owlto API error: ${response.status} ${response.statusText}`);
                }

                const jsonResponse = await response.json();
                if (!jsonResponse?.Data) {
                    throw new Error('Invalid response structure from Owlto API');
                }

                return jsonResponse.Data;
            }
            else {
                return null;
            }
        } catch (error) {
            console.error('Error in getOwltoPath:', error);
            return null;
        }
    }

    async getOwltoDTC(sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, walletAddress: string, order: "FASTEST" | "CHEAPEST"): Promise<ResponseOwltoDTC | null> {
        try {
            const requestOwltoDTC = await this.createOwltoDTCRequest(sourceChain, destChain, sourceToken, destToken, amount, walletAddress, order);
            const params = this.createOwltoDTCUrlParams(requestOwltoDTC);
            const url = `api/dynamic-dtc?${params.toString()}`;

            const payLoad = {
                apiType: "GET",
                apiUrl: url,
                apiData: null,
                apiProvider: SwapProvider.OWLTO
            };

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(this.apiUrlENV + '/api/common', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payLoad),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`Owlto API error: ${response.status} ${response.statusText}`);
            }

            const jsonResponse = await response.json();
            if (!jsonResponse?.Data) {
                throw new Error('Invalid response structure from Owlto API');
            }

            return jsonResponse.Data;
        } catch (error) {
            console.error('Error in getOwltoDTC:', error);
            return null;
        }
    }

    async createRapidXPathRequest(sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, fromWalletAddress: string, toWalletAddress: string, order: "FASTEST" | "CHEAPEST"): Promise<RequestRapidXPath> {

        const requestRapidXPath = new RequestRapidXPath();
        requestRapidXPath.chainIdFrom = sourceChain.chainId;
        requestRapidXPath.chainIdTo = destChain.chainId;
        requestRapidXPath.fromToken = sourceToken.address;
        requestRapidXPath.toToken = destToken.address;
        requestRapidXPath.fromWalletAddress = fromWalletAddress;
        requestRapidXPath.toWalletAddress = toWalletAddress;
        requestRapidXPath.amountIn = (await this.utilityService.convertToDecimals(amount, sourceToken.decimal)).toString();

        return requestRapidXPath;
    }

    async createLifiPathRequest(sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, walletAddress: string, order: "FASTEST" | "CHEAPEST"): Promise<RequestLifiPath> {

        const requestLifiPath = new RequestLifiPath();
        requestLifiPath.fromChain = sourceChain.chainId.toString();
        requestLifiPath.toChain = destChain.chainId.toString();
        requestLifiPath.fromToken = sourceToken.address;
        requestLifiPath.toToken = destToken.address;
        requestLifiPath.fromAddress = walletAddress;
        requestLifiPath.toAddress = walletAddress;
        requestLifiPath.fromAmount = (await this.utilityService.convertToDecimals(amount, sourceToken.decimal)).toString();
        requestLifiPath.order = order;
        requestLifiPath.slippage = 0.005;
        requestLifiPath.integrator = "TestIntegrator";
        requestLifiPath.fee = 0.02;
        requestLifiPath.referrer = "TestReferrer";
        requestLifiPath.allowBridges = ["hop", "multichain", "connext"];
        requestLifiPath.allowExchanges = ["1inch", "paraswap", "openocean", "0x"];
        requestLifiPath.denyBridges = [];
        requestLifiPath.denyExchanges = [];
        requestLifiPath.preferBridges = ["hop"];
        requestLifiPath.preferExchanges = ["1inch"];
        requestLifiPath.allowDestinationCall = true;
        requestLifiPath.fromAmountForGas = "100000";
        requestLifiPath.maxPriceImpact = 0.15;
        return requestLifiPath;
    }

    async createRangoPathRequest(sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, walletAddress: string, order: "FASTEST" | "CHEAPEST"): Promise<RequestRangoPath> {

        const requestRangoPath = new RequestRangoPath();

        let tokenfrom = "";
        let tokento = "";

        let sourceNative = await this.utilityService.isNativeCurrency(sourceChain, sourceToken);
        let destNative = await this.utilityService.isNativeCurrency(destChain, destToken);

        if (sourceNative == true) {

            tokenfrom = sourceToken.symbol;

        }
        else {
            tokenfrom = sourceToken.symbol + "--" + sourceToken.address;
        }

        if (destNative == true) {
            tokento = destToken.symbol
        }
        else {
            tokento = destToken.symbol + "--" + destToken.address;
        }





        requestRangoPath.from = sourceChain.rangoName.toString() + "." + tokenfrom;
        requestRangoPath.to = destChain.rangoName.toString() + "." + tokento;

        requestRangoPath.amount = await this.utilityService.convertToDecimals(amount, sourceToken.decimal);
        requestRangoPath.fromAddress = walletAddress;
        requestRangoPath.toAddress = walletAddress;
        requestRangoPath.slippage = 0.5;
        requestRangoPath.disableEstimate = "true";
        return requestRangoPath;
    }

    async createOwltoPathRequest(sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, walletAddress: string, order: "FASTEST" | "CHEAPEST"): Promise<RequestOwltoPath> {
        const requestOwltoPath = new RequestOwltoPath();

        requestOwltoPath.from_chainid = sourceChain.chainId;
        requestOwltoPath.to_chainid = destChain.chainId;
        requestOwltoPath.user = "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0";

        requestOwltoPath.token = sourceToken.symbol;



        return requestOwltoPath;
    }

    async createOwltoDTCRequest(sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, walletAddress: string, order: "FASTEST" | "CHEAPEST"): Promise<RequestOwltoDTC> {
        const requestOwltoDTC = new RequestOwltoDTC();

        requestOwltoDTC.from = sourceChain.owltoName;
        requestOwltoDTC.to = destChain.owltoName;
        requestOwltoDTC.amount = amount;

        requestOwltoDTC.token = sourceToken.symbol;



        return requestOwltoDTC;
    }

    createRapidXUrlParams(requestRapidXPath: RequestRapidXPath): URLSearchParams {
        return new URLSearchParams({
            chainIdFrom: requestRapidXPath.chainIdFrom.toString(),
            chainIdTo: requestRapidXPath.chainIdTo.toString(),
            fromToken: requestRapidXPath.fromToken,
            toToken: requestRapidXPath.toToken,
            fromWalletAddress: requestRapidXPath.fromWalletAddress,
            toWalletAddress: requestRapidXPath.toWalletAddress,
            amountIn: requestRapidXPath.amountIn
        });
    }

    createLifiUrlParams(requestLifiPath: RequestLifiPath): URLSearchParams {
        return new URLSearchParams({
            fromChain: requestLifiPath.fromChain,
            toChain: requestLifiPath.toChain,
            fromToken: requestLifiPath.fromToken,
            toToken: requestLifiPath.toToken,
            fromAddress: requestLifiPath.fromAddress,
            toAddress: requestLifiPath.toAddress || requestLifiPath.fromAddress,
            fromAmount: requestLifiPath.fromAmount,
            order: requestLifiPath.order
        });
    }

    createRangoUrlParams(requestRangoPath: RequestRangoPath): URLSearchParams {
        return new URLSearchParams({
            from: requestRangoPath.from,
            to: requestRangoPath.to,
            amount: requestRangoPath.amount.toString(),
            fromAddress: requestRangoPath.fromAddress,
            toAddress: requestRangoPath.toAddress,
            slippage: requestRangoPath.slippage.toString(),
            disableEstimate: requestRangoPath.disableEstimate.toString()
        });
    }

    createOwltoUrlParams(requestOwltoPath: RequestOwltoPath): URLSearchParams {
        return new URLSearchParams({
            token: requestOwltoPath.token,
            from_chainid: requestOwltoPath.from_chainid.toString(),
            to_chainid: requestOwltoPath.to_chainid.toString(),
            user: requestOwltoPath.user

        });
    }

    createOwltoDTCUrlParams(requestOwltoDTC: RequestOwltoDTC): URLSearchParams {
        return new URLSearchParams({
            token: requestOwltoDTC.token,
            from: requestOwltoDTC.from.toString(),
            to: requestOwltoDTC.to.toString(),
            amount: requestOwltoDTC.amount.toString()

        });
    }

    async createRapidXPathShowViewModel(RapidXPath: ResponseRapidXPath, sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, orderType: string): Promise<PathShowViewModel> {
        try {
            const pathShowViewModel = new PathShowViewModel();
            pathShowViewModel.estTime = "5s";
            pathShowViewModel.relayerfeeusd = RapidXPath.data.route.sourceTransaction.feeCosts.reduce((total, fee) => total + Number(fee.amountUSD), 0) + (RapidXPath.data.route.destinationTransaction?.feeCosts.reduce((total, fee) => total + Number(fee.amountUSD), 0) ?? 0);
            pathShowViewModel.networkcostusd = RapidXPath.data.route.sourceTransaction.gasCosts.reduce((total, fee) => total + Number(fee.amountUSD), 0) + (RapidXPath.data.route.destinationTransaction?.gasCosts.reduce((total, fee) => total + Number(fee.amountUSD), 0) ?? 0);
            pathShowViewModel.gasafee = (pathShowViewModel.relayerfeeusd + pathShowViewModel.networkcostusd).toFixed(2) + "USD";
            pathShowViewModel.fromChain = sourceChain.chainName;
            pathShowViewModel.fromToken = sourceToken.symbol;
            pathShowViewModel.fromAmount = amount.toString();
            pathShowViewModel.toChain = destChain.chainName;
            pathShowViewModel.toToken = destToken.symbol;
            pathShowViewModel.toAmount = ((await this.utilityService.convertToNumber(RapidXPath.data.quote.toAmount, RapidXPath.data.quote.recevableAmoutAtDestination.token.decimal)).toFixed(5)).toString();
            pathShowViewModel.receivedAmount = (await this.utilityService.convertToNumber(RapidXPath.data.quote.toAmount, RapidXPath.data.quote.recevableAmoutAtDestination.token.decimal)).toString();
            pathShowViewModel.fromAmountUsd = (Number(RapidXPath.data.route.sourceTransaction.fromToken.amount) * RapidXPath.data.route.sourceTransaction.fromToken.price).toFixed(2);
            pathShowViewModel.toAmountUsd = Number(RapidXPath.data.quote.recevableAmoutAtDestination.amountInUSD).toFixed(2);
            pathShowViewModel.aggregator = AggregatorProvider.RAPID_DEX;
            pathShowViewModel.aggregatorOrderType = orderType;
            pathShowViewModel.approvalAddress = RapidXPath.data.transactionData.to;
            pathShowViewModel.aggergatorRequestId = RapidXPath.data.id;

            const gasPrice = BigInt(RapidXPath.data.transactionData.gasPrice);
            const gasLimit = BigInt(RapidXPath.data.transactionData.gasLimit);

            pathShowViewModel.gasafeeRequiredTransaction = (gasPrice * gasLimit).toString();
            pathShowViewModel.gasPrice = RapidXPath.data.transactionData.gasPrice;
            pathShowViewModel.gasLimit = RapidXPath.data.transactionData.gasLimit;
            pathShowViewModel.data = RapidXPath.data.transactionData.data;
            pathShowViewModel.entire = RapidXPath;
            pathShowViewModel.fromAmountWei = RapidXPath.data.quote.fromAmount;
            pathShowViewModel.isMultiChain = RapidXPath.data.isMultiChain;

            let sourceTxnData = new RapidQuoteTransactionDto();
            let destinationTxnData = new RapidQuoteTransactionDto();

            if (RapidXPath.data.isMultiChain) {
                sourceTxnData.tokenAddress = sourceToken.address;
                sourceTxnData.amountinWei = RapidXPath.data.route.sourceTransaction.fromToken.amount;
                sourceTxnData.approvalAddress = RapidXPath.data.transactionData.to;
                sourceTxnData.callData = RapidXPath.data.transactionData.data;
                sourceTxnData.isNativeToken = RapidXPath.data.route.sourceTransaction.fromToken.tokenIsNative;
                sourceTxnData.rpcUrl = sourceChain.rpcUrl[0];

                destinationTxnData.tokenAddress = destToken.address;
                destinationTxnData.amountinWei = RapidXPath.data.route.destinationTransaction.fromToken.amount;
                destinationTxnData.approvalAddress = RapidXPath.data.executorTransactionData.from;
                destinationTxnData.callData = RapidXPath.data.executorTransactionData.data;
                destinationTxnData.isNativeToken = RapidXPath.data.route.destinationTransaction.fromToken.tokenIsNative;
                destinationTxnData.rpcUrl = destChain.rpcUrl[0];
            }

            pathShowViewModel.sourceTransactionData = sourceTxnData;
            pathShowViewModel.destinationTransactionData = destinationTxnData;
            return pathShowViewModel;
        }
        catch (error) {
            return null;
        }
    }

    async createPathShowViewModel(lifiPath: ResponseLifiPath, sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, orderType: string): Promise<PathShowViewModel> {
        try {



            const pathShowViewModel = new PathShowViewModel();
            pathShowViewModel.estTime = await this.utilityService.formatDuration(lifiPath.estimate.executionDuration);


            pathShowViewModel.relayerfeeusd = lifiPath.estimate.feeCosts.reduce((total, fee) => total + Number(fee.amountUSD), 0);
            pathShowViewModel.networkcostusd = lifiPath.estimate.gasCosts.reduce((total, fee) => total + Number(fee.amountUSD), 0);
            pathShowViewModel.gasafee = (pathShowViewModel.relayerfeeusd + pathShowViewModel.networkcostusd).toFixed(2) + "USD";
            pathShowViewModel.fromChain = sourceChain.chainName;
            pathShowViewModel.fromToken = sourceToken.symbol;
            pathShowViewModel.fromAmount = amount.toString();
            pathShowViewModel.toChain = destChain.chainName;
            pathShowViewModel.toToken = destToken.symbol;
            pathShowViewModel.toAmount = ((await this.utilityService.convertToNumber(lifiPath.estimate.toAmount, lifiPath.action.toToken.decimals)).toFixed(5)).toString();
            pathShowViewModel.receivedAmount = (await this.utilityService.convertToNumber(lifiPath.estimate.toAmountMin, lifiPath.action.toToken.decimals)).toString();
            pathShowViewModel.toAmountUsd = Number(lifiPath.estimate.toAmountUSD).toFixed(2);
            pathShowViewModel.aggregator = "lifi";
            pathShowViewModel.aggregatorOrderType = orderType;
            pathShowViewModel.approvalAddress = lifiPath.estimate.approvalAddress;
            pathShowViewModel.aggergatorRequestId = lifiPath.id;


            const gasPrice = BigInt(lifiPath.transactionRequest.gasPrice);
            const gasLimit = BigInt(lifiPath.transactionRequest.gasLimit);


            pathShowViewModel.gasafeeRequiredTransaction = (gasPrice * gasLimit).toString();
            pathShowViewModel.gasPrice = lifiPath.transactionRequest.gasPrice;
            pathShowViewModel.gasLimit = lifiPath.transactionRequest.gasLimit;
            pathShowViewModel.data = lifiPath.transactionRequest.data;
            pathShowViewModel.entire = lifiPath;
            return pathShowViewModel;
        }
        catch (error) {
            return null;
        }
    }

    async createRangoPathShowViewModel(responseRangoPath: ResponseRangoPath, sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, orderType: string): Promise<PathShowViewModel> {
        try {



            const pathShowViewModel = new PathShowViewModel();
            pathShowViewModel.estTime = await this.utilityService.formatDuration(responseRangoPath.route.estimatedTimeInSeconds);
            pathShowViewModel.relayerfeeusd = Number(responseRangoPath.route.feeUsd.toFixed(2));
            pathShowViewModel.networkcostusd = 0;
            pathShowViewModel.gasafee = responseRangoPath.route.feeUsd.toFixed(2) + " USD";

            pathShowViewModel.fromChain = sourceChain.chainName;
            pathShowViewModel.fromToken = sourceToken.symbol;
            pathShowViewModel.fromAmount = amount.toString();
            pathShowViewModel.toChain = destChain.chainName;
            pathShowViewModel.toToken = destToken.symbol;
            pathShowViewModel.toAmount = ((await this.utilityService.convertToNumber(responseRangoPath.route.outputAmount.toString(), destToken.decimal)).toFixed(5)).toString();
            pathShowViewModel.receivedAmount = (await this.utilityService.convertToNumber(responseRangoPath.route.outputAmountMin.toString(), destToken.decimal)).toString();;
            pathShowViewModel.toAmountUsd = Number(responseRangoPath.route.outputAmountUsd).toFixed(2);
            pathShowViewModel.aggregator = "rango";
            pathShowViewModel.aggregatorOrderType = orderType;
            pathShowViewModel.approvalAddress = responseRangoPath.tx?.txTo;
            pathShowViewModel.aggergatorRequestId = responseRangoPath.requestId;


            const gasPrice = BigInt(responseRangoPath.tx?.gasLimit);
            const gasLimit = BigInt(responseRangoPath.tx?.gasPrice ?? responseRangoPath.tx?.maxGasPrice);

            pathShowViewModel.gasafeeRequiredTransaction = (gasPrice * gasLimit).toString();
            pathShowViewModel.gasPrice = responseRangoPath.tx?.gasPrice?.toString() ?? responseRangoPath.tx?.maxGasPrice?.toString();
            pathShowViewModel.gasLimit = responseRangoPath.tx?.gasLimit.toString();
            pathShowViewModel.data = responseRangoPath.tx?.txData;




            pathShowViewModel.entire = responseRangoPath;
            return pathShowViewModel;
        }
        catch (error) {
            return null;
        }
    }



    async createOwltoPathShowViewModel(responseOwltoPath: ResponseOwltoPath, sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, orderType: string): Promise<PathShowViewModel> {
        try {
            let amountInWei = await this.utilityService.convertEtherToWei(amount.toString());

            console.log("Converted owlto ", amountInWei);

            if (!(Number(responseOwltoPath.msg.min) < amountInWei && Number(responseOwltoPath.msg.max) > amountInWei)) {
                return null;

            }






            const pathShowViewModel = new PathShowViewModel();
            pathShowViewModel.estTime = "less than 1 min";
            let responseOwltoDTC = new ResponseOwltoDTC()
            responseOwltoDTC = await this.getOwltoDTC(sourceChain, destChain, sourceToken, destToken, amount, "", "FASTEST");
            if (!(responseOwltoDTC)) {
                return null;
            }
            let price = sourceToken.price;
            let bridgefee = await this.utilityService.convertGweiToEther(responseOwltoDTC.bridgefee);
            let gasafee = (Number(responseOwltoDTC.dtc) + Number(bridgefee)) * price;
            pathShowViewModel.gasafee = gasafee.toFixed(2) + "USD";
            pathShowViewModel.relayerfeeusd = Number(gasafee.toFixed(2));
            pathShowViewModel.networkcostusd = 0;
            pathShowViewModel.fromChain = sourceChain.chainName;
            pathShowViewModel.fromToken = sourceToken.symbol;
            pathShowViewModel.fromAmount = amount.toString();
            pathShowViewModel.toChain = destChain.chainName;
            pathShowViewModel.toToken = destToken.symbol;
            pathShowViewModel.toAmount = (amount).toString();
            pathShowViewModel.receivedAmount = (amount).toString();;
            pathShowViewModel.toAmountUsd = Number((price * amount)).toFixed(2);
            pathShowViewModel.aggregator = "Owlto";
            pathShowViewModel.aggregatorOrderType = orderType;
            pathShowViewModel.approvalAddress = responseOwltoPath.msg.maker_address;
            pathShowViewModel.aggergatorRequestId = '';
            pathShowViewModel.gasafeeRequiredTransaction = responseOwltoPath.msg.estimated_gas;
            pathShowViewModel.entire = responseOwltoPath;

            return pathShowViewModel;
        }
        catch (error) {
            return null;
        }
    }

    async TransactionStatusLIFI(txHash: string, fromChainId: number, toChainId: number) {
        let transactionStatus;
        let payLoad = {
            apiType: 'GET',
            apiUrl: `status?txHash=${txHash}&fromChain=${fromChainId}&toChain=${toChainId}`,
            apiData: null,
            apiProvider: SwapProvider.LIFI
        }
        try {
            let apiResponse = await fetch(this.apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),

            });
            const result = await apiResponse.json();
            transactionStatus = result?.Data;
        } catch (error) {
            console.log(error);
        }

        return transactionStatus;
    }

    async TransactionStatusRango(requestId: string, txhash: string, step: number) {
        let transactionStatus;
        let bodyParam =
        {
            requestId: requestId,
            txId: txhash,
            step: step
        }

        let payLoad = {
            apiType: 'POST',
            apiUrl: `tx/check-status`,
            apiData: bodyParam,
            apiProvider: SwapProvider.RANGO
        }
        try {
            let apiResponse = await fetch(this.apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),

            });
            const result = await apiResponse.json();
            transactionStatus = result?.Data;
        } catch (error) {
            console.log(error);
        }

        return transactionStatus;
    }

    async TransactionStatusOwlto(chainId: number, txhash: string) {
        let transactionStatus;

        let request = {
            from_chain_hash: txhash
        }

        let payLoad = {
            apiType: 'POST',
            apiUrl: `bridge_api/v1/get_receipt`,
            apiData: request,
            apiProvider: SwapProvider.OWLTO
        }
        try {
            let apiResponse = await fetch(this.apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),

            });
            const result = await apiResponse.json();
            transactionStatus = result?.Data;
        } catch (error) {
            console.log(error);
        }

        return transactionStatus;
    }
}