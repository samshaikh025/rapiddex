
import { Keys, SwapProvider } from "../Enum/Common.enum";
import { Chains, Tokens, DLNChainResponse, ResponseMobulaPricing, PathShowViewModel } from '../Models/Common.model';
import { RequestLifiPath, ResponseLifiPath } from "../Models/Lifi";
import { RequestOwltoPath, ResponseOwltoPath } from "../Models/Owlto";
import { RequestRangoPath, ResponseRangoPath } from "../Models/Rango";
import { SharedService } from "./SharedService";
import { UtilityService } from "./UtilityService";
export class CryptoService {
    
    AvailableChains : Chains[] = [];
    SetLifiChains : any[] = [];
    SetDlnChains : DLNChainResponse[] = [];
    SetRangoChains : any[] = [];
    SetOwltoChains : any[] = [];
    AvailableCoins: Tokens[] = [];
    SetLifiCoins: any[] = [];
    SetDlnCoins: any[] = [];
    SetRangoCoins: any[] = [];
    SetOwltoCoins: any[] = [];
    SharedService = new SharedService();
    constructor(){
    }
    utilityService =new UtilityService();

    async GetAvailableTokens(selectedChain: Chains)
    {
        this.SetLifiCoins = [];
        //this.SetDlnCoins = [];
        this.SetRangoCoins  = [];
        this.SetOwltoCoins = [];
        this.AvailableCoins = [];
        this.SetLifiCoins = await this.GetCoinsForLifi(selectedChain);
        //this.SetDlnCoins = await this.GetCoinsForDln(selectedChain.chainId);
        this.SetRangoCoins  = await this.GetCoinsForRango(selectedChain);
        this.SetOwltoCoins = await this.GetCoinsForOwlto(selectedChain);
        this.SetLifiCoins?.map((coin: any)=>{
            let obj = new Tokens();
            obj.name = coin.name;
            obj.address = coin.address;
            obj.symbol = coin.symbol;
            obj.logoURI = coin.logoURI;
            obj.decimal = coin.decimals;
            this.AvailableCoins.push(obj);
        })

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

        this.SetRangoCoins?.map((coin: any)=>{

            if(this.AvailableCoins.filter(x => x.address == coin.address).length == 0)
            {
                let obj = new Tokens();
                obj.name = coin.name;
                obj.address = coin.address;
                obj.symbol = coin.symbol;
                obj.logoURI = coin.image;
                obj.decimal = coin.decimal;
                this.AvailableCoins.push(obj);
            }    
        })

        debugger;

        if(this.SetOwltoChains != undefined && this.SetOwltoChains.length >0)
        {

        

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
        chainList?.map((chain)=>{
            let index = this.AvailableChains.findIndex(x => x.chainId == chain.chainId);
            if(index > -1){
                this.AvailableChains[index].rpcUrl = chain.rpc;
            }
        });

        return this.AvailableCoins;
    }

    async getAvailableChainList(){
        let ChainListAPIResponseData = [];
        try{
            let ChainListAPIResponse = await fetch('https://chainid.network/chains.json');
            ChainListAPIResponseData = await ChainListAPIResponse.json();
            //let data = await this.SharedService.setIndexDbItem(Keys.All_LIFI_COINS, lifiCoins);
        }catch(error){
            console.log(error);
        }
        return ChainListAPIResponseData;
    }

    async GetCoinsForLifi(chain: Chains)
    {
        let lifiCoins = [];
        let payLoad = {
            apiType : 'GET',
            apiUrl : `tokens?chains=${chain.lifiName}`,
            apiData : null,
            apiProvider: SwapProvider.LIFI
        }
        try{
            let LIFICoinResult = await fetch('http://localhost:3000/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),
    
            });
            const LIFICoinData = await LIFICoinResult.json();
            lifiCoins = LIFICoinData?.Data?.tokens[chain.chainId];
            //let data = await this.SharedService.setIndexDbItem(Keys.All_LIFI_COINS, lifiCoins);
        }catch(error){
            console.log(error);
        }
        return lifiCoins; 
    }

