
import { Keys, SwapProvider } from "../Enum/Common.enum";
import { Chains, Tokens, DLNChainResponse, ResponseMobulaPricing, PathShowViewModel } from '../Models/Common.model';
import { RequestLifiPath, ResponseLifiPath } from "../Models/Lifi";
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

        this.SetOwltoCoins?.map((coin: any)=>{

            if(this.AvailableCoins.filter(x => x.address == coin.address).length == 0)
            {
                let obj = new Tokens();
                obj.name = coin.text;
                obj.address = coin.address;
                obj.symbol = coin.symbol;
                obj.logoURI = coin.icon;
                obj.decimal = coin.decimal;
                this.AvailableCoins.push(obj);
            }    
        })
        return this.AvailableCoins;
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
            console.log(error);
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
            this.AvailableChains = [];
            this.SetLifiChains = await this.GetLifiChains();
            //this.SetDlnChains = await this.GetDlnChains();
            this.SetRangoChains = await this.GetRangoChains();
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

            this.SetOwltoChains?.map((chain) => {
                if (this.AvailableChains.filter(x => x.chainId == chain.chainId).length == 0) {
                    let obj = new Chains();
                    obj.chainId = chain.chainId;
                    obj.chainName = chain.aliasName;
                    obj.lifiName = '';
                    obj.rangoName = '';
                    obj.logoURI = chain.icon;

                    this.AvailableChains.push(obj);
                }
            });

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

    // Getting Lifi Path FASTEST
    async GetFASTESTLifiPathFromChoosenChains(sourceChain: Chains,destChain: Chains,sourceToken: Tokens,destToken: Tokens,amount:number){

        var requestLifiPath = new RequestLifiPath();
    
        requestLifiPath.fromChain = "";
    
        var requestLifiPath = new RequestLifiPath();
    
        requestLifiPath.fromChain = sourceChain.chainId.toString();
        requestLifiPath.toChain = destChain.chainId.toString();
        requestLifiPath.fromToken = sourceToken.address;
        requestLifiPath.toToken = destToken.address;
        requestLifiPath.fromAddress = "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0";
        requestLifiPath.toAddress = "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0";
        requestLifiPath.fromAmount = (await this.utilityService.convertToDecimals(amount,sourceToken.decimal)).toString();
        requestLifiPath.order = "FASTEST";
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
    
        const params = new URLSearchParams({
          fromChain: requestLifiPath.fromChain,
          toChain: requestLifiPath.toChain,
          fromToken: requestLifiPath.fromToken,
          toToken: requestLifiPath.toToken,
          fromAddress: requestLifiPath.fromAddress,
          toAddress: requestLifiPath.toAddress || requestLifiPath.fromAddress,
          fromAmount: requestLifiPath.fromAmount,
          order:requestLifiPath.order
        });
    
        var url =  `quote?${params.toString()}`;
    
        let payLoad = {
          apiType: "GET",
          apiUrl: url,
          apiData: null,
          apiProvider: SwapProvider.LIFI
        };
    
        let data = await fetch("http://localhost:3000/api/common", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payLoad),
        });
    
        return await data.json();
    
      }

    // Getting Lifi Path CHEAPEST
    async GetCHEAPESTLifiPathFromChoosenChains(sourceChain: Chains,destChain: Chains,sourceToken: Tokens,destToken: Tokens,amount:number){

        var requestLifiPath = new RequestLifiPath();
    
        requestLifiPath.fromChain = "";
    
        var requestLifiPath = new RequestLifiPath();
    
        requestLifiPath.fromChain = sourceChain.chainId.toString();
        requestLifiPath.toChain = destChain.chainId.toString();
        requestLifiPath.fromToken = sourceToken.address;
        requestLifiPath.toToken = destToken.address;
        requestLifiPath.fromAddress = "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0";
        requestLifiPath.toAddress = "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0";
        requestLifiPath.fromAmount = (await this.utilityService.convertToDecimals(amount,sourceToken.decimal)).toString();
        requestLifiPath.order = "CHEAPEST";
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
    
        const params = new URLSearchParams({
          fromChain: requestLifiPath.fromChain,
          toChain: requestLifiPath.toChain,
          fromToken: requestLifiPath.fromToken,
          toToken: requestLifiPath.toToken,
          fromAddress: requestLifiPath.fromAddress,
          toAddress: requestLifiPath.toAddress || requestLifiPath.fromAddress,
          fromAmount: requestLifiPath.fromAmount,
          order:requestLifiPath.order
        });
    
        var url =  `quote?${params.toString()}`;
    
        let payLoad = {
          apiType: "GET",
          apiUrl: url,
          apiData: null,
          apiProvider: SwapProvider.LIFI
        };
        
        let data = await fetch("http://localhost:3000/api/common", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payLoad),
        });
    
        return await data.json();
    }

    // Getting Quotes
    async GetBestPathFromChoosenChains(sourceChain: Chains,destChain: Chains,sourceToken: Tokens,destToken: Tokens,amount:number) {
      try {
          //let TokenData = await this.GetTokenData(sourceToken);
          let pathShow: PathShowViewModel[] = [];
          //Lifi Path FASTEST
          {
              let lifiPath: ResponseLifiPath = (await this.GetFASTESTLifiPathFromChoosenChains(sourceChain, destChain, sourceToken, destToken, amount)).Data;
              let pathShowViewModel: PathShowViewModel = new PathShowViewModel();
              pathShowViewModel.estTime = (await this.utilityService.formatDuration(lifiPath.estimate.executionDuration)).toString();

              let gasafee = 0;
              lifiPath.estimate.feeCosts.forEach((de) => {

                  gasafee = Number(de.amountUSD) + gasafee;

              });

              pathShowViewModel.gasafee = gasafee.toString() + " USD";
              pathShowViewModel.fromChain = sourceChain.chainName;
              pathShowViewModel.fromToken = sourceToken.symbol;
              pathShowViewModel.fromAmount = amount.toString();
              pathShowViewModel.toChain = destChain.chainName;
              pathShowViewModel.toToken = destToken.symbol;
              pathShowViewModel.toAmount = (await this.utilityService.convertToNumber(lifiPath.estimate.toAmount, lifiPath.action.toToken.decimals)).toString();
              pathShowViewModel.receivedAmount = (await this.utilityService.convertToNumber(lifiPath.estimate.toAmountMin, lifiPath.action.toToken.decimals)).toString();
              pathShowViewModel.aggregator = "lifi";
              pathShowViewModel.aggregatorOrderType = "FASTEST"
              pathShow.push(pathShowViewModel);
          }

          //Lifi Path CHEAPEST
          {
              let lifiPath: ResponseLifiPath = (await this.GetCHEAPESTLifiPathFromChoosenChains(sourceChain, destChain, sourceToken, destToken, amount)).Data;
              let pathShowViewModel: PathShowViewModel = new PathShowViewModel();
              pathShowViewModel.estTime = (await this.utilityService.formatDuration(lifiPath.estimate.executionDuration)).toString();

              let gasafee = 0;
              lifiPath.estimate.feeCosts.forEach((de) => {

                  gasafee = Number(de.amountUSD) + gasafee;

              });

              pathShowViewModel.gasafee = gasafee.toString() + " USD";
              pathShowViewModel.fromChain = sourceChain.chainName;
              pathShowViewModel.fromToken = sourceToken.symbol;
              pathShowViewModel.fromAmount = amount.toString();
              pathShowViewModel.toChain = destChain.chainName;
              pathShowViewModel.toToken = destToken.symbol;
              pathShowViewModel.toAmount = (await this.utilityService.convertToNumber(lifiPath.estimate.toAmount, lifiPath.action.toToken.decimals)).toString();
              pathShowViewModel.receivedAmount = (await this.utilityService.convertToNumber(lifiPath.estimate.toAmountMin, lifiPath.action.toToken.decimals)).toString();
              pathShowViewModel.aggregator = "lifi";
              pathShowViewModel.aggregatorOrderType = "CHEAPEST"
              pathShow.push(pathShowViewModel);
          }
          return pathShow;
      }
      catch (error) {
          console.log(error);
      }
    }
    
}