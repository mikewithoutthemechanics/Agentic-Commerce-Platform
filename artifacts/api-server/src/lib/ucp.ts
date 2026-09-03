export const ucpManifest = {
  version: "2026-01-01",
  merchant: {
    name: "NEXUS MARKET",
    description:
      "A considered product shelf for people and autonomous shopping agents.",
  },
  capabilities: ["Catalog", "Cart", "Checkout", "OrderManagement"],
  endpoints: {
    catalog: "/api/products",
    inventory: "/api/products/{id}/inventory",
    deliveryEstimates: "/api/delivery-estimates",
    compatibility: "/api/compatibility/verify",
    checkout: "/api/checkout",
  },
  paymentMethods: {
    human: ["payfast"],
    agent: ["ucp_tokenized_payment"],
  },
} as const;