import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";//comment later
import "../assets/css/global.css";
import "../assets/css/style.css";
import "../assets/css/responsive.css";
import "../assets/css/walletview.css";
import "../assets/fonts/fonts.css";
import 'bootstrap/dist/css/bootstrap.css';
import Header from "@/shared/Component/header/page";
import { cookieToInitialState } from "wagmi";
import { config } from './wagmi/config'
import { headers } from "next/headers";
import WagmiProviderComp from "./wagmi/wagmi-provider";
import Providers from "@/shared/Component/header/providers/page";
import 'react-loading-skeleton/dist/skeleton.css'

const inter = Inter({ subsets: ["latin"] });







export const metadata: Metadata = {


  title: "RapidX - Empowers users in their journey toward financial freedom",
  description: "RapidX is built on a modern architecture designed to function as a highly efficient interoperability solution—offering the lowest cost, fastest speed, and true decentralization across any blockchain, whether it’s EVM, non-EVM, Solana, Cosmos, TON Chain, or others.",
  keywords: "RapidX, cross-chain bridging, blockchain interoperability, decentralized payment gateway, crypto funds, fixed deposit, P2P trading, zk-proofs, multi-chain support, EVM, Solana, Cosmos, TON Chain, BNB Greenfield",
  authors: [{ name: "RapidX Team" }],
  creator: "RapidX",
  publisher: "RapidX",
  category: "Finance, Cryptocurrency, Blockchain Interoperability",
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1",

  // Open Graph metadata for social sharing
  openGraph: {
    title: "RapidX - Empowers users in their journey toward financial freedom",
    description: "RapidX is built on a modern architecture designed to function as a highly efficient interoperability solution—offering the lowest cost, fastest speed, and true decentralization across any blockchain, whether it’s EVM, non-EVM, Solana, Cosmos, TON Chain, or others.",
    url: "https://rapidx.app",
    siteName: "RapidX",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/assets/images/rapidx/rapidxlogo.png",
        width: 1200,
        height: 630,
        alt: "RapidX - A Biggest Multichain Exchanger",
      },
    ],

  },

  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    site: "@rapidx_app",
    creator: "@rapidx_app",
    title: "RapidX - The biggest multi-chain liquidity exchanger. Swap any token across any chain – seamlessly, secure and with less fees.  Powered by @protocolix",
    description: "Empower your journey from fiat to crypto toward financial freedom. Experience true decentralization with cross-chain bridging, lowest costs, and fastest speed.",
    images: ["/Images/rapidx/twitter-card.jpg"],
  },

  // AI and search engine optimization
  other: {
    "google-site-verification": "your-google-verification-code",
    "msvalidate.01": "your-bing-verification-code",
    "yandex-verification": "your-yandex-verification-code",
    "theme-color": "#2563eb",
    "color-scheme": "dark light",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "RapidX",
    "application-name": "RapidX",
    "msapplication-TileColor": "#2563eb",
    "msapplication-config": "/browserconfig.xml",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = cookieToInitialState(config, headers().get("cookie"));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": "RapidX",
    "alternateName": "RapidX Cross-Chain Bridge",
    "description": "RapidX empowers users on their journey from fiat to crypto toward financial freedom. Cross-chain bridging solution with lowest cost, fastest speed, and true decentralization across multiple blockchain networks.",
    "url": "https://rapidx.app",
    "logo": "https://rapidx.app/Images/rapidx/og-image.png",
    "image": "https://rapidx.app/Images/rapidx/og-image.jpg",
    "sameAs": [
      "https://twitter.com/rapidx_app",
      "https://t.me/rapidx_app",
      "https://discord.gg/rapidx_app"
    ],
    "serviceType": "Blockchain Interoperability Service",
    "category": "Cross-Chain Infrastructure",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Cross-Chain Financial Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Cross-Chain Swaps",
            "description": "Seamless asset transfers across multiple blockchain networks"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Decentralized Payment Gateway",
            "description": "Secure and transparent payment processing"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Crypto Funds & Fixed Deposit Products",
            "description": "Financial products for crypto asset growth"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Secure P2P Trading Platform",
            "description": "Direct peer-to-peer cryptocurrency trading"
          }
        }
      ]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": "1250"
    }
  };

  return (
    <html lang="en" data-theme="dark">
      <head>
        {/* <meta charset="UTF-8"/> */}
        <link rel="icon" href="/assets/images/rapidx/rapidxvicon/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@200..700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css" />
      </head>
      <body>
        <div className="body-bg"></div>
        <WagmiProviderComp initialState={initialState}>
          <Providers>
            <Header />
            <div className="content-wrapper">
              {children}
            </div>
          </Providers>
        </WagmiProviderComp>
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"></script>
      </body>
    </html>
  );
}
