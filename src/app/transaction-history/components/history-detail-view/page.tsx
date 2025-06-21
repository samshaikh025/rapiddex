"use client";
import CommingSoon from "@/shared/Component/coming-soon/page";
import { PathShowViewModel, TransactionHistoryResponse } from "@/shared/Models/Common.model";
import { ResponseRapidXPath } from "@/shared/Models/RapidX";
import { UtilityService } from "@/shared/Services/UtilityService";
import { useEffect, useState } from "react";
import HistoryRapidx from "../history-rapidx/page";
import { AggregatorProvider } from "@/shared/Enum/Common.enum";
import HistoryLifi from "../history-lifi/page";
import HistoryRango from "../history-rango/page";
type propsType = {
  detailViewData: TransactionHistoryResponse;
  hideDetailView: () => void;
}
export default function DetailView(props: propsType) {
  let [quoteDetail, setQuoteDetail] = useState<PathShowViewModel>();
  let utilityService = new UtilityService();


  useEffect(() => {
    const quote: PathShowViewModel = JSON.parse(props?.detailViewData?.quoteDetail ?? '{}') as PathShowViewModel;
    setQuoteDetail(quote);
    console.log("aaaaaaa", quote);
  }, []);


  return (
    <>
      {
        props?.detailViewData?.transactiionAggregator === AggregatorProvider.RAPID_DEX &&

        <>
          <HistoryRapidx detailViewData={props.detailViewData} hideDetailView={props.hideDetailView}></HistoryRapidx>
        </>
      }

      {
        props?.detailViewData?.transactiionAggregator === AggregatorProvider.LIFI &&

        <>
          <HistoryLifi detailViewData={props.detailViewData} hideDetailView={props.hideDetailView}></HistoryLifi>
        </>
      }

      {
        props?.detailViewData?.transactiionAggregator === AggregatorProvider.RANGO &&

        <>
          <HistoryRango detailViewData={props.detailViewData} hideDetailView={props.hideDetailView}></HistoryRango>
        </>
      }
    </>
  );
}
