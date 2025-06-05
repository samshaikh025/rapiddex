import { SwapProvider, TransactionSubStatus } from "../Enum/Common.enum";
import { GetSignPayload, InsertTransactionRequestoDto, OperationResult, RapidQuoteTransactionDto, SignatureResponseRapid, TransactionRequestoDto, UpdateTransactionRequestoDto } from "../Models/Common.model";
let apiUrlENV: string = process.env.NEXT_PUBLIC_NODE_API_URL;


export class TransactionService {
    async AddTransactionLog(input: InsertTransactionRequestoDto) {
        let loggedResult = new OperationResult();
        let payLoad = {
            apiType: 'POST',
            apiUrl: 'Crypto/AddTransaction',
            apiData: input,
            apiProvider: SwapProvider.DOTNET
        }
        try {
            let apiResult = await fetch(apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),

            });
            if (apiResult.status == 200) {
                let data = await apiResult.json();
                loggedResult = data?.Data;
            }
        } catch (error) {
            console.log(error);
        }

        return loggedResult;
    }

    async UpdateTransactionLog(input: UpdateTransactionRequestoDto) {
        let loggedResult = new OperationResult();
        let payLoad = {
            apiType: 'POST',
            apiUrl: 'Crypto/UpdateTransactionStatus',
            apiData: input,
            apiProvider: SwapProvider.DOTNET
        }
        try {
            let apiResult = await fetch(apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),

            });
            if (apiResult.status == 200) {
                let data = await apiResult.json();
                loggedResult = data?.Data;
            }
        } catch (error) {
            console.log(error);
        }

        return loggedResult;
    }

    async GetTransactionStatusRapidDex(input: GetSignPayload) {
        let status = null;
        let payLoad = {
            apiType: 'POST',
            apiUrl: 'rapidtxnstatus',
            apiData: input,
            apiProvider: SwapProvider.RAPIDDEX
        }
        try {
            let apiResult = await fetch(apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),

            });
            if (apiResult.status == 200) {
                let data = await apiResult.json();
                status = data?.Data?.Data;
            }
        } catch (error) {
            console.log(error);
        }

        return status == null ? TransactionSubStatus.PENDING : (status == 1 ? TransactionSubStatus.DONE : TransactionSubStatus.FAILED);
    }

    async GetSignatureForTransaction(input: GetSignPayload) {
        let status = new SignatureResponseRapid();
        let payLoad = {
            apiType: 'POST',
            apiUrl: 'rapidsign',
            apiData: input,
            apiProvider: SwapProvider.RAPIDDEX
        }
        try {
            let apiResult = await fetch(apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),

            });
            if (apiResult.status == 200) {
                let data = await apiResult.json();
                status = data?.Data?.Data;
            }
        } catch (error) {
            console.log(error);
        }

        return status;
    }

    async ExecuteDestinationTransaction(input: RapidQuoteTransactionDto) {
        let txnHash;
        let payLoad = {
            apiType: 'POST',
            apiUrl: 'rapidexecutetxn',
            apiData: input,
            apiProvider: SwapProvider.RAPIDDEX
        }
        try {
            let apiResult = await fetch(apiUrlENV + '/api/common', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),

            });
            if (apiResult.status == 200) {
                let data = await apiResult.json();
                txnHash = data?.Data?.Data;
            }
        } catch (error) {
            console.log(error);
        }

        return txnHash;
    }
}



