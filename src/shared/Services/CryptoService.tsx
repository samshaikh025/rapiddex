
import { Keys } from "../Enum/Common.enum";
import { Chains, Tokens, DLNChainResponse } from '../Models/Common.model';
import { SharedService } from "./SharedService";
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

    async GetAvailableTokens(selectedChain: Chains)
    {
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

                this.AvailableCoins.push(obj);
            }    
        })

        console.log('Lifi Coins :' + this.SetLifiCoins?.length 
            + ' DlnCoins :' + this.SetDlnCoins?.length +
            + ' RangoCoins :' + this.SetRangoChains?.length +
             ' AvailableCoins: ' + this.AvailableCoins?.length)
        return this.AvailableCoins;
    }

    async GetCoinsForLifi(chain: Chains)
    {
        let lifiCoins = [];
        let payLoad = {
            apiType : 'GET',
            apiUrl : `https://li.quest/v1/tokens?chains=${chain.lifiName}`,
            apiData : null
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
            apiUrl : `https://api.rango.exchange/basic/meta?apiKey=c6381a79-2817-4602-83bf-6a641a409e32&blockchains=${chain.rangoName}`,
            apiData : null
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
            apiUrl : `https://owlto.finance/api/config/all-tokens`,
            apiData : null
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

    async GetLifiCoinFromIndexDB(id:number)
    {
        let lifiCoins = [];
        let data = await this.SharedService.getIndexDbItem(Keys.All_LIFI_COINS);
        try{
            lifiCoins = data[id];
        }catch(error){
            console.log(error);
        }

        return lifiCoins;
    }
    
    async GetOwltoCoinFromIndexDB(id:number)
    {
        let owltoCoins = [];
        let data = await this.SharedService.getIndexDbItem(Keys.All_OWLTO_COINS);
        try{
            if(data.length > 0)
            {
                owltoCoins = data.filter((x: any) => x.chainId == id);
            }
        }catch(error){
            console.log(error);
        }

        return owltoCoins;
    }

    async GetAvailableChains()
    {
        //let chains = await this.SharedService.getIndexDbItem(Keys.All_AVAILABLE_CHAINS);
        let chains;
        if(chains)
        {
            return chains;
        }else
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
    }

    async GetLifiChains()
    {
        let lifiChains = [];
        let payLoad = {
            apiType : 'GET',
            apiUrl : 'https://li.quest/v1/chains',
            apiData : null
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
            apiUrl : 'https://api.rango.exchange/basic/meta?apiKey=c6381a79-2817-4602-83bf-6a641a409e32',
            apiData : null
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
            //let rangoCoins = await this.GetAndStoreAllRangoCoins(RangoChainData.Data.tokens,rangoChains);
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
            apiUrl : 'https://owlto.finance/api/config/all-chains',
            apiData : null
        }
        try{
            let OwltoChainResult = await fetch('http://localhost:3000/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),
    
            });
            const OwltoChainData = await OwltoChainResult.json();
            owltoChains = OwltoChainData.Data.msg;
        }catch(error)
        {
            console.log(error);
        }
        
        return owltoChains;
    }

    async GetAndStoreAllRangoCoins(rangoAllCoins: any, rangoAvailableChains: any){
        let allRangoCoins: any[] = [];
        try{
            rangoAvailableChains.map((chain:any)=> {
                let allCoinsForChain = rangoAllCoins.filter((x: any)=> x.chainId == parseInt(chain.chainId));
                allRangoCoins = [...allRangoCoins, ...allCoinsForChain];
            });
            await this.SharedService.setIndexDbItem(Keys.All_RANGO_COINS, allRangoCoins);
        }catch(error){
            console.log(error);
        }
        
    }

    async GetTokenValue(token: Tokens)
    {
        let amountUSD = 0;
        let query = token.address == '0x0000000000000000000000000000000000000000' ? 'symbol='+ token.symbol : 'asset='+ token.address;
        let payLoad = {
            apiType : 'GET',
            apiUrl : `https://api.mobula.io/api/1/market/data?${query}`,
            apiData : null
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
            amountUSD = TokenResponse?.Data?.data?.price;
        }catch(error){
            console.log(error);
        }
        
        return amountUSD; 
    }
}