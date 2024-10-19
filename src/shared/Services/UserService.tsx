import { walletConnect } from "wagmi/connectors";
import { SwapProvider } from "../Enum/Common.enum";
import { LoggedParams, OperationResult, WalletConnectData } from "../Models/Common.model";

export class UserService {
    async AddLog(input: WalletConnectData){
        let loggedResult = new OperationResult();
        let param = new LoggedParams();
        param.WalletAddress = input.address;
        param.WalletProvider = input.providerName;
        param.ChainId = input.chainId;
        param.ChainName = input.chainName;
        param.LoggedDate = new Date().toISOString().split('T')[0];
        param.LoggedTime = new Date().toISOString().substring(11, 19);
        //let checkLifiCoins = await this.SharedService.getIndexDbItem(Keys.All_LIFI_COINS);
        let payLoad = {
            apiType : 'POST',
            apiUrl : 'User/AddLog',
            apiData : param,
            apiProvider: SwapProvider.DOTNET
        }
        try{
            let apiResult = await fetch('http://localhost:3000/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),
    
            });
            if(apiResult.status == 200){
                let data = await apiResult.json();
                loggedResult = data?.Data;
            }
        }catch(error){
            console.log(error);
        }
        
        return loggedResult; 
    }
}