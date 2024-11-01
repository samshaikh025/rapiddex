import { SwapProvider } from "../Enum/Common.enum";
import { OperationResult, TransactionRequestoDto } from "../Models/Common.model";



export class TransactionService {
    async AddTransactionLog(input: TransactionRequestoDto){
        let loggedResult = new OperationResult();
        let payLoad = {
            apiType : 'POST',
            apiUrl : 'Crypto/AddTransaction',
            apiData : input,
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



