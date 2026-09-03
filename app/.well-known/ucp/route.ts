import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ucp: {
      version: "2026-01-01",
      capabilities: ["Catalog", "Cart", "Checkout", "OrderManagement"],
    },
    endpoints: {
      catalog: "/api/products",
      checkout: "/api/checkout",
    },
  });
}