"use client"
import { OpenWalletModalA, SetActiveTransactionA } from "@/app/redux-store/action/action-redux";
import BridgeView from "@/app/swap/components/bridge-view/page";
import Chainui from "@/app/swap/components/chainui/page";
import Tokenui from "@/app/swap/components/tokenui/page";
import { AggregatorProvider, DataSource, Keys, TransactionStatus } from "@/shared/Enum/Common.enum";
import { BridgeMessage, Chains, GetPaymentRequest, PathShowViewModel, Tokens, TransactionRequestoDto } from "@/shared/Models/Common.model";
import { CryptoService } from "@/shared/Services/CryptoService";
import { SharedService } from "@/shared/Services/SharedService";
import { UtilityService } from "@/shared/Services/UtilityService";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatUnits, parseEther } from "viem";
import { useSwitchChain } from "wagmi";
import { Chain } from "wagmi/chains";
import * as definedChains from "wagmi/chains";

type propsType = {
  chains: Chains[],
  transactionRequest: GetPaymentRequest
}

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
export default function SendUI(props: propsType) {

  let utilityService = new UtilityService();
  let cryptoService = new CryptoService();
  let sharedService = SharedService.getSharedServiceInstance();

  let dataSource = DataSource.From;
  let [isShowChainUi, setIsShowChainUi] = useState<boolean>(false);
  let [isShowTokenUi, setIsShowTokenUi] = useState<boolean>(false);
  let [pathShowSpinner, setPathShowSpinner] = useState<boolean>(false);

  let [pathShowRetry, setPathShowRetry] = useState<boolean>(false);


  let [sourceChain, setSourceChain] = useState<Chains>(new Chains());
  let [destiationChain, setDestinationChain] = useState<Chains>();

  let [sourceToken, setSourceToken] = useState<Tokens>(new Tokens());
  let [destiationToken, setDestinationToken] = useState<Tokens>();

  let [sendAmount, setSendAmount] = useState<number>(0);
  let [sendAmountUSDC, setSendAmountUSDC] = useState<number>(0);

  let walletData = useSelector((state: any) => state.WalletData);
  let walletDisconnected: boolean = useSelector((state: any) => state.WalletDisconnected);

  let [selectedPath, setSelectedPath] = useState<PathShowViewModel>(new PathShowViewModel());
  let [startBridging, setStartBridging] = useState<boolean>(false);

  let dispatch = useDispatch();

  let [isBridgeMessage, setIsBridgeMessage] = useState<string>('');
  let bridgeMessage: BridgeMessage = new BridgeMessage();




  const {
    switchChain,
    error,
    isPending,
    isSuccess,
    reset,
    data,
    failureCount,
    failureReason,
  } = useSwitchChain();

  const getAllChains = (): Chain[] => {
    return Object.values(definedChains).filter((chain) => chain.id !== undefined) as Chain[];
  };

  // Get all chains
  const allChains = getAllChains();

  // Ensure there's at least one chain
  if (allChains.length === 0) {
    throw new Error("No chains available");
  }

  // Type assertion to tuple
  const chainsTuple = [allChains[0], ...allChains.slice(1)] as const;

  function openChainUi() {
    setIsShowChainUi(true);
  }

  function openTokenUi() {
    setIsShowTokenUi(true);
  }

  function closeChainUi(chain: Chains) {
    (sourceChain && chain && sourceChain.chainId != chain.chainId) ? setSourceToken(new Tokens()) : null;
    setSourceChain(chain);
    setIsShowChainUi(false);
  }

  async function closeTokenUi(sourceTokenData: Tokens) {
    debugger;
    if (sourceChain && sourceToken.address != sourceTokenData.address) {
      setSourceToken(sourceTokenData);
      fetchPriceOfTokens(sourceTokenData, destiationToken);
    }
    setIsShowTokenUi(false);

    console.log('chauin, ', sourceChain, 'token,', sourceTokenData)
  }

  async function initPayment() {
    if (!utilityService.isNullOrEmpty(walletData.address)) {

      let workingRpc = await utilityService.setupProviderForChain(sourceChain.chainId, sourceChain.rpcUrl);

      if (workingRpc != undefined && workingRpc != null) {
        console.log(error);
        if (walletData.chainId != sourceChain.chainId) {
          console.log("Need switch chain");
          try {
            await switchChain({ chainId: sourceChain.chainId }) // Call switchChain with only chainId
            console.log("Chain Switched")
          }
          catch (error) {
            console.log("rejected switch chain");
          }
        }
        else {
          console.log("No Need to switch chain")
        }

        let checkNativeCoin = await utilityService.checkCoinNative(sourceChain, sourceToken);
        // check balance
        let balance = await utilityService.getBalanceIne(checkNativeCoin, sourceToken, walletData.address, workingRpc);

        if (Number(balance) < Number(sendAmount)) {
          bridgeMessage.message = "You don't have enough " + sourceToken.symbol + " to complete the transaction.";
          setIsBridgeMessage(bridgeMessage.message);
          return false;
        }
        else {
          if (await isGasEnough(balance)) {
            await prepareTransactionRequest();
          }
          else {
            return false;
          }
        }
      }
    }
  }

  async function isGasEnough(balance: string) {

    let totalGasCost = 0;
    let totalGasCostNative = 0;

    let payableGasChain = allChains.find(a => a.id == sourceChain.chainId);
    let payableGasToken = new Tokens();

    if (payableGasChain.nativeCurrency.symbol == "ETH" || payableGasChain.nativeCurrency.symbol == "BNB") {
      payableGasToken.address = "0x0000000000000000000000000000000000000000";
    }

    payableGasToken.symbol = payableGasChain.nativeCurrency.symbol;
    payableGasToken.decimal = payableGasChain.nativeCurrency.decimals;
    payableGasToken.name = payableGasChain.nativeCurrency.name;

    let payableprice = (await cryptoService.GetTokenData(payableGasToken)).data.price;

    let gasafeeRequiredTransactionEther = formatUnits(BigInt(selectedPath.gasafeeRequiredTransaction), payableGasToken.decimal)

    let payablewalletfee = Number(gasafeeRequiredTransactionEther) * payableprice;

    totalGasCost = selectedPath.networkcostusd + selectedPath.relayerfeeusd + payablewalletfee;

    totalGasCostNative = totalGasCost / payableprice;

    let currentBalance = Number(balance);

    let totalBalanceGas = totalGasCostNative + sendAmount;

    if (currentBalance < totalBalanceGas) {
      bridgeMessage.message = "You don't have enough Gas to Complete this transaction. You required atleast " + totalGasCostNative + "  " + payableGasToken.symbol;
      setIsBridgeMessage(bridgeMessage.message);
      return false;
    }
    else {
      bridgeMessage.message = "";
      setIsBridgeMessage("");
      return true;
    }
  }

  async function prepareTransactionRequest() {

    let sendAmount = (selectedPath.aggregator == AggregatorProvider.RAPID_DEX && !selectedPath.isMultiChain) ? selectedPath.fromAmountWei : '';
    let sendAmountUsdc = (selectedPath.aggregator == AggregatorProvider.RAPID_DEX && !selectedPath.isMultiChain) ? selectedPath.fromAmountUsd : '';

    let transactoinObj = new TransactionRequestoDto();
    transactoinObj.transactionId = 0;
    transactoinObj.transactionGuid = '';
    transactoinObj.walletAddress = walletData.address;
    transactoinObj.amount = sendAmount;
    transactoinObj.amountUsd = sendAmountUsdc;
    transactoinObj.approvalAddress = selectedPath.aggregator == AggregatorProvider.RAPID_DEX && selectedPath.isMultiChain == true ? '' : selectedPath.approvalAddress;
    transactoinObj.transactionHash = '';
    transactoinObj.transactionStatus = TransactionStatus.ALLOWANCSTATE;
    transactoinObj.transactionSubStatus = 0;
    transactoinObj.quoteDetail = JSON.stringify(selectedPath.entire);
    transactoinObj.sourceChainId = sourceChain.chainId;
    transactoinObj.sourceChainName = sourceChain.chainName;
    transactoinObj.sourceChainLogoUri = sourceChain.logoURI;
    transactoinObj.destinationChainId = destiationChain.chainId;
    transactoinObj.destinationChainName = destiationChain.chainName;
    transactoinObj.destinationChainLogoUri = destiationChain.logoURI;
    transactoinObj.sourceTokenName = sourceToken.name;
    transactoinObj.sourceTokenAddress = sourceToken.address;
    transactoinObj.sourceTokenSymbol = sourceToken.symbol;
    transactoinObj.sourceTokenLogoUri = sourceToken.logoURI
    transactoinObj.destinationTokenName = destiationToken.name;
    transactoinObj.destinationTokenAddress = destiationToken.address;
    transactoinObj.destinationTokenSymbol = destiationToken.symbol;
    transactoinObj.destinationTokenLogoUri = destiationToken.logoURI;
    transactoinObj.isNativeToken = await utilityService.isNativeCurrency(sourceChain, sourceToken);
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

    //store active transaction in local storage and use when realod page
    sharedService.setData(Keys.ACTIVE_TRANASCTION_DATA, transactoinObj);

    dispatch(SetActiveTransactionA(transactoinObj));
    //addTransactionLog(transactoinObj);
    setStartBridging(true);
    //getAllowance();
  }

  useEffect(() => {
    if (walletDisconnected) {

    }
  }, [walletDisconnected])

  useEffect(() => {
    if (walletData.isReconnected == false && sourceChain && sourceToken.address) {
      fetchQuoteFromRapidx(sourceToken, sendAmount, sendAmountUSDC);
    }
  }, [walletData.isReconnected]);

  useEffect(() => {
    setDestinationChain(JSON.parse(props.transactionRequest.toChainJSon));
    setDestinationToken(JSON.parse(props.transactionRequest.toTokenJSon));
    setSendAmount(props.transactionRequest.amountIn);
  }, []);

  async function setDestinationData() {

  }

  function fetchQuoteFromRapidx(sourceToken: Tokens, sendAmount: number, sendAmountUSDC: number) {

    if (!isNaN(sendAmount) && sendAmount > 0) {
      // props.isPathLoadingParent(true);
      setPathShowSpinner(true);
      setPathShowRetry(false);
      // setIsShowPathShowTimer(false);

      // if (pathReloadIntervalId.current != null) {
      //   clearInterval(pathReloadIntervalId.current);
      //   pathReloadIntervalId.current = null;
      // }
      try {
        let walletAddress = !utilityService.isNullOrEmpty(walletData.address) ? walletData.address : '';
        //pathShowInvokedForAmount.current = props.Amountpathshow;

        // if ((sendAmountUSDC < 0.95)) {
        //   throw new Error();
        // }
        cryptoService.getBestPathFromChosenChainsRapidX(
          sourceChain,
          destiationChain,
          sourceToken,
          destiationToken,
          sendAmount,
          walletAddress,
          props.transactionRequest.toWalletAddress
        ).then((result) => {
          if (result) {
            console.log("Path from rapid dex", result);
            setSelectedPath(result);
            setPathShowSpinner(false);
            setPathShowRetry(false);
            //result = result.slice(0,2);

            // props.sendInitData(result);
            // setCurrentSelectedPath(result[0]);
            // setAvailablePaths(result);
            // setPathShowSpinner(false);
            // props.isPathLoadingParent(false);
            // setIsShowPathShowTimer(true);
            // //call time out for realod path
            // invokeTimeOutForReloadPath();
          } else {
            setPathShowSpinner(false);
            setPathShowRetry(true);
          }
          // else if (result && result.length == 0 && props.Amountpathshow == pathShowInvokedForAmount.current) {
          //   props.sendInitData([]);
          //   //setCurrentSelectedPath(new PathShowViewModel());
          //   //setAvailablePaths([]);
          //   setPathShowSpinner(false);
          //   props.isPathLoadingParent(false);
          //   //setIsShowPathShowTimer(true);
          // }
        }).catch((error) => {
          // props.sendInitData([]);
          setPathShowSpinner(false);
          setPathShowRetry(true);
          // bridgeMessage.message = "No path found";
          // props.isPathLoadingParent(false);
        })
      } catch (error) {
        // props.sendInitData([]);
        setPathShowSpinner(false);
        setPathShowRetry(true);
        // props.isPathLoadingParent(false);
        // console.error('Error fetching path data:', error);
      }
    }
  };

  // useEffect(()=>{
  //   if(sourceChain && sourceChain.chainId != null && sourceToken && sourceToken.address != null){
  //     fetchSourceTokenPrice(sourceToken);
  //   }
  // }, [sourceChain, sourceToken]);

  // async function fetchSourceTokenPrice(token: Tokens){
  //   let price = (await cryptoService.GetTokenData(token))?.data?.price;
  //   setSendAmount(sendAmountUSDC/price);
  // }

  async function fetchPriceOfTokens(sourceToken: Tokens, destinationToken: Tokens) {
    debugger;
    let sourceTokenPriceUsdc = (await cryptoService.GetTokenData(sourceToken))?.data?.price;
    let destinationTokenPriceUsdc = (await cryptoService.GetTokenData(destinationToken))?.data?.price;

    if (sourceTokenPriceUsdc && destinationTokenPriceUsdc) {
      let totalSendAmountUsdc = props.transactionRequest.amountIn * destinationTokenPriceUsdc; // no of token * price with usdc
      let sendActuallyAmount = (totalSendAmountUsdc / sourceTokenPriceUsdc);
      let truncatedValue = Number(sendActuallyAmount.toFixed(sourceToken.decimal));
      setSendAmount(truncatedValue);//no of token in decimal
      setSendAmountUSDC(Number(totalSendAmountUsdc?.toFixed(2)));// actual amount in usdc

      fetchQuoteFromRapidx(sourceToken, truncatedValue, totalSendAmountUsdc);
    }
  }

  function closeBridBridgeView() {
    setStartBridging(false);
  }

  return (
    <>
      <div className="exchange-wrapper">
        <div className="container">
          <div className="row justify-content-center gap-md-0 gap-3">
            <div className="col-lg-5">
              <div className="card shadow-sm">
                <div className="card-body p-24">
                  <div className="d-flex mb-3">
                    <div className="card-action-wrapper fs-6">
                      <i className="fa-solid fa-wallet mx-1"></i>
                    </div>
                    <span className="card-title p-1">Pay</span>
                  </div>
                  <div className="inner-card w-100 py-2 px-3 mt-3">
                    <div className="d-flex justify-content-between my-2">
                      <span>Payment To RapidY Merch</span>
                      <span>{props.transactionRequest.amountIn} {destiationToken?.symbol}</span>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between mb-3">
                      <span>Subtotal</span>
                      <span>{props.transactionRequest.amountIn} {destiationToken?.symbol}</span>
                    </div>

                    <div className="d-flex justify-content-between mb-2 card-title">
                      <h5>Total due</h5>
                      <h5>{props.transactionRequest.amountIn} {destiationToken?.symbol}</h5>
                    </div>

                    <div className="d-flex justify-content-between mb-3"><span>Note - Payment will automatically will credited at RapidY Merchant.</span><span></span></div>
                  </div>
                </div>
              </div>
            </div>

            {
              !startBridging &&
              <>
                {/* <div className="row">
                    <div className="col-5">

                    </div>
                  </div> */}
                {
                  (!isShowChainUi && !isShowTokenUi) &&
                  <>
                    <div className="col-lg-5 col-md-12 col-sm-12 col-12" id="swap-wrapper">
                      <div className="card">
                        <div className="p-24">
                          <>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <div className="card-title">
                                Send
                              </div>
                              {/* <div className="card-action-wrapper">
                                  <i className="fas fa-cog cursor-pointer"></i>
                                </div> */}
                            </div>
                            <div className="d-flex align-items-center gap-3 position-relative">
                              <div className="inner-card w-100 py-2 px-3" id="select-coin" onClick={() =>
                                openChainUi()}>
                                <label className="mb-2 fw-600">Network</label>
                                <div className="d-flex align-items-center gap-3">
                                  <div className="selcet-coin coin-wrapper">
                                    {utilityService.isNullOrEmpty(sourceChain.logoURI) && <div className="coin"></div>}

                                    {!utilityService.isNullOrEmpty(sourceChain.logoURI) && <img src={sourceChain.logoURI}
                                      className="coin" alt="coin" />}

                                  </div>
                                  <div className="d-flex flex-column">
                                    <label className="coin-name d-block fw-600">{sourceChain.chainId > 0 ?
                                      sourceChain.chainName : 'Select Network'}</label>
                                    {/* <label className="coin-sub-name">{props.sourceToken.name != '' ? props.sourceToken.name :
                              'Token'}</label> */}
                                  </div>
                                </div>
                              </div>
                              {/* <div className="change-btn position-absolute cursor-pointer inner-card d-flex align-items-center justify-content-center">
                        <i className="fas fa-exchange-alt"></i>
                      </div> */}
                              <div className="inner-card w-100 py-2 px-3" onClick={() => openTokenUi()}>
                                <label className="mb-2 fw-600">Coin</label>
                                <div className="d-flex align-items-center gap-3">
                                  <div className="selcet-coin coin-wrapper coin-to coin">

                                    {utilityService.isNullOrEmpty(sourceToken.logoURI) && <div className="coin"></div>}

                                    {!utilityService.isNullOrEmpty(sourceToken.logoURI) && <img src={sourceToken.logoURI}
                                      className="coin" alt="coin" />}

                                  </div>
                                  <div className="d-flex flex-column">
                                    <label className="coin-name d-block fw-600">{sourceToken.name != '' ? sourceToken.name :
                                      'Select Coin'}</label>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="inner-card w-100 py-2 px-3 mt-3">
                              <label className="mb-2 fw-600">Send</label>
                              <div className="d-flex align-items-center gap-3 pb-2">
                                <div className="position-relative coin-wrapper ">
                                  {utilityService.isNullOrEmpty(sourceChain.logoURI) && <div className="coin"></div>}
                                  {utilityService.isNullOrEmpty(sourceToken.logoURI) && <div className="coin-small"></div>}

                                  {!utilityService.isNullOrEmpty(sourceChain.logoURI) && <img src={sourceChain.logoURI}
                                    className="coin" alt="coin" />}
                                  {!utilityService.isNullOrEmpty(sourceToken.logoURI) && <img src={sourceToken.logoURI}
                                    className="coin-small" alt="coin" />}
                                </div>
                                <div className="d-flex flex-column">
                                  <input type="text" className="transparent-input" value={sendAmount} onChange={() => null} readOnly />
                                  {/* {sourceToken?.symbol} */}
                                  {(sendAmountUSDC != null && sendAmountUSDC > 0) && <label className="coin-sub-name">$ {sendAmountUSDC}</label>}
                                  {(!utilityService.isNullOrEmpty(sendAmount) && isNaN(Number(sendAmount))) && <label className="text-danger">Only Numeric Value Allowed</label>}
                                </div>
                              </div>
                            </div>
                            {
                              (bridgeMessage) && (isBridgeMessage != '') &&

                              <>
                                <div className="inner-card w-100 py-2 px-3 mt-2">
                                  <div className="d-flex align-items-center gap-3">



                                    <><span>{isBridgeMessage}</span></>


                                  </div>
                                </div>
                              </>
                            }
                            {/* {
                            showMinOneUSDAmountErr &&
                            <>
                              <div className="inner-card w-100 py-2 px-3 mt-2">
                                <div className="d-flex align-items-center gap-3">



                                  <span>Please enter an amount of at least $1 to proceed.</span>


                                </div>
                              </div>

                            </>
                          }  */}

                            {
                              (!utilityService.isNullOrEmpty(walletData.address) && pathShowRetry == false) &&
                              <>
                                <button className="btn primary-btn w-100 mt-3 btn-primary-bgColor" onClick={() => initPayment()} disabled={sendAmount == null}>
                                  {
                                    pathShowSpinner &&
                                    <>
                                      <i className="fa-solid fa-spinner fa-spin mx-2"></i>
                                      Fetching Quote
                                    </>
                                  }
                                  {
                                    !pathShowSpinner &&
                                    <>
                                      Exchange
                                    </>
                                  }
                                </button>
                              </>
                            }

                            {
                              pathShowRetry == true &&
                              <>
                                <button className="btn primary-btn w-100 mt-3 btn-primary-bgColor" onClick={() => fetchQuoteFromRapidx(sourceToken, sendAmount, sendAmountUSDC)} disabled={sendAmount == null}>
                                  {
                                    pathShowSpinner &&
                                    <>
                                      <i className="fa-solid fa-spinner fa-spin mx-2"></i>
                                      Retry Fetching Quote
                                    </>
                                  }
                                  {
                                    !pathShowSpinner &&
                                    <>
                                      Retry
                                    </>
                                  }
                                </button>
                              </>
                            }


                            {
                              utilityService.isNullOrEmpty(walletData.address) &&
                              <>
                                <button className="btn primary-btn w-100 mt-3 btn-primary-bgColor" onClick={() => dispatch(OpenWalletModalA(true))}>
                                  {
                                    pathShowSpinner &&
                                    <>
                                      <i className="fa-solid fa-spinner fa-spin mx-2"></i>
                                      Fetching Quote
                                    </>
                                  }
                                  {
                                    !pathShowSpinner &&
                                    <>
                                      Connect Wallet
                                    </>
                                  }
                                </button>
                              </>
                            }
                          </>
                        </div>
                      </div>
                    </div>
                  </>
                }
                {
                  isShowChainUi &&
                  <>
                    <Chainui closeChainUI={(chain: Chains) => closeChainUi(chain)}
                      sourceChain={sourceChain}
                      destChain={destiationChain}
                      dataSource={dataSource}
                      chains={props.chains} />
                  </>
                }
                {
                  isShowTokenUi &&
                  <>
                    <Tokenui
                      openChainUI={(isShow: boolean) => null}
                      closeTokenUI={(token: Tokens) => closeTokenUi(token)}
                      sourceChain={sourceChain}
                      destChain={destiationChain}
                      dataSource={dataSource}
                      sourceToken={sourceToken}
                      destToken={destiationToken} />
                  </>
                }
              </>
            }
            {
              startBridging &&
              <>
                <BridgeView closeBridgeView={() => closeBridBridgeView()}></BridgeView>
              </>
            }
          </div>
        </div>
      </div >
    </>
  );
}
