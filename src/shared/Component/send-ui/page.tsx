"use client"
import { OpenWalletModalA, SetActiveTransactionA, SetWalletDataA, SetWalletDisconnectedA } from "@/app/redux-store/action/action-redux";
import BridgeView from "@/app/swap/components/bridge-view/page";
import Chainui from "@/app/swap/components/chainui/page";
import Tokenui from "@/app/swap/components/tokenui/page";
import { AggregatorProvider, DataSource, Keys, TransactionStatus } from "@/shared/Enum/Common.enum";
import { BridgeMessage, Chains, GetPaymentRequest, PathShowViewModel, Tokens, TransactionRequestoDto, WalletConnectData } from "@/shared/Models/Common.model";
import { CryptoService } from "@/shared/Services/CryptoService";
import { SharedService } from "@/shared/Services/SharedService";
import { UtilityService } from "@/shared/Services/UtilityService";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatUnits, parseEther } from "viem";
import { useSwitchChain } from "wagmi";
import { Chain } from "wagmi/chains";
import * as definedChains from "wagmi/chains";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount, useAccountEffect, useConnect, useDisconnect } from "wagmi";
import { UserService } from "@/shared/Services/UserService";
import EmbeddedWallet from "../embeddedwallet/page";

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
  const abortControllerRef = useRef<AbortController | null>(null);

  const [isWalletOpen, setIsWalletOpen] = useState(false);

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
  const { open } = useWeb3Modal();
  const { disconnect } = useDisconnect();
  const allAvailableChains = useSelector((state: any) => state.AvailableChains);
  let userService = new UserService();
  let apiUrlENV: string = process.env.NEXT_PUBLIC_NODE_API_URL;
  let currentTheme = useSelector((state: any) => state.SelectedTheme);


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
      setSelectedPath(new PathShowViewModel());
    }
  }, [walletDisconnected])

  useEffect(() => {
    if (walletData.isReconnected == false && sourceChain && sourceToken.address) {
      //fetchQuoteFromRapidx(sourceToken, sendAmount, sendAmountUSDC);
      getAllPathForAmount(sourceToken, destiationToken, sendAmount);
    }
  }, [walletData.isReconnected]);

  useEffect(() => {

    setDestinationChain(JSON.parse(props.transactionRequest.toChainJSon));
    setDestinationToken(JSON.parse(props.transactionRequest.toTokenJSon));
    setSendAmount(props.transactionRequest.amountIn);

    // Cleanup function to clear the interval
    return () => {
      // Abort on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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
    let sourceTokenPriceUsdc = (await cryptoService.GetTokenData(sourceToken))?.data?.price;
    let destinationTokenPriceUsdc = (await cryptoService.GetTokenData(destinationToken))?.data?.price;

    if (sourceTokenPriceUsdc && destinationTokenPriceUsdc) {
      let totalSendAmountUsdc = props.transactionRequest.amountIn * destinationTokenPriceUsdc; // no of token * price with usdc
      let sendActuallyAmount = (totalSendAmountUsdc / sourceTokenPriceUsdc);
      let truncatedValue = Number(sendActuallyAmount.toFixed(sourceToken.decimal));
      setSendAmount(truncatedValue);//no of token in decimal
      setSendAmountUSDC(Number(totalSendAmountUsdc?.toFixed(2)));// actual amount in usdc
      debugger;
      //fetchQuoteFromRapidx(sourceToken, truncatedValue, totalSendAmountUsdc);
      getAllPathForAmount(sourceToken, destiationToken, truncatedValue);
    }
  }

  function closeBridBridgeView() {
    setStartBridging(false);
  }

  function getAllPathForAmount(sourceToken: Tokens, destToken: Tokens, amt: number) {


    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new controller
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      let walletAddress = !utilityService.isNullOrEmpty(walletData.address) ? walletData.address : '';
      setPathShowSpinner(true);
      setPathShowRetry(false);

      cryptoService.getBestPathFromChosenChains(
        sourceChain,
        destiationChain,
        sourceToken,
        destToken,
        amt,
        walletAddress,
        false
      ).then((result) => {
        if (signal.aborted) {
          return;
        }
        else if (result && result.length > 0) {
          const lifiPath = result.find(path => path.aggregator === AggregatorProvider.LIFI);
          if (lifiPath) {
            setSelectedPath(result[0]);
            setPathShowSpinner(false);
            setPathShowRetry(false);
          } else {
            setPathShowSpinner(false);
            setPathShowRetry(true);
          }
        } else if (result && result.length == 0) {
          setPathShowSpinner(false);
          setPathShowRetry(true);
        }
      }).catch((error) => {
        setPathShowSpinner(false);
        setPathShowRetry(true);
      })
    }
    catch (error) {
      console.log("Error fetching path data:", error);
      setPathShowSpinner(false);
      setPathShowRetry(true);
    }
  }

  // Wallet Functions
  const openWallet = () => {
    setIsWalletOpen(true);
  };

  const closeWallet = () => {
    setIsWalletOpen(false);
  };

  return (
    <>
      <div className="exchange-wrapper">
        <div className="container">
          <div className="row justify-content-center gap-md-0 gap-3">


            {/* Payment Options Panel (Centered Single Card) */}

            <div className="col-lg-6 col-md-8 col-12" id="payment-methods-wrapper">
              <div className="card border-0" style={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}>
                {/* Blue Header - User Info */}
                <div className="d-flex justify-content-between align-items-center px-4 py-3" style={{
                  backgroundColor: '#2196F3',
                  color: 'white'
                }}>
                  <div className="d-flex align-items-center gap-2">
                    <div style={{
                      width: '36px',
                      height: '36px',
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: '600'
                    }}>
                      K
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: '500' }}>kevin</span>
                  </div>
                  {
                    !utilityService.isNullOrEmpty(walletData.address) &&
                    <i
                      className="fa-solid fa-user cursor-pointer p-2 rounded-circle"
                      data-bs-toggle="offcanvas"
                      data-bs-target="#offcanvasMyWallet"
                      aria-controls="offcanvasMyWallet"
                      onClick={() => openWallet()}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        fontSize: '14px'
                      }}
                    ></i>
                  }
                </div>

                <div className="card-body p-4">
                  {/* Payment Options Title */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0" style={{
                      fontSize: '22px',
                      fontWeight: '700',
                      color: '#212121',
                      letterSpacing: '-0.5px'
                    }}>
                      Payment Methods
                    </h5>
                    <div className="badge" style={{
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {destiationToken?.symbol} {props.transactionRequest.amountIn}
                    </div>
                  </div>

                  {/* Accordion for Payment Methods */}
                  <div className="accordion accordion-flush" id="paymentAccordion" style={{ borderRadius: '12px', overflow: 'hidden' }}>

                    {/* Accordion Item 1 - Pay via Crypto (Open by Default) */}
                    <div className="accordion-item" style={{ border: '1px solid #e0e0e0', borderRadius: '12px !important', marginBottom: '12px', overflow: 'hidden' }}>
                      <h2 className="accordion-header" id="headingCrypto">
                        <button
                          className="accordion-button"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseCrypto"
                          aria-expanded="true"
                          aria-controls="collapseCrypto"
                          style={{
                            backgroundColor: '#fff',
                            color: '#212121',
                            fontWeight: '600',
                            fontSize: '16px',
                            padding: '16px 20px',
                            boxShadow: 'none',
                            borderRadius: '12px'
                          }}
                        >
                          <div className="d-flex align-items-center gap-3 w-100">
                            <div style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: '#fff3e0',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <i className="fa-brands fa-bitcoin" style={{ color: '#f7931a', fontSize: '20px' }}></i>
                            </div>
                            <span>Pay via Crypto</span>
                          </div>
                        </button>
                      </h2>
                      <div
                        id="collapseCrypto"
                        className="accordion-collapse collapse show"
                        aria-labelledby="headingCrypto"
                        data-bs-parent="#paymentAccordion"
                      >
                        <div className="accordion-body" style={{ padding: '20px' }}>
                      {!startBridging && (
                        <>
                          {(!isShowChainUi && !isShowTokenUi) && (
                            <>
                              <div className="row mb-3 g-2">
                                <div className="col-md-6 col-12">
                                  {/* <label className="form-label fw-600 mb-2">Network</label> */}
                                  <div className="inner-card w-100 py-3 px-3 cursor-pointer" onClick={() => openChainUi()}
                                  >
                                    <div className="d-flex align-items-center gap-2">
                                      <div className="selcet-coin coin-wrapper">
                                        {utilityService.isNullOrEmpty(sourceChain.logoURI) ? (
                                          <div className="coin"></div>
                                        ) : (
                                          <img src={sourceChain.logoURI} className="coin" alt="coin" />
                                        )}
                                      </div>
                                      <div className="flex-grow-1">
                                        <label className="coin-name d-block fw-600 mb-0 small">
                                          {sourceChain.chainId > 0 ? sourceChain.chainName : 'Select Network'}
                                        </label>
                                      </div>
                                      <i className="fas fa-chevron-right text-muted"></i>
                                    </div>
                                  </div>
                                </div>

                                <div className="col-md-6 col-12">
                                  {/* <label className="form-label fw-600 mb-2">Coin</label> */}
                                  <div className="inner-card w-100 py-3 px-3 cursor-pointer" onClick={() => openTokenUi()}
                                  >
                                    <div className="d-flex align-items-center gap-2">
                                      <div className="selcet-coin coin-wrapper">
                                        {utilityService.isNullOrEmpty(sourceToken.logoURI) ? (
                                          <div className="coin"></div>
                                        ) : (
                                          <img src={sourceToken.logoURI} className="coin" alt="coin" />
                                        )}
                                      </div>
                                      <div className="flex-grow-1">
                                        <label className="coin-name d-block fw-600 mb-0 small">
                                          {sourceToken.name != '' ? sourceToken.name : 'Select Coin'}
                                        </label>
                                      </div>
                                      <i className="fas fa-chevron-right text-muted"></i>
                                    </div>
                                  </div>
                                </div>
                              </div>


                              <div className="inner-card w-100 py-3 px-3 mb-3">
                                {/* <label className="form-label fw-600 mb-2">Send Amount</label> */}
                                <div className="d-flex align-items-center gap-3">
                                  <div className="position-relative coin-wrapper">
                                    {utilityService.isNullOrEmpty(sourceChain.logoURI) && <div className="coin"></div>}
                                    {utilityService.isNullOrEmpty(sourceToken.logoURI) && <div className="coin-small"></div>}
                                    {!utilityService.isNullOrEmpty(sourceChain.logoURI) && (
                                      <img src={sourceChain.logoURI} className="coin" alt="coin" />
                                    )}
                                    {!utilityService.isNullOrEmpty(sourceToken.logoURI) && (
                                      <img src={sourceToken.logoURI} className="coin-small" alt="coin" />
                                    )}
                                  </div>
                                  <div className="flex-grow-1">
                                    <div className="d-flex align-items-center mb-1">
                                      <input
                                        type="text"
                                        className="transparent-input"
                                        value={sendAmount}
                                        onChange={() => null}
                                        readOnly
                                      />
                                      <span className="fw-600 ms-2">
                                        {(sourceToken && sourceToken.symbol != '' ? sourceToken.symbol : '')}
                                      </span>
                                    </div>
                                    {(sendAmountUSDC != null && sendAmountUSDC > 0) && (
                                      <label className="coin-sub-name mb-0 d-block">$ {sendAmountUSDC}</label>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {(bridgeMessage && isBridgeMessage != '') && (
                                <div className="alert alert-warning py-2 px-3 mb-3" role="alert">
                                  <small>{isBridgeMessage}</small>
                                </div>
                              )}

                              {!utilityService.isNullOrEmpty(walletData.address) && pathShowRetry == false && (
                                <button
                                  className="btn primary-btn w-100 btn-primary-bgColor"
                                  onClick={() => initPayment()}
                                  disabled={sendAmount == null}
                                >
                                  {pathShowSpinner ? (
                                    <>
                                      <i className="fa-solid fa-spinner fa-spin me-2"></i>
                                      Fetching Quote
                                    </>
                                  ) : (
                                    'Exchange'
                                  )}
                                </button>
                              )}

                              {utilityService.isNullOrEmpty(walletData.address) && pathShowRetry == false && (
                                <button
                                  className="btn primary-btn w-100 btn-primary-bgColor"
                                  onClick={() => dispatch(OpenWalletModalA(true))}
                                >
                                  {pathShowSpinner ? (
                                    <>
                                      <i className="fa-solid fa-spinner fa-spin me-2"></i>
                                      Fetching Quote
                                    </>
                                  ) : (
                                    'Connect Wallet'
                                  )}
                                </button>
                              )}

                              {pathShowRetry == true && (
                                <button
                                  className="btn primary-btn w-100 btn-primary-bgColor"
                                  onClick={() => getAllPathForAmount(sourceToken, destiationToken, sendAmount)}
                                  disabled={sendAmount == null}
                                >
                                  {pathShowSpinner ? (
                                    <>
                                      <i className="fa-solid fa-spinner fa-spin me-2"></i>
                                      Retry Fetching Quote
                                    </>
                                  ) : (
                                    'Retry'
                                  )}
                                </button>
                              )}
                            </>
                          )}

                          {isShowChainUi &&
                            <div className="col-12" id="swap-coin-wrapper">
                              <Chainui
                                closeChainUI={(chain: Chains) => closeChainUi(chain)}
                                sourceChain={sourceChain}
                                destChain={destiationChain}
                                dataSource={dataSource}
                                chains={props.chains} />
                            </div>
                          }

                          {isShowTokenUi &&
                            <div className="col-12" id="swap-coin-wrapper">
                              <Tokenui
                                openChainUI={(isShow: boolean) => null}
                                closeTokenUI={(token: Tokens) => closeTokenUi(token)}
                                sourceChain={sourceChain}
                                destChain={destiationChain}
                                dataSource={dataSource}
                                sourceToken={sourceToken}
                                destToken={destiationToken}
                              />
                            </div>
                          }
                        </>
                      )}
                      {startBridging && (
                        <div className="col-12 position-relative overflow-hidden" id="swap-wrapper">
                          <BridgeView closeBridgeView={() => closeBridBridgeView()}></BridgeView>
                        </div>
                      )}
                        </div>
                      </div>
                    </div>

                    {/* Accordion Item 2 - Pay via UPI */}
                    <div className="accordion-item" style={{ border: '1px solid #e0e0e0', borderRadius: '12px !important', marginBottom: '12px', overflow: 'hidden' }}>
                      <h2 className="accordion-header" id="headingUPI">
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseUPI"
                          aria-expanded="false"
                          aria-controls="collapseUPI"
                          style={{
                            backgroundColor: '#fff',
                            color: '#212121',
                            fontWeight: '600',
                            fontSize: '16px',
                            padding: '16px 20px',
                            boxShadow: 'none',
                            borderRadius: '12px'
                          }}
                        >
                          <div className="d-flex align-items-center gap-3 w-100">
                            <div style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: '#f3e5f5',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <i className="fa-solid fa-mobile-screen-button" style={{ color: '#7b1fa2', fontSize: '20px' }}></i>
                            </div>
                            <div className="flex-grow-1">
                              <span>Pay via UPI</span>
                            </div>
                            <div className="d-flex gap-1 me-2">
                              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#5f259f' }}></div>
                              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#0c7fdc' }}></div>
                              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#00baf2' }}></div>
                            </div>
                          </div>
                        </button>
                      </h2>
                      <div
                        id="collapseUPI"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingUPI"
                        data-bs-parent="#paymentAccordion"
                      >
                        <div className="accordion-body" style={{ padding: '20px' }}>
                          <div className="text-center py-5">
                            <div className="mb-4" style={{
                              width: '80px',
                              height: '80px',
                              backgroundColor: '#f3e5f5',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto'
                            }}>
                              <i className="fa-brands fa-paypal" style={{ fontSize: '36px', color: '#7b1fa2' }}></i>
                            </div>
                            <h6 className="mb-2" style={{ fontWeight: '600', color: '#212121' }}>UPI Payment</h6>
                            <p className="text-muted small">
                              Pay using PhonePe, Google Pay, PayTM, BHIM and other UPI apps
                            </p>
                            <div className="alert alert-info mt-3" style={{ backgroundColor: '#e3f2fd', border: 'none' }}>
                              <small>Coming Soon!</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Accordion Item 3 - Pay via Cards */}
                    <div className="accordion-item" style={{ border: '1px solid #e0e0e0', borderRadius: '12px !important', marginBottom: '12px', overflow: 'hidden' }}>
                      <h2 className="accordion-header" id="headingCards">
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseCards"
                          aria-expanded="false"
                          aria-controls="collapseCards"
                          style={{
                            backgroundColor: '#fff',
                            color: '#212121',
                            fontWeight: '600',
                            fontSize: '16px',
                            padding: '16px 20px',
                            boxShadow: 'none',
                            borderRadius: '12px'
                          }}
                        >
                          <div className="d-flex align-items-center gap-3 w-100">
                            <div style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: '#e1f5fe',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <i className="fa-solid fa-credit-card" style={{ color: '#0277bd', fontSize: '20px' }}></i>
                            </div>
                            <div className="flex-grow-1">
                              <span>Pay via Cards</span>
                            </div>
                            <div className="d-flex gap-2 me-2" style={{ fontSize: '11px', fontWeight: '700' }}>
                              <span style={{ color: '#1a1f71' }}>VISA</span>
                              <span style={{ color: '#eb001b' }}>MC</span>
                              <span style={{ color: '#00579f' }}>AMEX</span>
                            </div>
                          </div>
                        </button>
                      </h2>
                      <div
                        id="collapseCards"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingCards"
                        data-bs-parent="#paymentAccordion"
                      >
                        <div className="accordion-body" style={{ padding: '20px' }}>
                          <div className="text-center py-5">
                            <div className="mb-4" style={{
                              width: '80px',
                              height: '80px',
                              backgroundColor: '#e1f5fe',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto'
                            }}>
                              <i className="fa-solid fa-credit-card" style={{ fontSize: '36px', color: '#0277bd' }}></i>
                            </div>
                            <h6 className="mb-2" style={{ fontWeight: '600', color: '#212121' }}>Card Payment</h6>
                            <p className="text-muted small">
                              Pay securely using your Credit or Debit card
                            </p>
                            <div className="alert alert-info mt-3" style={{ backgroundColor: '#e3f2fd', border: 'none' }}>
                              <small>Coming Soon!</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Accordion Item 4 - Pay via Netbanking */}
                    <div className="accordion-item" style={{ border: '1px solid #e0e0e0', borderRadius: '12px !important', marginBottom: '12px', overflow: 'hidden' }}>
                      <h2 className="accordion-header" id="headingNetbanking">
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseNetbanking"
                          aria-expanded="false"
                          aria-controls="collapseNetbanking"
                          style={{
                            backgroundColor: '#fff',
                            color: '#212121',
                            fontWeight: '600',
                            fontSize: '16px',
                            padding: '16px 20px',
                            boxShadow: 'none',
                            borderRadius: '12px'
                          }}
                        >
                          <div className="d-flex align-items-center gap-3 w-100">
                            <div style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: '#fff3e0',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <i className="fa-solid fa-building-columns" style={{ color: '#e65100', fontSize: '20px' }}></i>
                            </div>
                            <div className="flex-grow-1">
                              <span>Pay via Netbanking</span>
                            </div>
                            <div className="d-flex gap-1 me-2">
                              <div style={{ width: '18px', height: '18px', borderRadius: '3px', backgroundColor: '#d32f2f' }}></div>
                              <div style={{ width: '18px', height: '18px', borderRadius: '3px', backgroundColor: '#1976d2' }}></div>
                              <div style={{ width: '18px', height: '18px', borderRadius: '3px', backgroundColor: '#f57c00' }}></div>
                            </div>
                          </div>
                        </button>
                      </h2>
                      <div
                        id="collapseNetbanking"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingNetbanking"
                        data-bs-parent="#paymentAccordion"
                      >
                        <div className="accordion-body" style={{ padding: '20px' }}>
                          <div className="text-center py-5">
                            <div className="mb-4" style={{
                              width: '80px',
                              height: '80px',
                              backgroundColor: '#fff3e0',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto'
                            }}>
                              <i className="fa-solid fa-building-columns" style={{ fontSize: '36px', color: '#e65100' }}></i>
                            </div>
                            <h6 className="mb-2" style={{ fontWeight: '600', color: '#212121' }}>Netbanking</h6>
                            <p className="text-muted small">
                              Pay using your bank's internet banking service
                            </p>
                            <div className="alert alert-info mt-3" style={{ backgroundColor: '#e3f2fd', border: 'none' }}>
                              <small>Coming Soon!</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Wallet Offcanvas */}
                  <div className="offcanvas offcanvas-end custom-backgrop offcanvas-cms" id="offcanvasMyWallet" aria-labelledby="offcanvasMyWalletLabel" style={{ position: 'absolute' }}>
                    <div className="offcanvas-header">
                      <h5 className="offcanvas-title" id="offcanvasMyWalletLabel">My Wallet</h5>
                      <button type="button" className="btn-close text-reset primary-text" data-bs-dismiss="offcanvas" aria-label="Close" onClick={() => closeWallet()}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>
                      </button>
                    </div>
                    <div className="offcanvas-body">
                      <EmbeddedWallet
                        isOpen={isWalletOpen}
                        onClose={closeWallet}
                        walletAddress={walletData.address}
                        className="embedded-wallet"
                      />
                    </div>
                  </div>

                  {/* Powered By RapidX Footer */}
                  <div className="mt-4 pt-3 border-top">
                    <div className="d-flex align-items-center justify-content-center gap-2 p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                      <small style={{ fontSize: '12px', color: '#757575' }}>
                        <i className="fa-solid fa-shield-halved me-1"></i>
                        Secured by
                      </small>
                      <img
                        src={apiUrlENV + '/assets/images/rapidx/logo_light.svg'}
                        className="desktop-logo"
                        alt="RapidX Logo"
                        style={{ maxHeight: '16px', width: 'auto', filter: 'grayscale(0.3)' }}
                      />
                    </div>
                    <div className="text-center mt-2">
                      <div className="d-flex align-items-center justify-content-center gap-3" style={{ fontSize: '11px', color: '#9e9e9e' }}>
                        <span>UPI</span>
                        <span>•</span>
                        <span>VISA</span>
                        <span>•</span>
                        <span>Mastercard</span>
                        <span>•</span>
                        <span>RuPay</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
