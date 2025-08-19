"use client"
import { AggregatorProvider, DataSource, Keys, TransactionStatus } from "@/shared/Enum/Common.enum";
import { BridgeMessage, Chains, PathShowViewModel, RequestTransaction, Tokens, TransactionRequestoDto } from "@/shared/Models/Common.model";
import { SharedService } from "@/shared/Services/SharedService";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useAccount, useSwitchAccount, useSwitchChain, useSendTransaction, useConnections, useReadContract, useWriteContract } from "wagmi";
import Pathshow from "../pathshow/page";
import { UtilityService } from "@/shared/Services/UtilityService";
import Skeleton from "react-loading-skeleton";
import { useDispatch, useSelector } from "react-redux";
import { OpenWalletModalA, SetActiveTransactionA, UpdateTransactionGuid } from "@/app/redux-store/action/action-redux";
import { mainnet, sepolia } from 'wagmi/chains';
import { config } from '../../../wagmi/config';
import { Chain } from "wagmi/chains";
import { TransactionService } from "@/shared/Services/TransactionService";
import BridgeView from "../bridge-view/page";
import { formatUnits, parseEther } from 'viem';
import { readContract, writeContract } from '@wagmi/core';
import * as definedChains from "wagmi/chains";
import { CryptoService } from "@/shared/Services/CryptoService";
import SubBridgeView from "../sub-bridge-view/page";
import { SupportedChains } from "@/shared/Static/SupportedChains";
import { TokenBalanceService } from "@/shared/Services/TokenBalanceService";

