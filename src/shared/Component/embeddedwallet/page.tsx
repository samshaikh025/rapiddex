'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAccount, useDisconnect } from 'wagmi';
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

    const switchChain = async (newChain: any) => {
        if (newChain.chainId === currentChain?.chainId) return;
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
        clearWalletData();
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
                                        onClick={() => switchChain(chain)}
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
                                <button className="action-btn" onClick={() => window.location.href = "/transaction-history"}>
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
                                onClick={() => window.location.href = "/transaction-history"}
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

            {/* Styles */}
            < style jsx > {`
                .wallet-wrapper {
                    position: fixed;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    background: transparent;
                    pointer-events: none;
                    z-index: 9999;
                }

                .wallet-container {
                    position: absolute;
                    top: 70px;
                    right: 20px;
                    width: 440px;
                    max-width: calc(100vw - 40px);
                    max-height: calc(100vh - 90px);
                    background: #ffffff;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                    display: flex;
                    flex-direction: column;
                    pointer-events: auto;
                }

                .wallet-view {
                    display: none;
                    flex-direction: column;
                    height: 100%;
                    animation: slideOut 0.3s ease;
                }

                .wallet-view.active {
                    display: flex;
                    animation: slideIn 0.3s ease;
                }

                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(-100%); opacity: 0; }
                }

                /* Header */
                .wallet-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid #f0f0f0;
                }

                .wallet-address {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    padding: 8px 12px;
                    border-radius: 12px;
                    transition: background 0.2s;
                }

                .wallet-address:hover {
                    background: #f8f9fa;
                }

                .address-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    overflow: hidden;
                }

                .avatar-gradient {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }

                .address-text {
                    font-size: 14px;
                    font-weight: 500;
                    color: #1a1a1a;
                    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
                }

                .header-actions {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .chain-selector {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    border: 1px solid #e0e0e0;
                    border-radius: 12px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 14px;
                    font-weight: 500;
                }

                .chain-selector:hover {
                    border-color: #667eea;
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
                }

                .chain-icon {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                }

                .chain-icon-placeholder {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }

                .chain-name {
                    color: #1a1a1a;
                }

                .chain-selector i {
                    font-size: 10px;
                    color: #666;
                    transition: transform 0.2s;
                }

                .chain-dropdown {
                    position: absolute;
                    top: 70px;
                    right: 20px;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                    z-index: 100;
                    overflow: hidden;
                    min-width: 200px;
                }

                .chain-option {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 16px;
                    cursor: pointer;
                    transition: background 0.2s;
                    font-size: 14px;
                    font-weight: 500;
                }

                .chain-option:hover {
                    background: #f8f9fa;
                }

                .chain-option.active {
                    background: #f0f4ff;
                    color: #667eea;
                }

                .chain-option i {
                    margin-left: auto;
                    color: #667eea;
                }

                /* Icon Buttons */
                .icon-button {
                    width: 36px;
                    height: 36px;
                    border-radius: 12px;
                    border: none;
                    background: #f8f9fa;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #666;
                }

                .icon-button:hover {
                    background: #e9ecef;
                    transform: scale(1.05);
                }

                .icon-button-sm {
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    border: none;
                    background: transparent;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #666;
                }

                .icon-button-sm:hover {
                    background: #f8f9fa;
                }

                /* Balance Section */
                .balance-section {
                    padding: 24px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
                }

                .total-balance {
                    text-align: center;
                    margin-bottom: 24px;
                }

                .balance-header {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: 8px;
                }

                .balance-label {
                    font-size: 13px;
                    color: #666;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .balance-amount {
                    font-size: 42px;
                    font-weight: 700;
                    color: #1a1a1a;
                    line-height: 1;
                    margin-bottom: 8px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }

                .balance-change {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 500;
                }

                .balance-change.positive {
                    background: #e8f5e9;
                    color: #2e7d32;
                }

                .balance-change.negative {
                    background: #ffebee;
                    color: #c62828;
                }

                .balance-change i {
                    font-size: 10px;
                }

                /* Action Buttons */
                .action-buttons {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }

                .action-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 0;
                    border: none;
                    background: none;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .action-btn:hover {
                    transform: translateY(-2px);
                }

                .action-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 16px;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    transition: all 0.2s;
                }

                .action-btn:hover .action-icon {
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .action-btn span {
                    font-size: 12px;
                    font-weight: 500;
                    color: #666;
                }

                /* Tabs */
                .wallet-tabs {
                    display: flex;
                    padding: 0 16px;
                    border-bottom: 1px solid #f0f0f0;
                    background: #fafafa;
                }

                .tab {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 14px 0;
                    border: none;
                    background: none;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    color: #999;
                    position: relative;
                    transition: all 0.2s;
                }

                .tab:hover {
                    color: #666;
                }

                .tab.active {
                    color: #667eea;
                }

                .tab.active::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 20%;
                    right: 20%;
                    height: 2px;
                    background: #667eea;
                    border-radius: 2px;
                }

                .tab i {
                    font-size: 14px;
                }

                /* Tab Content */
                .tab-content {
                    display: none;
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: 16px;
                    min-height: 0;
                    max-height: calc(100% - 280px);
                }

                .tab-content.active {
                    display: block;
                }

                .tab-content::-webkit-scrollbar {
                    width: 6px;
                }

                .tab-content::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 3px;
                }

                .tab-content::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 3px;
                }

                .tab-content::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }

                /* Token List */
                .token-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .token-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    min-height: 64px;
                }

                .token-item:hover {
                    background: #f8f9fa;
                    transform: translateX(4px);
                }

                .token-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                    min-width: 0;
                }

                .token-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .token-icon img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .token-icon-placeholder {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 600;
                    font-size: 14px;
                }

                .token-icon-placeholder.large {
                    width: 64px;
                    height: 64px;
                    font-size: 20px;
                }

                .token-details {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                    flex: 1;
                }

                .token-name {
                    font-size: 15px;
                    font-weight: 600;
                    color: #1a1a1a;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .token-network {
                    font-size: 12px;
                    color: #999;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .token-balance {
                    text-align: right;
                    flex-shrink: 0;
                    max-width: 45%;
                }

                .token-amount {
                    font-size: 15px;
                    font-weight: 600;
                    color: #1a1a1a;
                    font-family: 'SF Mono', 'Monaco', monospace;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .token-value {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 6px;
                    font-size: 12px;
                    color: #666;
                }

                .token-change {
                    font-size: 11px;
                    font-weight: 500;
                    white-space: nowrap;
                }

                .token-change.positive {
                    color: #2e7d32;
                }

                .token-change.negative {
                    color: #c62828;
                }

                /* NFT Grid */
                .nft-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                }

                .nft-item {
                    border-radius: 12px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: transform 0.2s;
                    background: #f8f9fa;
                }

                .nft-item:hover {
                    transform: scale(1.02);
                }

                .nft-image {
                    aspect-ratio: 1;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .nft-placeholder {
                    color: white;
                    opacity: 0.5;
                    font-size: 32px;
                }

                .nft-info {
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .nft-name {
                    font-size: 13px;
                    font-weight: 600;
                    color: #1a1a1a;
                }

                .nft-price {
                    font-size: 12px;
                    color: #666;
                }

                /* Activity List */
                .activity-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .activity-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 12px;
                    background: #f8f9fa;
                }

                .activity-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 14px;
                }

                .activity-icon.send {
                    background: #ef5350;
                }

                .activity-icon.receive {
                    background: #66bb6a;
                }

                .activity-details {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .activity-type {
                    font-size: 14px;
                    font-weight: 500;
                    color: #1a1a1a;
                }

                .activity-time {
                    font-size: 12px;
                    color: #999;
                }

                .activity-amount {
                    font-size: 14px;
                    font-weight: 600;
                    font-family: 'SF Mono', 'Monaco', monospace;
                }

                .activity-amount.positive {
                    color: #2e7d32;
                }

                .activity-amount.negative {
                    color: #c62828;
                }

                /* Empty State */
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 48px;
                    color: #999;
                }

                .empty-state i {
                    font-size: 48px;
                    margin-bottom: 16px;
                    opacity: 0.3;
                }

                .empty-state p {
                    font-size: 14px;
                    margin: 0;
                }

                /* Loading State */
                .loading-state {
                    padding: 20px;
                }

                .skeleton-loader {
                    height: 60px;
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                    border-radius: 12px;
                    margin-bottom: 12px;
                }

                @keyframes loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                /* Token Detail View */
                .token-detail-view {
                    background: white;
                }

                .detail-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 20px;
                    border-bottom: 1px solid #f0f0f0;
                }

                .back-button {
                    width: 36px;
                    height: 36px;
                    border-radius: 12px;
                    border: none;
                    background: #f8f9fa;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #666;
                }

                .back-button:hover {
                    background: #e9ecef;
                    transform: scale(1.05);
                }

                .detail-title {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .detail-title span:first-child {
                    font-size: 18px;
                    font-weight: 600;
                    color: #1a1a1a;
                }

                .detail-network {
                    font-size: 12px;
                    color: #999;
                }

                .detail-content {
                    padding: 24px;
                    overflow-y: auto;
                    flex: 1;
                }

                .token-detail-balance {
                    text-align: center;
                    margin-bottom: 32px;
                }

                .detail-token-icon {
                    width: 64px;
                    height: 64px;
                    margin: 0 auto 16px;
                    border-radius: 50%;
                    overflow: hidden;
                }

                .detail-token-icon img {
                    width: 100%;
                    height: 100%;
                }

                .detail-balance-amount {
                    font-size: 28px;
                    font-weight: 600;
                    color: #1a1a1a;
                    margin-bottom: 8px;
                }

                .detail-balance-value {
                    font-size: 18px;
                    color: #666;
                }

                .price-chart {
                    margin-bottom: 32px;
                }

                .chart-placeholder {
                    height: 180px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #999;
                    gap: 8px;
                }

                .chart-placeholder i {
                    font-size: 32px;
                    opacity: 0.5;
                }

                .token-stats {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                    margin-bottom: 32px;
                }

                .stat-item {
                    padding: 16px;
                    background: #f8f9fa;
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .stat-label {
                    font-size: 12px;
                    color: #999;
                    font-weight: 500;
                }

                .stat-value {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1a1a1a;
                }

                .stat-value.positive {
                    color: #2e7d32;
                }

                .stat-value.negative {
                    color: #c62828;
                }

                .detail-actions {
                    display: flex;
                    gap: 12px;
                }

                /* QR View */
                .qr-view {
                    background: white;
                }

                .qr-section {
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 24px;
                }

                .qr-container.inline {
                    display: flex;
                    justify-content: center;
                    padding: 24px;
                    background: white;
                    border-radius: 16px;
                    border: 2px solid #f0f0f0;
                }

                .address-display.inline {
                    padding: 16px;
                    background: #f8f9fa;
                    border-radius: 12px;
                    word-break: break-all;
                    font-family: 'SF Mono', 'Monaco', monospace;
                    font-size: 14px;
                    color: #1a1a1a;
                    text-align: center;
                    max-width: 100%;
                }

                .qr-actions {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                /* Buttons */
                .primary-button {
                    flex: 1;
                    padding: 14px 24px;
                    border-radius: 12px;
                    border: none;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .primary-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
                }

                .primary-button.full-width {
                    width: 100%;
                }

                .secondary-button {
                    flex: 1;
                    padding: 14px 24px;
                    border-radius: 12px;
                    border: 1px solid #e0e0e0;
                    background: white;
                    color: #667eea;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .secondary-button:hover {
                    border-color: #667eea;
                    background: #f0f4ff;
                }

                .secondary-button.full-width {
                    width: 100%;
                }

                /* Toast */
                .toast-notification {
                    position: fixed;
                    bottom: 24px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #1a1a1a;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    z-index: 10001;
                    animation: slideUp 0.3s ease;
                }

                @keyframes slideUp {
                    from {
                        transform: translate(-50%, 100%);
                        opacity: 0;
                    }
                    to {
                        transform: translate(-50%, 0);
                        opacity: 1;
                    }
                }

                .toast-notification i {
                    color: #66bb6a;
                }

                /* Utilities */
                .spinning {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* Mobile Offcanvas Styles */
                .offcanvas-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 1040;
                    opacity: 0;
                    transition: opacity 0.3s;
                    pointer-events: none;
                }

                .offcanvas-backdrop.show {
                    opacity: 1;
                    pointer-events: auto;
                }

                .wallet-offcanvas {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 85vh;
                    background: white;
                    border-radius: 24px 24px 0 0;
                    z-index: 1050;
                    transform: translateY(100%);
                    transition: transform 0.3s ease-in-out;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .wallet-offcanvas.show {
                    transform: translateY(0);
                }

                .wallet-offcanvas-content {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .wallet-offcanvas .offcanvas-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid #f0f0f0;
                    background: #fafafa;
                }

                .wallet-offcanvas .offcanvas-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #1a1a1a;
                    margin: 0;
                }

                .wallet-offcanvas .btn-close {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    border: none;
                    background: transparent;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #666;
                }

                .wallet-offcanvas .btn-close:hover {
                    background: #f0f0f0;
                }

                .wallet-offcanvas .offcanvas-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0;
                }

                /* Mobile specific styles */
                .mobile-wallet-header {
                    padding: 16px;
                    background: #f8f9fa;
                    cursor: pointer;
                }

                .address-section {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .address-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .mobile-balance-section {
                    padding: 24px;
                    text-align: center;
                    background: white;
                }

                .mobile-balance-section .balance-label {
                    font-size: 12px;
                    color: #999;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 8px;
                }

                .mobile-balance-section .balance-amount {
                    font-size: 36px;
                    font-weight: 700;
                    color: #1a1a1a;
                    margin-bottom: 8px;
                }

                .mobile-action-buttons {
                    display: flex;
                    justify-content: space-around;
                    padding: 16px;
                    background: white;
                    border-bottom: 1px solid #f0f0f0;
                }

                .mobile-action-buttons .action-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    padding: 8px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    color: #666;
                }

                .mobile-action-buttons .action-btn i {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    background: #f8f9fa;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                }

                .mobile-action-buttons .action-btn span {
                    font-size: 11px;
                    font-weight: 500;
                }

                .mobile-tabs {
                    display: flex;
                    padding: 0 16px;
                    background: #fafafa;
                    border-bottom: 1px solid #f0f0f0;
                }

                .mobile-tabs .tab {
                    flex: 1;
                    padding: 14px 0;
                    border: none;
                    background: none;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    color: #999;
                    position: relative;
                }

                .mobile-tabs .tab.active {
                    color: #667eea;
                }

                .mobile-tabs .tab.active::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: #667eea;
                }

                .mobile-token-list {
                    padding: 16px;
                    flex: 1;
                    overflow-y: auto;
                }

                .mobile-token-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    margin-bottom: 8px;
                    border-radius: 12px;
                    background: #f8f9fa;
                    cursor: pointer;
                }

                .mobile-token-item:active {
                    background: #e9ecef;
                }

                .mobile-token-item .token-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    overflow: hidden;
                }

                .mobile-token-item .token-icon img {
                    width: 100%;
                    height: 100%;
                }

                .mobile-token-item .token-info {
                    flex: 1;
                }

                .mobile-token-item .token-name {
                    font-size: 15px;
                    font-weight: 600;
                    color: #1a1a1a;
                }

                .mobile-token-item .token-network {
                    font-size: 12px;
                    color: #999;
                }

                .mobile-token-item .token-balance {
                    text-align: right;
                }

                .mobile-token-item .token-amount {
                    font-size: 15px;
                    font-weight: 600;
                    color: #1a1a1a;
                }

                .mobile-token-item .token-value {
                    font-size: 12px;
                    color: #666;
                }

                .mobile-qr-view,
                .mobile-token-detail {
                    padding: 20px;
                }

                .back-button {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    border: none;
                    background: #f8f9fa;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #666;
                }

                .qr-content,
                .token-detail-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                }

                .qr-content canvas {
                    border: 2px solid #f0f0f0;
                    border-radius: 12px;
                    padding: 20px;
                }

                .qr-content .address-display {
                    padding: 12px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    word-break: break-all;
                    font-family: monospace;
                    font-size: 13px;
                    width: 100%;
                    text-align: center;
                }

                .token-icon.large {
                    width: 80px;
                    height: 80px;
                }

                .token-icon-placeholder.large {
                    font-size: 24px;
                }

                .token-actions {
                    display: flex;
                    gap: 12px;
                    width: 100%;
                }

                .primary-button,
                .secondary-button {
                    flex: 1;
                    padding: 14px;
                    border-radius: 12px;
                    border: none;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .primary-button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .secondary-button {
                    background: white;
                    color: #667eea;
                    border: 1px solid #667eea;
                }

                .mobile-toast {
                    position: fixed;
                    bottom: 100px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #1a1a1a;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    z-index: 1060;
                    animation: slideUp 0.3s ease;
                }

                /* Responsive adjustments */
                @media (max-width: 480px) {
                    .wallet-container {
                        top: 60px;
                        right: 10px;
                        left: 10px;
                        width: auto;
                        max-width: none;
                    }

                    .balance-amount {
                        font-size: 36px;
                    }
                    
                    .action-buttons {
                        padding: 0 8px;
                    }
                    
                    .action-btn span {
                        font-size: 11px;
                    }
                }
            `}</style >
        </>
    );
}