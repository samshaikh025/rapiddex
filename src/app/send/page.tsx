import SendUI from "@/shared/Component/send-ui/page";
import { GetPaymentRequest } from "@/shared/Models/Common.model";
import { PaymentLinkDto } from "@/shared/Models/PaymentDetailsByQuote";
import { CryptoService } from "@/shared/Services/CryptoService";
import { TransactionService } from "@/shared/Services/TransactionService";

export default async function Send({searchParams} : any) {

  let cryptoService = new CryptoService();
  let transactionService = new TransactionService();
  let chains = await cryptoService.GetAllAvailableChainsRapidX();
  console.log('quote:',searchParams['quoteId'])
  //let paymentDetails : PaymentLinkDto = searchParams['quoteId'] == '' ?  new PaymentLinkDto() : await transactionService.GetPaymentDetailByQuoteId(searchParams['quoteId']);
  //console.log("payment dtail :", paymentDetails);
  let paymentRequest = new GetPaymentRequest();

  // if (paymentDetails?.url != '') {
  //   paymentRequest.amountIn = paymentDetails.amountIn;
  //   paymentRequest.chainIdTo = paymentDetails.chainIdTo;
  //   paymentRequest.toToken = paymentDetails.toToken;
  //   paymentRequest.toTokenJSon = paymentDetails.toTokenJSon;
  //   paymentRequest.toChainJSon = paymentDetails.toChainJSon;
  //   paymentRequest.toWalletAddress = paymentDetails.toWalletAddress;
  // }

  let DestinationChain = {
    "chainId": 42161,
    "chainName": "Arbitrum",
    "lifiName": "arb",
    "rangoName": "ARBITRUM",
    "owltoName": "ArbitrumOneMainnet",
    "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/arbitrum.svg",
    "rpcUrl": [
      "https://arbitrum-mainnet.infura.io/v3/187e3c93df364840824e3274e58e402c",
      "https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}",
      "https://arb1.arbitrum.io/rpc",
      "https://arbitrum-one-rpc.publicnode.com",
      "wss://arbitrum-one-rpc.publicnode.com"
    ]
  }

  let DestinationToken = {
    "address": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    "symbol": "USDC",
    "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
    "name": "USD Coin",
    "decimal": 6,
    "price": 1.0004001600640255,
    "chainId": 42161,
    "tokenIsNative": false,
    "tokenIsStable": false,
    "amount": ""
  };

   paymentRequest.amountIn = 1;
   paymentRequest.chainIdTo = 42161;
   paymentRequest.toToken = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
   paymentRequest.toTokenJSon = JSON.stringify(DestinationToken);
   paymentRequest.toChainJSon = JSON.stringify(DestinationChain);
   paymentRequest.toWalletAddress = '0xa5f4BA19305fbA92B9FE86a452c0d98F5D95f2D0';

  return (
    <>
      <SendUI chains={JSON.parse(JSON.stringify(chains))} transactionRequest={JSON.parse(JSON.stringify(paymentRequest))} ></SendUI>
    </>
  );
}
