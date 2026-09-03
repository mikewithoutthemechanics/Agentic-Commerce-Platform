import { Router, type IRouter } from "express";
import {
  CreateCheckoutBody,
  GetEstimatedDeliveryDatesQueryParams,
  GetLiveInventoryParams,
  ListProductsQueryParams,
  VerifyCompatibilitySpecsBody,
  CreateCheckoutResponse,
  GetEstimatedDeliveryDatesResponse,
  GetLiveInventoryResponse,
  ListProductsResponse,
  VerifyCompatibilitySpecsResponse,
} from "@workspace/api-zod";
import {
  commerceStore,
  CommerceConfigurationError,
  CommerceNotFoundError,
  InvalidPaymentTokenError,
  PaymentProviderConfigurationError,
} from "../lib/commerce-store";

const router: IRouter = Router();

function handleCommerceError(res: Parameters<IRouter["get"]>[1] extends never ? never : any, error: unknown) {
  if (error instanceof CommerceNotFoundError) {
    res.status(404).json({ error: error.message });
    return;
  }
  if (error instanceof InvalidPaymentTokenError) {
    res.status(401).json({ error: error.message });
    return;
  }
  if (
    error instanceof CommerceConfigurationError ||
    error instanceof PaymentProviderConfigurationError
  ) {
    res.status(503).json({ error: error.message });
    return;
  }
  throw error;
}

router.get("/.well-known/ucp", (_req, res) => {
  res.json({
    ucp: {
      version: "2026-01-01",
      capabilities: ["Catalog", "Cart", "Checkout", "OrderManagement"],
    },
    endpoints: {
      catalog: "/api/products",
      checkout: "/api/checkout",
    },
  });
});

router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const products = await commerceStore.listProducts(parsed.data);
    res.json(ListProductsResponse.parse(products));
  } catch (error) {
    handleCommerceError(res, error);
  }
});

router.get("/products/:id/inventory", async (req, res): Promise<void> => {
  const parsed = GetLiveInventoryParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const inventory = await commerceStore.getLiveInventory(parsed.data.id);
    res.json(GetLiveInventoryResponse.parse(inventory));
  } catch (error) {
    handleCommerceError(res, error);
  }
});

router.get("/delivery-estimates", async (req, res): Promise<void> => {
  const parsed = GetEstimatedDeliveryDatesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const estimate = await commerceStore.getEstimatedDeliveryDates(
      parsed.data.productId,
      parsed.data.postalCode,
    );
    res.json(GetEstimatedDeliveryDatesResponse.parse(estimate));
  } catch (error) {
    handleCommerceError(res, error);
  }
});

router.post("/compatibility/verify", async (req, res): Promise<void> => {
  const parsed = VerifyCompatibilitySpecsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const result = await commerceStore.verifyCompatibility(parsed.data);
    res.json(VerifyCompatibilitySpecsResponse.parse(result));
  } catch (error) {
    handleCommerceError(res, error);
  }
});

router.post("/checkout", async (req, res): Promise<void> => {
  const parsed = CreateCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const checkout = await commerceStore.createCheckout(parsed.data);
    res.status(201).json(CreateCheckoutResponse.parse(checkout));
  } catch (error) {
    handleCommerceError(res, error);
  }
});

export default router;