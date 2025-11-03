'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { TokenBalanceService } from '@/shared/Services/TokenBalanceService';
import { UtilityService } from '@/shared/Services/UtilityService';
import { Chains, Tokens, TransactionRequestoDto, WalletConnectData } from '@/shared/Models/Common.model';
import { SupportedChains } from '@/shared/Static/SupportedChains';

import { SharedService } from "@/shared/Services/SharedService";
import { Keys } from '@/shared/Enum/Common.enum';
import { OpenWalletModalA, SetActiveTransactionA, SetWalletDataA, SetWalletDisconnectedA } from '@/app/redux-store/action/action-redux';

interface TokenBalance {
    token: Tokens;
    balance: number;
    balanceRaw: string;
    balanceUSD: number;
    price: number;
    chainId: number;
    lastUpdated: number;
}

interface EmbeddedWalletProps {
    isOpen: boolean;
    onClose: () => void;
    walletAddress?: string;
    className?: string;
}

export default function EmbeddedWallet({ isOpen, onClose, walletAddress, className = '' }: EmbeddedWalletProps) {
    const account = useAccount();
    const walletData: WalletConnectData = useSelector((state: any) => state.WalletData);
    const selectedLang = useSelector((state: any) => state.SelectedLanguage);

    const [currentView, setCurrentView] = useState<'main' | 'tokenDetail' | 'qr'>('main');
    const [activeTab, setActiveTab] = useState<'tokens' | 'nfts' | 'pools' | 'activity'>('tokens');
    const [allTokenBalances, setAllTokenBalances] = useState<TokenBalance[]>([]);
    const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
    const [loading, setLoading] = useState(false);
    const [totalBalance, setTotalBalance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [currentChain, setCurrentChain] = useState<any>(null);
    const [isChainSupported, setIsChainSupported] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showChainSelector, setShowChainSelector] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

    const tokenBalanceService = TokenBalanceService.getInstance();
    const utilityService = new UtilityService();
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);

    // Use passed walletAddress or fall back to Redux walletData
    const activeWalletAddress = walletAddress || walletData.address;

    const { disconnect, isSuccess } = useDisconnect();

    let sharedService = SharedService.getSharedServiceInstance();

    let dispatch = useDispatch();

    const {
        switchChain
    } = useSwitchChain();
    const allAvailableChains = useSelector((state: any) => state.AvailableChains);
    
    // Check if connected chain is supported and set current chain
    useEffect(() => {
        if (walletData.chainId) {
            const supportedChain = SupportedChains.find((chain: any) => chain.chainId === walletData.chainId);

            if (supportedChain) {
                setCurrentChain(supportedChain);
                setIsChainSupported(true);
            } else {
                setCurrentChain(null);
                setIsChainSupported(false);
                setAllTokenBalances([]);
                setTotalBalance(0);
            }
        }
    }, [walletData.chainId]);

    // Load all token balances when wallet or chain changes
    useEffect(() => {
        if (activeWalletAddress && currentChain && isChainSupported && isOpen) {
            loadAllTokenBalances();
        }
    }, [activeWalletAddress, currentChain, isChainSupported, isOpen]);

    // Reset view when wallet closes
    useEffect(() => {
        if (!isOpen) {
            setCurrentView('main');
            setSelectedToken(null);
            setActiveTab('tokens');
        }
    }, [isOpen]);

    // Add click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const walletElement = document.querySelector('.wallet-container');
            if (walletElement && !walletElement.contains(event.target as Node) && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const loadAllTokenBalances = async () => {
        if (!activeWalletAddress || !currentChain) return;

        setLoading(true);
        try {
            // Create chain object for TokenBalanceService
            const chainForService = new Chains();
            chainForService.chainId = currentChain.chainId;
            chainForService.chainName = currentChain.name;
            chainForService.rpcUrl = currentChain.supportedRPC;

            // First, get the native token
            const nativeToken = new Tokens();
            nativeToken.address = currentChain.nativeToken.address;
            nativeToken.symbol = currentChain.nativeToken.symbol;
            nativeToken.name = currentChain.nativeToken.name;
            nativeToken.tokenIsNative = currentChain.nativeToken.tokenIsNative;
            nativeToken.decimal = currentChain.nativeToken.decimal;
            nativeToken.chainId = currentChain.chainId;
            nativeToken.logoURI = currentChain.nativeToken.logoURI;

            // Fetch all tokens including native
            const allTokens = await tokenBalanceService.getTokenBalances(
                activeWalletAddress,
                chainForService,
                [nativeToken] // Pass native token to ensure it's included
            );

            if (allTokens.length > 0) {
                // Sort tokens by balance (highest first)
                const sortedTokens = allTokens.sort((a, b) => b.balanceUSD - a.balanceUSD);
                setAllTokenBalances(sortedTokens);

                // Calculate total balance
                const total = sortedTokens.reduce((sum, token) => sum + (token.balanceUSD || 0), 0);
                setTotalBalance(total);
            } else {
                // If no tokens returned, try to get at least the native token
                const nativeBalance = await tokenBalanceService.getSingleTokenBalance(
                    activeWalletAddress,
                    chainForService,
                    nativeToken
                );

                if (nativeBalance) {
                    setAllTokenBalances([nativeBalance]);
                    setTotalBalance(nativeBalance.balanceUSD || 0);
                } else {
                    setAllTokenBalances([]);
                    setTotalBalance(0);
                }
            }
        } catch (error) {
            console.error('Error loading token balances:', error);
            setAllTokenBalances([]);
            setTotalBalance(0);
        } finally {
            setLoading(false);
        }
    };

    const refreshBalance = async () => {
        if (!activeWalletAddress || !currentChain) return;
        setRefreshing(true);
        tokenBalanceService.clearCache(activeWalletAddress, currentChain.chainId);
        setTimeout(async () => {
            await loadAllTokenBalances();
            setRefreshing(false);
            displayToast('Balance updated!');
        }, 2000);
    };

    const switchChainSelectedByUSer = async (newChain: any) => {
        if (newChain.chainId === currentChain?.chainId) return;
        //swich chain
        // await switchChain({ chainId: newChain.chainId });
        
        // //get switched chain infor from allChains and update redux walletData state
        // let selectedChain = allAvailableChains.length > 0 ? allAvailableChains?.find(x => x.chainId == newChain?.chainId) : null;
        // if (selectedChain) {
        //     dispatch(SetWalletDataA({
        //         ...walletData,
        //         chainId: selectedChain?.chainId,
        //         chainName: selectedChain?.chainName,
        //         chainLogo: selectedChain?.logoURI,
        //         //blockExplorer: newChain.blockExplorers?.default
        //     }));
        // }

        setCurrentChain(newChain);
        setIsChainSupported(true);
        setLoading(true);
        setAllTokenBalances([]);
        setTotalBalance(0);
        setShowChainSelector(false);
        displayToast(`Switched to ${newChain.name}`);
    };

    const generateQRCode = () => {
        if (qrCanvasRef.current && typeof window !== 'undefined' && activeWalletAddress) {
            import('qrious').then(({ default: QRious }) => {
                new QRious({
                    element: qrCanvasRef.current,
                    value: activeWalletAddress,
                    size: 200,
                    foreground: '#000',
                    background: '#fff'
                });
            }).catch(console.error);
        }
    };

    const copyAddress = async () => {
        if (navigator.clipboard && activeWalletAddress) {
            try {
                await navigator.clipboard.writeText(activeWalletAddress);
                displayToast('Address copied!');
            } catch (error) {
                displayToast('Copy failed');
            }
        }
    };

    const openQRView = () => {
        generateQRCode();
        setCurrentView('qr');
    };

    const openBlockExplorer = () => {
        if (currentChain && walletData.blockExplorer) {
            const url = `${walletData.blockExplorer.url}/address/${activeWalletAddress}`;
            window.open(url, '_blank');
        }
    };

    const displayToast = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const formatBalance = (balance: number): string => {
        if (balance === 0) return '0';
        if (balance < 0.0001) return '< 0.0001';
        if (balance < 1) return balance.toFixed(4);
        if (balance < 1000) return balance.toFixed(2);
        return balance.toLocaleString();
    };

    const formatUSD = (value: number): string => {
        if (value === 0) return '$0.00';
        if (value < 0.01) return '< $0.01';
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatPercentage = (value: number): string => {
        const prefix = value >= 0 ? '+' : '';
        return `${prefix}${value.toFixed(2)}%`;
    };

    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
        displayToast(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    };

    function diconnectWallet() {
        disconnect();
        onClose();
        //clearWalletData();
    }

    function clearWalletData() {
        sharedService.removeData(Keys.WALLET_CONNECT_DATA);
        sharedService.removeData(Keys.ACTIVE_TRANASCTION_DATA);
        dispatch(SetActiveTransactionA(new TransactionRequestoDto()));
        dispatch(SetWalletDataA(new WalletConnectData()));
        dispatch(SetWalletDisconnectedA(true));
        dispatch(OpenWalletModalA(false))
    }


    if (!isOpen) return null;

    return (
        <>
            {/* Modern Wallet Container */}
            <div className="wallet-wrapper">
                <div className="wallet-container">

                    {/* Main View */}
                    <div className={`wallet-view ${currentView === 'main' ? 'active' : ''}`}>
                        {/* Header */}
                        <div className="wallet-header">
                            <div className="wallet-address" onClick={openQRView}>
                                <div className="address-avatar">
                                    <div className="avatar-gradient"></div>
                                </div>
                                <span className="address-text">
                                    {activeWalletAddress?.substring(0, 6)}...{activeWalletAddress?.substring(activeWalletAddress.length - 4)}
                                </span>
                            </div>

                            <div className="header-actions">
                                <button className="chain-selector" onClick={() => setShowChainSelector(!showChainSelector)}>
                                    {currentChain?.logoURI ? (
                                        <img src={currentChain.logoURI} alt="" className="chain-icon" />
                                    ) : (
                                        <div className="chain-icon-placeholder"></div>
                                    )}
                                    {/* <span className="chain-name">{currentChain?.name || 'Select'}</span> */}
                                    <i className="fas fa-chevron-down"></i>
                                </button>

                                <button className="icon-button" onClick={onClose}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>

                        {/* Chain Selector Dropdown */}
                        {showChainSelector && (
                            <div className="chain-dropdown">
                                {SupportedChains.map((chain: any) => (
                                    <div
                                        key={chain.chainId}
                                        className={`chain-option ${currentChain?.chainId === chain.chainId ? 'active' : ''}`}
                                        onClick={() => switchChainSelectedByUSer(chain)}
                                    >
                                        {chain.logoURI && (
                                            <img src={chain.logoURI} alt="" className="chain-icon" />
                                        )}
                                        <span>{chain.name}</span>
                                        {currentChain?.chainId === chain.chainId && (
                                            <i className="fas fa-check"></i>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Balance Section */}
                        <div className="balance-section">
                            <div className="total-balance">
                                <div className="balance-header">
                                    <span className="balance-label">Portfolio Balance</span>
                                    <button className="icon-button-sm" onClick={refreshBalance}>
                                        <i className={`fas fa-sync-alt ${refreshing ? 'spinning' : ''}`}></i>
                                    </button>
                                    <button className="icon-button-sm" onClick={toggleFavorite}>
                                        <i className={`${isFavorite ? 'fas' : 'far'} fa-star`}></i>
                                    </button>
                                </div>
                                <div className="balance-amount">
                                    {formatUSD(totalBalance)}
                                </div>
                                <div className="balance-change positive">
                                    <i className="fas fa-arrow-up"></i>
                                    <span>$4.67 (0.82%)</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="action-buttons">
                                <button className="action-btn" onClick={openQRView}>
                                    <div className="action-icon">

                                        <i className="fas fa-qrcode"></i>
                                    </div>
                                    <span>Qr Code</span>
                                </button>
                                <button className="action-btn" onClick={() => window.open("/transaction-history", "_blank", "noopener,noreferrer")}>
                                    <div className="action-icon">
                                        <i className="fas fa-history"></i>

                                    </div>
                                    <span>Transaction</span>
                                </button>

                                <button className="action-btn" onClick={openBlockExplorer}>
                                    <div className="action-icon">
                                        <i className="fas fa-external-link-alt"></i>
                                    </div>
                                    <span>Explorer</span>
                                </button>
                                <button className="action-btn" onClick={() => diconnectWallet()}>
                                    <div className="action-icon">

                                        <i className="fa-solid fa-power-off"></i>
                                    </div>
                                    <span>Disconnet</span>
                                </button>

                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="wallet-tabs">
                            <button
                                className={`tab ${activeTab === 'tokens' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tokens')}
                            >
                                <i className="fas fa-coins"></i>
                                <span>Tokens</span>
                            </button>
                            {/* <button
                                className={`tab ${activeTab === 'nfts' ? 'active' : ''}`}
                                onClick={() => setActiveTab('nfts')}
                            >
                                <i className="fas fa-images"></i>
                                <span>NFTs</span>
                            </button>
                            <button
                                className={`tab ${activeTab === 'pools' ? 'active' : ''}`}
                                onClick={() => setActiveTab('pools')}
                            >
                                <i className="fas fa-water"></i>
                                <span>Pools</span>
                            </button> */}
                            <button
                                className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
                                onClick={() => window.open("/transaction-history", "_blank", "noopener,noreferrer")}
                            >
                                <i className="fas fa-history"></i>
                                <span>Activity</span>
                            </button>
                        </div>

                        {/* Token List */}
                        <div className={`tab-content ${activeTab === 'tokens' ? 'active' : ''}`}>
                            {loading ? (
                                <div className="loading-state">
                                    <div className="skeleton-loader"></div>
                                    <div className="skeleton-loader"></div>
                                    <div className="skeleton-loader"></div>
                                </div>
                            ) : allTokenBalances.length > 0 ? (
                                <div className="token-list">
                                    {allTokenBalances.map((tokenBalance, index) => (
                                        <div
                                            key={`${tokenBalance.token.address}-${index}`}
                                            className="token-item"
                                            onClick={() => { setSelectedToken(tokenBalance); setCurrentView('tokenDetail'); }}
                                        >
                                            <div className="token-info">
                                                <div className="token-icon">
                                                    {tokenBalance.token.logoURI ? (
                                                        <img src={tokenBalance.token.logoURI} alt="" />
                                                    ) : (
                                                        <div className="token-icon-placeholder">
                                                            {tokenBalance.token.symbol?.substring(0, 2)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="token-details">
                                                    <div className="token-name">{tokenBalance.token.symbol}</div>
                                                    <div className="token-network">{tokenBalance.token.name || currentChain?.name}</div>
                                                </div>
                                            </div>
                                            <div className="token-balance">
                                                <div className="token-amount">{formatBalance(tokenBalance.balance)}</div>
                                                <div className="token-value">
                                                    <span>{formatUSD(tokenBalance.balanceUSD)}</span>
                                                    <span className={`token-change ${tokenBalance.price > 0 ? 'positive' : 'negative'}`}>
                                                        {formatPercentage(0)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-coins"></i>
                                    <p>No tokens found</p>
                                </div>
                            )}
                        </div>

                        {/* NFTs Tab */}
                        <div className={`tab-content ${activeTab === 'nfts' ? 'active' : ''}`}>
                            <div className="nft-grid">
                                <div className="nft-item">
                                    <div className="nft-image">
                                        <div className="nft-placeholder">
                                            <i className="fas fa-image"></i>
                                        </div>
                                    </div>
                                    <div className="nft-info">
                                        <span className="nft-name">CryptoPunk #1234</span>
                                        <span className="nft-price">45.2 ETH</span>
                                    </div>
                                </div>
                                <div className="nft-item">
                                    <div className="nft-image">
                                        <div className="nft-placeholder">
                                            <i className="fas fa-image"></i>
                                        </div>
                                    </div>
                                    <div className="nft-info">
                                        <span className="nft-name">Bored Ape #5678</span>
                                        <span className="nft-price">28.1 ETH</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pools Tab */}
                        <div className={`tab-content ${activeTab === 'pools' ? 'active' : ''}`}>
                            <div className="empty-state">
                                <i className="fas fa-water"></i>
                                <p>No liquidity positions</p>
                            </div>
                        </div>

                        {/* Activity Tab */}
                        <div className={`tab-content ${activeTab === 'activity' ? 'active' : ''}`}>
                            <div className="activity-list">
                                <div className="activity-item">
                                    <div className="activity-icon send">
                                        <i className="fas fa-arrow-up"></i>
                                    </div>
                                    <div className="activity-details">
                                        <span className="activity-type">Sent</span>
                                        <span className="activity-time">2 hours ago</span>
                                    </div>
                                    <div className="activity-amount negative">
                                        -0.005 ETH
                                    </div>
                                </div>
                                <div className="activity-item">
                                    <div className="activity-icon receive">
                                        <i className="fas fa-arrow-down"></i>
                                    </div>
                                    <div className="activity-details">
                                        <span className="activity-type">Received</span>
                                        <span className="activity-time">1 day ago</span>
                                    </div>
                                    <div className="activity-amount positive">
                                        +0.001 ETH
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* QR Code View */}
                    <div className={`wallet-view qr-view ${currentView === 'qr' ? 'active' : ''}`}>
                        <div className="detail-header">
                            <button className="back-button" onClick={() => setCurrentView('main')}>
                                <i className="fas fa-arrow-left"></i>
                            </button>
                            <div className="detail-title">
                                <span>Wallet Address</span>
                                <span className="detail-network">Scan or Copy</span>
                            </div>
                            <button className="icon-button" onClick={() => setCurrentView('main')}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="detail-content">
                            <div className="qr-section">
                                <div className="qr-container inline">
                                    <canvas ref={qrCanvasRef}></canvas>
                                </div>
                                <div className="address-display inline">
                                    <span>{activeWalletAddress}</span>
                                </div>
                                <div className="qr-actions">
                                    <button className="primary-button full-width" onClick={copyAddress}>
                                        <i className="fas fa-copy"></i>
                                        Copy Address
                                    </button>
                                    <button className="secondary-button full-width" onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({
                                                title: 'My Wallet Address',
                                                text: activeWalletAddress || ''
                                            });
                                        } else {
                                            copyAddress();
                                        }
                                    }}>
                                        <i className="fas fa-share"></i>
                                        Share Address
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Token Detail View */}
                    <div className={`wallet-view token-detail-view ${currentView === 'tokenDetail' ? 'active' : ''}`}>
                        {selectedToken && (
                            <>
                                <div className="detail-header">
                                    <button className="back-button" onClick={() => setCurrentView('main')}>
                                        <i className="fas fa-arrow-left"></i>
                                    </button>
                                    <div className="detail-title">
                                        <span>{selectedToken.token.symbol}</span>
                                        <span className="detail-network">{currentChain?.name}</span>
                                    </div>
                                    <button className="icon-button">
                                        <i className="fas fa-ellipsis-v"></i>
                                    </button>
                                </div>

                                <div className="detail-content">
                                    <div className="token-detail-balance">
                                        <div className="detail-token-icon">
                                            {selectedToken.token.logoURI ? (
                                                <img src={selectedToken.token.logoURI} alt="" />
                                            ) : (
                                                <div className="token-icon-placeholder large">
                                                    {selectedToken.token.symbol?.substring(0, 2)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="detail-balance-amount">
                                            {formatBalance(selectedToken.balance)} {selectedToken.token.symbol}
                                        </div>
                                        <div className="detail-balance-value">
                                            {formatUSD(selectedToken.balanceUSD)}
                                        </div>
                                    </div>

                                    <div className="price-chart">
                                        <div className="chart-placeholder">
                                            <i className="fas fa-chart-line"></i>
                                            <span>Price Chart</span>
                                        </div>
                                    </div>

                                    <div className="token-stats">
                                        <div className="stat-item">
                                            <span className="stat-label">Price</span>
                                            <span className="stat-value">{formatUSD(selectedToken.price)}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">24h Change</span>
                                            <span className="stat-value positive">+0.00%</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Market Cap</span>
                                            <span className="stat-value">$555.2B</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Volume</span>
                                            <span className="stat-value">$12.4B</span>
                                        </div>
                                    </div>

                                    <div className="detail-actions">
                                        <button className="primary-button">
                                            <i className="fas fa-paper-plane"></i>
                                            Send
                                        </button>
                                        <button className="secondary-button">
                                            <i className="fas fa-exchange-alt"></i>
                                            Swap
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Toast */}
                {showToast && (
                    <div className="toast-notification">
                        <i className="fas fa-check-circle"></i>
                        <span>{toastMessage}</span>
                    </div>
                )}
            </div >


        </>
    );
}