    async GetCoinsForDln(id: number)
    {
        let dlnCoins: any[] = [];
        let dlnId = 0;
        let dlnChains: DLNChainResponse[] = await this.SharedService.getIndexDbItem(Keys.All_DLN_CHAINS);
        if(dlnChains && dlnChains?.length > 0){
            dlnId = dlnChains.find(x => x.originalChainId == id)?.chainId;
        }
        try{
            let payLoad = {
                apiType : 'GET',
                apiUrl : `https://api.dln.trade/v1.0/token-list?chainId=${dlnId}`,
                apiData : null
            }
            let DlnCoinResult = await fetch('http://localhost:3000/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),
    
            });
            const DLnCoinData = await DlnCoinResult.json();
            let keys = Object.keys(DLnCoinData.Data.tokens);
            keys.map((index)=>{
                dlnCoins.push(DLnCoinData.Data.tokens[index])
            })
        }catch(error){
            console.log(error);
        }
        
        return dlnCoins; 
    }

    async GetCoinsForRango(chain: Chains)
    {
        let rangoCoins = [];
        //let checkLifiCoins = await this.SharedService.getIndexDbItem(Keys.All_LIFI_COINS);
        let payLoad = {
            apiType : 'GET',
            apiUrl : `basic/meta?blockchains=${chain.rangoName}`,
            apiData : null,
            apiProvider: SwapProvider.RANGO
        }
        try{
            let RangoCoinResult = await fetch('http://localhost:3000/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),
    
            });
            const RangoCoinData = await RangoCoinResult.json();
            rangoCoins = RangoCoinData?.Data?.tokens;
            //let data = await this.SharedService.setIndexDbItem(Keys.All_LIFI_COINS, lifiCoins);
        }catch(error){
            console.log(chain.rangoName,error);
        }
        
        return rangoCoins; 
    }

    async GetCoinsForOwlto(chain: Chains)
    {
        let owltCoins = [];
        let payLoad = {
            apiType : 'GET',
            apiUrl : `config/all-tokens`,
            apiData : null,
            apiProvider: SwapProvider.OWLTO
        }
        try{
            let LIFICoinResult = await fetch('http://localhost:3000/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),
    
            });
            const OwltoCoinData = await LIFICoinResult.json();
            owltCoins = OwltoCoinData?.Data?.msg?.filter((x)=> x.chainId == chain.chainId);
            //let data = await this.SharedService.setIndexDbItem(Keys.All_OWLTO_COINS, owltCoins);
        }catch(error){
            console.log(error);
        }
        
        return owltCoins; 
    }
    
    async GetAvailableChains()
    {
        debugger;
            this.AvailableChains = [];
            this.SetLifiChains = await this.GetLifiChains();
            //this.SetDlnChains = await this.GetDlnChains();
            this.SetRangoChains = await this.GetRangoChains();
            debugger
            this.SetOwltoChains = await this.GetOwltoChains();

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
                }else if(includeLength == 1){
                    let index = this.AvailableChains?.findIndex(x => x.chainId == parseInt(chain.chainId));
                    this.AvailableChains[index].rangoName = chain.name;
                }
            });

            if(this.SetOwltoChains != undefined && this.SetOwltoChains.length > 0)
            {
                debugger;

            

            // this.SetOwltoChains?.map((chain) => {
            //     if (this.AvailableChains.filter(x => x.chainId == chain.chainId).length == 0) {
            //         let obj = new Chains();
            //         obj.chainId = chain.chainId;
            //         obj.chainName = chain.aliasName;
            //         obj.lifiName = '';
            //         obj.rangoName = '';
            //         obj.logoURI = chain.icon;
                    

            //         this.AvailableChains.push(obj);
            //     }
            // });
        }

            //let res = await this.SharedService.setIndexDbItem(Keys.All_AVAILABLE_CHAINS, this.AvailableChains)
            return this.AvailableChains;
    }

    async GetLifiChains()
    {
        let lifiChains = [];
        let payLoad = {
            apiType : 'GET',
            apiUrl : 'chains',
            apiData : null,
            apiProvider: SwapProvider.LIFI
        }
        try{
            let LIFIChainResult = await fetch('http://localhost:3000/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),
            });
            const LIFIChainData = await LIFIChainResult.json();
            lifiChains = LIFIChainData.Data?.chains; 
        }catch(error)
        {
            console.log(error);
        }
        return lifiChains;
    }

    async GetDlnChains()
    {
        let dlnChains = [];
        let payLoad = {
            apiType : 'GET',
            apiUrl : 'https://api.dln.trade/v1.0/supported-chains-info',
            apiData : null
        }
        try{
            let DlnChainResult = await fetch('http://localhost:3000/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),
    
            });
            const DlnChainData = await DlnChainResult.json();
            dlnChains = DlnChainData.Data?.chains;
            let res = this.SharedService.setIndexDbItem(Keys.All_DLN_CHAINS, dlnChains); 
        }catch(error)
        {
            console.log(error);
        }
        return dlnChains;
    }

    async GetRangoChains()
    {
        let rangoChains = [];
        let payLoad = {
            apiType : 'GET',
            apiUrl : 'basic/meta',
            apiData : null,
            apiProvider: SwapProvider.RANGO
        }
        try{
            let RangoChainResult = await fetch('http://localhost:3000/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),
    
            });
            const RangoChainData = await RangoChainResult.json();
            rangoChains = RangoChainData.Data.blockchains.filter((x:any)=> x.type == 'EVM'); 
        }catch(error)
        {
            console.log(error);
        }
        
        return rangoChains;
    }

    async GetOwltoChains()
    {
        let owltoChains = [];
        let payLoad = {
            apiType : 'GET',
            apiUrl : 'config/all-chains',
            apiData : null,
            apiProvider: SwapProvider.OWLTO
        }
        try{
            let OwltoChainResult = await fetch('http://localhost:3000/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad)
            });
            const OwltoChainData = await OwltoChainResult.json();
            owltoChains = OwltoChainData.Data.msg;
        }catch(error)
        {
            console.log(error);
        }
        
        return owltoChains;
    }

    async GetTokenData(token: Tokens)
    {
        let amountUSD = 0;
        let TokenData : ResponseMobulaPricing;
        let query = token.address == '0x0000000000000000000000000000000000000000' ? 'symbol='+ token.symbol : 'asset='+ token.address;
        let payLoad = {
            apiType : 'GET',
            apiUrl : `market/data?${query}`,
            apiData : null,
            apiProvider: SwapProvider.MOBULA
        }
        try{
            let tokenExec = await fetch('http://localhost:3000/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),
    
            });
            const TokenResponse = await tokenExec.json();
            
            TokenData  = TokenResponse?.Data;
        }catch(error){
            console.log(error);
        }
        
        return TokenData;
    }

    async getBestPathFromChosenChains(sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number) {
        try {
          const [fastestPath, cheapestPath,rangoPath] = await Promise.all([
            this.getLifiPath(sourceChain, destChain, sourceToken, destToken, amount, "FASTEST"),
            this.getLifiPath(sourceChain, destChain, sourceToken, destToken, amount, "CHEAPEST"),
            this.getRangoPath(sourceChain, destChain, sourceToken, destToken, amount, "CHEAPEST")
          ]);

          let urls = sourceChain.rpcUrl;

          const reorderedUrls = [
            ...urls.filter(url => url.includes('publicnode')), // Publicnode URLs first
            ...urls.filter(url => !url.includes('publicnode')) // Other URLs after
          ];

          // Example usage:
          const balance = await this.getFirstBalanceWithAbort(sourceToken.address, "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",reorderedUrls);
          console.log("Final balance:", balance);


                
          

          
         

         
          

         
           
          

          
    
          return [
            await this.createPathShowViewModel(fastestPath, sourceChain, destChain, sourceToken, destToken, amount, "FASTEST"),
            await this.createPathShowViewModel(cheapestPath, sourceChain, destChain, sourceToken, destToken, amount, "CHEAPEST"),
            await this.createRangoPathShowViewModel(rangoPath,sourceChain,destChain,sourceToken,destToken,amount,"Rango")
          ];
        } catch (error) {
          console.error("Error in getBestPathFromChosenChains:", error);
          throw error;
        }
      }

      async  fetchWithAbort(url, signal) {
        const response = await fetch(url, { signal });
        return response.json();
    }
    
    async  getFirstBalanceWithAbort(sourceTokenAddress, userAddress,reorderedUrls) {
        const controller = new AbortController();
        const { signal } = controller;
    
        const balancePromises = reorderedUrls.map(rpcUrl =>
            this.fetchWithAbort(rpcUrl, signal)
                .then(response => {
                    // Process balance with ethers.js logic here
                    // If balance is found, abort the other requests
                    controller.abort();
                    return 'balance found'; // Replace with actual balance logic
                })
                .catch(error => {
                    if (error.name === 'AbortError') {
                        console.log(`Request aborted for ${rpcUrl}`);
                    } else {
                        console.error(`Error fetching balance from ${rpcUrl}:`, error);
                    }
                    return '0'; // Return '0' if there's an error
                })
        );
    
        try {
            const firstBalance = await Promise.race(balancePromises);
            return firstBalance;
        } catch (error) {
            console.error("Error during balance retrieval:", error);
            return '0';
        }
    }
    

      async  getFirstBalance(sourceTokenAddress, userAddress,reorderedUrls) {
        const rpcPromises = reorderedUrls.map(rpcUrl => 
            this.utilityService.getBalance(sourceTokenAddress, userAddress, rpcUrl)
            .then(balance => {
                if (balance) {
                    return { balance, rpcUrl }; // Return balance with the URL if found
                }
                throw new Error('No balance found'); // Explicitly reject if no balance found
            })
            .catch(error => {
                console.error(`Error fetching balance from ${rpcUrl}:`, error);
                return null; // Return null for errors to avoid Promise.race halting on first error
            })
        );
    
        // Wait for the first successful balance
        const result = await Promise.any(rpcPromises);
        if (result && result.balance) {
            console.log(`Balance found: ${result.balance} using ${result.rpcUrl}`);
            return result.balance;
        }
    
        console.error("Failed to fetch balance from all provided URLs.");
        return null;
    }
      
    
       async getLifiPath(sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, order: "FASTEST" | "CHEAPEST"): Promise<ResponseLifiPath> {
        const requestLifiPath = await this.createLifiPathRequest(sourceChain, destChain, sourceToken, destToken, amount, order);
        const params = this.createLifiUrlParams(requestLifiPath);
        const url = `quote?${params.toString()}`;
    
        const payLoad = {
          apiType: "GET",
          apiUrl: url,
          apiData: null,
          apiProvider: SwapProvider.LIFI
        };
    
        const response = await fetch("http://localhost:3000/api/common", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payLoad),
        });
    
        const jsonResponse = await response.json();
        return jsonResponse.Data;
      }

      async getRangoPath(sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, order: "FASTEST" | "CHEAPEST"): Promise<ResponseRangoPath> {
        const requestRangoPath = await this.createRangoPathRequest(sourceChain, destChain, sourceToken, destToken, amount, order);
        const params = this.createRangoUrlParams(requestRangoPath);
        const url = `basic/quote?${params.toString()}`;
    
        const payLoad = {
          apiType: "GET",
          apiUrl: url,
          apiData: null,
          apiProvider: SwapProvider.RANGO
        };
    
        const response = await fetch("http://localhost:3000/api/common", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payLoad),
        });
    
        const jsonResponse = await response.json();
        return jsonResponse.Data;
      }
    
       async createLifiPathRequest(sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, order: "FASTEST" | "CHEAPEST"): Promise<RequestLifiPath> {
        const requestLifiPath = new RequestLifiPath();
        requestLifiPath.fromChain = sourceChain.chainId.toString();
        requestLifiPath.toChain = destChain.chainId.toString();
        requestLifiPath.fromToken = sourceToken.address;
        requestLifiPath.toToken = destToken.address;
        requestLifiPath.fromAddress = "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0";
        requestLifiPath.toAddress = "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0";
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

      async createRangoPathRequest(sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, order: "FASTEST" | "CHEAPEST"): Promise<RequestRangoPath> {
        
        const requestRangoPath = new RequestRangoPath();

        let tokenfrom = "";
        let tokento="";
          
        let sourceNative=await this.utilityService.checkCoinNative(sourceChain,sourceToken);
        let destNative=await this.utilityService.checkCoinNative(destChain,destToken);

        if(sourceNative == true)
        {

            tokenfrom = sourceToken.symbol;

        }
        else
        {
            tokenfrom = +sourceToken.symbol+"--"+sourceToken.address;
        }

        if(destNative == true)
        {
            tokento = destToken.symbol
        }
        else
        {
            tokento = destToken.symbol+"--"+destToken.address;
        }




        
        requestRangoPath.from = sourceChain.rangoName.toString()+"."+tokenfrom;
        requestRangoPath.to = destChain.rangoName.toString()+"."+tokento;
        
        requestRangoPath.amount = Number(await this.utilityService.convertToDecimals(amount, sourceToken.decimal));
        
        return requestRangoPath;
      }

      async createOwltoPathRequest(sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, order: "FASTEST" | "CHEAPEST"): Promise<RequestOwltoPath> {
        const requestOwltoPath = new RequestOwltoPath();

        requestOwltoPath.from_chainid=sourceChain.chainId;
        requestOwltoPath.to_chainid=destChain.chainId;
        requestOwltoPath.user="0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0";
        
        requestOwltoPath.token=sourceToken.symbol;


        
        return requestOwltoPath;
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
          from:requestRangoPath.from,
          to:requestRangoPath.to,
          amount:requestRangoPath.amount.toString()
        });
      }

      createOwltoUrlParams(requestRangoPath: RequestOwltoPath): URLSearchParams {
        return new URLSearchParams({
            token:requestRangoPath.token,
            from_chainid:requestRangoPath.from_chainid.toString(),
            to_chainid:requestRangoPath.to_chainid.toString(),
            user:requestRangoPath.user

        });
      }
    
       async createPathShowViewModel(lifiPath: ResponseLifiPath, sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, orderType: string): Promise<PathShowViewModel> {
        const pathShowViewModel = new PathShowViewModel();
        pathShowViewModel.estTime = await this.utilityService.formatDuration(lifiPath.estimate.executionDuration);
        pathShowViewModel.gasafee = lifiPath.estimate.feeCosts.reduce((total, fee) => total + Number(fee.amountUSD), 0).toFixed(2) + " USD";
        pathShowViewModel.fromChain = sourceChain.chainName;
        pathShowViewModel.fromToken = sourceToken.symbol;
        pathShowViewModel.fromAmount = amount.toString();
        pathShowViewModel.toChain = destChain.chainName;
        pathShowViewModel.toToken = destToken.symbol;
        pathShowViewModel.toAmount = (await this.utilityService.convertToNumber(lifiPath.estimate.toAmount, lifiPath.action.toToken.decimals)).toString();
        pathShowViewModel.receivedAmount = (await this.utilityService.convertToNumber(lifiPath.estimate.toAmountMin, lifiPath.action.toToken.decimals)).toString();
        pathShowViewModel.aggregator = "lifi";
        pathShowViewModel.aggregatorOrderType = orderType;
        return pathShowViewModel;
      }

      async createRangoPathShowViewModel(responseRangoPath: ResponseRangoPath, sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, orderType: string): Promise<PathShowViewModel> {
        const pathShowViewModel = new PathShowViewModel();
        pathShowViewModel.estTime = await this.utilityService.formatDuration(responseRangoPath.route.estimatedTimeInSeconds);
        pathShowViewModel.gasafee = responseRangoPath.route.feeUsd + " USD";
        pathShowViewModel.fromChain = sourceChain.chainName;
        pathShowViewModel.fromToken = sourceToken.symbol;
        pathShowViewModel.fromAmount = amount.toString();
        pathShowViewModel.toChain = destChain.chainName;
        pathShowViewModel.toToken = destToken.symbol;
        pathShowViewModel.toAmount = (await this.utilityService.convertToNumber(responseRangoPath.route.outputAmount.toString(), destToken.decimal)).toString();
        pathShowViewModel.receivedAmount = (await this.utilityService.convertToNumber(responseRangoPath.route.outputAmountMin.toString(), destToken.decimal)).toString();;
        pathShowViewModel.aggregator = "rango";
        pathShowViewModel.aggregatorOrderType = orderType;
        return pathShowViewModel;
      }
    


      async createOwltoPathShowViewModel(responseOwltoPath: ResponseOwltoPath, sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, amount: number, orderType: string): Promise<PathShowViewModel> {
        const pathShowViewModel = new PathShowViewModel();
        pathShowViewModel.estTime = "less than 1 min";
        pathShowViewModel.gasafee = (Number(responseOwltoPath.msg.dtc) + Number(amount) * Number(responseOwltoPath.msg.bridge_fee_ratio) ) + " " + sourceToken.symbol;
        pathShowViewModel.fromChain = sourceChain.chainName;
        pathShowViewModel.fromToken = sourceToken.symbol;
        pathShowViewModel.fromAmount = amount.toString();
        pathShowViewModel.toChain = destChain.chainName;
        pathShowViewModel.toToken = destToken.symbol;
        pathShowViewModel.toAmount = (amount).toString();
        pathShowViewModel.receivedAmount = (amount).toString();;
        pathShowViewModel.aggregator = "Owlto";
        pathShowViewModel.aggregatorOrderType = orderType;
        return pathShowViewModel;
      }

}