// Debounce utility function with cancel method
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
    let timeout: NodeJS.Timeout | null = null;
    const debounced = (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
    debounced.cancel = () => {
        if (timeout) clearTimeout(timeout);
        timeout = null;
    };
    return debounced;
}

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
    const [sendAmount, setSendAmount] = useState<number | null>(null);
    const [equAmountUSD, setequAmountUSD] = useState<number | null>(null);
    const [totalAvailablePath, setTotalAvailablePath] = useState<number>(0);
    const [isPathShow, setIsPathShow] = useState<boolean>(false);
    const [isShowPathComponent, setIsShowPathComponent] = useState<boolean>(false);
    const [selectedPath, setSelectedPath] = useState<PathShowViewModel>(new PathShowViewModel());
    const [pathshow, setpathshow] = useState<boolean>(false);
    const [isBridgeMessageVisible, setIsBridgeMessageVisible] = useState<boolean>(false);
    const [isBridgeMessage, setIsBridgeMessage] = useState<string>('');
    const [startBridging, setStartBridging] = useState<boolean>(false);
    const [showSubBridgeView, setShowSubBridgeView] = useState<boolean>(false);
    const [showMinOneUSDAmountErr, setShowMinOneUSDAmountErr] = useState<boolean>(false);
    const [showSelectSourceErr, setshowSelectSourceErr] = useState<boolean>(false);
    const [showSelectDestinationErr, setSelectDestinationErr] = useState<boolean>(false);
    const [showBalanceErr, setBalanceErr] = useState<boolean>(false);

    const [dynamicChains, setDynamicChains] = useState<Chains[]>([]);

    // Token balance state
    const [sourceTokenBalance, setSourceTokenBalance] = useState<any>(null);
    const [balanceLoading, setBalanceLoading] = useState<boolean>(false);
    const [balanceFetchKey, setBalanceFetchKey] = useState<string>('');

    // Services - using useMemo to ensure singleton instance
    const tokenBalanceService = useMemo(() => TokenBalanceService.getInstance(), []);

    // Refs
    const amountTextBoxRef = useRef<HTMLInputElement>(null);
    const currentAmountRef = useRef<number | null>(null);
    const prevFetchKeyRef = useRef<string>('');
    const isMountedRef = useRef<boolean>(true);

    // Services and utilities
    const sharedService = SharedService.getSharedServiceInstance();
    const utilityService = new UtilityService();
    const cryptoService = new CryptoService();
    const bridgeMessage: BridgeMessage = new BridgeMessage();

    // Redux selectors
    const walletData = useSelector((state: any) => state.WalletData);
    const activeTransactionData: TransactionRequestoDto = useSelector((state: any) => state.ActiveTransactionData);
    const walletDisconnected: boolean = useSelector((state: any) => state.WalletDisconnected);
    const currentTheme = useSelector((state: any) => state.SelectedTheme);

    // Hooks
    const dispatch = useDispatch();
    const { open } = useWeb3Modal();
    const account = useAccount();
    const { sendTransactionAsync, isPending: isTransactionPending, isError: isTransactionError } = useSendTransaction();
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

    // Environment variables
    const apiUrlENV: string = process.env.NEXT_PUBLIC_NODE_API_URL;

    // Get all chains
    const getAllChains = (): Chain[] => {
        return Object.values(definedChains).filter((chain) => chain.id !== undefined) as Chain[];
    };

    const allChains = getAllChains();
    if (allChains.length === 0) {
        throw new Error("No chains available");
    }
    const chainsTuple = [allChains[0], ...allChains.slice(1)] as const;

    // Create a unique key for fetch parameters
    const fetchParamsKey = useMemo(() => {
        if (!walletData.address || !props.sourceToken?.address || !props.sourceChain?.chainId) {
            return '';
        }
        return `${walletData.address}_${props.sourceToken.address}_${props.sourceChain.chainId}`;
    }, [walletData.address, props.sourceToken?.address, props.sourceChain?.chainId]);

    // Function to fetch token balance
    const fetchTokenBalance = useCallback(async () => {
        if (!walletData.address || !props.sourceToken || !props.sourceChain ||
            props.sourceChain.chainId <= 0 || !props.sourceToken.address) {
            setSourceTokenBalance(null);
            return;
        }

        // Prevent duplicate fetches
        if (prevFetchKeyRef.current === fetchParamsKey && sourceTokenBalance !== null) {
            console.log('Skipping duplicate fetch for:', fetchParamsKey);
            return;
        }

        console.log('Fetching balance for:', fetchParamsKey);
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

    // Clear cache when wallet changes
    useEffect(() => {
        if (walletData.address) {
            // Clear previous wallet's cache when wallet changes
            return () => {
                if (!isMountedRef.current) {
                    tokenBalanceService.clearCache(walletData.address);
                }
            };
        }
    }, [walletData.address, tokenBalanceService]);

    // Track component mount status
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Helper function to format balance
    const formatBalance = useCallback((value: number): string => {
        if (value === 0) return '0';
        if (value < 0.0001) return '< 0.0001';
        if (value < 1) return value.toFixed(6);
        if (value < 1000) return value.toFixed(4);
        return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
    }, []);

    // Check if token is native
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
            adjustedBalance = Math.max(0, sourceTokenBalance.balance - 0.001);
        }

        const newAmount = (adjustedBalance * percentage).toFixed(6);

        if (amountTextBoxRef.current) {
            amountTextBoxRef.current.value = newAmount;
            updateAmount(newAmount);
        }
    }, [sourceTokenBalance, props.sourceToken, isNativeToken]);

    // Update amount with validation
    const updateAmount = useCallback((amount: string) => {
        try {
            if (!utilityService.isNullOrEmpty(amount) && !isNaN(Number(amount))) {
                const numAmount = Number(amount);
                setSendAmount(numAmount);
                currentAmountRef.current = numAmount;
                setequAmountUSD(null);



                if (props.sourceChain.chainId == 0 || props.sourceToken.address == '') {
                    setshowSelectSourceErr(true);
                    setIsShowPathComponent(false);
                    return false;
                }


                if (props.destChain.chainId == 0 || props.destToken.address == '') {
                    setSelectDestinationErr(true);
                    setIsShowPathComponent(false);
                    return false;
                }

                if (props.sourceTokenAmount > 0 && numAmount > 0) {
                    const eq = numAmount * props.sourceTokenAmount;
                    setequAmountUSD(Number(eq.toFixed(2)));



                    if (eq < 0.95) {
                        setShowMinOneUSDAmountErr(true);
                        setIsShowPathComponent(false);
                    }

                    else {
                        setShowMinOneUSDAmountErr(false);
                        setshowSelectSourceErr(false);
                        setSelectDestinationErr(false);



                        if (walletData.address != '') {

                            if (numAmount > sourceTokenBalance.balance) {
                                setBalanceErr(true);
                                setIsShowPathComponent(false);
                            }
                            else {
                                setIsShowPathComponent(true);
                            }


                        }



                    }
                }
                else {
                    setShowMinOneUSDAmountErr(false);
                    setshowSelectSourceErr(false);
                    setSelectDestinationErr(false);
                    setIsShowPathComponent(false);
                    setBalanceErr(false);
                }
            } else {
                setSendAmount(null);
                currentAmountRef.current = null;
                setequAmountUSD(null);
                setShowMinOneUSDAmountErr(false);
                setshowSelectSourceErr(false);
                setSelectDestinationErr(false);
                setIsShowPathComponent(false);
                setBalanceErr(false);
            }

            // Reset path data
            setTotalAvailablePath(0);
            setSelectedPath(new PathShowViewModel());
            setIsBridgeMessageVisible(false);
            setIsBridgeMessage("");
        } catch (error) {
            console.error("Error updating amount:", error);
        }
    }, [props.sourceTokenAmount, utilityService]);

    // Debounced amount update
    const debouncedUpdateAmount = useMemo(
        () => debounce((value: string) => {
            updateAmount(value);
        }, 300),
        [updateAmount]
    );

    // Handle input change with debouncing
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Allow empty string, numbers, and decimal points
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            debouncedUpdateAmount(value);
        }
    }, [debouncedUpdateAmount]);

    // Interchange from/to chains
    const interChangeFromTo = useCallback(() => {
        // Reset all states
        setSendAmount(null);
        currentAmountRef.current = null;
        setequAmountUSD(null);
        setIsShowPathComponent(false);
        setTotalAvailablePath(0);
        setSelectedPath(new PathShowViewModel());
        setIsBridgeMessageVisible(false);
        setIsBridgeMessage("");
        setShowMinOneUSDAmountErr(false);
        setshowSelectSourceErr(false);
        setSelectDestinationErr(false);
        setBalanceErr(false);

        if (amountTextBoxRef.current) {
            amountTextBoxRef.current.value = '';
        }

        // Clear balance cache for the new source token
        prevFetchKeyRef.current = '';
        setSourceTokenBalance(null);

        props.interChangeData();
    }, [props]);

    // Handle initial path data
    const getInitData = useCallback((data: PathShowViewModel[]) => {
        setTotalAvailablePath(data.length);
        if (data.length > 0) {
            setSelectedPath(data[0]);
            if (sendAmount && sendAmount > 0) {
                setIsShowPathComponent(true);
            }
        } else {
            setIsShowPathComponent(false);
            setSelectedPath(new PathShowViewModel());
        }
    }, [sendAmount]);

    // Handle path selection
    const getSelectedPath = useCallback((data: PathShowViewModel) => {
        setSelectedPath(data);
    }, []);

    // Handle path loading state
    const setIsPathLoading = useCallback((status: boolean) => {
        setIsPathShow(status);
    }, []);

    // Reset states when chains/tokens change
    useEffect(() => {
        // Reset amount-related states
        setSendAmount(null);
        currentAmountRef.current = null;
        setequAmountUSD(null);
        setIsShowPathComponent(false);
        setTotalAvailablePath(0);
        setSelectedPath(new PathShowViewModel());
        setShowMinOneUSDAmountErr(false);
        setshowSelectSourceErr(false);
        setSelectDestinationErr(false);
        setBalanceErr(false);

        if (amountTextBoxRef.current) {
            amountTextBoxRef.current.value = '';
        }

        // Clear balance for new token selection
        prevFetchKeyRef.current = '';
    }, [props.sourceChain?.chainId, props.destChain?.chainId, props.sourceToken?.address, props.destToken?.address]);

    // Handle active transaction on mount
    useEffect(() => {
        const activeTransactiondata = sharedService.getData(Keys.ACTIVE_TRANASCTION_DATA);
        if (activeTransactiondata) {
            setShowSubBridgeView(true);
            dispatch(SetActiveTransactionA(activeTransactiondata));
        }
    }, [dispatch, sharedService]);

    // Handle wallet disconnection
    useEffect(() => {
        if (walletDisconnected) {
            setShowSubBridgeView(false);
            setSourceTokenBalance(null);
            prevFetchKeyRef.current = '';
        }
    }, [walletDisconnected]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Cancel any pending debounced calls
            debouncedUpdateAmount.cancel?.();
        };
    }, [debouncedUpdateAmount]);

    async function getAllowance() {
        const SPENDER_ADDRESS = "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE";
        const amountToSend = parseEther(sendAmount.toString());

        if (account && account.address && account.address === walletData.address) {
            // Token approval logic
            const tokenAbi = [
                {
                    type: 'function',
                    name: 'allowance',
                    stateMutability: 'view',
                    inputs: [
                        { name: 'owner', type: 'address' },
                        { name: 'spender', type: 'address' },
                    ],
                    outputs: [{ name: 'remaining', type: 'uint256' }],
                },
                {
                    type: 'function',
                    name: 'approve',
                    stateMutability: 'nonpayable',
                    inputs: [
                        { name: 'spender', type: 'address' },
                        { name: 'amount', type: 'uint256' },
                    ],
                    outputs: [{ name: 'success', type: 'bool' }],
                },
            ];

            try {
                // Check allowance
                const allowance = await readContract(config, {
                    address: props.sourceToken.address as `0x${string}`,
                    abi: tokenAbi,
                    functionName: 'allowance',
                    args: [walletData.address, SPENDER_ADDRESS],
                });

                // If allowance is insufficient, request approval
                if (Number(allowance) <= Number(amountToSend)) {
                    console.log("Requesting token approval...");

                    const a = await writeContract(config, {
                        address: props.sourceToken.address as `0x${string}`,
                        abi: tokenAbi,
                        functionName: 'approve',
                        args: [SPENDER_ADDRESS, amountToSend],
                        chain: chainsTuple.find(a => a.id == props.sourceChain.chainId),
                        account: walletData.address as `0x${string}`,
                    });

                    console.log("Approval successful:", a);
                } else {
                    console.log("Token already approved");
                }

                // Proceed with the main transaction
                const tx = await sendTransactionAsync({
                    to: SPENDER_ADDRESS,
                    value: amountToSend,
                });

                console.log('Transaction successful:', tx);
                alert('Transaction sent successfully!');

            } catch (error) {
                console.error('Transaction error:', error);
                alert('Transaction failed. Please try again.');
            }
        }
    }

    async function isGasEnough(balance: string) {
        let totalGasCost = 0;
        let totalGasCostNative = 0;

        let payableGasChain = allChains.find(a => a.id == props.sourceChain.chainId);
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
            bridgeMessage.message = "You don't have enough Gas to Complete this transaction. You required atleast " + totalGasCostNative.toFixed(6) + "  " + payableGasToken.symbol;
            setIsBridgeMessageVisible(true);
            setIsBridgeMessage(bridgeMessage.message);
            return false;
        } else {
            bridgeMessage.message = "";
            setIsBridgeMessageVisible(false);
            setIsBridgeMessage("");
            return true;
        }
    }

    async function prepareTransactionRequest() {
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
        transactoinObj.walletAddress = walletData.address;
        transactoinObj.amount = sendAmt;
        transactoinObj.amountUsd = sendAmtUsdc;
        transactoinObj.approvalAddress = selectedPath.aggregator == AggregatorProvider.RAPID_DEX && selectedPath.isMultiChain == true ? '' : selectedPath.approvalAddress;
        transactoinObj.transactionHash = '';
        transactoinObj.transactionStatus = TransactionStatus.ALLOWANCSTATE;
        transactoinObj.transactionSubStatus = 0;
        transactoinObj.quoteDetail = JSON.stringify(selectedPath.entire);
        transactoinObj.sourceChainId = props.sourceChain.chainId;
        transactoinObj.sourceChainName = props.sourceChain.chainName;
        transactoinObj.sourceChainLogoUri = props.sourceChain.logoURI;
        transactoinObj.destinationChainId = props.destChain.chainId;
        transactoinObj.destinationChainName = props.destChain.chainName;
        transactoinObj.destinationChainLogoUri = props.destChain.logoURI;
        transactoinObj.sourceTokenName = props.sourceToken.name;
        transactoinObj.sourceTokenAddress = props.sourceToken.address;
        transactoinObj.sourceTokenSymbol = props.sourceToken.symbol;
        transactoinObj.sourceTokenLogoUri = props.sourceToken.logoURI
        transactoinObj.destinationTokenName = props.destToken.name;
        transactoinObj.destinationTokenAddress = props.destToken.address;
        transactoinObj.destinationTokenSymbol = props.destToken.symbol;
        transactoinObj.destinationTokenLogoUri = props.destToken.logoURI;
        transactoinObj.isNativeToken = await utilityService.isNativeCurrency(props.sourceChain, props.sourceToken);
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

        // Store active transaction in local storage
        sharedService.setData(Keys.ACTIVE_TRANASCTION_DATA, transactoinObj);
        dispatch(SetActiveTransactionA(transactoinObj));
        setShowSubBridgeView(false);
        setStartBridging(true);
    }

    async function exchange() {
        if (!utilityService.isNullOrEmpty(walletData.address)) {
            let workingRpc = SupportedChains.find(a => a.chainId == props.sourceChain.chainId)?.supportedRPC[0];

            if (workingRpc != undefined && workingRpc != null) {
                console.log(error);
                if (walletData.chainId != props.sourceChain.chainId) {
                    console.log("Need switch chain");
                    try {
                        await switchChain({ chainId: props.sourceChain.chainId })
                        console.log("Chain Switched")
                    } catch (error) {
                        console.log("rejected switch chain");
                        return false;
                    }
                } else {
                    console.log("No Need to switch chain")
                }

                console.time("time a")

                let checkNativeCoin = props.sourceToken.tokenIsNative;
                let balance = props.sourceToken.balance.toString();



                if (Number(balance) < Number(sendAmount)) {
                    bridgeMessage.message = "You don't have enough " + props.sourceToken.symbol + " to complete the transaction.";
                    setIsBridgeMessageVisible(true);
                    setIsBridgeMessage(bridgeMessage.message);
                    return false;
                } else {
                    if (await isGasEnough(balance)) {
                        console.timeEnd("time a")
                        await prepareTransactionRequest();
                    } else {
                        return false;
                    }
                }


            }
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
        activeTransactiondata ? setShowSubBridgeView(true) : setShowSubBridgeView(false);
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

                                <div className="d-flex align-items-center gap-3 position-relative">
                                    <div className="inner-card w-100 py-2 px-3" id="select-coin" onClick={() =>
                                        props.openTokenUI(DataSource.From)}>
                                        <label className="mb-2 fw-600">From</label>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="position-relative coin-wrapper coin-from">
                                                {utilityService.isNullOrEmpty(props.sourceChain.logoURI) && <div className="coin"></div>}
                                                {utilityService.isNullOrEmpty(props.sourceToken.logoURI) && <div className="coin-small"></div>}

                                                {!utilityService.isNullOrEmpty(props.sourceChain.logoURI) && <img src={props.sourceChain.logoURI}
                                                    className="coin" alt="coin" />}
                                                {!utilityService.isNullOrEmpty(props.sourceToken.logoURI) && <img src={props.sourceToken.logoURI}
                                                    className="coin-small" alt="coin" />}
                                            </div>
                                            <div className="d-flex flex-column">
                                                <label className="coin-name d-block fw-600">{props.sourceChain.chainId > 0 ?
                                                    props.sourceChain.chainName : 'Chain'}</label>
                                                <label className="coin-sub-name">{props.sourceToken.symbol != '' ? props.sourceToken.symbol :
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
                                                {utilityService.isNullOrEmpty(props.destChain.logoURI) && <div className="coin"></div>}
                                                {utilityService.isNullOrEmpty(props.destToken.logoURI) && <div className="coin-small"></div>}

                                                {!utilityService.isNullOrEmpty(props.destChain.logoURI) && <img src={props.destChain.logoURI}
                                                    className="coin" alt="coin" />}
                                                {!utilityService.isNullOrEmpty(props.destToken.logoURI) && <img src={props.destToken.logoURI}
                                                    className="coin-small" alt="coin" />}
                                            </div>
                                            <div className="d-flex flex-column ">
                                                <label className="coin-name d-block fw-600">{props.destChain.chainId > 0 ?
                                                    props.destChain.chainName : 'Chain'}</label>
                                                <label className="coin-sub-name">{props.destToken.symbol != '' ? props.destToken.symbol :
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
                                                    {sourceTokenBalance.balanceUSD > 0 && ` ≈ ${sourceTokenBalance.balanceUSD.toFixed(2)}`}
                                                </span>
                                            ) : (
                                                <span className="small text-muted">
                                                    Balance: 0 {props.sourceToken?.symbol || ''}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {
                                    (totalAvailablePath > 0 && sendAmount != null && sendAmount > 0) &&
                                    <>
                                        <label className="d-block d-lg-none text-end mt-2 primary-text text-bold" data-bs-toggle="offcanvas" data-bs-target="#offcanvasBottom" aria-controls="offcanvasBottom">
                                            View All {totalAvailablePath} Routes <i className="fa-solid fa-chevron-right"></i>
                                        </label>
                                    </>
                                }
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
                                {
                                    showMinOneUSDAmountErr &&
                                    <>
                                        <div className="inner-card w-100 py-2 px-3 mt-2">
                                            <div className="d-flex align-items-center gap-3">
                                                <span>Please enter an amount of at least $1 to proceed.</span>
                                            </div>
                                        </div>
                                    </>
                                }
                                {
                                    showSelectSourceErr &&
                                    <>
                                        <div className="inner-card w-100 py-2 px-3 mt-2">
                                            <div className="d-flex align-items-center gap-3">
                                                <span>Please select source.</span>
                                            </div>
                                        </div>
                                    </>
                                }
                                {
                                    showSelectDestinationErr &&
                                    <>
                                        <div className="inner-card w-100 py-2 px-3 mt-2">
                                            <div className="d-flex align-items-center gap-3">
                                                <span>Please select destination.</span>
                                            </div>
                                        </div>
                                    </>
                                }
                                {
                                    showBalanceErr &&
                                    <>
                                        <div className="inner-card w-100 py-2 px-3 mt-2">
                                            <div className="d-flex align-items-center gap-3">
                                                <span>You do not have enough balance.</span>
                                            </div>
                                        </div>
                                    </>
                                }
                                {
                                    sendAmount != null && sendAmount > 0 && !showMinOneUSDAmountErr && !showSelectSourceErr && !showSelectDestinationErr && isPathShow &&
                                    <>
                                        <div className="inner-card w-100 py-3 px-3 mt-3">
                                            <div className="">
                                                {isPathShow &&
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
                                                    (!isPathShow && totalAvailablePath == 0 && isShowPathComponent) &&
                                                    <><span>No Routes Available</span></>
                                                }

                                                {
                                                    (!isPathShow && totalAvailablePath > 0) &&
                                                    <>
                                                        <div className="d-flex gap-3">
                                                            <div className="selcet-coin coin-wrapper">
                                                                <img src={props.destChain.logoURI} className="coin" alt="" />
                                                            </div>
                                                            <div className="d-flex flex-column w-100">
                                                                <label className="coin-name d-flex gap-2 justify-content-between">
                                                                    <label className="coin-name d-block ">
                                                                        <span className="d-block fw-600"> {selectedPath.toAmount} {selectedPath.toToken} </span>
                                                                        <span className="d-block coin-sub-name" >$ {selectedPath.toAmountUsd}</span>
                                                                    </label>
                                                                    <p className="faster fw-600 px-2 py-1 text-capitalize">
                                                                        {selectedPath?.aggregatorOrderType}
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
                                        <button className="btn primary-btn w-100 mt-3 btn-primary-bgColor" onClick={() => exchange()}
                                            disabled={sendAmount == null || sendAmount <= 0 || totalAvailablePath === 0 || showMinOneUSDAmountErr}>
                                            Exchange
                                        </button>
                                    </>
                                }
                                {
                                    utilityService.isNullOrEmpty(walletData.address) &&
                                    <>
                                        <button className="btn primary-btn w-100 mt-3 btn-primary-bgColor" onClick={() => dispatch(OpenWalletModalA(true))}>
                                            Connect Wallet
                                        </button>
                                    </>
                                }
                            </div>
                        </div>
                    </div>

                    {(isShowPathComponent && sendAmount > 0 && !showMinOneUSDAmountErr) &&
                        <Pathshow
                            key={`${props.sourceChain.chainId}-${props.destChain.chainId}-${props.sourceToken.address}-${props.destToken.address}-${sendAmount}`}
                            Amountpathshow={sendAmount}
                            destChain={props.destChain}
                            sourceChain={props.sourceChain}
                            sourceToken={props.sourceToken}
                            destToken={props.destToken}
                            sendInitData={(result: PathShowViewModel[]) => getInitData(result)}
                            sendSelectedPath={(result: PathShowViewModel) => getSelectedPath(result)}
                            isPathLoadingParent={(status: boolean) => setIsPathLoading(status)}
                            amountInUsd={equAmountUSD}
                        />
                    }
                </>
            }
            {
                startBridging &&
                <>
                    <BridgeView closeBridgeView={() => closeBridBridgeView()}></BridgeView>
                </>
            }
        </>
    );
}