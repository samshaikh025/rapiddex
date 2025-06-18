"use client";
import { TransactionHistoryPayload, TransactionHistoryResponse } from "@/shared/Models/Common.model";
import { TransactionService } from "@/shared/Services/TransactionService";
import { useEffect, useState } from "react";
import ListView from "../history-list-view/page";
import DetailView from "../history-detail-view/page";
import Skeleton from "react-loading-skeleton";

export default function TransactionHistroyUI() {

    let transactionService = new TransactionService();
    let [transactionHistoryData, setTransactionHistoryData] = useState<TransactionHistoryResponse[]>();
    let [showListView, setShowListView] = useState<boolean>(true);
    let [detailViewHistoryData, setDetailViewHistoryData] = useState<TransactionHistoryResponse>();
    let [showfetchLoader, setShowfetchLoader] = useState<boolean>();
    async function GetTransactionHistory() {
        let input = new TransactionHistoryPayload();
        input.walletAddress = '0xA6f0B82965c17b34276acFeaE26D3DDDB48D0d23';
        setShowfetchLoader(true);
        let txnData = await transactionService.GetTransactionTxnHistory(input);
        setShowfetchLoader(false);
        setTransactionHistoryData(txnData);
    }


    useEffect(() => {
        GetTransactionHistory();
    }, [])

    function showDetailViewPage(object: TransactionHistoryResponse){
        setShowListView(false);
        setDetailViewHistoryData(object);
    }

    function hideDetailViewPage(){
        setShowListView(true);
        setDetailViewHistoryData(new TransactionHistoryResponse());
    }

    return (
        <>
            {
                showListView && 
                <>
                    <ListView
                        walletAddress='0xA6f0B82965c17b34276acFeaE26D3DDDB48D0d23' transactionData={transactionHistoryData}
                        showDetailView={(data: TransactionHistoryResponse) => showDetailViewPage(data)}
                        showLoader={showfetchLoader} />
                </>
            }
            {
                !showListView && 
                <>
                    <DetailView detailViewData = {detailViewHistoryData} hideDetailView={()=>hideDetailViewPage()}/>
                </>
            }
        </>
    );
}
