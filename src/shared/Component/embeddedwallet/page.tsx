'use client'
import React, { useState, useEffect, useRef } from 'react';

interface TokenBalance {
    token: {
        symbol: string;
        name: string;
        address: string;
        logoURI?: string;
        decimal: number;
    };
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
    const [currentView, setCurrentView] = useState<'main' | 'tokenDetail' | 'qr'>('main');
    const [activeTab, setActiveTab] = useState<'tokens' | 'nfts' | 'pools' | 'activity'>('tokens');
    const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [totalBalance] = useState(29.57);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    const qrCanvasRef = useRef<HTMLCanvasElement>(null);

    // Mock data for demonstration
    const mockTokens: TokenBalance[] = [
        {
            token: {
                symbol: 'SOLVBTC',
                name: 'Solv Protocol SolvBTC',
                address: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c',
                decimal: 18,
                logoURI: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png'
            },
            balance: 0.0001,
            balanceRaw: '100000000000000',
            balanceUSD: 11.19,
            price: 111900,
            chainId: 56,
            lastUpdated: Date.now()
        },
        {
            token: {
                symbol: 'SLISBNB',
                name: 'Lista Staked BNB',
                address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
                decimal: 18,
                logoURI: 'https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png'
            },
            balance: 0.0108,
            balanceRaw: '10800000000000000',
            balanceUSD: 9.75,
            price: 902.78,
            chainId: 56,
            lastUpdated: Date.now()
        },
        {
            token: {
                symbol: 'BTCB',
                name: 'Binance Bitcoin',
                address: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c',
                decimal: 18,
                logoURI: 'https://coin-images.coingecko.com/coins/images/14108/large/Binance-bitcoin.png'
            },
            balance: 0.0001,
            balanceRaw: '100000000000000',
            balanceUSD: 2.51,
            price: 25100,
            chainId: 56,
            lastUpdated: Date.now()
        },
        {
            token: {
                symbol: 'REX',
                name: 'REVOX',
                address: '0x8f0528ce5ef7b51152a59745befdd91d97091d2f',
                decimal: 18
            },
            balance: 41.30,
            balanceRaw: '41300000000000000000',
            balanceUSD: 2.44,
            price: 0.059,
            chainId: 56,
            lastUpdated: Date.now()
        },
        {
            token: {
                symbol: 'BNB',
                name: 'BNB',
                address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
                decimal: 18,
                logoURI: 'https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png'
            },
            balance: 0.0021,
            balanceRaw: '2100000000000000',
            balanceUSD: 1.86,
            price: 885.71,
            chainId: 56,
            lastUpdated: Date.now()
        },
        {
            token: {
                symbol: 'CHEEMS',
                name: 'Cheems Token',
                address: '0x33a51b4037c5c5f24b33ad3b16c62b1aa43bc8be',
                decimal: 18
            },
            balance: 1502827.194,
            balanceRaw: '1502827194000000000000000',
            balanceUSD: 1.74,
            price: 0.00000116,
            chainId: 56,
            lastUpdated: Date.now()
        }
    ];

    const activeWalletAddress = walletAddress || '0x6539...B53f';

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Reset view when wallet closes
    useEffect(() => {
        if (!isOpen) {
            setCurrentView('main');
            setSelectedToken(null);
            setActiveTab('tokens');
        }
    }, [isOpen]);

