"use client"
import { SetPredineTokensForChainA } from "@/app/redux-store/action/action-redux";
import { DataSource } from "@/shared/Enum/Common.enum";
import { ChainBase, Chains, PreDefinedTokensForChains, TokenBase, Tokens } from "@/shared/Models/Common.model";
import { CryptoService } from "@/shared/Services/CryptoService";
import { UtilityService } from "@/shared/Services/UtilityService";
import { TokenBalanceService } from "@/shared/Services/TokenBalanceService";
import { useContext, useEffect, useState, useRef, useCallback } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Skeleton from 'react-loading-skeleton'
import { useDispatch, useSelector } from "react-redux";
import { SupportedChains } from "@/shared/Static/SupportedChains";
import { SupportedTokens } from "@/shared/Static/supportedAssets";

// Extend Tokens type to include balance


type propsType = {
    sourceChain: Chains,
    destChain: Chains,
    dataSource: string,
    sourceToken: Tokens,
    destToken: Tokens,
    openChainUI: (isShow: boolean) => void,
    closeTokenUI: (token: Tokens) => Promise<void>
}

export default function Tokenui(props: propsType) {
    let cryptoService = new CryptoService();
    let tokenBalanceService = TokenBalanceService.getInstance();
    let [AvailableToken, setAvailableToken] = useState<Tokens[]>([]);
    let [masterAvailableToken, setMasterAvailableToken] = useState<Tokens[]>([]);
    let [tokenResponse, setTokenResponse] = useState<Tokens[]>([]);
    let [showCoinSpinner, setShowCoinSpinner] = useState<boolean>(false);
    let preDefineTokensContextData = useSelector((state: any) => state.PreDefinedTokensForChainsData);
    let walletData = useSelector((state: any) => state.WalletData);
    let dispatch = useDispatch();
    let [abc, setAbc] = useState<number>(0);
    let [hasMoreData, setHasMoreData] = useState<boolean>(false);
    let defaultListSize = 20;
    let utilityService = new UtilityService();
    let chainImageURL = '';
    chainImageURL = props.dataSource == DataSource.From ? props.sourceChain.logoURI : props.destChain.logoURI;

    // Ref to track which balances have been fetched
    const fetchedBalancesRef = useRef<Set<string>>(new Set());
    const isMountedRef = useRef<boolean>(true);

    // Format balance for display
    const formatBalance = (balance: number): string => {
        if (balance === 0) return '0';
        if (balance < 0.0001) return '< 0.0001';
        if (balance < 1) return balance.toFixed(4);
        if (balance < 1000) return balance.toFixed(2);
        if (balance < 1000000) return `${(balance / 1000).toFixed(2)}K`;
        return `${(balance / 1000000).toFixed(2)}M`;
    };

    // Sort tokens with balance at top
    const sortTokensByBalance = (tokens: Tokens[]): Tokens[] => {
        return [...tokens].sort((a, b) => {
            // First priority: tokens with balance
            if (a.balance && a.balance > 0 && (!b.balance || b.balance === 0)) return -1;
            if ((!a.balance || a.balance === 0) && b.balance && b.balance > 0) return 1;

            // Second priority: sort by balance USD value
            if (a.balance && b.balance && a.balance > 0 && b.balance > 0) {
                return (b.balanceUSD || 0) - (a.balanceUSD || 0);
            }

            return 0;
        });
    };

    // Fetch ALL balances from Mobula and merge with token list
    const fetchAllBalancesAndMerge = useCallback(async () => {
        if (!walletData.address || !isMountedRef.current) {
            return;
        }

        const chainDataSource = props.dataSource == DataSource.From ? props.sourceChain : props.destChain;

        // Skip if already fetched for this chain
        if (fetchedBalancesRef.current.has(`chain_${chainDataSource.chainId}`)) {
            return;
        }

        console.log('[TokenUI] Fetching balances with fallback system...');

        let allBalances: any[] = [];

        try {
            // Method 1: Try Mobula first (gets all tokens with balances)
            console.log('[TokenUI] Trying Mobula API...');
            allBalances = await tokenBalanceService.getTokenBalances(
                walletData.address,
                chainDataSource,
                []
            );

            if (allBalances && allBalances.length > 0) {
                console.log(`[TokenUI] Mobula succeeded with ${allBalances.length} balances`);
            } else {
                console.log('[TokenUI] Mobula returned no balances, trying Multicall3...');

                // Method 2: Fallback to Multicall3 with available token list
                if (tokenResponse && tokenResponse.length > 0) {
                    console.log(`[TokenUI] Trying Multicall3 with ${tokenResponse.length} tokens...`);
                    allBalances = await tokenBalanceService.getTokenBalancesWithFallback(
                        walletData.address,
                        chainDataSource,
                        tokenResponse
                    );
                    console.log(`[TokenUI] Multicall3 returned ${allBalances.length} balances`);
                }
            }

            console.log('[TokenUI] Final balance count:', allBalances.length);

            if (!isMountedRef.current) return;

            // Mark as fetched for this chain
            fetchedBalancesRef.current.add(`chain_${chainDataSource.chainId}`);

            // Helper function to check if addresses match
            const addressesMatch = (addr1: string, addr2: string): boolean => {
                const a1 = addr1.toLowerCase();
                const a2 = addr2.toLowerCase();
                if (a1 === a2) return true;
                const nativeAddresses = [
                    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                    '0x0000000000000000000000000000000000000000',
                    'native'
                ];
                return (nativeAddresses.includes(a1) && nativeAddresses.includes(a2));
            };

            // Helper function to merge balances into token list
            const mergeBalances = (tokens: Tokens[]): Tokens[] => {
                const updatedTokens = tokens.map(token => {
                    if (!token.address) return token;

                    const balanceData = allBalances.find(b => {
                        if (!b.token || !b.token.address) return false;
                        return addressesMatch(token.address, b.token.address) ||
                            (token.symbol === b.token.symbol && (token.tokenIsNative || b.token.tokenIsNative));
                    });

                    if (balanceData) {
                        return {
                            ...token,
                            balance: balanceData.balance,
                            balanceUSD: balanceData.balanceUSD,
                            price: balanceData.price || token.price
                        };
                    }
                    return token;
                });

                // Add tokens with balances that aren't in the current list
                const tokensToAdd: Tokens[] = [];
                allBalances.forEach(balanceData => {
                    if (!balanceData.token || !balanceData.token.address) return;

                    // Check if this token is already in the list
                    const existsInList = updatedTokens.some(token =>
                        token.address && (
                            addressesMatch(token.address, balanceData.token.address) ||
                            (token.symbol === balanceData.token.symbol && (token.tokenIsNative || balanceData.token.tokenIsNative))
                        )
                    );

                    // If not in list and has balance, add it
                    if (!existsInList && balanceData.balance > 0) {
                        tokensToAdd.push({
                            ...balanceData.token,
                            balance: balanceData.balance,
                            balanceUSD: balanceData.balanceUSD,
                            price: balanceData.price
                        });
                    }
                });

                // Combine and sort
                return sortTokensByBalance([...updatedTokens, ...tokensToAdd]);
            };

            // Update all token lists
            setTokenResponse(prev => mergeBalances(prev));
            setMasterAvailableToken(prev => mergeBalances(prev));
            setAvailableToken(prev => {
                const merged = mergeBalances(prev);
                // Keep only first batch visible
                return merged.slice(0, Math.max(prev.length, defaultListSize));
            });

        } catch (error) {
            console.error('[TokenUI] Error fetching balances:', error);
        }
    }, [walletData.address, props.dataSource, props.sourceChain, props.destChain, tokenResponse]);

    // Legacy function for backward compatibility (now just calls the main function)
    const fetchBalancesForTokens = useCallback(async (tokens: Tokens[]) => {
        // Just trigger the full balance fetch
        await fetchAllBalancesAndMerge();
    }, [fetchAllBalancesAndMerge]);

    async function getCoinsByChain() {

        debugger;
        let tokens: Tokens[] = [];
        let chainDataSource = new Chains();
        try {
            chainDataSource = props.dataSource == DataSource.From ? props.sourceChain : props.destChain;
            if (chainDataSource.chainId > 0) {
                setShowCoinSpinner(true);
                // Clear fetched balances when chain changes
                fetchedBalancesRef.current.clear();

                if (preDefineTokensContextData && preDefineTokensContextData.length > 0 && preDefineTokensContextData.findIndex(x => x.chainId == chainDataSource.chainId) > -1) {
                    tokens = preDefineTokensContextData?.find(x => x.chainId == chainDataSource.chainId)?.tokens || [];
                } else {
                    tokens = await cryptoService.GetAllAvailableCoinsRapidX(chainDataSource);
                    let obj = new PreDefinedTokensForChains();
                    obj.chainId = chainDataSource.chainId;
                    obj.tokens = tokens;


                    dispatch(SetPredineTokensForChainA(obj));
                }
                setShowCoinSpinner(false);

                if (tokens && tokens.length > 0) {
                    setTokenResponse(tokens);
                    setMasterAvailableToken(tokens);
                    const firstBatch = tokens.slice(0, defaultListSize);
                    setAvailableToken(firstBatch);
                    setHasMoreData(tokens.length > defaultListSize);

                    // Fetch ALL balances if wallet connected
                    if (walletData.address) {
                        fetchAllBalancesAndMerge();
                    }
                }
            }
        } catch (error) {
            console.error('Error in getCoinsByChain:', error);
            setShowCoinSpinner(false);
        }
    }

    async function backCloseTokenUI() {
        let token = props.dataSource == DataSource.From ? props.sourceToken : props.destToken;
        await props.closeTokenUI(token);
    }

    async function handleCloseTokenUI(token: Tokens) {



        //let tokendata = await cryptoService.getTokenAllInformation(token);
        //token.price = tokendata?.price || 0;
        //console.log(token);

        await props.closeTokenUI(token);
    }

    async function filterToken(tokenValue: string) {

        let tempData: Tokens[] = [];
        if (tokenResponse && tokenResponse.length > 0) {
            setMasterAvailableToken([]);
            setAvailableToken([]);
            setShowCoinSpinner(true);
            setHasMoreData(false);

            if (tokenValue.length > 0) {
                const searchLower = tokenValue.toLowerCase();
                tempData = tokenResponse.filter(x =>
                    x.symbol?.toLowerCase()?.includes(searchLower) ||
                    x.name?.toLowerCase()?.includes(searchLower) ||
                    x.address?.toLowerCase() === searchLower
                );
            } else {
                tempData = tokenResponse;
            }

            // Sort filtered results with balance at top
            if (walletData.address) {
                tempData = sortTokensByBalance(tempData);
            }

            setMasterAvailableToken(tempData);
            const firstBatch = tempData.slice(0, defaultListSize);
            setAvailableToken(firstBatch);
            setHasMoreData(tempData.length > defaultListSize);
            setShowCoinSpinner(false);
        }
    }

    function fetchMoreData() {
        setTimeout(() => {
            if (AvailableToken.length < masterAvailableToken.length) {
                const nextBatch = masterAvailableToken.slice(
                    AvailableToken.length,
                    AvailableToken.length + defaultListSize
                );
                setAvailableToken([...AvailableToken, ...nextBatch]);
            } else {
                setHasMoreData(false);
            }
        }, 1500);
    }

    useEffect(() => {
        isMountedRef.current = true;
        getCoinsByChain();

        return () => {
            isMountedRef.current = false;
        };
    }, [props.sourceChain.chainId, props.destChain.chainId, props.dataSource]);

    // Fetch balances when wallet connects
    useEffect(() => {
        if (walletData.address && AvailableToken.length > 0) {
            fetchAllBalancesAndMerge();
        }
    }, [walletData.address, fetchAllBalancesAndMerge]);

    return (
        <>
            <div className="card">
                <div className="p-24">
                    <div className="d-flex align-items-center gap-3 mb-2">
                        <div className="card-action-wrapper cursor-pointer" id="back-to-swap" onClick={() => backCloseTokenUI()}>
                            <i className="fas fa-chevron-left"></i>
                        </div>
                        <div className="card-title">
                            Exchange {props.dataSource == DataSource.From ? 'From' : 'To'}
                        </div>
                    </div>

                    <div className="inner-card w-100 py-3 px-3 d-flex flex-column gap-3">
                        <div className="d-flex gap-3 w-100 align-items-center">
                            <div className="selcet-coin coin-wrapper">
                                {utilityService.isNullOrEmpty(chainImageURL) && <div className="coin"></div>}
                                {!utilityService.isNullOrEmpty(chainImageURL) && <img src={chainImageURL} className="coin" alt="" />}
                            </div>
                            <button className="btn primary-btn w-100 btn-primary-bgColor" onClick={() => props.openChainUI(true)}>
                                {props.dataSource == DataSource.From ? (props.sourceChain.chainName == '' ? 'Select Chain' :
                                    props.sourceChain.chainName) : (props.destChain.chainName == '' ? 'Select Chain' :
                                        props.destChain.chainName)}
                            </button>
                        </div>
                        <div className="search-bar position-relative">
                            <i className="fas fa-search"></i>
                            <input type="text" className="w-100" placeholder="Search by token name or address" onKeyUp={(e) =>
                                filterToken(e.currentTarget.value)} />
                        </div>
                        <div className="mt-2">
                            {
                                showCoinSpinner == true &&
                                <>
                                    {Array.from({ length: 3 }, (_, i) => (
                                        <div key={i} className="inner-card d-flex align-items-center justify-content-between w-100 py-2 px-3 mb-2">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="position-relative coin-wrapper">
                                                    <Skeleton circle={true} width={50} height={50} />
                                                </div>
                                                <div className="d-flex flex-column">
                                                    <Skeleton width={100} height={10} />
                                                    <Skeleton width={100} height={10} />
                                                </div>
                                            </div>
                                            <Skeleton width={50} height={10} />
                                        </div>
                                    ))}
                                </>
                            }
                            {
                                showCoinSpinner == false &&
                                <>
                                    <div id="scrollableCoinDiv" className="coin-list-wrapper d-flex flex-column gap-2">
                                        <InfiniteScroll
                                            dataLength={AvailableToken?.length}
                                            next={fetchMoreData}
                                            hasMore={hasMoreData}
                                            loader={<span className="text-center mt-2">Loading...</span>}
                                            scrollableTarget="scrollableCoinDiv"
                                        >
                                            {
                                                AvailableToken.map((token: Tokens, index) => (
                                                    <div key={index} className="inner-card d-flex align-items-center justify-content-between w-100 py-2 px-3 cursor-pointer"
                                                        onClick={() => handleCloseTokenUI(token)}>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="position-relative coin-wrapper">
                                                                <img
                                                                    src={token.logoURI || 'https://media.istockphoto.com/id/2173059563/vector/coming-soon-image-on-white-background-no-photo-available.jpg?s=612x612&w=0&k=20&c=v0a_B58wPFNDPULSiw_BmPyhSNCyrP_d17i2BPPyDTk='}
                                                                    className="coin"
                                                                    alt="coin"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = 'https://media.istockphoto.com/id/2173059563/vector/coming-soon-image-on-white-background-no-photo-available.jpg?s=612x612&w=0&k=20&c=v0a_B58wPFNDPULSiw_BmPyhSNCyrP_d17i2BPPyDTk=';
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="d-flex flex-column">
                                                                <label className="coin-name d-block fw-600">{token.symbol || 'Unknown'}</label>
                                                                <label className="coin-sub-name">
                                                                    {token.address ?
                                                                        `${token.address.substring(0, 4)}...${token.address.substring(token.address.length - 4)}` :
                                                                        'No address'
                                                                    }
                                                                </label>
                                                            </div>
                                                        </div>
                                                        {/* Balance Display */}
                                                        {walletData.address && (
                                                            <>
                                                                {token.isLoadingBalance ? (
                                                                    <Skeleton width={50} height={10} />
                                                                ) : (
                                                                    token.balance !== undefined && token.balance > 0 ? (
                                                                        <div className="d-flex flex-column align-items-end">
                                                                            <label className="fw-600">{formatBalance(token.balance)}</label>
                                                                            {token.balanceUSD !== undefined && token.balanceUSD > 0 && (
                                                                                <label className="small text-muted">${token.balanceUSD.toFixed(2)}</label>
                                                                            )}
                                                                        </div>
                                                                    ) : null
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                ))
                                            }
                                        </InfiniteScroll>
                                    </div>
                                </>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}