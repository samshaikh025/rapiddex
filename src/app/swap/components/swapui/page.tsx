'use client'
import { useState } from "react";
import Exchangeui from "../exchangeui/page";
import Tokenui from "../tokenui/page";
import Chainui from "../chainui/page";
import { ChainBase, Chains, TokenBase, Tokens } from "@/shared/Models/Common.model";
import { DataSource } from "@/shared/Enum/Common.enum";
import { CryptoService } from "@/shared/Services/CryptoService";

export default function Swapui() {

    const [showExchangeUI, setShowExchangeUI] = useState<boolean>(true);
    const [showChainUI, setshowChainUI] = useState<boolean>(false);
    const [dataSource, setDataSource] = useState<string>('');

    const [sourceChain, setSourceChain] = useState<Chains>(new Chains());
    const [destChain, setDestChain] = useState<Chains>(new Chains());
    const [sourceToken, setSourceToken] = useState<Tokens>(new Tokens());
    const [sourceTokenAmount, setSourceTokenAmount] = useState<number>(0);
    const [destToken, setDestToken] = useState<Tokens>(new Tokens());
    const [destTokenAmount, setDestTokenAmount] = useState<number>(Number);
    let cryptoService = new CryptoService();
    function OpenTokenUI(dataSource: string) {
        setDataSource(dataSource);
        setShowExchangeUI(false);
    }

    async function CloseTokenUI(token: Tokens) {
        if (dataSource == DataSource.From) {
            setSourceToken(token);
            let amount = await cryptoService.GetTokenValue(token);
            setSourceTokenAmount(amount);
            console.log('Source token amount = ' + amount);
        } else if (dataSource == DataSource.To) {
            setDestToken(token);
            let amount = await cryptoService.GetTokenValue(token);
            setDestTokenAmount(amount);
        }
        setShowExchangeUI(true);
    }
    function OpenChainUI(isShow: boolean) {
        setshowChainUI(isShow);
    }

    function CloseChainUI(chain: Chains) {
        if (dataSource == DataSource.From) {
            setSourceChain(chain);
            setSourceToken(new Tokens());
        } else if (dataSource == DataSource.To) {
            setDestChain(chain);
            setDestToken(new Tokens());
        }
        setshowChainUI(false);
        console.log('selected chain: ', chain.chainId)
    }

    function InterChangeData() {
        let tempChain = sourceChain;
        setSourceChain(destChain);
        setDestChain(tempChain);

        let tempToken = sourceToken;
        setSourceToken(destToken);
        setDestToken(tempToken);

        let tempTokenAmount = sourceTokenAmount;
        setSourceTokenAmount(destTokenAmount);
        setDestTokenAmount(tempTokenAmount);
    }
    return (
        <>
            <div className="exchange-wrapper">
                <div className="container">
                    <div className="row justify-content-center">
                        {showExchangeUI && <Exchangeui openTokenUI={(dataSource: string) => OpenTokenUI(dataSource)} sourceChain={sourceChain} destChain={destChain} dataSource={dataSource} sourceToken={sourceToken} destToken={destToken} sourceTokenAmount={sourceTokenAmount} destTokenAmount={destTokenAmount} interChangeData={() => InterChangeData()} />}
                        {(!showExchangeUI && !showChainUI) && <Tokenui openChainUI={(isShow: boolean) => OpenChainUI(isShow)} closeTokenUI={(token: Tokens) => CloseTokenUI(token)} sourceChain={sourceChain} destChain={destChain} dataSource={dataSource} sourceToken={sourceToken} destToken={destToken} />}
                        {(!showExchangeUI && showChainUI) && <Chainui closeChainUI={(chain: Chains) => CloseChainUI(chain)} sourceChain={sourceChain} destChain={destChain} dataSource={dataSource} />}
                    </div>
                </div>
            </div>
        </>
    );
}
