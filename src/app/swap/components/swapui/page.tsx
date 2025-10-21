'use client'
import { useEffect, useState } from "react";
import Exchangeui from "../exchangeui/page";
import Tokenui from "../tokenui/page";
import Chainui from "../chainui/page";
import { Chains, Tokens } from "@/shared/Models/Common.model";
import { DataSource } from "@/shared/Enum/Common.enum";
import { CryptoService } from "@/shared/Services/CryptoService";
import { useDispatch } from "react-redux";
import { SetAllAvailableChainsA } from "@/app/redux-store/action/action-redux";

type propsType = {
    chains: Chains[]
}
export default function Swapui(props: propsType) {

    const [showExchangeUI, setShowExchangeUI] = useState<boolean>(true);
    const [showChainUI, setshowChainUI] = useState<boolean>(false);
    const [dataSource, setDataSource] = useState<string>('');


    const [sourceChain, setSourceChain] = useState<Chains>(new Chains());
    const [destChain, setDestChain] = useState<Chains>(new Chains());
    const [sourceToken, setSourceToken] = useState<Tokens>(new Tokens());
    const [sourceTokenAmount, setSourceTokenAmount] = useState<number>(0);
    const [destToken, setDestToken] = useState<Tokens>(new Tokens());
    const [destTokenAmount, setDestTokenAmount] = useState<number>(0);
    let dispatch = useDispatch();

    let cryptoService = new CryptoService();

    useEffect(() => {
        dispatch(SetAllAvailableChainsA(props.chains));
    }, []);

    useEffect(() => {


        if (
            sourceChain.chainId === destChain.chainId &&
            sourceToken.address === destToken.address
        ) {
            if (dataSource == DataSource.From) {


                setDestChain(new Chains());
                setDestToken(new Tokens());
                setDestTokenAmount(0);

            } else if (dataSource == DataSource.To) {


                setSourceChain(new Chains());
                setSourceToken(new Tokens());
                setSourceTokenAmount(0);
            }

        }
    }, [sourceChain, destChain, sourceToken, destToken]);


    function OpenTokenUI(dataSource: string) {
        setDataSource(dataSource);
        setShowExchangeUI(false);
    }

    async function CloseTokenUI(token: Tokens) {
        if (dataSource == DataSource.From) {
            setSourceToken(token);
            setShowExchangeUI(true);  // Show UI immediately
            setSourceTokenAmount(token.price);
        } else if (dataSource == DataSource.To) {
            setDestToken(token);
            setShowExchangeUI(true);  // Show UI immediately
            setDestTokenAmount(token.price);
        }
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
                    <div className="row justify-content-center gap-md-0 gap-3">
                        {showExchangeUI &&
                            <Exchangeui openTokenUI={(dataSource: string) =>
                                OpenTokenUI(dataSource)}
                                sourceChain={sourceChain}
                                destChain={destChain}
                                dataSource={dataSource}
                                sourceToken={sourceToken}
                                destToken={destToken}
                                sourceTokenAmount={sourceTokenAmount}
                                destTokenAmount={destTokenAmount}
                                interChangeData={() => InterChangeData()} />}
                        {(!showExchangeUI && !showChainUI) &&
                            <div className="col-lg-5 col-md-12 col-sm-12 col-12" id="swap-coin-wrapper">
                                <Tokenui openChainUI={(isShow: boolean) => OpenChainUI(isShow)}
                                    closeTokenUI={(token: Tokens) => CloseTokenUI(token)}
                                    sourceChain={sourceChain}
                                    destChain={destChain}
                                    dataSource={dataSource}
                                    sourceToken={sourceToken}
                                    destToken={destToken} />
                            </div>
                        }
                        {(!showExchangeUI && showChainUI) &&
                            <div className="col-lg-5 col-md-12 col-sm-12 col-12" id="swap-coin-wrapper">
                                <Chainui closeChainUI={(chain: Chains) => CloseChainUI(chain)}
                                    sourceChain={sourceChain}
                                    destChain={destChain}
                                    dataSource={dataSource}
                                    chains={props.chains} />
                            </div>
                        }
                    </div>
                </div>
            </div>
        </>
    );
}
