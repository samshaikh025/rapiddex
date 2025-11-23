"use client"
import { AggregatorProvider, DataSource, Keys, TransactionStatus } from "@/shared/Enum/Common.enum";
import { Chains, PathShowViewModel, SwapRequest, Tokens, TransactionRequestoDto } from "@/shared/Models/Common.model";
import { SharedService } from "@/shared/Services/SharedService";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useSwitchAccount, useSwitchChain, useSendTransaction, useConnections, useReadContract, useWriteContract } from "wagmi";
import Pathshow from "../pathshow/page";
import { UtilityService } from "@/shared/Services/UtilityService";
import Skeleton from "react-loading-skeleton";
import { useDispatch, useSelector } from "react-redux";
import { SetActiveTransactionA, SetWalletDataA } from "@/app/redux-store/action/action-redux";
import { config } from '../../../wagmi/config';// Go up a level if needed
import { Chain } from "wagmi/chains";

import BridgeView from "../bridge-view/page";
import { formatUnits, parseEther } from 'viem';
import { injected, readContract, reconnect, writeContract, getChainId } from '@wagmi/core';
import * as definedChains from "wagmi/chains";
import { CryptoService } from "@/shared/Services/CryptoService";
import SubBridgeView from "../sub-bridge-view/page";
import SwapChatBot from "../swap-chatbot/page";
import { TokenBalanceService } from "@/shared/Services/TokenBalanceService";
import { parse } from "path";
import { TransactionService } from "@/shared/Services/TransactionService";

type propsType = {
    sourceChain: Chains,
    destChain: Chains,
    sourceToken: Tokens,
    destToken: Tokens,
    dataSource: string | null,
    sourceTokenAmount: number,
    destTokenAmount: number,
    openTokenUI: (dataSource: string) => void;
    interChangeData: () => void
}

