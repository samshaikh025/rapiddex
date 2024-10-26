export default function SubBridgeView() {
    return (
        <div className="col-lg-5 col-md-12 col-sm-12 col-12" id="swap-wrapper">
            <div className="card">
                <div className="p-24">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="card-action-wrapper cursor-pointer" id="back-to-swap">
                            <i className="fas fa-chevron-left"></i>
                        </div>
                        <div className="card-title">
                            Transaction Details
                        </div>
                        <div className="card-action-wrapper">
                            <i className="fas fa-cog cursor-pointer"></i>
                        </div>
                    </div>

                    <div className="inner-card w-100 py-2 px-3 mt-3">
                        <label className="mb-2 fw-600">Bridge</label>
                        <div className="">
                            <div className="m-5 text-center">Chain Switch Successfully</div>
                            <div className="m-5 text-center">Setting Token Allowance</div>
                            <div className="m-5 text-center">Transaction Status</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}