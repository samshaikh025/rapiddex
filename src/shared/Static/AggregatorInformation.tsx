// aggregators.ts
export interface Aggregator {
    name: string;        // Display name
    logoUrl: string;     // URL or path to the logo
    description: string; // Description of the aggregator
}

export const aggregators: Record<string, Aggregator> = {
    lifi: {
        name: "LI.FI",
        logoUrl: "/path/to/lifi-logo.png",
        description: "LiFi aggregator for blockchain asset swaps.",
    },
    rango: {
        name: "Rango",
        logoUrl: "/path/to/rango-logo.png",
        description: "Rango aggregator for cross-chain transfers.",
    },
    owlto: {
        name: "Owlto",
        logoUrl: "",
        description: ""
    },
    other: {
        name: "Other Aggregator",
        logoUrl: "/path/to/other-logo.png",
        description: "Description for another aggregator.",
    },
};