export default function Exchangeui(props: propsType) {
    let [sendAmount, setSendAmount] = useState<number | null>();
    let [equAmountUSD, setequAmountUSD] = useState<number | null>(null);
    let sharedService = SharedService.getSharedServiceInstance();
    let walletData = useSelector((state: any) => state.WalletData);
    let utilityService = new UtilityService();
    let transactionService = new TransactionService();
    let [totalAvailablePath, setTotalAvailablePath] = useState<number>(0);
    let [isPathShow, setIsPathShow] = useState<boolean>(false);
    let [isShowPathComponent, setIsShowPathComponent] = useState<boolean>(false);
    let [selectedPath, setSelectedPath] = useState<PathShowViewModel>(new PathShowViewModel());

    let dispatch = useDispatch();
    const { open } = useWeb3Modal();
    let account = useAccount();
    let activeTransactionData: TransactionRequestoDto = useSelector((state: any) => state.ActiveTransactionData);
    let walletDisconnected: boolean = useSelector((state: any) => state.WalletDisconnected);
    let currentTheme = useSelector((state: any) => state.SelectedTheme);
    let apiUrlENV: string = process.env.NEXT_PUBLIC_NODE_API_URL;
    let [isAIMode, setAIMode] = useState<boolean>(false);
    let [sourceChain, setSourceChain] = useState<Chains>(new Chains());
    let [destChain, setDestChain] = useState<Chains>(new Chains());
    let [sourceToken, setSourceToken] = useState<Tokens>(new Tokens());
    let [destToken, setDestToken] = useState<Tokens>(new Tokens());
    let [sourceTokenAmount, setSourceTokenAmount] = useState<number>(0);
    let [destTokenAmount, setDestTokenAmount] = useState<number>(0);
    let allAvailableChains = useSelector((state: any) => state.AvailableChains);

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

    const { sendTransactionAsync, isPending: isTransactionPending, isError: isTransactionError } = useSendTransaction();
    let [startBridging, setStartBridging] = useState<boolean>(false);
    let [showSubBridgeView, setShowSubBridgeView] = useState<boolean>(false);
    let cryptoService = new CryptoService();
    let [messageFromAssistant, setMessageFromAssistant] = useState<string>('');
    let [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

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
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Token balance state
    const [sourceTokenBalance, setSourceTokenBalance] = useState<any>(null);
    const [balanceLoading, setBalanceLoading] = useState<boolean>(false);
    const amountTextBoxRef = useRef<HTMLInputElement>(null);
    const currentAmountRef = useRef<number | null>(null);
    const prevFetchKeyRef = useRef<string>('');
    const isMountedRef = useRef<boolean>(true);

    // Services - using useMemo to ensure singleton instance
    const tokenBalanceService = useMemo(() => TokenBalanceService.getInstance(), []);

    // Create a unique key for fetch parameters
    const fetchParamsKey = useMemo(() => {
        if (!walletData.address || !props.sourceToken?.address || !props.sourceChain?.chainId) {
            return '';
        }
        return `${walletData.address}_${props.sourceToken.address}_${props.sourceChain.chainId}`;
    }, [walletData.address, props.sourceToken?.address, props.sourceChain?.chainId]);

    // Function to fetch token balance
    const fetchTokenBalance = useCallback(async (forceRefresh: boolean = false) => {
        if (!walletData.address || !props.sourceToken || !props.sourceChain ||
            props.sourceChain.chainId <= 0 || !props.sourceToken.address) {
            setSourceTokenBalance(null);
            return;
        }

        // Prevent duplicate fetches (unless forced refresh)
        if (!forceRefresh && prevFetchKeyRef.current === fetchParamsKey && sourceTokenBalance !== null) {
            console.log('Skipping duplicate fetch for:', fetchParamsKey);
            return;
        }

        console.log('Fetching balance for:', fetchParamsKey, forceRefresh ? '(forced refresh)' : '');
        setBalanceLoading(true);

        try {
            const balance = await tokenBalanceService.getSingleTokenBalance(
                walletData.address,
                props.sourceChain,
                props.sourceToken
            );

            // Only update state if component is still mounted
            if (isMountedRef.current) {
                console.log('Fetched balance:', balance);
                setSourceTokenBalance(balance);
                prevFetchKeyRef.current = fetchParamsKey;
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
            if (isMountedRef.current) {
                setSourceTokenBalance(null);
            }
        } finally {
            if (isMountedRef.current) {
                setBalanceLoading(false);
            }
        }
    }, [walletData.address, props.sourceToken, props.sourceChain, fetchParamsKey, tokenBalanceService, sourceTokenBalance]);

    // Effect to fetch balance when parameters change
    useEffect(() => {
        if (fetchParamsKey && fetchParamsKey !== prevFetchKeyRef.current) {
            fetchTokenBalance();
        }
    }, [fetchParamsKey, fetchTokenBalance]);

    // Auto-refresh balance every 60 seconds (1 minute)
    useEffect(() => {
        // Only set up auto-refresh if wallet is connected and tokens are selected
        if (!walletData.address || !props.sourceToken || !props.sourceChain ||
            props.sourceChain.chainId <= 0 || !props.sourceToken.address) {
            return;
        }

        console.log('[ExchangeUI] Starting balance auto-refresh (60s interval)');

        const refreshInterval = setInterval(() => {
            console.log('[ExchangeUI] Auto-refreshing balance...');
            fetchTokenBalance(true); // Force refresh to bypass duplicate check
        }, 60000); // 60 seconds = 1 minute

        // Cleanup interval on unmount or when dependencies change
        return () => {
            console.log('[ExchangeUI] Stopping balance auto-refresh');
            clearInterval(refreshInterval);
        };
    }, [walletData.address, props.sourceToken?.address, props.sourceChain?.chainId, fetchTokenBalance]);

    const isNativeToken = useCallback((token: Tokens): boolean => {
        if (!token) return false;
        return token.tokenIsNative ||
            token.address === '0x0000000000000000000000000000000000000000' ||
            token.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    }, []);

    // Handle percentage button clicks
    const handlePercentageClick = useCallback((percentage: number) => {

        if (!sourceTokenBalance || sourceTokenBalance.balance === 0) return;

        let adjustedBalance = sourceTokenBalance.balance;

        // Check if it's a native token
        const isNative = isNativeToken(props.sourceToken);

        if (isNative && percentage === 1) {
            // Leave 0.001 for gas if it's native token and max is selected
            //adjustedBalance = Math.max(0, sourceTokenBalance.balance - 0.001);
            percentage = 0.9; // Set to 90% instead of 100%
        }

        const newAmount = (adjustedBalance * percentage).toFixed(6);

        if (amountTextBoxRef.current) {
            amountTextBoxRef.current.value = newAmount;
            updateAmount(newAmount, props.sourceToken.price);
        }
    }, [sourceTokenBalance, props.sourceToken, isNativeToken]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        setSendAmount(null);
        setequAmountUSD(null);
        setTotalAvailablePath(0);
        setSelectedPath(new PathShowViewModel());

        // Immediately hide Pathshow while typing
        setIsPathShow(false);
        setIsShowPathComponent(false);

        // Clear the previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set a new timeout
        typingTimeoutRef.current = setTimeout(() => {
            console.log("User stopped typing. Final input value:", value);
            updateAmount(value, props.sourceToken.price);
        }, 500); // Wait 500ms after user stops typing
    };

    const formatBalance = useCallback((value: number): string => {
        if (value === 0) return '0';
        if (value < 0.0001) return '< 0.0001';
        if (value < 1) return value.toFixed(6);
        if (value < 1000) return value.toFixed(4);
        return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
    }, []);

    function updateAmount(amount, sourceTokenValue) {
        try {
            // setIsShowPathComponent(false);

            if (!utilityService.isNullOrEmpty(amount) && !isNaN(amount) && sourceTokenValue > 0 && Number(amount) > 0) {

                let numAmount = Number(amount);
                let eq = (amount * sourceTokenValue);
                setequAmountUSD(Number(eq.toFixed(2)));
                //setIsShowPathComponent(true);
                //shwo validation message if balance is less than 1 USD

                if (eq < 0.95) {
                    currentAmountRef.current = null;
                    displayToast("Minimum swap amount is $1 USD.");
                    return;
                }
                else {
                    currentAmountRef.current = numAmount;
                    setSendAmount(numAmount);
                    //if balance is available and amount is greater than balance then show error
                    // (balance is only available when wallet is connected)
                    if (sourceTokenBalance && numAmount > sourceTokenBalance?.balance) {
                        displayToast(`Insufficient balance. Available: ${formatBalance(sourceTokenBalance?.balance)} ${sourceToken.symbol}. Required: ${formatBalance(numAmount)} ${sourceToken.symbol}.`);
                    }
                    setIsShowPathComponent(true);
                }
            }
            else {
                setSendAmount(null);
                currentAmountRef.current = null;
                setequAmountUSD(null);
                setIsShowPathComponent(false);
            }
        } catch (error) {

        }
    }

    function interChangeFromTo() {
        setSendAmount(null);
        setequAmountUSD(null);
        currentAmountRef.current = null;
        if (amountTextBoxRef.current) {
            amountTextBoxRef.current.value = '';
        }
        prevFetchKeyRef.current = '';
        props.interChangeData();
    }

    useEffect(() => {
        // Reset amount-related states
        setSendAmount(null);
        currentAmountRef.current = null;
        setequAmountUSD(null);
        setIsShowPathComponent(false);
        setTotalAvailablePath(0);
        setSelectedPath(new PathShowViewModel());

        if (amountTextBoxRef.current) {
            amountTextBoxRef.current.value = '';
        }

        // Clear balance for new token selection
        prevFetchKeyRef.current = '';
    }, [props.sourceChain?.chainId, props.destChain?.chainId, props.sourceToken?.address, props.destToken?.address]);

    function getInitData(data: PathShowViewModel[]) {
        setTotalAvailablePath(data.length);
        if (data.length > 0) {
            setSelectedPath(data[0]);
            setIsShowPathComponent(true);
        } else {
            setIsShowPathComponent(false);
            setSelectedPath(new PathShowViewModel());
            displayToast("No Route Found.");
        }
    }

    function getSelectedPath(data: PathShowViewModel) {
        setSelectedPath(data);
    }

    function setIsPathLoading(status: boolean) {
        setIsPathShow(status);
    }

    useEffect(() => {
        let activeTransactiondata = sharedService.getData(Keys.ACTIVE_TRANASCTION_DATA);
        if (activeTransactiondata) {
            setShowSubBridgeView(true);
            dispatch(SetActiveTransactionA(activeTransactiondata));
        }
    }, [])

    useEffect(() => {
        setSourceChain(props.sourceChain);
        setDestChain(props.destChain);
        setSourceToken(props.sourceToken);
        setDestToken(props.destToken);
        setSourceTokenAmount(props.sourceTokenAmount);
    }, [props.sourceChain, props.destChain, props.sourceToken, props.destToken, props.sourceTokenAmount])

    async function isGasEnough(checkSourceTokenIsNativeCoin: boolean, workingRpc: string, sourceTokenbalance: string) {

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

        payableGasToken.chainId = payableGasChain.id;
        payableGasToken.tokenIsNative = true;
        payableGasToken.tokenIsStable = false;

        let currentNativeBalance = checkSourceTokenIsNativeCoin ? sourceTokenbalance : await utilityService.getBalanceIne(true, payableGasToken, walletData.address, workingRpc);

        let payableprice = (await cryptoService.getTokenAllInformation(payableGasToken)).price;

        let gasafeeRequiredTransactionEther = formatUnits(BigInt(selectedPath.gasafeeRequiredTransaction), payableGasToken.decimal)

        let payablewalletfee = Number(gasafeeRequiredTransactionEther) * payableprice;

        totalGasCost = selectedPath.networkcostusd + selectedPath.relayerfeeusd + payablewalletfee;

        totalGasCostNative = totalGasCost / payableprice;

        //let currentBalance = Number(balance);

        let totalNativeBalanceRequired = checkSourceTokenIsNativeCoin ? totalGasCostNative + sendAmount : totalGasCostNative;

        if (Number(currentNativeBalance) < totalNativeBalanceRequired) {
            displayToast(`Insufficient gas balance. Available: ${formatBalance(Number(currentNativeBalance))} ${payableGasToken.symbol}. Required: ${formatBalance(totalNativeBalanceRequired)} ${payableGasToken.symbol}.`);
            return false;
        }
        else {
            return true;
        }
    }

    async function prepareTransactionRequest(checkSourceTokenIsNativeCoin: boolean) {

        clearPreviousActiveData();

        const transactoinObj = transactionService.GetTransactionRequest(selectedPath, sendAmount, equAmountUSD, walletData.address, sourceChain, destChain, sourceToken, destToken, checkSourceTokenIsNativeCoin);

        //store active transaction in local storage and use when realod page
        sharedService.setData(Keys.ACTIVE_TRANASCTION_DATA, transactoinObj);

        dispatch(SetActiveTransactionA(transactoinObj));
        //addTransactionLog(transactoinObj);
        setIsProcessingPayment(false);
        setShowSubBridgeView(false);
        setStartBridging(true);
        //getAllowance();

    }

    async function exchange() {

        debugger;
        //setStartBridging(true);
        //start showing processing loading message
        try {
            setIsProcessingPayment(true);
            let workingRpc = await utilityService.setupProviderForChain(sourceChain.chainId, sourceChain.rpcUrl);

            if (workingRpc != undefined && workingRpc != null) {

                //check current chain and switch if not matched
                if (walletData.chainId != sourceChain.chainId) {
                    console.log("Need switch chain");
                    await switchCurrentChain();
                }

                let checkSourceTokenIsNativeCoin = await utilityService.checkCoinNative(sourceChain, sourceToken);

                //check sufficient source token balance
                const hasSufficientBalance = await transactionService.HasSufficientSourceBalance(sourceChain, sourceToken, checkSourceTokenIsNativeCoin, walletData.address, workingRpc, sendAmount);
                if (!hasSufficientBalance.status) {
                    displayToast(hasSufficientBalance.message);
                    setIsProcessingPayment(false);
                    return false;
                }

                //check sufficient balance for gas fee
                const hasSufficientGasBalance = await transactionService.HasSufficientGasBalance(sourceChain, sourceToken, checkSourceTokenIsNativeCoin, hasSufficientBalance.tokenBalance, walletData.address, workingRpc, selectedPath, sendAmount);
                if (!hasSufficientGasBalance.status) {
                    displayToast(hasSufficientGasBalance.message);
                    setIsProcessingPayment(false);
                    return false;
                }
                else {
                    await prepareTransactionRequest(checkSourceTokenIsNativeCoin);
                }
            }
        }
        catch (error) {
            console.log(error);
            setIsProcessingPayment(false);
        }
    }

    function closeBridBridgeView() {
        setStartBridging(false);
        setSendAmount(null);
        currentAmountRef.current = null;
        setequAmountUSD(null);
        setIsShowPathComponent(false);
        openOrCloseSubBridBridgeView();
    }

    function openOrCloseSubBridBridgeView() {
        let activeTransactiondata = sharedService.getData(Keys.ACTIVE_TRANASCTION_DATA);

        if (activeTransactiondata) {
            setShowSubBridgeView(true);
        } else {
            setShowSubBridgeView(false);
            fetchTokenBalance();
        }
    }

    useEffect(() => {
        if (walletDisconnected) {
            setShowSubBridgeView(false);
            prevFetchKeyRef.current = '';
        }
    }, [walletDisconnected])

    function toggleAIMode(status: boolean) {
        setAIMode(status);
        clearData();
    }

    function clearData() {
        setMessageFromAssistant("");
        setSourceChain(new Chains());
        setSourceToken(new Tokens());
        setSourceTokenAmount(0);

        setDestChain(new Chains());
        setDestToken(new Tokens());
        setDestTokenAmount(0);

        setSendAmount(null);
        setequAmountUSD(null);

        setTotalAvailablePath(0);
        setSelectedPath(new PathShowViewModel());

        setIsPathShow(false);
        setIsShowPathComponent(false);
    }

    function clearPreviousActiveData() {
        //if previous transaction is active then clear it
        let activeTransactiondata = sharedService.getData(Keys.ACTIVE_TRANASCTION_DATA);
        if (activeTransactiondata) {
            sharedService.removeData(Keys.ACTIVE_TRANASCTION_DATA);
            dispatch(SetActiveTransactionA(new TransactionRequestoDto()));
            setShowSubBridgeView(false);
        }
    }

    async function receivedChatDetails(data: SwapRequest) {

        if (allAvailableChains && allAvailableChains.length > 0) {

            //getting source chain and token data
            let sourceChainObj = allAvailableChains?.find(x => x.chainName.toLowerCase() == data.sourceChain.toLowerCase());
            setSourceChain(sourceChainObj);

            let sourceTokenObjList = await cryptoService.GetAllAvailableCoinsRapidX(sourceChainObj);
            let sourceTokenObj = sourceTokenObjList && sourceTokenObjList.length > 0 ? sourceTokenObjList.find(x => x.address == data?.sourceTokenAddress) : new Tokens();
            if (sourceTokenObj) {
                setSourceToken(sourceTokenObj);
                let payableprice = (await cryptoService.getTokenAllInformation(sourceTokenObj)).price;
                setSourceTokenAmount(payableprice ?? 0);
            } else {
                setMessageFromAssistant("Source Token Is Not Supported By Chain.");
                return;
            }


            //getting destination token data
            let destChainObj = allAvailableChains?.find(x => x.chainName.toLowerCase() == data.destChain.toLowerCase());
            setDestChain(destChainObj);

            let destTokenObjList = await cryptoService.GetAllAvailableCoinsRapidX(destChainObj);
            let destTokenObj = destTokenObjList && destTokenObjList.length > 0 ? destTokenObjList.find(x => x.address == data?.destTokenAddress) : new Tokens();
            if (destTokenObj) {
                setDestToken(destTokenObj);
                let payableprice = (await cryptoService.getTokenAllInformation(destTokenObj)).price;
                setDestTokenAmount(payableprice ?? 0);
            } else {
                setMessageFromAssistant("Destination Token Is Not Supported By Chain.");
                return;
            }

            updateAmount(data.amount, sourceTokenObj?.price);
        }
    }

    async function waitUntilWagmiUpdatesChain(targetChainId: number) {
        return new Promise((resolve) => {
            const interval = setInterval(async () => {
                const id = await getChainId(config);
                if (id === targetChainId) {
                    console.log("Wagmi chainId updated to:", id);
                    clearInterval(interval);
                    resolve(true);
                }
            }, 200);
        });
    }

    function isAmoutInputDisabled() {
        return (
            props.sourceChain.chainId === 0 ||
            props.sourceToken.address === "" ||
            props.destChain.chainId === 0 ||
            props.destToken.address === ""
        );
    }

    function openWalletConnectModel() {
        open();
    }

    function displayToast(message: string) {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
    };

    async function switchCurrentChain() {
        try {
            await switchChain({ chainId: sourceChain.chainId }) // Call switchChain with only chainId
            console.log("Chain Switched")

            //update redux wallet data state
            dispatch(SetWalletDataA({
                ...walletData,
                chainId: sourceChain?.chainId,
                chainName: sourceChain?.chainName,
                chainLogo: sourceChain?.logoURI,
                //blockExplorer: newChain.blockExplorers?.default
            }));

            await waitUntilWagmiUpdatesChain(sourceChain.chainId);
            console.log("wagmi chain updated")
        }
        catch (error) {
            console.log("rejected switch chain");
            throw error;
        }
    }

    return (
        <>
            {
                !startBridging &&
                <>
                    <div className="row">
                        <div className="col-5">

                        </div>
                    </div>
                    <div className="col-lg-5 col-md-12 col-sm-12 col-12" id="swap-wrapper">
                        <div className="card">
                            <div className="p-24">

                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div className="card-title">
                                        Exchange
                                    </div>
                                    <div className="card-action-wrapper">
                                        <>
                                            <div className="theme-mode position-relative">
                                                <input type="checkbox" className="checkbox" id="checkboxAIToggle" onChange={(e) => toggleAIMode(e.currentTarget.checked)} />
                                                <label htmlFor="checkboxAIToggle" className="checkbox-label">
                                                    {/* <i className="fa-solid fa-microchip"></i> */}
                                                    <i className="fa-solid fa-gear fs-6"></i>
                                                    <i className="fa-solid fa-bolt fs-6"></i>
                                                    <span className="ball"></span>
                                                </label>
                                            </div>
                                        </>
                                    </div>
                                </div>
                                {
                                    showSubBridgeView &&
                                    <>
                                        <div className="inner-card w-100 py-2 px-3 mt-3 mb-3">
                                            <label className="mb-2 fw-600">Active Transaction</label>
                                            <div>
                                                <SubBridgeView openBridgeView={() => setStartBridging(true)} closeSubBridgeView={() => openOrCloseSubBridBridgeView()}></SubBridgeView>
                                            </div>
                                        </div>
                                    </>
                                }

                                {
                                    (isAIMode == false) &&
                                    <>
                                        <div className="d-flex align-items-center gap-3 position-relative">
                                            <div className="inner-card w-100 py-2 px-3" id="select-coin" onClick={() =>
                                                props.openTokenUI(DataSource.From)}>
                                                <label className="mb-2 fw-600">From</label>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="position-relative coin-wrapper coin-from">
                                                        {utilityService.isNullOrEmpty(sourceChain.logoURI) && <div className="coin"></div>}
                                                        {utilityService.isNullOrEmpty(sourceToken.logoURI) && <div className="coin-small"></div>}

                                                        {!utilityService.isNullOrEmpty(sourceChain.logoURI) && <img src={sourceChain.logoURI}
                                                            className="coin" alt="coin" />}
                                                        {!utilityService.isNullOrEmpty(sourceToken.logoURI) && <img src={sourceToken.logoURI}
                                                            className="coin-small" alt="coin" />}
                                                    </div>
                                                    <div className="d-flex flex-column">
                                                        <label className="coin-name d-block fw-600">{sourceChain.chainId > 0 ?
                                                            sourceChain.chainName : 'Chain'}</label>
                                                        <label className="coin-sub-name">{sourceToken.symbol != '' ? sourceToken.symbol :
                                                            'Token'}</label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="change-btn position-absolute cursor-pointer inner-card d-flex align-items-center justify-content-center"
                                                onClick={() => interChangeFromTo()}>
                                                <i className="fas fa-exchange-alt"></i>
                                            </div>
                                            <div className="inner-card w-100 py-2 px-3" onClick={() => props.openTokenUI(DataSource.To)}>
                                                <label className="mb-2 fw-600">To</label>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="position-relative coin-wrapper coin-to">

                                                        {utilityService.isNullOrEmpty(destChain.logoURI) && <div className="coin"></div>}
                                                        {utilityService.isNullOrEmpty(destToken.logoURI) && <div className="coin-small"></div>}

                                                        {!utilityService.isNullOrEmpty(destChain.logoURI) && <img src={destChain.logoURI}
                                                            className="coin" alt="coin" />}
                                                        {!utilityService.isNullOrEmpty(destToken.logoURI) && <img src={destToken.logoURI}
                                                            className="coin-small" alt="coin" />}
                                                    </div>
                                                    <div className="d-flex flex-column ">
                                                        <label className="coin-name d-block fw-600">{destChain.chainId > 0 ?
                                                            destChain.chainName : 'Chain'}</label>
                                                        <label className="coin-sub-name">{destToken.symbol != '' ? destToken.symbol :
                                                            'Token'}</label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Enhanced Send Section with Balance and Percentage Buttons */}
                                        <div className="inner-card w-100 py-2 px-3 mt-3">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <label className="fw-600">Send</label>

                                                {/* Percentage buttons moved to right side */}
                                                {walletData.address && sourceTokenBalance && sourceTokenBalance.balance > 0 && (
                                                    <div className="d-flex gap-1 ms-3 justify-content-end">
                                                        <button
                                                            type="button"
                                                            className="py-1 px-2"
                                                            onClick={() => handlePercentageClick(0.25)}
                                                            style={{
                                                                fontSize: '0.7rem',
                                                                borderRadius: '6px',
                                                                border: 'none',
                                                                backgroundColor: '#f5f5f5',
                                                                color: '#888',
                                                                minHeight: '24px',
                                                                minWidth: '32px',
                                                                fontWeight: '500',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            25%
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="py-1 px-2"
                                                            onClick={() => handlePercentageClick(0.5)}
                                                            style={{
                                                                fontSize: '0.7rem',
                                                                borderRadius: '6px',
                                                                border: 'none',
                                                                backgroundColor: '#f5f5f5',
                                                                color: '#888',
                                                                minHeight: '24px',
                                                                minWidth: '32px',
                                                                fontWeight: '500',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            50%
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="py-1 px-2"
                                                            onClick={() => handlePercentageClick(0.75)}
                                                            style={{
                                                                fontSize: '0.7rem',
                                                                borderRadius: '6px',
                                                                border: 'none',
                                                                backgroundColor: '#f5f5f5',
                                                                color: '#888',
                                                                minHeight: '24px',
                                                                minWidth: '32px',
                                                                fontWeight: '500',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            75%
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="py-1 px-2"
                                                            onClick={() => handlePercentageClick(1)}
                                                            style={{
                                                                fontSize: '0.7rem',
                                                                borderRadius: '6px',
                                                                border: 'none',
                                                                backgroundColor: '#f5f5f5',
                                                                color: '#888',
                                                                minHeight: '24px',
                                                                minWidth: '36px',
                                                                fontWeight: '500',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Max
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="d-flex align-items-start gap-3 pb-2">
                                                <div className="position-relative coin-wrapper">
                                                    {utilityService.isNullOrEmpty(props.sourceChain.logoURI) && <div className="coin"></div>}
                                                    {utilityService.isNullOrEmpty(props.sourceToken.logoURI) && <div className="coin-small"></div>}

                                                    {!utilityService.isNullOrEmpty(props.sourceChain.logoURI) && <img src={props.sourceChain.logoURI}
                                                        className="coin" alt="coin" />}
                                                    {!utilityService.isNullOrEmpty(props.sourceToken.logoURI) && <img src={props.sourceToken.logoURI}
                                                        className="coin-small" alt="coin" />}
                                                </div>
                                                <div className="d-flex flex-column flex-grow-1">
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div className="flex-grow-1">
                                                            <input
                                                                type="text"
                                                                ref={amountTextBoxRef}
                                                                className="transparent-input"
                                                                onChange={handleChange}
                                                                placeholder="0"
                                                                disabled={isAmoutInputDisabled()}
                                                                title={isAmoutInputDisabled() ? "Source or Destination Missing" : ""}
                                                                style={{ cursor: isAmoutInputDisabled() ? "not-allowed" : "text" }}
                                                            />
                                                            {(equAmountUSD != null && equAmountUSD > 0) && <label className="coin-sub-name">$ {equAmountUSD}</label>}
                                                            {(!utilityService.isNullOrEmpty(sendAmount) && isNaN(Number(sendAmount))) && <label className="text-danger">Only Numeric Value Allowed</label>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Balance display with loading state */}
                                            {walletData.address && (
                                                <div className="d-flex align-items-center gap-1 justify-content-end">
                                                    {balanceLoading ? (
                                                        <span className="small text-muted">
                                                            <i className="fas fa-spinner fa-spin me-1"></i>
                                                            Loading balance...
                                                        </span>
                                                    ) : sourceTokenBalance && sourceTokenBalance.balance > 0 ? (
                                                        <span className="small text-muted">
                                                            Balance: {formatBalance(sourceTokenBalance.balance)} {props.sourceToken?.symbol || ''}
                                                            {sourceTokenBalance.balanceUSD > 0 && ` ≈ $ ${sourceTokenBalance.balanceUSD.toFixed(2)}`}
                                                        </span>
                                                    ) : (
                                                        <span className="small text-muted">

                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                    </>
                                }

                                {
                                    (isAIMode == true) &&
                                    <>
                                        <SwapChatBot messageFromAssistant={messageFromAssistant} sendSwapChatDetail={(obj: SwapRequest) => receivedChatDetails(obj)} resetDataOnTyeping={() => clearData()} />
                                    </>
                                }

                                {
                                    (totalAvailablePath > 0 && sendAmount != null && sendAmount > 0) &&
                                    <>
                                        <label className="d-block d-lg-none text-end mt-2 primary-text text-bold" data-bs-toggle="offcanvas" data-bs-target="#offcanvasBottom" aria-controls="offcanvasBottom">
                                            View All {totalAvailablePath} Routes <i className="fa-solid fa-chevron-right"></i>
                                        </label>
                                    </>
                                }
                                {
                                    (sendAmount != null && sendAmount > 0 && isShowPathComponent) &&
                                    <>
                                        <div className="inner-card w-100 py-3 px-3 mt-3">
                                            <div className="">
                                                {(isPathShow) &&
                                                    <>
                                                        <div className="d-flex gap-3">
                                                            <div className="selcet-coin coin-wrapper">
                                                                <Skeleton circle={true} width={50} height={50} />
                                                            </div>
                                                            <div className="d-flex flex-column w-100">
                                                                <label className="coin-name d-flex gap-2 justify-content-between">
                                                                    <label className="coin-name d-block ">
                                                                        <span className="d-block fw-600"> <Skeleton width={90} height={15} /> </span>
                                                                        <span className="d-block coin-sub-name" ><Skeleton width={50} height={10} /></span>
                                                                    </label>
                                                                    <p className="fw-600 px-2 py-1">
                                                                        <Skeleton width={90} height={20} />
                                                                    </p>
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className=" py-1 px-2 d-flex align-item-center justify-content-between">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <label className="font-16 d-flex align-items-center gap-2">
                                                                    <Skeleton width={10} height={10} circle={true} />
                                                                    <Skeleton width={90} height={10} />
                                                                </label>
                                                                <label className="font-16 d-flex align-items-center gap-2">
                                                                    <Skeleton width={10} height={10} circle={true} />
                                                                    <Skeleton width={90} height={10} />
                                                                </label>
                                                            </div>
                                                            <div className='d-flex'>
                                                                <Skeleton width={90} height={20} />
                                                            </div>
                                                        </div>
                                                    </>
                                                }
                                                {
                                                    (!isPathShow && totalAvailablePath > 0) &&
                                                    <>
                                                        <div className="d-flex gap-3">
                                                            <div className="selcet-coin coin-wrapper">
                                                                <img src={destChain.logoURI} className="coin" alt="" />
                                                            </div>
                                                            <div className="d-flex flex-column w-100">
                                                                <label className="coin-name d-flex gap-2 justify-content-between">
                                                                    <label className="coin-name d-block ">
                                                                        <span className="d-block fw-600"> {selectedPath.toAmount} {selectedPath.toToken} </span>
                                                                        <span className="d-block coin-sub-name" >$ {selectedPath.toAmountUsd}</span>
                                                                    </label>
                                                                    <p className="faster fw-600 px-2 py-1 text-capitalize">
                                                                        {
                                                                            !utilityService.isNullOrEmpty(selectedPath?.suggestedPath) &&
                                                                            <>
                                                                                {"AI #" + selectedPath?.suggestedPath}
                                                                                <i
                                                                                    className="fa fa-info-circle ms-2 text-muted"
                                                                                    title={selectedPath?.declaration || ""}
                                                                                    style={{ cursor: "pointer" }}
                                                                                ></i>
                                                                            </>
                                                                        }
                                                                        {
                                                                            utilityService.isNullOrEmpty(selectedPath?.suggestedPath) &&
                                                                            <>
                                                                                {selectedPath?.aggregatorOrderType}
                                                                            </>
                                                                        }
                                                                    </p>
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className=" py-1  py-1 d-flex align-item-center justify-content-between">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <label className="font-16 d-flex align-items-center gap-2">
                                                                    <i className="fa-regular fa-clock "></i>
                                                                    {selectedPath.estTime}
                                                                </label>
                                                                <label className="font-16 d-flex align-items-center gap-2">
                                                                    <i className="fa-solid fa-gas-pump"></i>
                                                                    {selectedPath.gasafee}
                                                                </label>
                                                            </div>
                                                            {
                                                                !utilityService.isNullOrEmpty(currentTheme) &&
                                                                <>
                                                                    <div className='d-flex align-item-center gap-2 aggrigator-box'>
                                                                        <img src={apiUrlENV + '/assets/images/provider-logo/' + selectedPath.aggregator + '.svg'} alt="" />
                                                                    </div>
                                                                </>
                                                            }
                                                        </div>
                                                    </>

                                                }
                                            </div>
                                        </div>
                                    </>
                                }
                                {
                                    !utilityService.isNullOrEmpty(walletData.address) &&
                                    <>
                                        <button className="btn primary-btn w-100 mt-3 btn-primary-bgColor" onClick={() => exchange()} disabled={sendAmount == null} title={sendAmount == null ? "Enter Amount" : ""} style={{ cursor: sendAmount == null ? "not-allowed" : "pointer", pointerEvents: sendAmount == null ? "all" : "auto" }}>
                                            {
                                                isProcessingPayment ?
                                                    <>
                                                        <i className="fa-solid fa-spinner fa-spin me-2"></i> Processing...
                                                    </>
                                                    :
                                                    'Exchange'
                                            }
                                        </button>
                                    </>
                                }
                                {
                                    utilityService.isNullOrEmpty(walletData.address) &&
                                    <>
                                        <button className="btn primary-btn w-100 mt-3 btn-primary-bgColor" onClick={() => openWalletConnectModel()}>
                                            Connect Wallet
                                        </button>
                                    </>
                                }
                            </div>
                            {showToast && (
                                <div className="toast-notification">
                                    <i className="fas fa-check-circle"></i>
                                    <span>{toastMessage}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {(isShowPathComponent) &&
                        <Pathshow Amountpathshow={sendAmount}
                            destChain={destChain}
                            sourceChain={sourceChain}
                            sourceToken={sourceToken}
                            destToken={destToken}
                            sendInitData={(result: PathShowViewModel[]) => getInitData(result)}
                            sendSelectedPath={(result: PathShowViewModel) => getSelectedPath(result)}
                            isPathLoadingParent={(status: boolean) => setIsPathLoading(status)}
                            amountInUsd={equAmountUSD}
                            isAIMode={isAIMode}
                        />
                    }
                </>
            }
            {
                startBridging &&
                <>
                    <div className="col-lg-5 col-md-12 col-sm-12 col-12 position-relative" id="swap-wrapper">
                        <BridgeView closeBridgeView={() => closeBridBridgeView()}></BridgeView>
                    </div>
                </>
            }
        </>
    );
}
