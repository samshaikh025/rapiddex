'use client'
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector, } from "react-redux";
import { Chain, parseEther } from "viem";
import { config } from '../../../wagmi/config';// Go up a level if needed
import { readContract, writeContract } from '@wagmi/core';
import * as definedChains from "wagmi/chains";
import { useSendTransaction } from "wagmi";
import { AggregatorProvider, Keys, TransactionStatus, TransactionSubStatus, TransactionSubStatusLIFI, TransactionSubStatusRango } from "@/shared/Enum/Common.enum";
import { SetActiveTransactionA, UpdateTransactionStatusA } from "@/app/redux-store/action/action-redux";
import { UtilityService } from "@/shared/Services/UtilityService";
import { Chains, GetSignPayload, GreenFieldResponse, InsertTransactionRequestoDto, TransactionRequestoDto, UpdateTransactionRequestoDto, ZkProofPayload } from "@/shared/Models/Common.model";
import { TransactionService } from "@/shared/Services/TransactionService";
import { SharedService } from "@/shared/Services/SharedService";
import { CryptoService } from "@/shared/Services/CryptoService";
import { stat } from "fs";
import { LiFiTransactionResponse } from "@/shared/Models/Lifi";
import { OwltoTransactionResponse } from "@/shared/Models/Owlto";
import { OwltoSubStatus } from "@/shared/Const/Common.const";
import { ActiveTransactionData } from "@/app/redux-store/reducer/reducer-redux";
import { SupportedChains } from "@/shared/Static/SupportedChains";
import { useSearchParams } from "next/navigation";
import { Client } from "@bnb-chain/greenfield-js-sdk";
import Long from "long";
import { ReedSolomon } from "@bnb-chain/reed-solomon";
import { ethers } from "ethers";
import { json } from "stream/consumers";
type propsType = {
    closeBridgeView: () => void;
}
export default function BridgeView(props: propsType) {
    let activeTransactionData: TransactionRequestoDto = useSelector((state: any) => state.ActiveTransactionData);
    let dispatch = useDispatch();
    let utilityService = new UtilityService();
    let transactionService = new TransactionService();
    let cryptoService = new CryptoService();
    let sharedService = SharedService.getSharedServiceInstance();
    let statusIntervalId = useRef<number>();
    const { sendTransactionAsync, isPending: isTransactionPending, isError: isTransactionError } = useSendTransaction();
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
    const chainsTuple = [allChains[0], ...allChains.slice(1)] as const;

    let [execptionErrorMessage, setExceptionErrorMessage] = useState<String>("");

    const searchParams = useSearchParams();

    let [showButton, setShowButton] = useState<boolean>(true);


    useEffect(() => {
        showButtonItem();
        //clean up function
        return () => {
            clearInterval(statusIntervalId.current);
        }
    }, []);

    function showButtonItem() {
        searchParams.has('quoteId') ? setShowButton(false) : null;
    }

    function getPayloadForTransaction(transactionData: TransactionRequestoDto) {
        let payLoad: InsertTransactionRequestoDto = {
            transactionGuid: transactionData.transactionGuid,
            walletAddress: transactionData.walletAddress,
            amount: Number(transactionData.amount),
            amountUsd: Number(transactionData.amountUsd),
            approvalAddress: transactionData.approvalAddress,
            transactionHash: transactionData.transactionHash,
            transactionStatus: transactionData.transactionStatus,
            transactionSubStatus: transactionData.transactionSubStatus,
            quoteDetail: transactionData.quoteDetail,
            sourceChainId: transactionData.sourceChainId,
            sourceChainName: transactionData.sourceChainName,
            sourceChainLogoUri: transactionData.sourceChainLogoUri,
            destinationChainId: transactionData.destinationChainId,
            destinationChainName: transactionData.destinationChainName,
            destinationChainLogoUri: transactionData.destinationChainLogoUri,
            sourceTokenName: transactionData.sourceTokenName,
            sourceTokenAddress: transactionData.sourceTokenAddress,
            sourceTokenSymbol: transactionData.sourceTokenSymbol,
            sourceTokenLogoUri: transactionData.sourceTokenLogoUri,
            destinationTokenName: transactionData.destinationTokenName,
            destinationTokenAddress: transactionData.destinationTokenAddress,
            destinationTokenSymbol: transactionData.destinationTokenSymbol,
            destinationTokenLogoUri: transactionData.destinationTokenLogoUri,
            sourceChain: transactionData?.sourceChain ? JSON.stringify(transactionData.sourceChain) : '',
            destinationChain: transactionData?.destinationChain ? JSON.stringify(transactionData.destinationChain) : '',
            isNativeToken: transactionData.isNativeToken,
            transactiionAggregator: transactionData.transactiionAggregator,
            transactionAggregatorRequestId: transactionData.transactionAggregatorRequestId,
            transactionAggregatorRequestData: transactionData.transactionAggregatorRequestData,
            transactionAggregatorGasPrice: transactionData.transactionAggregatorGasLimit,
            transactionAggregatorGasLimit: transactionData.transactionAggregatorGasLimit,
            isMultiChain: transactionData.isMultiChain,
            sourceTransactionData: transactionData?.sourceTransactionData ? JSON.stringify(transactionData?.sourceTransactionData) : '',
            destinationTransactionData: transactionData?.destinationTransactionData ? JSON.stringify(transactionData?.destinationTransactionData) : '',
            transactionSourceHash: activeTransactionData.transactionSourceHash,
            transactionSourceStatus: activeTransactionData.transactionSourceStatus,
            transactionSourceSubStatus: activeTransactionData.transactionSourceSubStatus,
            greenFieldTxnHash: '',
            greenFieldUrl: ''
        }
        return payLoad;
    }

    async function GetTransactionStatus(tx: string) {
        let status = 0;
        if (!utilityService.isNullOrEmpty(tx)) {
            if (activeTransactionData.transactiionAggregator == AggregatorProvider.LIFI) {
                // check lifi transaction status
                let response: LiFiTransactionResponse = await cryptoService.TransactionStatusLIFI(tx, activeTransactionData.sourceChainId, activeTransactionData.destinationChainId)
                if (response && response.status) {
                    status = TransactionSubStatusLIFI[response.status];
                }
            }
            else if (activeTransactionData.transactiionAggregator == AggregatorProvider.RANGO) {
                // chack rango
                let response: LiFiTransactionResponse = await cryptoService.TransactionStatusRango(activeTransactionData.transactionAggregatorRequestId, tx, 1);
                if (response && response.status) {
                    status = TransactionSubStatusRango[response.status];
                }
            }
            else if (activeTransactionData.transactiionAggregator == AggregatorProvider.OWLTO) {
                // cheack owlto
                let response: OwltoTransactionResponse = await cryptoService.TransactionStatusOwlto(activeTransactionData.sourceChainId, tx);
                if (response && response.status) {
                    status = OwltoSubStatus[String(response.status.code)];
                }
            }
            else if (activeTransactionData.transactiionAggregator == AggregatorProvider.RAPID_DEX) {
                debugger;
                // cheack Rapid Dex
                let payLoad = new GetSignPayload();
                payLoad.txnHash = activeTransactionData.transactionHash;
                let chainId = activeTransactionData.isMultiChain ? activeTransactionData.destinationChainId : activeTransactionData.sourceChainId;
                payLoad.rpcUrl = SupportedChains.find(x => x.chainId == chainId)?.supportedRPC[0];

                status = await GetTransactionStatusRapidDex(payLoad);
            }
        }

        return status;
    }

    async function GetTransactionStatusRapidDex(input: GetSignPayload) {
        let status;
        status = await transactionService.GetTransactionStatusRapidDex(input);
        return status;
    }

    useEffect(() => {
        transactionSteps();
    }, [activeTransactionData.transactionStatus])

    // async function checkData(){
    //     let payLoad = new GetSignPayload();
    //     payLoad.txnHash = "0x1555049ae043dadd9255f1879230ce02eb883ba38a1748f13d968d96fbea9084";
    //     payLoad.rpcUrl = "https://1rpc.io/arb";
    //     let signData = await transactionService.GetSignatureForTransaction(payLoad);
    //     console.log(signData);
    // }

    async function transactionSteps() {
        let tx = '';
        setExceptionErrorMessage("");

        if (activeTransactionData.transactionStatus == TransactionStatus.ALLOWANCSTATE) {

            if (activeTransactionData.isNativeToken) {
                dispatch(UpdateTransactionStatusA(TransactionStatus.PENDING));
            }
            else {

                let allowanceAmount = await checkAllowance();
                if (allowanceAmount >= Number(activeTransactionData.amount)) {
                    dispatch(UpdateTransactionStatusA(TransactionStatus.PENDING));
                }
            }
        }
        if (activeTransactionData.isMultiChain == false && activeTransactionData.transactionStatus == TransactionStatus.PENDING) {
            sharedService.setData(Keys.ACTIVE_TRANASCTION_DATA, activeTransactionData);
            let transactionStatus = '';
            //Proceed with the main transaction
            try {
                console.log(activeTransactionData);

                var transactionRequest = {
                    to: activeTransactionData.approvalAddress,

                    data: activeTransactionData.transactionAggregatorRequestData,
                    gas: null,
                    chainId: activeTransactionData.sourceChainId,
                }

                if (activeTransactionData.isNativeToken) {
                    transactionRequest["value"] = activeTransactionData.amount;
                }

                tx = await sendTransactionAsync(transactionRequest);

                if (searchParams.toString().includes('quoteId') && tx != null) {

                    window.location.href = 'https://demochekout.rapidx.app/success'

                }

                let status = await GetTransactionStatus(tx);

                let updateTransactionData = {
                    ...activeTransactionData,
                    transactionHash: tx ? tx : '',
                    transactionGuid: utilityService.uuidv4(),
                    transactionStatus: TransactionStatus.COMPLETED,
                    transactionSubStatus: status
                }
                let requestPayload = getPayloadForTransaction(updateTransactionData);
                addTransactionLog(requestPayload);
                dispatch(SetActiveTransactionA(updateTransactionData));
            }
            catch (error) {
                setExceptionErrorMessage(error.shortMessage);
                document.getElementById('exceptionOffCanvas').classList.add('show');
                return;
            }
        }
        if (activeTransactionData.isMultiChain == true && activeTransactionData.transactionStatus == TransactionStatus.PENDING) {
            sharedService.setData(Keys.ACTIVE_TRANASCTION_DATA, activeTransactionData);
            let transactionStatus = '';
            //Proceed with the main transaction
            try {
                console.log(activeTransactionData);

                var transactionRequest = {
                    to: activeTransactionData.sourceTransactionData.approvalAddress,

                    data: activeTransactionData.sourceTransactionData.callData,
                    gas: null,
                    chainId: activeTransactionData.sourceChainId,
                }

                if (activeTransactionData.sourceTransactionData.isNativeToken) {
                    transactionRequest["value"] = activeTransactionData.sourceTransactionData.amountinWei;
                }


                tx = await sendTransactionAsync(transactionRequest);

                if (searchParams.toString().includes('quoteId') && tx != null) {

                    window.location.href = 'demochekout.rapidx.app/success'

                }

                let payLoad = new GetSignPayload();
                payLoad.txnHash = tx;
                payLoad.rpcUrl = activeTransactionData.sourceTransactionData.rpcUrl;

                let signData = await transactionService.GetSignatureForTransaction(payLoad);

                if (signData && signData.signValid) {
                    let status = 1;
                    let destinationTxn = await transactionService.ExecuteDestinationTransaction(activeTransactionData.destinationTransactionData);
                    let payLoad = new GetSignPayload();
                    payLoad.txnHash = destinationTxn;
                    payLoad.rpcUrl = activeTransactionData.destinationTransactionData.rpcUrl;

                    let destinationStatus = await GetTransactionStatusRapidDex(payLoad);
                    let GUID = utilityService.uuidv4();
                    let updateDestTransactionData = {
                        ...activeTransactionData,
                        transactionSourceHash: tx ? tx : null,// update source transaction state
                        transactionSourceStatus: TransactionStatus.COMPLETED,
                        transactionSourceSubStatus: status,
                        transactionHash: destinationTxn ? destinationTxn : '',// update destination txn state
                        transactionGuid: GUID,
                        transactionStatus: TransactionStatus.COMPLETED,
                        transactionSubStatus: destinationStatus
                    };

                    let zkProofInput = new ZkProofPayload();
                    zkProofInput.sign = signData?.validators?.map(e => e?.data?.sign)

                    const zkProof = await transactionService.GetZkProofForTransaction(zkProofInput);
                    let greenFieldResponse = await storeSignDceller(zkProof);

                    let requestPayload = getPayloadForTransaction(updateDestTransactionData);
                    requestPayload.greenFieldTxnHash = greenFieldResponse.greenFieldTxnHash;
                    requestPayload.greenFieldUrl = greenFieldResponse.greenFieldUrl;
                    addTransactionLog(requestPayload);
                    dispatch(SetActiveTransactionA(updateDestTransactionData));
                }
            }
            catch (error) {
                setExceptionErrorMessage(error.shortMessage);
                document.getElementById('exceptionOffCanvas').classList.add('show');
                return;
            }
        }
        if (activeTransactionData.transactionStatus == TransactionStatus.COMPLETED) {
            try {
                //set interval to check status in 10 sec
                //sharedService.setData(Keys.ACTIVE_TRANASCTION_DATA, activeTransactionData);
                //sharedService.removeData(Keys.ACTIVE_TRANASCTION_DATA);
                if (activeTransactionData.transactionSubStatus == TransactionSubStatus.PENDING) {
                    // set time out for checking status
                    // break if failed or done 
                    // update status in API
                    const intervalId = setInterval(async () => {
                        let status = await GetTransactionStatus(activeTransactionData.transactionHash);
                        if (status == TransactionSubStatus.DONE || status == TransactionSubStatus.FAILED) {
                            let updateTransactionData = {
                                ...activeTransactionData,
                                transactionSubStatus: status
                            }
                            dispatch(SetActiveTransactionA(updateTransactionData));
                            let requestPayload: UpdateTransactionRequestoDto = {
                                transactionGuid: activeTransactionData.transactionGuid,
                                transactionSubStatus: status
                            };
                            UpdateTransactionLog(requestPayload);
                            clearInterval(statusIntervalId.current);
                        }
                    }, 10000)
                    statusIntervalId.current = (intervalId as unknown as number);
                }
            }
            catch (error) {
                setExceptionErrorMessage(error);
                document.getElementById('exceptionOffCanvas').classList.add('show');
                return;
            }
        }
    }

    function addTransactionLog(payLoad: InsertTransactionRequestoDto) {
        transactionService.AddTransactionLog(payLoad).then((response) => {
            if (response?.data && response.data.transactionGuid) {
                //dispatch(SetActiveTransactionA(response.data));
                //sharedService.setData(Keys.ACTIVE_TRANASCTION_DATA, response.data);
                console.log('transaction added successfully');
            }
        }).catch((error) => {
            console.log(error);
        });;
    }

    function UpdateTransactionLog(payLoad: UpdateTransactionRequestoDto) {
        transactionService.UpdateTransactionLog(payLoad).then((response) => {
            if (response?.data && response.data == 1) {
                //dispatch(SetActiveTransactionA(response.data));
                //sharedService.setData(Keys.ACTIVE_TRANASCTION_DATA, response.data);
                console.log('transaction updated successfully');
            }
        }).catch((error) => {
            console.log(error);
        });;
    }

    async function checkAllowance() {
        const SPENDER_ADDRESS = (activeTransactionData.transactiionAggregator == AggregatorProvider.RAPID_DEX && activeTransactionData.isMultiChain) ? activeTransactionData.sourceTransactionData.approvalAddress : activeTransactionData.approvalAddress;
        const amountToSend = (activeTransactionData.transactiionAggregator == AggregatorProvider.RAPID_DEX && activeTransactionData.isMultiChain) ? activeTransactionData.sourceTransactionData.amountinWei : activeTransactionData.amount;
        let allowanceAmount = 0;
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

            const allowance = await readContract(config, {
                address: activeTransactionData.sourceTokenAddress as `0x${string}`,
                abi: tokenAbi,
                functionName: 'allowance',
                args: [activeTransactionData.walletAddress, SPENDER_ADDRESS],
                chainId: activeTransactionData.sourceChainId
            });
            allowanceAmount = Number(allowance);

            // If allowance is insufficient, request approval
            if (Number(allowanceAmount) <= Number(amountToSend)) {
                try {
                    const approvalAllowance = await writeContract(config, {
                        address: activeTransactionData.sourceTokenAddress as `0x${string}`,
                        abi: tokenAbi,
                        functionName: 'approve',
                        args: [SPENDER_ADDRESS, amountToSend],
                        chain: chainsTuple.find(a => a.id == activeTransactionData.sourceChainId), // Add chain
                        account: activeTransactionData.walletAddress as `0x${string}`, // Add account
                        chainId: activeTransactionData.sourceChainId,
                    });
                    allowanceAmount = Number(approvalAllowance);
                }
                catch (error) {
                    setExceptionErrorMessage(error['shortMessage']);
                    document.getElementById('exceptionOffCanvas').classList.add('show');
                    return;
                }
            }
        } catch (error) {
            setExceptionErrorMessage(error['shortMessage']);
            document.getElementById('exceptionOffCanvas').classList.add('show');
            return;

        }

        return allowanceAmount;
    }

    function closeBridgeView() {

        if (activeTransactionData.transactionSubStatus == TransactionSubStatus.DONE || activeTransactionData.transactionSubStatus == TransactionSubStatus.FAILED) {
            sharedService.removeData(Keys.ACTIVE_TRANASCTION_DATA);
            dispatch(SetActiveTransactionA(new TransactionRequestoDto()));
        }
        props.closeBridgeView();
    }

    async function tryAgain() {
        await transactionSteps();
    }

    function closeExceptionModal() {
        document.getElementById('exceptionOffCanvas').classList.remove('show');
    }

    async function storeSignDceller(signdata: any) {

        let response = new GreenFieldResponse();

        try {
            const PRIVATE_KEY = "0x2ceaafa08af632e3089018aae2e85a2249632acbb9bd4eaa4a37beff8fef088a"; // WARNING: Don't expose this in production
            const wallet = new ethers.Wallet(PRIVATE_KEY);

            const client = Client.create('https://greenfield-chain.bnbchain.org', '1017');

            const bucketName = 'rapidx-sign-storage'; // Must exist already
            const objectName = `my-json-${Date.now()}.json`;

            // 1) Prepare your JSON
            const jsonObject = { ...signdata };
            const jsonString = JSON.stringify(jsonObject, null, 2);
            const fileBuffer = new Uint8Array(Buffer.from(jsonString, 'utf-8'));

            // 2) Use Reed–Solomon to generate the exact checksums array
            const rs = new ReedSolomon();
            // rs.encode returns an array of Base64-encoded shards (data+parity)
            const base64Shards = rs.encode(fileBuffer);
            // Convert each Base64 shard to raw bytes (Uint8Array/Buffer)
            const checksums = base64Shards.map(b64 => {
                const buffer = Buffer.from(b64, 'base64');
                return new Uint8Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
            });

            console.log('File size:', fileBuffer.length);
            console.log('Shards (checksums) count:', checksums.length);

            const createObjectTx = await client.object.createObject({
                bucketName,
                objectName,
                creator: wallet.address,
                visibility: 1, // public
                contentType: 'application/json',
                redundancyType: 0, // EC_TYPE
                payloadSize: Long.fromInt(fileBuffer.length),
                expectChecksums: checksums, // Let SDK handle checksums internally
            });

            const simulateInfo = await createObjectTx.simulate({
                denom: 'BNB',
            });

            const broadcastRes = await createObjectTx.broadcast({
                denom: 'BNB',
                gasLimit: Number(simulateInfo.gasLimit),
                gasPrice: simulateInfo.gasPrice || '5000000000',
                payer: wallet.address,
                granter: '',
                privateKey: wallet.privateKey,
            });

            response.greenFieldTxnHash = broadcastRes.transactionHash;
            response.greenFieldUrl = objectName;

            if (broadcastRes.code !== 0) {
                console.log("Broadcast failed", broadcastRes.rawLog);
            }

            // ✅ Use native Blob or File
            const file = new File([fileBuffer], objectName, { type: 'application/json' });

            const uploadRes = await client.object.uploadObject(
                {
                    bucketName,
                    objectName,
                    body: file,
                    txnHash: broadcastRes.transactionHash,
                },
                {
                    type: 'ECDSA',
                    privateKey: wallet.privateKey,
                }
            );

            if (uploadRes.code === 0) {
                console.log('JSON uploaded to green feild successfully! Object.');
            } else {
                console.log('Error while uploaded data on green field.');
            }
        } catch (ex) {
            console.log("Error while store data on greenfeild");
        }

        return response;
    }

    return (
        <div className="col-lg-5 col-md-12 col-sm-12 col-12 position-relative overflow-hidden" id="swap-wrapper">
            <div className="card">
                <div className="p-24">

                    <div className="d-block gap-3 align-items-center mb-4">
                        <div className="card-action-wrapper cursor-pointer left-arrow" id="back-to-swap" onClick={(event) => { event.preventDefault(); closeBridgeView() }}>
                            <i className="fas fa-chevron-left"></i>
                        </div>
                        <div className="card-title">
                            Swap
                        </div>
                        {/* <div className="card-action-wrapper">
                            <i className="fas fa-cog cursor-pointer"></i>
                        </div> */}
                    </div>

                    <div className="d-flex align-items-center gap-3 position-relative">
                        <div className="inner-card w-100 py-2 px-3" id="select-coin">
                            <label className="mb-2 fw-600">From</label>
                            <div className="d-flex align-items-center gap-3">
                                <div className="position-relative coin-wrapper">
                                    {!utilityService.isNullOrEmpty(activeTransactionData?.sourceChainLogoUri) && <img src={activeTransactionData?.sourceChainLogoUri}
                                        className="coin" alt="coin" />}
                                    {!utilityService.isNullOrEmpty(activeTransactionData?.sourceTokenLogoUri) && <img src={activeTransactionData?.sourceTokenLogoUri}
                                        className="coin-small" alt="coin" />}
                                </div>
                                <div className="d-flex flex-column">
                                    <label className="coin-name d-block fw-600">{activeTransactionData?.sourceChainName}</label>
                                    <label className="coin-sub-name">{activeTransactionData?.sourceTokenSymbol}</label>
                                </div>
                            </div>
                        </div>
                        <div className="change-btn position-absolute cursor-pointer inner-card d-flex align-items-center justify-content-center">
                            <i className="fas fa-exchange-alt"></i>
                        </div>
                        <div className="inner-card w-100 py-2 px-3">
                            <label className="mb-2 fw-600">To</label>
                            <div className="d-flex align-items-center gap-3">
                                <div className="position-relative coin-wrapper">
                                    {!utilityService.isNullOrEmpty(activeTransactionData?.destinationChainLogoUri) && <img src={activeTransactionData?.destinationChainLogoUri}
                                        className="coin" alt="coin" />}
                                    {!utilityService.isNullOrEmpty(activeTransactionData?.destinationTokenLogoUri) && <img src={activeTransactionData?.destinationTokenLogoUri}
                                        className="coin-small" alt="coin" />}
                                </div>
                                <div className="d-flex flex-column">
                                    <label className="coin-name d-block fw-600">{activeTransactionData?.destinationChainName}</label>
                                    <label className="coin-sub-name">{activeTransactionData?.destinationTokenSymbol}</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="inner-card w-100 p-4 mt-3 swap-card">
                        <div className={`step ${activeTransactionData.transactionStatus == TransactionStatus.ALLOWANCSTATE ? 'step-active' : ''}`}>
                            <div>
                                <div className="circle">
                                    {
                                        activeTransactionData.transactionStatus > TransactionStatus.ALLOWANCSTATE &&
                                        <>
                                            <i className="fa fa-check"></i>
                                        </>
                                    }
                                    {
                                        activeTransactionData.transactionStatus < TransactionStatus.ALLOWANCSTATE &&
                                        <>
                                            <span>1</span>
                                        </>
                                    }
                                    {
                                        activeTransactionData.transactionStatus == TransactionStatus.ALLOWANCSTATE &&
                                        <>
                                            <span><i className="fas fa-spinner fa-spin"></i></span>
                                        </>
                                    }
                                </div>
                            </div>
                            <div>
                                <div className="title">Token Allowance</div>
                                <div className="caption">Allowance To Non Native Token</div>
                                {
                                    (activeTransactionData.transactionStatus == TransactionStatus.ALLOWANCSTATE && !utilityService.isNullOrEmpty(execptionErrorMessage)) &&
                                    <>
                                        <span className="text-danger">{execptionErrorMessage}</span>
                                    </>
                                }
                            </div>
                        </div>
                        <div className={`step ${activeTransactionData.transactionStatus == TransactionStatus.PENDING ? 'step-active' : ''}`}>
                            <div>
                                <div className="circle">
                                    {
                                        activeTransactionData.transactionStatus > TransactionStatus.PENDING &&
                                        <>
                                            <i className="fa fa-check"></i>
                                        </>
                                    }
                                    {
                                        activeTransactionData.transactionStatus < TransactionStatus.PENDING &&
                                        <>
                                            <span>2</span>
                                        </>
                                    }
                                    {
                                        activeTransactionData.transactionStatus == TransactionStatus.PENDING &&
                                        <>
                                            <span><i className="fas fa-spinner fa-spin"></i></span>
                                        </>
                                    }
                                </div>
                            </div>
                            <div>
                                <div className="title">Swap Transaction</div>
                                <div className="caption">Transaction Swap Via Bridge</div>
                                {
                                    (activeTransactionData.transactionStatus == TransactionStatus.PENDING && !utilityService.isNullOrEmpty(execptionErrorMessage)) &&
                                    <>
                                        <span className="text-danger">{execptionErrorMessage}</span>
                                    </>
                                }
                            </div>
                        </div>
                        <div className={`step ${activeTransactionData.transactionStatus == TransactionStatus.COMPLETED ? 'step-active' : ''}`}>
                            <div>
                                <div className="circle">
                                    {
                                        (activeTransactionData.transactionStatus == TransactionStatus.COMPLETED && (activeTransactionData.transactionSubStatus == TransactionSubStatus.DONE || activeTransactionData.transactionSubStatus == TransactionSubStatus.FAILED)) &&
                                        <>
                                            <i className="fa fa-check"></i>
                                        </>
                                    }
                                    {
                                        activeTransactionData.transactionStatus < TransactionStatus.COMPLETED &&
                                        <>
                                            <span>3</span>
                                        </>
                                    }
                                    {
                                        (activeTransactionData.transactionStatus == TransactionStatus.COMPLETED && (activeTransactionData.transactionSubStatus == 0 || activeTransactionData.transactionSubStatus == TransactionSubStatus.PENDING)) &&
                                        <>
                                            <span><i className="fas fa-spinner fa-spin"></i></span>
                                        </>
                                    }
                                </div>
                            </div>
                            <div>
                                <div className="title">Transaction Status</div>
                                <div className="caption">
                                    Swap Transaction
                                    {
                                        activeTransactionData.transactionSubStatus == 0 &&
                                        <>
                                            <span className="alert alert-secondary px-2 p-0 mx-1" role="alert">
                                                Not Started
                                            </span>
                                        </>

                                    }
                                    {
                                        activeTransactionData.transactionSubStatus == TransactionSubStatus.PENDING &&
                                        <>
                                            <span className="alert alert-warning px-2 p-0 mx-1" role="alert">
                                                Pending
                                            </span>
                                        </>

                                    }
                                    {
                                        activeTransactionData.transactionSubStatus == TransactionSubStatus.FAILED &&
                                        <>
                                            <span className="alert alert-danger px-2 mx-1" role="alert">
                                                Failed
                                            </span>
                                        </>

                                    }
                                    {
                                        activeTransactionData.transactionSubStatus == TransactionSubStatus.DONE &&
                                        <>
                                            <span className="alert alert-success px-2 p-0 mx-1" role="alert">
                                                Success
                                            </span>
                                        </>

                                    }

                                    {
                                        (activeTransactionData.transactionStatus == TransactionStatus.COMPLETED && !utilityService.isNullOrEmpty(execptionErrorMessage)) &&
                                        <>
                                            <span className="text-danger">{execptionErrorMessage}</span>
                                        </>
                                    }
                                </div>
                            </div>
                        </div>
                        {
                            ((activeTransactionData.transactionSubStatus == TransactionSubStatus.DONE || activeTransactionData.transactionSubStatus == TransactionSubStatus.FAILED) && showButton) &&
                            <>

                                <div className="inner-card swap-card-btn mt-4">
                                    <label><a href="" role="button" onClick={(event) => { event.preventDefault(); closeBridgeView() }}>Swap More</a></label>
                                </div>
                            </>
                        }
                        {
                            !utilityService.isNullOrEmpty(execptionErrorMessage) &&
                            <>
                                <div className="inner-card swap-card-btn mt-4">
                                    <label><a href="" role="button" onClick={(event) => { event.preventDefault(); tryAgain() }}>Try Again</a></label>
                                </div>
                            </>
                        }
                    </div>

                    <div
                        className="offcanvas offcanvas-bottom custom-backgrop position-absolute"
                        id="exceptionOffCanvas"
                        data-bs-backdrop="true"
                        aria-labelledby="exceptionOffCanvasLabel"
                        style={{ height: '35%' }}
                    >
                        <div className="offcanvas-header offcanvas-close-btn justify-content-between">
                            <h5 className="offcanvas-title card-title" id="offcanvasExampleLabel">Transaction Error</h5>
                            <i className="fa-solid fa-xmark" onClick={() => closeExceptionModal()}></i>
                        </div>
                        <div className="offcanvas-body small py-0">
                            {
                                !utilityService.isNullOrEmpty(execptionErrorMessage) &&
                                <>
                                    <div className="alert alert-danger">
                                        <div className="d-inline">
                                            <i className="fa-regular fa-circle-xmark"></i>
                                        </div>
                                        <div className="d-inline mx-1">
                                            <span>{execptionErrorMessage}</span>
                                        </div>
                                    </div>
                                </>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>

    )
}

