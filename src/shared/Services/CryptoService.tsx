
import { useSelector } from "react-redux";
import { AggregatorProvider, Keys, SwapProvider } from "../Enum/Common.enum";
import { Chains, Tokens, DLNChainResponse, ResponseMobulaPricing, PathShowViewModel, RapidQuoteTransactionDto, AISuggestedRouteParams, BestPathFromGPTOss } from '../Models/Common.model';
import { RequestLifiPath, ResponseLifiPath } from "../Models/Lifi";
import { RequestOwltoDTC, RequestOwltoPath, ResponseOwltoDTC, ResponseOwltoPath } from "../Models/Owlto";
import { RequestRangoPath, ResponseRangoPath } from "../Models/Rango";
import { SharedService } from "./SharedService";
import { UtilityService } from "./UtilityService";
import { RequestRapidXPath, ResponseRapidXPath } from "../Models/RapidX";
import { CommonConfig } from "../Const/Common.const";
import { json } from "stream/consumers";
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

    apiUrlENV: string = process.env.NEXT_PUBLIC_NODE_API_URL;
    private readonly MOBULA_API_KEY = "4ee7370b-89e7-4d74-8b87-38355f2fb37d";

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

    async GetTokenData(token: Tokens) {
        let amountUSD = 0;
        let TokenData: ResponseMobulaPricing;
        let query = token.address == '0x0000000000000000000000000000000000000000' ? 'symbol=' + token.symbol : 'asset=' + token.address;
        let payLoad = {
            apiType: 'GET',
            apiUrl: `market/data?${query}`,
            apiData: null,
            apiProvider: SwapProvider.MOBULA,
        }
        try {
            let tokenExec = await fetch(this.apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Authorization': this.MOBULA_API_KEY || '',
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
        sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, walletAddress: string, isAIMode: boolean) {
        try {

            // Assign default wallet address if not provided
            if (this.utilityService.isNullOrEmpty(walletAddress)) {
                walletAddress = "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0";
            }

            // Set a 6-second timeout for each API call (reduced from 100 seconds)
            const apiTimeout = 6000; // 6 seconds

            const withTimeout = (promise: Promise<any>, ms: number, apiName: string) => {
                return Promise.race([
                    promise,
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error(`${apiName} API timed out after ${ms} ms`)), ms)
                    ),
                ]);
            };

            // Fetch paths concurrently with timeout - using Promise.allSettled instead of Promise.all
            // This ensures that if one API fails/times out, others can still complete
            const results = await Promise.allSettled([
                withTimeout(this.getRapidXPath(sourceChain, destChain, sourceToken, destToken, amount, walletAddress, walletAddress, "CHEAPEST"), apiTimeout, 'RapidX'),
                withTimeout(this.getLifiPath(sourceChain, destChain, sourceToken, destToken, amount, walletAddress, "FASTEST"), apiTimeout, 'Lifi (Fastest)'),
                withTimeout(this.getLifiPath(sourceChain, destChain, sourceToken, destToken, amount, walletAddress, "CHEAPEST"), apiTimeout, 'Lifi (Cheapest)'),
                withTimeout(this.getRangoPath(sourceChain, destChain, sourceToken, destToken, amount, walletAddress, "CHEAPEST"), apiTimeout, 'Rango'),
                withTimeout(this.getOwltoPath(sourceChain, destChain, sourceToken, destToken, amount, walletAddress, "CHEAPEST"), apiTimeout, 'Owlto'),
            ]);

            // Extract successful results, log failed ones
            const [rapidXResult, fastestResult, cheapestResult, rangoResult, owltoResult] = results;

            const rapidXPath = rapidXResult.status === 'fulfilled' ? rapidXResult.value : null;
            const fastestPath = fastestResult.status === 'fulfilled' ? fastestResult.value : null;
            const cheapestPath = cheapestResult.status === 'fulfilled' ? cheapestResult.value : null;
            const rangoPath = rangoResult.status === 'fulfilled' ? rangoResult.value : null;
            const owltoPath = owltoResult.status === 'fulfilled' ? owltoResult.value : null;

            // Log failed API calls (optional)
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const apiNames = ['RapidX', 'Lifi (Fastest)', 'Lifi (Cheapest)', 'Rango', 'Owlto'];
                    console.warn(`${apiNames[index]} failed:`, result.reason.message);
                }
            });

            // Log message if the default wallet address is used
            if (walletAddress === "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0") {
                //console.log("Wallet is not connected");
            }

            // Create PathShowViewModel concurrently - also use Promise.allSettled here
            const viewModelResults = await Promise.allSettled([
                rapidXPath ? this.createRapidXPathShowViewModel(rapidXPath, sourceChain, destChain, sourceToken, destToken, amount, "CHEAPEST") : Promise.resolve(null),
                fastestPath ? this.createPathShowViewModel(fastestPath, sourceChain, destChain, sourceToken, destToken, amount, "FASTEST") : Promise.resolve(null),
                cheapestPath ? this.createPathShowViewModel(cheapestPath, sourceChain, destChain, sourceToken, destToken, amount, "CHEAPEST") : Promise.resolve(null),
                rangoPath ? this.createRangoPathShowViewModel(rangoPath, sourceChain, destChain, sourceToken, destToken, amount, "Rango") : Promise.resolve(null),
                owltoPath ? this.createOwltoPathShowViewModel(owltoPath, sourceChain, destChain, sourceToken, destToken, amount, "Owlto") : Promise.resolve(null)
            ]);

            // Extract successful view models
            const viewModels = viewModelResults
                .filter((result): result is PromiseFulfilledResult<PathShowViewModel> =>
                    result.status === 'fulfilled' && result.value !== null)
                .map(result => result.value);

            // Return successful paths
            if(isAIMode){
                return viewModels.length > 0 ? await this.AISuggestedPath(viewModels) : [];
            }else
            {
                return viewModels;
            }


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

            // console.log("aaaaaaaaa");
            // console.log(requestRapidXPath);
            //const params = this.createRapidXUrlParams(requestRapidXPath);
            const url = 'rapidquote';

            const payLoad = {
                apiType: "POST",
                apiUrl: url,
                apiData: requestRapidXPath,
                apiProvider: SwapProvider.RAPIDDEX,
            };

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 5 second timeout

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
            disableEstimate: requestRangoPath.disableEstimate
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
                sourceTxnData.rpcUrl = await this.utilityService.setupProviderForChain(sourceChain.chainId, sourceChain.rpcUrl);
                sourceTxnData.contractAddress = RapidXPath.data.transactionData.to;

                destinationTxnData.tokenAddress = destToken.address;
                destinationTxnData.amountinWei = RapidXPath.data.route.destinationTransaction.fromToken.amount;
                destinationTxnData.approvalAddress = RapidXPath.data.executorTransactionData.from;
                destinationTxnData.callData = RapidXPath.data.executorTransactionData.data;
                destinationTxnData.isNativeToken = RapidXPath.data.route.destinationTransaction.fromToken.tokenIsNative;
                destinationTxnData.rpcUrl = await this.utilityService.setupProviderForChain(destChain.chainId, destChain.rpcUrl);
                destinationTxnData.contractAddress = RapidXPath.data.executorTransactionData.from;
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
            pathShowViewModel.isMultiChain = false;
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


            const gasPrice = BigInt(responseRangoPath.tx?.gasPrice ?? responseRangoPath?.tx?.maxGasPrice);
            const gasLimit = BigInt(responseRangoPath.tx?.gasLimit);

            pathShowViewModel.gasafeeRequiredTransaction = (gasPrice * gasLimit).toString();
            pathShowViewModel.gasPrice = gasPrice.toString();
            pathShowViewModel.gasLimit = responseRangoPath.tx?.gasLimit.toString();
            pathShowViewModel.data = responseRangoPath.tx?.txData;




            pathShowViewModel.entire = responseRangoPath;
            pathShowViewModel.isMultiChain = false;
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
            pathShowViewModel.isMultiChain = false;

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

    async GetAllAvailableCoinsRapidX(chain: Chains) {
        let allAvailableCoins = [];
        let payLoad = {
            apiType: 'POST',
            apiUrl: 'getallcoinsbychain',
            apiData: chain,
            apiProvider: SwapProvider.RAPIDDEX
        }
        try {
            let LIFIChainResult = await fetch(this.apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),
            });
            const AllCoins = await LIFIChainResult.json();
            allAvailableCoins = (AllCoins && AllCoins?.Data) ? AllCoins?.Data?.Data : [];
        } catch (error) {
            console.log(error);
        }
        return allAvailableCoins;
    }

    async GetAllAvailableChainsRapidX() {
        let allAvailableChains = [];
        let payLoad = {
            apiType: 'GET',
            apiUrl: 'getavailablechains',
            apiData: null,
            apiProvider: SwapProvider.RAPIDDEX
        }
        try {
            let LIFIChainResult = await fetch(this.apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),
            });
            const AllChains = await LIFIChainResult.json();
            allAvailableChains = (AllChains && AllChains?.Data) ? AllChains?.Data?.Data : [];
        } catch (error) {
            console.log(error);
        }
        return allAvailableChains;
    }

    async AISuggestedPath(result: PathShowViewModel[]) {
        let sortedRoutes: PathShowViewModel[] = [];

        const inputParam = result.map((res, index) => {
            return {
                pathId: index + 1, // index starts from 0, so +1 for human-friendly numbering
                aggregator: res.aggregator,
                gasafee: res.gasafee,
                estTime: res.estTime,
                toAmountUsd: res.toAmountUsd
            } as AISuggestedRouteParams;
        });

        const data = await this.getAISuggestedRoutes(inputParam);

        if (data && data.length > 0) {

            for (let i = 0; i < data.length; i++) {

                let object = {
                    ...result[i],
                    pathId : i +1,
                    suggestedPath: data[i].suggestedPath,
                    declaration: data[i].declaration
                } as PathShowViewModel;

                sortedRoutes.push(object);
            }
            sortedRoutes.sort((a, b) => a.suggestedPath - b.suggestedPath);
            sortedRoutes.forEach((item)=>{
                console.log('path id '+ item.pathId, 'suggested id'+ item.suggestedPath, 'dec :'+item.declaration)
            })
        } else {
            sortedRoutes = result.map((res, index) => ({
                ...res,              // copy all existing properties
                pathId: index + 1    // add or overwrite pathId
            }));
        }
        return sortedRoutes;
    }
    
      async getAISuggestedRoutes(messages): Promise<BestPathFromGPTOss[]> {
    
        let apiConfig = CommonConfig[SwapProvider.RAPIDDEX];
        let response : BestPathFromGPTOss[]= [];
        
        try {
          const res = await fetch(apiConfig?.apiUrl + "aisuggestedroutes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(messages)
          });
    
          if (res.status == 200) {
            const apiResponse = await res.json();
            response = (apiResponse && apiResponse.Data?.length > 0) ? apiResponse.Data : [];
          }
        }
        catch {
          console.log("error while fetching data from groq");
        }
        return response;
      }
    
}