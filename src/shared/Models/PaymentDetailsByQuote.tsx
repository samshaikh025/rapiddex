export class PaymentField {
    id: number;
    label: string;
    isOptional?: boolean;
    paymentLinkId?: number;
  }
  
  export class PaymentLinkAdvanceField {
    id: number;
    tags?: string;
    allowPromotionalCode?: boolean;
    callToActionLabel?: string;
    showConfirmationPage?: boolean;
    message?: string;
    redirectUrl?: string;
    paymentLinkId?: number;
  }
  
  export class PaymentLink {
    id: number;
    url?: string;
    linkType?: string;
    acceptPayment?: string;
    product?: string;
    token?: string;
    amount?: number;
    title?: string;
    description?: string;
    image?: string;
    status?: string;
    addedBy?: string;
    addedDate?: string; // use string or Date depending on API
    expiryTime?: string; // use string or Date depending on API
    chainIdFrom?: number;
    chainIdTo?: number;
    fromToken?: string;
    toToken?: string;
    fromWalletAddress?: string;
    toWalletAddress?: string;
    amountIn?: number;
    toTokenJSon?: string;
    toChainJSon?: string;
  }
  
  export class PaymentLinkDto extends PaymentLink {
    paymentFields?: PaymentField[];
    paymentLinkAdvanceFields?: PaymentLinkAdvanceField;
    supportedTokens?: any;
    supportedChains?: any;
  }