    // Add click outside handler for desktop
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!isMobile) {
                const walletElement = document.querySelector('.wallet-container');
                if (walletElement && !walletElement.contains(event.target as Node) && isOpen) {
                    onClose();
                }
            }
        };

        if (isOpen && !isMobile) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, isMobile]);

    const generateQRCode = () => {
        if (qrCanvasRef.current && activeWalletAddress) {
            const canvas = qrCanvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = 200;
                canvas.height = 200;

                // Create a simple QR-like pattern
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, 200, 200);

                ctx.fillStyle = '#000000';
                const size = 8;
                for (let x = 0; x < 200; x += size) {
                    for (let y = 0; y < 200; y += size) {
                        if (Math.random() > 0.5) {
                            ctx.fillRect(x, y, size - 1, size - 1);
                        }
                    }
                }

                // Add corner squares
                ctx.fillRect(20, 20, 40, 40);
                ctx.fillRect(140, 20, 40, 40);
                ctx.fillRect(20, 140, 40, 40);

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(30, 30, 20, 20);
                ctx.fillRect(150, 30, 20, 20);
                ctx.fillRect(30, 150, 20, 20);
            }
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

    const refreshBalance = async () => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
            displayToast('Balance updated!');
        }, 2000);
    };

    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
        displayToast(isFavorite ? 'Removed from favorites' : 'Added to favorites');
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

    if (!isOpen) return null;

    // Mobile Layout
    if (isMobile) {
        return (
            <>
                <div className="mobile-backdrop" onClick={onClose}></div>

                <div className="mobile-wallet">
                    <div className="mobile-handle"></div>

                    {currentView === 'main' && (
                        <div className="mobile-content">
                            <div className="mobile-header">
                                <div className="mobile-wallet-info">
                                    <div className="mobile-avatar"></div>
                                    <div className="mobile-address-info">
                                        <span className="mobile-address">{activeWalletAddress}</span>
                                        <span className="mobile-network">BNB Smart Chain Mainnet</span>
                                    </div>
                                </div>
                                <button className="mobile-close" onClick={onClose}>×</button>
                            </div>

                            <div className="mobile-balance-section">
                                <div className="mobile-balance-header">
                                    <span className="mobile-balance-label">PORTFOLIO BALANCE</span>
                                    <div className="mobile-balance-actions">
                                        <button onClick={refreshBalance} className={refreshing ? 'spinning' : ''}>
                                            🔄
                                        </button>
                                        <button onClick={toggleFavorite}>
                                            {isFavorite ? '⭐' : '☆'}
                                        </button>
                                    </div>
                                </div>
                                <div className="mobile-balance-amount">${totalBalance}</div>
                                <div className="mobile-balance-change">⬆ $4.67 (0.82%)</div>
                            </div>

                            <div className="mobile-actions">
                                <button className="mobile-action-btn">
                                    <div className="mobile-action-icon">⬆</div>
                                    <span>Send</span>
                                </button>
                                <button className="mobile-action-btn" onClick={openQRView}>
                                    <div className="mobile-action-icon">⬇</div>
                                    <span>Receive</span>
                                </button>
                                <button className="mobile-action-btn">
                                    <div className="mobile-action-icon">⇄</div>
                                    <span>Swap</span>
                                </button>
                                <button className="mobile-action-btn">
                                    <div className="mobile-action-icon">↗</div>
                                    <span>Explorer</span>
                                </button>
                            </div>

                            <div className="mobile-tabs">
                                <button
                                    className={`mobile-tab ${activeTab === 'tokens' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('tokens')}
                                >
                                    💰 Tokens
                                </button>
                                <button
                                    className={`mobile-tab ${activeTab === 'nfts' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('nfts')}
                                >
                                    🖼 NFTs
                                </button>
                                <button
                                    className={`mobile-tab ${activeTab === 'pools' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('pools')}
                                >
                                    💧 Pools
                                </button>
                                <button
                                    className={`mobile-tab ${activeTab === 'activity' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('activity')}
                                >
                                    📜 Activity
                                </button>
                            </div>

                            {activeTab === 'tokens' && (
                                <div className="mobile-token-list">
                                    {mockTokens.map((token, index) => (
                                        <div
                                            key={index}
                                            className="mobile-token-item"
                                            onClick={() => { setSelectedToken(token); setCurrentView('tokenDetail'); }}
                                        >
                                            <div className="mobile-token-icon">
                                                {token.token.logoURI ? (
                                                    <img src={token.token.logoURI} alt={token.token.symbol} />
                                                ) : (
                                                    <div className="token-placeholder">
                                                        {token.token.symbol.substring(0, 2)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mobile-token-info">
                                                <div className="mobile-token-name">{token.token.symbol}</div>
                                                <div className="mobile-token-network">{token.token.name}</div>
                                            </div>
                                            <div className="mobile-token-balance">
                                                <div className="mobile-token-amount">{formatBalance(token.balance)}</div>
                                                <div className="mobile-token-value">
                                                    <span>{formatUSD(token.balanceUSD)}</span>
                                                    <span className="mobile-token-change">+0.00%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'nfts' && (
                                <div className="mobile-empty-state">
                                    <div>🖼</div>
                                    <p>No NFTs found</p>
                                </div>
                            )}

                            {activeTab === 'pools' && (
                                <div className="mobile-empty-state">
                                    <div>💧</div>
                                    <p>No liquidity pools</p>
                                </div>
                            )}

                            {activeTab === 'activity' && (
                                <div className="mobile-activity-list">
                                    <div className="mobile-activity-item">
                                        <div className="mobile-activity-icon send">⬆</div>
                                        <div className="mobile-activity-details">
                                            <span className="mobile-activity-type">Sent</span>
                                            <span className="mobile-activity-time">2 hours ago</span>
                                        </div>
                                        <div className="mobile-activity-amount negative">-0.005 ETH</div>
                                    </div>
                                    <div className="mobile-activity-item">
                                        <div className="mobile-activity-icon receive">⬇</div>
                                        <div className="mobile-activity-details">
                                            <span className="mobile-activity-type">Received</span>
                                            <span className="mobile-activity-time">1 day ago</span>
                                        </div>
                                        <div className="mobile-activity-amount positive">+0.001 ETH</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {currentView === 'qr' && (
                        <div className="mobile-content">
                            <div className="mobile-header">
                                <button className="mobile-back" onClick={() => setCurrentView('main')}>← Back</button>
                                <span className="mobile-title">Wallet Address</span>
                                <div></div>
                            </div>

                            <div className="mobile-qr-content">
                                <div className="mobile-qr-container">
                                    <canvas ref={qrCanvasRef}></canvas>
                                </div>
                                <div className="mobile-address-display">{activeWalletAddress}</div>
                                <button className="mobile-copy-btn" onClick={copyAddress}>
                                    📋 Copy Address
                                </button>
                                <button className="mobile-share-btn" onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: 'My Wallet Address',
                                            text: activeWalletAddress || ''
                                        });
                                    } else {
                                        copyAddress();
                                    }
                                }}>
                                    📤 Share Address
                                </button>
                            </div>
                        </div>
                    )}

                    {currentView === 'tokenDetail' && selectedToken && (
                        <div className="mobile-content">
                            <div className="mobile-header">
                                <button className="mobile-back" onClick={() => setCurrentView('main')}>← Back</button>
                                <span className="mobile-title">{selectedToken.token.symbol}</span>
                                <button className="mobile-more">⋯</button>
                            </div>

                            <div className="mobile-token-detail">
                                <div className="mobile-detail-icon">
                                    {selectedToken.token.logoURI ? (
                                        <img src={selectedToken.token.logoURI} alt={selectedToken.token.symbol} />
                                    ) : (
                                        <div className="token-placeholder large">
                                            {selectedToken.token.symbol.substring(0, 2)}
                                        </div>
                                    )}
                                </div>
                                <div className="mobile-detail-balance">
                                    {formatBalance(selectedToken.balance)} {selectedToken.token.symbol}
                                </div>
                                <div className="mobile-detail-value">{formatUSD(selectedToken.balanceUSD)}</div>

                                <div className="mobile-chart-placeholder">
                                    <div className="chart-icon">📈</div>
                                    <span>Price Chart</span>
                                </div>

                                <div className="mobile-token-stats">
                                    <div className="mobile-stat-item">
                                        <span className="mobile-stat-label">Price</span>
                                        <span className="mobile-stat-value">{formatUSD(selectedToken.price)}</span>
                                    </div>
                                    <div className="mobile-stat-item">
                                        <span className="mobile-stat-label">24h Change</span>
                                        <span className="mobile-stat-value positive">+0.00%</span>
                                    </div>
                                </div>

                                <div className="mobile-detail-actions">
                                    <button className="mobile-detail-btn primary">
                                        ⬆ Send
                                    </button>
                                    <button className="mobile-detail-btn secondary">
                                        ⇄ Swap
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </>
        );
    }

    // Desktop Layout
    return (
        <>
            <div className="desktop-wallet-wrapper">
                <div className="wallet-container">
                    {currentView === 'main' && (
                        <div className="desktop-content">
                            <div className="desktop-header">
                                <div className="desktop-wallet-address" onClick={openQRView}>
                                    <div className="desktop-avatar"></div>
                                    <span>{activeWalletAddress}</span>
                                </div>
                                <div className="desktop-header-actions">
                                    <button className="desktop-chain-btn">
                                        <span>🟡</span>
                                        <span>BNB Smart Chain</span>
                                        <span>▼</span>
                                    </button>
                                    <button className="desktop-close" onClick={onClose}>×</button>
                                </div>
                            </div>

                            <div className="desktop-balance-section">
                                <div className="desktop-balance-header">
                                    <span>Portfolio Balance</span>
                                    <div className="desktop-balance-actions">
                                        <button onClick={refreshBalance} className={refreshing ? 'spinning' : ''}>
                                            🔄
                                        </button>
                                        <button onClick={toggleFavorite}>
                                            {isFavorite ? '⭐' : '☆'}
                                        </button>
                                    </div>
                                </div>
                                <div className="desktop-balance-amount">${totalBalance}</div>
                                <div className="desktop-balance-change">⬆ $4.67 (0.82%)</div>

                                <div className="desktop-actions">
                                    <button className="desktop-action-btn">
                                        <div>⬆</div>
                                        <span>Send</span>
                                    </button>
                                    <button className="desktop-action-btn" onClick={openQRView}>
                                        <div>⬇</div>
                                        <span>Receive</span>
                                    </button>
                                    <button className="desktop-action-btn">
                                        <div>⇄</div>
                                        <span>Swap</span>
                                    </button>
                                    <button className="desktop-action-btn">
                                        <div>↗</div>
                                        <span>Explorer</span>
                                    </button>
                                </div>
                            </div>

                            <div className="desktop-tabs">
                                <button
                                    className={`desktop-tab ${activeTab === 'tokens' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('tokens')}
                                >
                                    💰 Tokens
                                </button>
                                <button
                                    className={`desktop-tab ${activeTab === 'nfts' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('nfts')}
                                >
                                    🖼 NFTs
                                </button>
                                <button
                                    className={`desktop-tab ${activeTab === 'pools' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('pools')}
                                >
                                    💧 Pools
                                </button>
                                <button
                                    className={`desktop-tab ${activeTab === 'activity' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('activity')}
                                >
                                    📜 Activity
                                </button>
                            </div>

                            {activeTab === 'tokens' && (
                                <div className="desktop-token-list">
                                    {mockTokens.map((token, index) => (
                                        <div
                                            key={index}
                                            className="desktop-token-item"
                                            onClick={() => { setSelectedToken(token); setCurrentView('tokenDetail'); }}
                                        >
                                            <div className="desktop-token-left">
                                                <div className="desktop-token-icon">
                                                    {token.token.logoURI ? (
                                                        <img src={token.token.logoURI} alt={token.token.symbol} />
                                                    ) : (
                                                        <div className="token-placeholder">
                                                            {token.token.symbol.substring(0, 2)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="desktop-token-name">{token.token.symbol}</div>
                                                    <div className="desktop-token-network">{token.token.name}</div>
                                                </div>
                                            </div>
                                            <div className="desktop-token-right">
                                                <div className="desktop-token-amount">{formatBalance(token.balance)}</div>
                                                <div className="desktop-token-value">
                                                    <span>{formatUSD(token.balanceUSD)}</span>
                                                    <span className="desktop-token-change">+0.00%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'nfts' && (
                                <div className="desktop-empty-state">
                                    <div>🖼</div>
                                    <p>No NFTs found</p>
                                </div>
                            )}

                            {activeTab === 'pools' && (
                                <div className="desktop-empty-state">
                                    <div>💧</div>
                                    <p>No liquidity pools</p>
                                </div>
                            )}

                            {activeTab === 'activity' && (
                                <div className="desktop-activity-list">
                                    <div className="desktop-activity-item">
                                        <div className="desktop-activity-icon send">⬆</div>
                                        <div className="desktop-activity-details">
                                            <span className="desktop-activity-type">Sent</span>
                                            <span className="desktop-activity-time">2 hours ago</span>
                                        </div>
                                        <div className="desktop-activity-amount negative">-0.005 ETH</div>
                                    </div>
                                    <div className="desktop-activity-item">
                                        <div className="desktop-activity-icon receive">⬇</div>
                                        <div className="desktop-activity-details">
                                            <span className="desktop-activity-type">Received</span>
                                            <span className="desktop-activity-time">1 day ago</span>
                                        </div>
                                        <div className="desktop-activity-amount positive">+0.001 ETH</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {currentView === 'qr' && (
                        <div className="desktop-content">
                            <div className="desktop-header">
                                <button className="desktop-back" onClick={() => setCurrentView('main')}>← Back</button>
                                <span className="desktop-title">Wallet Address</span>
                                <button className="desktop-close" onClick={onClose}>×</button>
                            </div>
                            <div className="desktop-qr-content">
                                <div className="desktop-qr-container">
                                    <canvas ref={qrCanvasRef}></canvas>
                                </div>
                                <div className="desktop-address-display">{activeWalletAddress}</div>
                                <div className="desktop-qr-actions">
                                    <button className="desktop-copy-btn" onClick={copyAddress}>
                                        📋 Copy Address
                                    </button>
                                    <button className="desktop-share-btn" onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({
                                                title: 'My Wallet Address',
                                                text: activeWalletAddress || ''
                                            });
                                        } else {
                                            copyAddress();
                                        }
                                    }}>
                                        📤 Share Address
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === 'tokenDetail' && selectedToken && (
                        <div className="desktop-content">
                            <div className="desktop-header">
                                <button className="desktop-back" onClick={() => setCurrentView('main')}>← Back</button>
                                <span className="desktop-title">{selectedToken.token.symbol}</span>
                                <button className="desktop-more">⋯</button>
                            </div>
                            <div className="desktop-token-detail">
                                <div className="desktop-detail-icon">
                                    {selectedToken.token.logoURI ? (
                                        <img src={selectedToken.token.logoURI} alt={selectedToken.token.symbol} />
                                    ) : (
                                        <div className="token-placeholder large">
                                            {selectedToken.token.symbol.substring(0, 2)}
                                        </div>
                                    )}
                                </div>
                                <div className="desktop-detail-balance">
                                    {formatBalance(selectedToken.balance)} {selectedToken.token.symbol}
                                </div>
                                <div className="desktop-detail-value">{formatUSD(selectedToken.balanceUSD)}</div>

                                <div className="desktop-chart-placeholder">
                                    <div className="chart-icon">📈</div>
                                    <span>Price Chart</span>
                                </div>

                                <div className="desktop-token-stats">
                                    <div className="desktop-stat-item">
                                        <span className="desktop-stat-label">Price</span>
                                        <span className="desktop-stat-value">{formatUSD(selectedToken.price)}</span>
                                    </div>
                                    <div className="desktop-stat-item">
                                        <span className="desktop-stat-label">24h Change</span>
                                        <span className="desktop-stat-value positive">+0.00%</span>
                                    </div>
                                    <div className="desktop-stat-item">
                                        <span className="desktop-stat-label">Market Cap</span>
                                        <span className="desktop-stat-value">$555.2B</span>
                                    </div>
                                    <div className="desktop-stat-item">
                                        <span className="desktop-stat-label">Volume</span>
                                        <span className="desktop-stat-value">$12.4B</span>
                                    </div>
                                </div>

                                <div className="desktop-detail-actions">
                                    <button className="desktop-detail-btn primary">
                                        ⬆ Send
                                    </button>
                                    <button className="desktop-detail-btn secondary">
                                        ⇄ Swap
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Toast */}
            {showToast && (
                <div className="toast">
                    ✅ {toastMessage}
                </div>
            )}

            <style jsx>{`
                /* Mobile Styles */
                .mobile-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 9998;
                    animation: fadeIn 0.3s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .mobile-wallet {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: white;
                    border-radius: 20px 20px 0 0;
                    z-index: 9999;
                    max-height: 85vh;
                    overflow: hidden;
                    animation: slideUpMobile 0.3s ease-out;
                }

                @keyframes slideUpMobile {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }

                .mobile-handle {
                    width: 40px;
                    height: 4px;
                    background: #ddd;
                    border-radius: 2px;
                    margin: 12px auto 8px;
                }

                .mobile-content {
                    display: flex;
                    flex-direction: column;
                    height: calc(85vh - 24px);
                    overflow: hidden;
                }

                .mobile-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid #f0f0f0;
                    background: white;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }

                .mobile-wallet-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }

                .mobile-avatar {
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border-radius: 50%;
                }

                .mobile-address-info {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    min-width: 0;
                }

                .mobile-address {
                    font-size: 14px;
                    font-weight: 600;
                    color: #333;
                    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
                }

                .mobile-network {
                    font-size: 12px;
                    color: #666;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .mobile-close, .mobile-back, .mobile-more {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: #f5f5f5;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 16px;
                    color: #666;
                    transition: background 0.2s;
                }

                .mobile-close:hover, .mobile-back:hover, .mobile-more:hover {
                    background: #e9ecef;
                }

                .mobile-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #333;
                    flex: 1;
                    text-align: center;
                }

                .mobile-balance-section {
                    padding: 24px 20px;
                    text-align: center;
                    background: linear-gradient(135deg, #f8f9fa, #ffffff);
                }

                .mobile-balance-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .mobile-balance-label {
                    font-size: 11px;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .mobile-balance-actions {
                    display: flex;
                    gap: 8px;
                }

                .mobile-balance-actions button {
                    width: 28px;
                    height: 28px;
                    border: none;
                    background: transparent;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background 0.2s;
                }

                .mobile-balance-actions button:hover {
                    background: #f0f0f0;
                }

                .mobile-balance-actions button.spinning {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .mobile-balance-amount {
                    font-size: 36px;
                    font-weight: 700;
                    color: #333;
                    margin-bottom: 8px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }

                .mobile-balance-change {
                    font-size: 14px;
                    color: #22c55e;
                    font-weight: 500;
                    background: #f0f9ff;
                    padding: 4px 8px;
                    border-radius: 6px;
                    display: inline-block;
                }

                .mobile-actions {
                    display: flex;
                    justify-content: space-around;
                    padding: 20px;
                    background: #fafafa;
                    border-bottom: 1px solid #f0f0f0;
                }

                .mobile-action-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    padding: 8px;
                    transition: transform 0.2s;
                }

                .mobile-action-btn:active {
                    transform: scale(0.95);
                }

                .mobile-action-icon {
                    width: 44px;
                    height: 44px;
                    background: white;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    transition: all 0.2s;
                }

                .mobile-action-btn:hover .mobile-action-icon {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                }

                .mobile-action-btn span {
                    font-size: 12px;
                    color: #666;
                    font-weight: 500;
                }

                .mobile-tabs {
                    display: flex;
                    background: #fafafa;
                    border-bottom: 1px solid #f0f0f0;
                    position: sticky;
                    top: 73px;
                    z-index: 9;
                }

                .mobile-tab {
                    flex: 1;
                    padding: 16px 4px;
                    border: none;
                    background: none;
                    font-size: 12px;
                    font-weight: 500;
                    color: #999;
                    position: relative;
                    cursor: pointer;
                    transition: color 0.2s;
                }

                .mobile-tab:active {
                    background: #f0f0f0;
                }

                .mobile-tab.active {
                    color: #667eea;
                }

                .mobile-tab.active::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 20%;
                    right: 20%;
                    height: 2px;
                    background: #667eea;
                }

                .mobile-token-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px 20px;
                    -webkit-overflow-scrolling: touch;
                }

                .mobile-token-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 0;
                    border-bottom: 1px solid #f5f5f5;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .mobile-token-item:last-child {
                    border-bottom: none;
                }

                .mobile-token-item:active {
                    background: #f8f9fa;
                }

                .mobile-token-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .mobile-token-icon img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .token-placeholder {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 600;
                    font-size: 14px;
                }

                .token-placeholder.large {
                    font-size: 20px;
                }

                .mobile-token-info {
                    flex: 1;
                    min-width: 0;
                }

                .mobile-token-name {
                    font-size: 15px;
                    font-weight: 600;
                    color: #333;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .mobile-token-network {
                    font-size: 12px;
                    color: #666;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .mobile-token-balance {
                    text-align: right;
                    flex-shrink: 0;
                    max-width: 40%;
                }

                .mobile-token-amount {
                    font-size: 15px;
                    font-weight: 600;
                    color: #333;
                    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .mobile-token-value {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 6px;
                    font-size: 12px;
                    color: #666;
                }

                .mobile-token-change {
                    font-size: 11px;
                    color: #22c55e;
                    font-weight: 500;
                }

                .mobile-empty-state {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #999;
                    gap: 12px;
                    padding: 48px 20px;
                }

                .mobile-empty-state div {
                    font-size: 48px;
                    opacity: 0.3;
                }

                .mobile-activity-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px 20px;
                }

                .mobile-activity-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 0;
                    border-bottom: 1px solid #f5f5f5;
                }

                .mobile-activity-item:last-child {
                    border-bottom: none;
                }

                .mobile-activity-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 16px;
                    font-weight: 600;
                }

                .mobile-activity-icon.send {
                    background: #ef5350;
                }

                .mobile-activity-icon.receive {
                    background: #66bb6a;
                }

                .mobile-activity-details {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .mobile-activity-type {
                    font-size: 14px;
                    font-weight: 500;
                    color: #333;
                }

                .mobile-activity-time {
                    font-size: 12px;
                    color: #999;
                }

                .mobile-activity-amount {
                    font-size: 14px;
                    font-weight: 600;
                    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
                }

                .mobile-activity-amount.positive {
                    color: #22c55e;
                }

                .mobile-activity-amount.negative {
                    color: #ef5350;
                }

                .mobile-qr-content, .mobile-token-detail {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 32px 20px;
                    gap: 24px;
                    overflow-y: auto;
                }

                .mobile-qr-container {
                    padding: 20px;
                    background: white;
                    border-radius: 12px;
                    border: 2px solid #f0f0f0;
                }

                .mobile-address-display {
                    padding: 12px 16px;
                    background: #f5f5f5;
                    border-radius: 8px;
                    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
                    font-size: 12px;
                    word-break: break-all;
                    text-align: center;
                    max-width: 100%;
                    color: #333;
                }

                .mobile-copy-btn, .mobile-share-btn, .mobile-detail-btn {
                    width: 100%;
                    padding: 16px;
                    border-radius: 12px;
                    border: none;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .mobile-copy-btn, .mobile-detail-btn.primary {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                }

                .mobile-copy-btn:active, .mobile-detail-btn.primary:active {
                    transform: scale(0.98);
                }

                .mobile-share-btn, .mobile-detail-btn.secondary {
                    background: white;
                    color: #667eea;
                    border: 1px solid #667eea;
                }

                .mobile-share-btn:active, .mobile-detail-btn.secondary:active {
                    background: #f0f4ff;
                }

                .mobile-detail-icon {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .mobile-detail-icon img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .mobile-detail-balance {
                    font-size: 24px;
                    font-weight: 600;
                    color: #333;
                    text-align: center;
                    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
                }

                .mobile-detail-value {
                    font-size: 18px;
                    color: #666;
                    text-align: center;
                }

                .mobile-chart-placeholder {
                    width: 100%;
                    height: 140px;
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #999;
                    gap: 8px;
                }

                .chart-icon {
                    font-size: 32px;
                    opacity: 0.5;
                }

                .mobile-token-stats {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    width: 100%;
                }

                .mobile-stat-item {
                    padding: 16px;
                    background: #f8f9fa;
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .mobile-stat-label {
                    font-size: 12px;
                    color: #999;
                    font-weight: 500;
                }

                .mobile-stat-value {
                    font-size: 16px;
                    font-weight: 600;
                    color: #333;
                }

                .mobile-stat-value.positive {
                    color: #22c55e;
                }

                .mobile-detail-actions {
                    display: flex;
                    gap: 12px;
                    width: 100%;
                }

                /* Desktop Styles */
                .desktop-wallet-wrapper {
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
                    background: white;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                    pointer-events: auto;
                    animation: slideInDesktop 0.3s ease;
                }

                @keyframes slideInDesktop {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                .desktop-content {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    max-height: calc(100vh - 90px);
                }

                .desktop-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid #f0f0f0;
                }

                .desktop-wallet-address {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    padding: 8px 12px;
                    border-radius: 12px;
                    transition: background 0.2s;
                }

                .desktop-wallet-address:hover {
                    background: #f8f9fa;
                }

                .desktop-avatar {
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border-radius: 50%;
                }

                .desktop-wallet-address span {
                    font-size: 14px;
                    font-weight: 500;
                    color: #333;
                    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
                }

                .desktop-header-actions {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .desktop-chain-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    border: 1px solid #e0e0e0;
                    border-radius: 12px;
                    background: white;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .desktop-chain-btn:hover {
                    border-color: #667eea;
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
                }

                .desktop-close, .desktop-back, .desktop-more {
                    width: 36px;
                    height: 36px;
                    border-radius: 12px;
                    border: none;
                    background: #f8f9fa;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #666;
                    font-size: 16px;
                    transition: all 0.2s;
                }

                .desktop-close:hover, .desktop-back:hover, .desktop-more:hover {
                    background: #e9ecef;
                    transform: scale(1.05);
                }

                .desktop-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #333;
                    flex: 1;
                    text-align: center;
                }

                .desktop-balance-section {
                    padding: 24px;
                    background: linear-gradient(135deg, #f8f9fa, #ffffff);
                }

                .desktop-balance-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .desktop-balance-header span {
                    font-size: 13px;
                    color: #666;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .desktop-balance-actions {
                    display: flex;
                    gap: 8px;
                }

                .desktop-balance-actions button {
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    color: #666;
                    transition: background 0.2s;
                    font-size: 14px;
                }

                .desktop-balance-actions button:hover {
                    background: #f8f9fa;
                }

                .desktop-balance-actions button.spinning {
                    animation: spin 1s linear infinite;
                }

                .desktop-balance-amount {
                    font-size: 42px;
                    font-weight: 700;
                    color: #333;
                    line-height: 1;
                    margin-bottom: 8px;
                    text-align: center;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }

                .desktop-balance-change {
                    text-align: center;
                    font-size: 13px;
                    color: #22c55e;
                    font-weight: 500;
                    padding: 4px 8px;
                    border-radius: 8px;
                    background: #f0f9ff;
                    display: inline-block;
                    margin: 0 auto;
                }

                .desktop-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    margin-top: 24px;
                }

                .desktop-action-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .desktop-action-btn:hover {
                    transform: translateY(-2px);
                }

                .desktop-action-btn div {
                    width: 48px;
                    height: 48px;
                    border-radius: 16px;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    font-size: 18px;
                    transition: all 0.2s;
                }

                .desktop-action-btn:hover div {
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                }

                .desktop-action-btn span {
                    font-size: 12px;
                    font-weight: 500;
                    color: #666;
                }

                .desktop-tabs {
                    display: flex;
                    padding: 0 16px;
                    border-bottom: 1px solid #f0f0f0;
                    background: #fafafa;
                }

                .desktop-tab {
                    flex: 1;
                    padding: 14px 0;
                    border: none;
                    background: none;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    color: #999;
                    position: relative;
                    transition: color 0.2s;
                    text-align: center;
                }

                .desktop-tab:hover {
                    color: #666;
                }

                .desktop-tab.active {
                    color: #667eea;
                }

                .desktop-tab.active::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 20%;
                    right: 20%;
                    height: 2px;
                    background: #667eea;
                    border-radius: 2px;
                }

                .desktop-token-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    max-height: 300px;
                }

                .desktop-token-list::-webkit-scrollbar {
                    width: 6px;
                }

                .desktop-token-list::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 3px;
                }

                .desktop-token-list::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 3px;
                }

                .desktop-token-list::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }

                .desktop-token-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-bottom: 8px;
                }

                .desktop-token-item:hover {
                    background: #f8f9fa;
                    transform: translateX(4px);
                }

                .desktop-token-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                    min-width: 0;
                }

                .desktop-token-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .desktop-token-icon img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .desktop-token-name {
                    font-size: 15px;
                    font-weight: 600;
                    color: #333;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .desktop-token-network {
                    font-size: 12px;
                    color: #999;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .desktop-token-right {
                    text-align: right;
                    flex-shrink: 0;
                    max-width: 40%;
                }

                .desktop-token-amount {
                    font-size: 15px;
                    font-weight: 600;
                    color: #333;
                    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .desktop-token-value {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 6px;
                    font-size: 12px;
                    color: #666;
                }

                .desktop-token-change {
                    font-size: 11px;
                    color: #22c55e;
                    font-weight: 500;
                }

                .desktop-empty-state {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #999;
                    gap: 12px;
                    padding: 48px 20px;
                }

                .desktop-empty-state div {
                    font-size: 48px;
                    opacity: 0.3;
                }

                .desktop-activity-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    max-height: 300px;
                }

                .desktop-activity-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 12px;
                    background: #f8f9fa;
                    margin-bottom: 8px;
                }

                .desktop-activity-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 16px;
                    font-weight: 600;
                }

                .desktop-activity-icon.send {
                    background: #ef5350;
                }

                .desktop-activity-icon.receive {
                    background: #66bb6a;
                }

                .desktop-activity-details {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .desktop-activity-type {
                    font-size: 14px;
                    font-weight: 500;
                    color: #333;
                }

                .desktop-activity-time {
                    font-size: 12px;
                    color: #999;
                }

                .desktop-activity-amount {
                    font-size: 14px;
                    font-weight: 600;
                    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
                }

                .desktop-activity-amount.positive {
                    color: #22c55e;
                }

                .desktop-activity-amount.negative {
                    color: #ef5350;
                }

                .desktop-qr-content, .desktop-token-detail {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 32px 24px;
                    gap: 24px;
                    overflow-y: auto;
                }

                .desktop-qr-container {
                    padding: 20px;
                    background: white;
                    border-radius: 12px;
                    border: 2px solid #f0f0f0;
                }

                .desktop-address-display {
                    padding: 16px;
                    background: #f8f9fa;
                    border-radius: 12px;
                    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
                    font-size: 14px;
                    word-break: break-all;
                    text-align: center;
                    max-width: 100%;
                    color: #333;
                }

                .desktop-qr-actions {
                    display: flex;
                    gap: 12px;
                    width: 100%;
                }

                .desktop-copy-btn, .desktop-share-btn, .desktop-detail-btn {
                    padding: 14px 24px;
                    border-radius: 12px;
                    border: none;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .desktop-copy-btn, .desktop-detail-btn.primary {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    flex: 1;
                }

                .desktop-copy-btn:hover, .desktop-detail-btn.primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
                }

                .desktop-share-btn, .desktop-detail-btn.secondary {
                    background: white;
                    color: #667eea;
                    border: 1px solid #667eea;
                    flex: 1;
                }

                .desktop-share-btn:hover, .desktop-detail-btn.secondary:hover {
                    background: #f0f4ff;
                }

                .desktop-detail-icon {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .desktop-detail-icon img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .desktop-detail-balance {
                    font-size: 28px;
                    font-weight: 600;
                    color: #333;
                    text-align: center;
                    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
                }

                .desktop-detail-value {
                    font-size: 18px;
                    color: #666;
                    text-align: center;
                }

                .desktop-chart-placeholder {
                    width: 100%;
                    height: 180px;
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #999;
                    gap: 8px;
                }

                .desktop-token-stats {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                    width: 100%;
                }

                .desktop-stat-item {
                    padding: 16px;
                    background: #f8f9fa;
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .desktop-stat-label {
                    font-size: 12px;
                    color: #999;
                    font-weight: 500;
                }

                .desktop-stat-value {
                    font-size: 16px;
                    font-weight: 600;
                    color: #333;
                }

                .desktop-stat-value.positive {
                    color: #22c55e;
                }

                .desktop-detail-actions {
                    display: flex;
                    gap: 12px;
                    width: 100%;
                }

                /* Toast */
                .toast {
                    position: fixed;
                    bottom: 24px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #333;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 12px;
                    z-index: 10000;
                    animation: slideUp 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
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

                /* Responsive breakpoints */
                @media (max-width: 768px) {
                    .desktop-wallet-wrapper {
                        display: none;
                    }
                }

                @media (min-width: 769px) {
                    .mobile-backdrop,
                    .mobile-wallet {
                        display: none;
                    }
                }

                @media (max-width: 480px) {
                    .wallet-container {
                        width: calc(100vw - 20px);
                        right: 10px;
                        top: 60px;
                    }

                    .mobile-balance-amount {
                        font-size: 32px;
                    }

                    .mobile-token-list {
                        padding: 12px 16px;
                    }

                    .mobile-qr-content, 
                    .mobile-token-detail {
                        padding: 24px 16px;
                    }
                }
            `}</style>
        </>
    );
}