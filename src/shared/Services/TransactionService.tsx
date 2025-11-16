import { promises } from "dns";
import { AggregatorProvider, SwapProvider, TransactionStatus, TransactionSubStatus } from "../Enum/Common.enum";
import { Chains, GetSignPayload, HasSufficientBalanceResponse, InsertTransactionRequestoDto, OperationResult, PathShowViewModel, RapidQuoteTransactionDto, SignatureResponseRapid, Tokens, TransactionHistoryPayload, TransactionRequestoDto, UpdateTransactionRequestoDto, WalletConnectData, ZkProofPayload, ZkProofResponse } from "../Models/Common.model";
import { PaymentLinkDto } from "../Models/PaymentDetailsByQuote";
import { Chain, formatUnits, parseEther } from "viem";
import { UtilityService } from "./UtilityService";
import * as definedChains from "wagmi/chains";
import { CryptoService } from "./CryptoService";
let apiUrlENV: string = process.env.NEXT_PUBLIC_NODE_API_URL;


export class TransactionService {

    utilityService = new UtilityService();
    cryptoService = new CryptoService();
    getAllChains(): Chain[] {
        return Object.values(definedChains).filter((chain) => chain.id !== undefined) as Chain[];
    };

    // Get all chains
    allChains = this.getAllChains();

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

    async GetTransactionTxnHistory(input: TransactionHistoryPayload) {
        let response = [];
        let payLoad = {
            apiType: 'GET',
            apiUrl: 'Crypto/GetTransaction',
            apiData: null,
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
                response = data?.Data?.data;
            }
        } catch (error) {
            console.log(error);
        }

