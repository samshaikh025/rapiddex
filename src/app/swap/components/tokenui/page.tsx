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

    // Fetch balances for visible tokens
    const fetchBalancesForTokens = useCallback(async (tokens: Tokens[]) => {
        if (!walletData.address || tokens.length === 0 || !isMountedRef.current) {
            return;
        }

        const chainDataSource = props.dataSource == DataSource.From ? props.sourceChain : props.destChain;

        // Filter tokens that haven't been fetched yet
        const tokensToFetch = tokens.filter(
            token => token.address && !fetchedBalancesRef.current.has(token.address.toLowerCase())
        );

        if (tokensToFetch.length === 0) return;

        console.log('Fetching balances for tokens:', tokensToFetch.map(t => ({ symbol: t.symbol, address: t.address })));

        // Mark tokens as loading
        setAvailableToken(prev => prev.map(token => {
            const shouldLoad = tokensToFetch.some(t => t.address === token.address);
            return shouldLoad ? { ...token, isLoadingBalance: true } : token;
        }));

        try {
            // Fetch balances in batches of 10
            const batchSize = 10;
            for (let i = 0; i < tokensToFetch.length; i += batchSize) {
                if (!isMountedRef.current) break;

                const batch = tokensToFetch.slice(i, i + batchSize);
                const balances = await tokenBalanceService.getTokenBalances(
                    walletData.address,
                    chainDataSource,
                    batch
                );

                console.log('Received balances:', balances);

                if (!isMountedRef.current) break;

                // Update tokens with fetched balances
                setAvailableToken(prev => {
                    const updated = prev.map(token => {
                        // Skip if token doesn't have an address
                        if (!token.address) return token;

                        const balanceData = balances.find(b => {
                            // Skip if balance token doesn't have address
                            if (!b.token || !b.token.address) return false;

                            // Handle different address formats for native tokens
                            const tokenAddr = token.address.toLowerCase();
                            const balanceAddr = b.token.address.toLowerCase();

                            // Check exact match first
                            if (tokenAddr === balanceAddr) return true;

                            // Check for native token variations
                            const nativeAddresses = [
                                '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                                '0x0000000000000000000000000000000000000000',
                                'native'
                            ];

                            // Match by symbol for native tokens
                            if ((nativeAddresses.includes(tokenAddr) || nativeAddresses.includes(balanceAddr)) &&
                                token.symbol === b.token.symbol) {
                                return true;
                            }

                            return false;
                        });

                        if (balanceData) {
                            fetchedBalancesRef.current.add(token.address.toLowerCase());
                            console.log(`Setting balance for ${token.symbol}:`, balanceData.balance);
                            return {
                                ...token,
                                balance: balanceData.balance,
                                balanceUSD: balanceData.balanceUSD,
                                isLoadingBalance: false
                            };
                        }

                        // Mark as not loading even if no balance found
                        if (tokensToFetch.some(t => t.address === token.address)) {
                            fetchedBalancesRef.current.add(token.address.toLowerCase());
                            return { ...token, isLoadingBalance: false };
                        }

                        return token;
                    });

                    // Sort tokens with balance at top
                    return sortTokensByBalance(updated);
                });

                // Also update master lists
                setTokenResponse(prev => {
                    const updated = prev.map(token => {
                        // Skip if token doesn't have an address
                        if (!token.address) return token;

                        const balanceData = balances.find(b => {
                            if (!b.token || !b.token.address) return false;
                            const tokenAddr = token.address.toLowerCase();
                            const balanceAddr = b.token.address.toLowerCase();
                            if (tokenAddr === balanceAddr) return true;
                            const nativeAddresses = ['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', '0x0000000000000000000000000000000000000000', 'native'];
                            if ((nativeAddresses.includes(tokenAddr) || nativeAddresses.includes(balanceAddr)) && token.symbol === b.token.symbol) {
                                return true;
                            }
                            return false;
                        });

                        if (balanceData) {
                            return {
                                ...token,
                                balance: balanceData.balance,
                                balanceUSD: balanceData.balanceUSD
                            };
                        }
                        return token;
                    });
                    return sortTokensByBalance(updated);
                });

                setMasterAvailableToken(prev => {
                    const updated = prev.map(token => {
                        // Skip if token doesn't have an address
                        if (!token.address) return token;

                        const balanceData = balances.find(b => {
                            if (!b.token || !b.token.address) return false;
                            const tokenAddr = token.address.toLowerCase();
                            const balanceAddr = b.token.address.toLowerCase();
                            if (tokenAddr === balanceAddr) return true;
                            const nativeAddresses = ['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', '0x0000000000000000000000000000000000000000', 'native'];
                            if ((nativeAddresses.includes(tokenAddr) || nativeAddresses.includes(balanceAddr)) && token.symbol === b.token.symbol) {
                                return true;
                            }
                            return false;
                        });

                        if (balanceData) {
                            return {
                                ...token,
                                balance: balanceData.balance,
                                balanceUSD: balanceData.balanceUSD
                            };
                        }
                        return token;
                    });
                    return sortTokensByBalance(updated);
                });
            }
        } catch (error) {
            console.error('Error fetching balances:', error);
            // Mark tokens as not loading on error
            setAvailableToken(prev => prev.map(token => ({
                ...token,
                isLoadingBalance: false
            })));
        }
    }, [walletData.address, props.dataSource, props.sourceChain, props.destChain]);

    async function getCoinsByChain() {
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
                    let supportedTokens = SupportedTokens.filter(a => a.chainId == chainDataSource.chainId);
                    if (supportedTokens) {


                        obj.tokens = obj.tokens.map(token => {

                            try {
                                supportedTokens.forEach(supported => {

                                    if (supported.address && token.address) {
                                        if (supported.address.toLowerCase() == token.address.toLowerCase()) {
                                            token.tokenIsNative = supported.tokenIsNative;
                                            token.tokenIsStable = supported.tokenIsStable;
                                        }


                                    }





                                });



                                return token;
                            }
                            catch (error) {
                                console.log(error)
                            }
                        });
                    }

                    dispatch(SetPredineTokensForChainA(obj));
                }
                setShowCoinSpinner(false);

                if (tokens && tokens.length > 0) {
                    setTokenResponse(tokens);
                    setMasterAvailableToken(tokens);
                    const firstBatch = tokens.slice(0, defaultListSize);
                    setAvailableToken(firstBatch);
                    setHasMoreData(tokens.length > defaultListSize);

                    // Fetch balances for first batch if wallet connected
                    if (walletData.address) {
                        fetchBalancesForTokens(firstBatch);
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



        if (token?.price == 0) {

            let tokendata = await cryptoService.GetTokenData(token);
            token.price = tokendata?.data?.price || 0;
            console.log(token);
        }
        await props.closeTokenUI(token)
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

            // Fetch balances for filtered results if wallet connected
            if (walletData.address) {
                const unfetchedTokens = firstBatch.filter(
                    t => !fetchedBalancesRef.current.has(t.address.toLowerCase())
                );
                if (unfetchedTokens.length > 0) {
                    fetchBalancesForTokens(unfetchedTokens);
                }
            }
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

                // Fetch balances for new batch if wallet connected
                if (walletData.address) {
                    const unfetchedTokens = nextBatch.filter(
                        t => !fetchedBalancesRef.current.has(t.address.toLowerCase())
                    );
                    if (unfetchedTokens.length > 0) {
                        fetchBalancesForTokens(unfetchedTokens);
                    }
                }
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
            const unfetchedTokens = AvailableToken.filter(
                t => !fetchedBalancesRef.current.has(t.address.toLowerCase())
            );
            if (unfetchedTokens.length > 0) {
                fetchBalancesForTokens(unfetchedTokens);
            }
        }
    }, [walletData.address]);

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