import SendUI from "@/shared/Component/send-ui/page";
import { GetPaymentRequest } from "@/shared/Models/Common.model";
import { CryptoService } from "@/shared/Services/CryptoService";
import 'react-loading-skeleton/dist/skeleton.css';

export default async function Send() {

  let cryptoService = new CryptoService();
  let chains = await cryptoService.GetAvailableChains();
  let paymentRequest = new GetPaymentRequest();
  paymentRequest.amountIn = 1;
  paymentRequest.chainIdTo = 42161;
  paymentRequest.toToken = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
  paymentRequest.toTokenJSon = '{"address":"0xaf88d065e77c8cC2239327C5EDb3A432268e5831","symbol":"USDC","logoURI":"https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png","name":"USD Coin","decimal":6,"price":1.0004001600640255,"chainId":42161,"tokenIsNative":false,"tokenIsStable":false,"amount":""}';
  paymentRequest.toChainJSon = '{"chainId":42161,"chainName":"Arbitrum","lifiName":"arb","rangoName":"ARBITRUM","owltoName":"ArbitrumOneMainnet","logoURI":"https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/arbitrum.svg","rpcUrl":["https://arbitrum-mainnet.infura.io/v3/187e3c93df364840824e3274e58e402c","https://arb1.arbitrum.io/rpc","https://arbitrum-one-rpc.publicnode.com","wss://arbitrum-one-rpc.publicnode.com"]}';
  paymentRequest.toWalletAddress = '0xA6f0B82965c17b34276acFeaE26D3DDDB48D0d23';
  return (
    <>
      <SendUI chains={JSON.parse(JSON.stringify(chains))} transactionRequest={JSON.parse(JSON.stringify(paymentRequest))} ></SendUI>
    </>
  );
}
