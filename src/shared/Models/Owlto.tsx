export class RequestOwltoPath {
    token: string; // Example: "ETH"
    from_chainid: number; // Example: 1 (for Ethereum Mainnet)
    to_chainid: number; // Example: 56 (for Binance Smart Chain)
    user: string; // Example: "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0"
  }

  export class ResponseOwltoPath {
    code: number;
    msg: {
      from_balance: string; // Example: "70288039521000"
      to_balance: string; // Example: "0"
      token_name: string; // Example: "ETH"
      token_decimal: number; // Example: 18
      dst_token_decimal: number; // Example: 18
      min: string; // Example: "100000000000000"
      max: string; // Example: "300000000000000000"
      dtc: string; // Example: "250000000000000"
      bridge_fee_ratio: string; // Example: "0"
      from_chainid: number; // Example: 1
      from_token_address: string; // Example: "0x0000000000000000000000000000000000000000"
      to_chainid: number; // Example: 56
      to_token_address: string; // Example: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8"
      maker_address: string; // Example: "0x5e809A85Aa182A9921EDD10a4163745bb3e36284"
      bridge_contract_address: string; // Example: ""
      deposit_contract_address: string; // Example: "0x0e83DEd9f80e1C92549615D96842F5cB64A08762"
      gas_token_name: string; // Example: "BNB"
      gas_token_decimal: number; // Example: 18
      estimated_gas: string; // Example: "100000000000"
      token_price: string; // Example: "0"
      cctp_amount: string; // Example: "0"
      is_cctp: number; // Example: 0
      cctp_dtc: string; // Example: "0"
    };
  }
  