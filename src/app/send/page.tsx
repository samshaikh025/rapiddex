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
  let paymentDetails : PaymentLinkDto = searchParams['quoteId'] == '' ?  new PaymentLinkDto() : await transactionService.GetPaymentDetailByQuoteId(searchParams['quoteId']);
  console.log("payment dtail :", paymentDetails);
  let paymentRequest = new GetPaymentRequest();

  if (paymentDetails?.url != '') {
    paymentRequest.amountIn = paymentDetails.amountIn;
    paymentRequest.chainIdTo = paymentDetails.chainIdTo;
    paymentRequest.toToken = paymentDetails.toToken;
    paymentRequest.toTokenJSon = paymentDetails.toTokenJSon;
    paymentRequest.toChainJSon = paymentDetails.toChainJSon;
    paymentRequest.toWalletAddress = paymentDetails.toWalletAddress;
  }
  
  return (
    <>
      <SendUI chains={JSON.parse(JSON.stringify(chains))} transactionRequest={JSON.parse(JSON.stringify(paymentRequest))} ></SendUI>
    </>
  );
}