        return response;
    }

    async GetZkProofForTransaction(input: ZkProofPayload) {
        let response = new ZkProofResponse();
        let payLoad = {
            apiType: 'POST',
            apiUrl: 'generatezkproof',
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
                response = data?.Data?.Data;
            }
        } catch (error) {
            console.log(error);
        }

        return response;
    }

    async GetPaymentDetailByQuoteId(quoteId: string): Promise<PaymentLinkDto> {
        let response: PaymentLinkDto;
        let payLoad = {
            apiType: 'GET',
            apiUrl: 'Checkout/' + quoteId,
            apiData: null,
            apiProvider: SwapProvider.DOTNETPAYMENTAPI
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
                response = data?.Data;
            }
        } catch (error) {
            console.log(error);
        }

        return response;
    }

    async HasSufficientSourceBalance(sourceChain: Chains, sourceToken: Tokens, checkSourceTokenIsNativeCoin:boolean,walletAddress: string, workingRpc: string, sendAmount: number): Promise<HasSufficientBalanceResponse> {

        let sourceTokenbal = await this.utilityService.getBalanceIne(checkSourceTokenIsNativeCoin, sourceToken, walletAddress, workingRpc);

        if (Number(sourceTokenbal) < Number(sendAmount)) {
            return {
                status: false,
                message: `Insufficient balance. Available: ${this.formatBalance(Number(sourceTokenbal))} ${sourceToken.symbol}. Required: ${this.formatBalance(sendAmount)} ${sourceToken.symbol}.`,
                tokenBalance: sourceTokenbal
            } as HasSufficientBalanceResponse;
        } else {
            return {
                status: true,
                message: `Sufficient balance`,
                tokenBalance: sourceTokenbal
            } as HasSufficientBalanceResponse;
        }
    }

    formatBalance(value: number): string {
        if (value === 0) return '0';
        if (value < 0.0001) return '< 0.0001';
        if (value < 1) return value.toFixed(6);
        if (value < 1000) return value.toFixed(4);
        return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
    }

    async HasSufficientGasBalance(sourceChain: Chains, sourceToken: Tokens, checkSourceTokenIsNativeCoin:boolean, sourceTokenbalance: string, walletAddress: string, workingRpc: string, selectedPath: PathShowViewModel, sendAmount: number): Promise<HasSufficientBalanceResponse> {
        let totalGasCost = 0;
        let totalGasCostNative = 0;

        let payableGasChain = this.allChains.find(a => a.id == sourceChain.chainId);
        let payableGasToken = new Tokens();

        if (payableGasChain.nativeCurrency.symbol == "ETH" || payableGasChain.nativeCurrency.symbol == "BNB") {
            payableGasToken.address = "0x0000000000000000000000000000000000000000";
        }

        payableGasToken.symbol = payableGasChain.nativeCurrency.symbol;
        payableGasToken.decimal = payableGasChain.nativeCurrency.decimals;
        payableGasToken.name = payableGasChain.nativeCurrency.name;

        let currentNativeBalance = checkSourceTokenIsNativeCoin ? sourceTokenbalance : await this.utilityService.getBalanceIne(true, payableGasToken, walletAddress, workingRpc);

        let payableprice = (await this.cryptoService.getTokenAllInformation(payableGasToken)).price;

        let gasafeeRequiredTransactionEther = formatUnits(BigInt(selectedPath.gasafeeRequiredTransaction), payableGasToken.decimal)

        let payablewalletfee = Number(gasafeeRequiredTransactionEther) * payableprice;

        totalGasCost = selectedPath.networkcostusd + selectedPath.relayerfeeusd + payablewalletfee;

        totalGasCostNative = totalGasCost / payableprice;

        //let currentBalance = Number(balance);

        let totalNativeBalanceRequired = checkSourceTokenIsNativeCoin ? totalGasCostNative + sendAmount : totalGasCostNative;

        if (Number(currentNativeBalance) < totalNativeBalanceRequired) {
            return {
                status: false,
                message: `Insufficient gas balance. Available: ${this.formatBalance(Number(currentNativeBalance))} ${payableGasToken.symbol}. Required: ${this.formatBalance(totalNativeBalanceRequired)} ${payableGasToken.symbol}.`,
                tokenBalance: currentNativeBalance
            } as HasSufficientBalanceResponse;
        }
        else {
            return {
                status: true,
                message: `Sufficient gas balance.`,
                tokenBalance: currentNativeBalance
            } as HasSufficientBalanceResponse;
        }
    }

    GetTransactionRequest(selectedPath: PathShowViewModel, sendAmount:number, equAmountUSD: number, walletAddress: string, sourceChain: Chains, destChain: Chains, sourceToken: Tokens, destToken: Tokens, isNativeCurrency: boolean) : TransactionRequestoDto{
        
        let sendAmt = '';
        let sendAmtUsdc = '0';

        if (selectedPath.aggregator == AggregatorProvider.RAPID_DEX && !selectedPath.isMultiChain) {
            sendAmt = selectedPath.fromAmountWei;
            sendAmtUsdc = selectedPath.fromAmountUsd;
        } else if (selectedPath.aggregator != AggregatorProvider.RAPID_DEX) {
            let wei = parseEther(sendAmount.toString());
            sendAmt = String(wei);
            sendAmtUsdc = String(equAmountUSD);
        }

        let transactoinObj = new TransactionRequestoDto();
        transactoinObj.transactionId = 0;
        transactoinObj.transactionGuid = '';
        transactoinObj.walletAddress = walletAddress;
        transactoinObj.amount = sendAmt;
        transactoinObj.amountUsd = sendAmtUsdc;
        transactoinObj.amountInEther = sendAmount.toString();//value in ether
        transactoinObj.approvalAddress = selectedPath.aggregator == AggregatorProvider.RAPID_DEX && selectedPath.isMultiChain == true ? '' : selectedPath.approvalAddress;
        transactoinObj.transactionHash = '';
        transactoinObj.transactionStatus = TransactionStatus.ALLOWANCSTATE;
        transactoinObj.transactionSubStatus = 0;
        transactoinObj.quoteDetail = JSON.stringify(selectedPath.entire);
        transactoinObj.sourceChainId = sourceChain.chainId;
        transactoinObj.sourceChainName = sourceChain.chainName;
        transactoinObj.sourceChainLogoUri = sourceChain.logoURI;
        transactoinObj.destinationChainId = destChain.chainId;
        transactoinObj.destinationChainName = destChain.chainName;
        transactoinObj.destinationChainLogoUri = destChain.logoURI;
        transactoinObj.sourceTokenName = sourceToken.name;
        transactoinObj.sourceTokenAddress = sourceToken.address;
        transactoinObj.sourceTokenSymbol = sourceToken.symbol;
        transactoinObj.sourceTokenLogoUri = sourceToken.logoURI
        transactoinObj.destinationTokenName = destToken.name;
        transactoinObj.destinationTokenAddress = destToken.address;
        transactoinObj.destinationTokenSymbol = destToken.symbol;
        transactoinObj.destinationTokenLogoUri = destToken.logoURI;
        transactoinObj.isNativeToken = isNativeCurrency;
        transactoinObj.transactiionAggregator = selectedPath.aggregator;
        transactoinObj.transactionAggregatorRequestId = selectedPath.aggergatorRequestId;
        transactoinObj.transactionAggregatorGasLimit = selectedPath.gasLimit;
        transactoinObj.transactionAggregatorGasPrice = selectedPath.gasPrice;
        transactoinObj.transactionAggregatorRequestData = selectedPath.data;
        transactoinObj.isMultiChain = selectedPath.isMultiChain;
        transactoinObj.sourceTransactionData = selectedPath.sourceTransactionData;
        transactoinObj.destinationTransactionData = selectedPath.destinationTransactionData;
        transactoinObj.transactionSourceHash = '';
        transactoinObj.transactionSourceStatus = TransactionStatus.ALLOWANCSTATE;
        transactoinObj.transactionSourceSubStatus = 0;

        return transactoinObj;
    }
}



