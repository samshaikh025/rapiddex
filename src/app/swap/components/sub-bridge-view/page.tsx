import { TransactionStatus } from "@/shared/Enum/Common.enum";
import { UtilityService } from "@/shared/Services/UtilityService";
import { useEffect } from "react";
import { useSelector } from "react-redux";
type propsType = {
    openBridgeView: () => void;
}
export default function SubBridgeView(props: propsType) {
    

    let activeTransactionData = useSelector((state: any) => state.ActiveTransactionData);
    let utilityService = new UtilityService();

    useEffect(()=>{
        checkTransactionStatus();
    }, [])

    function checkTransactionStatus()
    {
        if(!utilityService.isNullOrEmpty(activeTransactionData.transactionHash) && activeTransactionData.transactionStatus == TransactionStatus.PENDING){
            // set interval to check status
        }
    }

    return (
        <div className="col-lg-5 col-md-12 col-sm-12 col-12" id="swap-wrapper">
            <div className="card">
                <div className="p-24">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="card-action-wrapper cursor-pointer" id="back-to-swap">
                            <i className="fas fa-chevron-left"></i>
                        </div>
                        <div className="card-title">
                            Transaction Is
                            {
                               (activeTransactionData.transactionStatus == TransactionStatus.ALLOWANCSTATE 
                                || (utilityService.isNullOrEmpty(activeTransactionData.transactionHash) && activeTransactionData.transactionStatus == TransactionStatus.PENDING)) &&
                                <><span><a href="" onClick={()=>props.openBridgeView()}>Incomplete</a></span></>
                            }
                            {
                               (!utilityService.isNullOrEmpty(activeTransactionData.transactionHash) && activeTransactionData.transactionStatus == TransactionStatus.PENDING) &&
                                <><span><a href=""></a>Pending</span></>
                            }
                        </div>
                        <div className="card-action-wrapper">
                            <i className="fas fa-cog cursor-pointer"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}