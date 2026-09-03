import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import type {
  CheckoutInput,
  CheckoutResponse,
  CompatibilityCheckInput,
  CompatibilityResult,
  DeliveryEstimate,
  InventoryStatus,
  Product,
} from "@workspace/api-zod";

type ProductRow = {
  id: string;
  gtin: string | null;
  title: string;
  detailed_specs: Record<string, unknown>;
  inventory_count: number;
  human_price: number | string;
  agent_tokenized_price: number | string;
  trend_score: number | string;
};

type OrderRow = {
  id: string;
};

export class CommerceConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommerceConfigurationError";
  }
}

export class CommerceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommerceNotFoundError";
  }
}

export class InvalidPaymentTokenError extends Error {
  constructor() {
    super("The agent payment token is invalid.");
    this.name = "InvalidPaymentTokenError";
  }
}

export class PaymentProviderConfigurationError extends Error {
  constructor(provider: string) {
    super(`${provider} is not configured for this environment.`);
    this.name = "PaymentProviderConfigurationError";
  }
}

const PRODUCT_SELECT =
  "id,gtin,title,detailed_specs,inventory_count,human_price,agent_tokenized_price,trend_score";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new CommerceConfigurationError(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return { url, serviceRoleKey };
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    gtin: row.gtin,
    title: row.title,
    detailedSpecs: row.detailed_specs ?? {},
    inventoryCount: Number(row.inventory_count),
    humanPrice: Number(row.human_price),
    agentTokenizedPrice: Number(row.agent_tokenized_price),
    trendScore: Number(row.trend_score),
  };
}

function encodeFilterValue(value: string) {
  return value.replace(/[*(),]/g, " ").trim().slice(0, 120);
}

async function supabaseRequest<T>(
  table: string,
  options: {
    method?: string;
    query?: Record<string, string>;
    body?: unknown;
    prefer?: string;
  } = {},
): Promise<T> {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const requestUrl = new URL(`${url}/rest/v1/${table}`);

  for (const [key, value] of Object.entries(options.query ?? {})) {
    requestUrl.searchParams.set(key, value);
  }

  const response = await fetch(requestUrl, {
    method: options.method ?? "GET",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed with status ${response.status}.`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export class CommerceStore {
  async listProducts(filters: {
    q?: string;
    category?: string;
    availableOnly?: boolean;
  }): Promise<Product[]> {
    const rows = await supabaseRequest<ProductRow[]>("products", {
      query: {
        select: PRODUCT_SELECT,
        order: "trend_score.desc",
        limit: "100",
      },
    });

    const q = filters.q?.trim().toLowerCase();
    const category = filters.category?.trim().toLowerCase();

    return rows
      .map(mapProduct)
      .filter((product) => {
        if (filters.availableOnly !== false && product.inventoryCount <= 0) {
          return false;
        }

        if (q) {
          const searchable = [
            product.title,
            JSON.stringify(product.detailedSpecs),
          ]
            .join(" ")
            .toLowerCase();
          if (!searchable.includes(encodeFilterValue(q))) {
            return false;
          }
        }

        if (category) {
          const productCategory = String(
            product.detailedSpecs.category ?? "",
          ).toLowerCase();
          if (productCategory !== category) {
            return false;
          }
        }

        return true;
      });
  }

  async getProduct(id: string): Promise<Product> {
    const rows = await supabaseRequest<ProductRow[]>("products", {
      query: {
        select: PRODUCT_SELECT,
        id: `eq.${id}`,
        limit: "1",
      },
    });

    const row = rows[0];
    if (!row) {
      throw new CommerceNotFoundError("Product not found.");
    }

    return mapProduct(row);
  }

  async getLiveInventory(id: string): Promise<InventoryStatus> {
    const product = await this.getProduct(id);
    return {
      productId: product.id,
      inventoryCount: product.inventoryCount,
      available: product.inventoryCount > 0,
    };
  }

  async getEstimatedDeliveryDates(
    productId: string,
    postalCode: string,
  ): Promise<DeliveryEstimate> {
    const inventory = await this.getLiveInventory(productId);
    if (!inventory.available) {
      throw new CommerceNotFoundError("Product is not currently available.");
    }

    const from = new Date();
    const to = new Date();
    from.setUTCDate(from.getUTCDate() + 3);
    to.setUTCDate(to.getUTCDate() + 7);

    return {
      productId,
      postalCode,
      estimatedFrom: from,
      estimatedTo: to,
    };
  }

  async verifyCompatibility(
    input: CompatibilityCheckInput,
  ): Promise<CompatibilityResult> {
    const product = await this.getProduct(input.productId);
    const matches: string[] = [];
    const mismatches: string[] = [];

    for (const [key, expectedValue] of Object.entries(input.requirements)) {
      const actualValue = product.detailedSpecs[key];
      if (
        actualValue !== undefined &&
        String(actualValue).toLowerCase() === expectedValue.toLowerCase()
      ) {
        matches.push(key);
      } else {
        mismatches.push(key);
      }
    }

    return {
      productId: product.id,
      compatible: mismatches.length === 0,
      matches,
      mismatches,
    };
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutResponse> {
    const products = await Promise.all(
      input.items.map((item) => this.getProduct(item.productId)),
    );
    const lineItems = input.items.map((item, index) => ({
      productId: item.productId,
      quantity: item.quantity,
      title: products[index].title,
      humanPrice: products[index].humanPrice,
      agentTokenizedPrice: products[index].agentTokenizedPrice,
    }));

    for (const [index, product] of products.entries()) {
      if (product.inventoryCount < input.items[index].quantity) {
        throw new CommerceNotFoundError(
          `${product.title} does not have enough inventory.`,
        );
      }
    }

    const orderId = randomUUID();
    if (input.consumer === "human") {
      const redirectUrl = createPayFastRedirect(
        orderId,
        lineItems.reduce(
          (total, item) => total + item.humanPrice * item.quantity,
          0,
        ),
        products.map((product) => product.title).join(", "),
      );

      const [order] = await insertOrder({
        id: orderId,
        user_id: input.userId ?? null,
        cart_details: lineItems,
        status: "payment_pending",
        agent_id: null,
        payment_gateway: "payfast",
      });

      return {
        orderId: order?.id ?? orderId,
        consumer: "human",
        status: "payment_pending",
        paymentGateway: "payfast",
        redirectUrl,
      };
    }

    verifyAgentPaymentToken(input.paymentToken);
    const [order] = await insertOrder({
      id: orderId,
      user_id: input.userId ?? null,
      cart_details: lineItems,
      status: "paid",
      agent_id: input.agentId ?? null,
      payment_gateway: "agent_api",
    });

    return {
      orderId: order?.id ?? orderId,
      consumer: "agent",
      status: "paid",
      paymentGateway: "agent_api",
      redirectUrl: null,
    };
  }
}

async function insertOrder(values: Record<string, unknown>) {
  return supabaseRequest<OrderRow[]>("orders", {
    method: "POST",
    prefer: "return=representation",
    body: values,
    query: { select: "id" },
  });
}

function verifyAgentPaymentToken(token: string | null | undefined) {
  const expectedHash = process.env.AGENT_PAYMENT_TOKEN_HASH;
  if (!expectedHash) {
    throw new PaymentProviderConfigurationError("Agent payment authorization");
  }

  const suppliedHash = createHash("sha256").update(token ?? "").digest();
  const expected = Buffer.from(expectedHash, "hex");
  if (expected.length !== suppliedHash.length || !timingSafeEqual(suppliedHash, expected)) {
    throw new InvalidPaymentTokenError();
  }
}

function createPayFastRedirect(
  orderId: string,
  amount: number,
  itemName: string,
): string {
  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
  const passphrase = process.env.PAYFAST_PASSPHRASE;
  const returnUrl = process.env.PAYFAST_RETURN_URL;
  const cancelUrl = process.env.PAYFAST_CANCEL_URL;
  const notifyUrl = process.env.PAYFAST_NOTIFY_URL;

  if (
    !merchantId ||
    !merchantKey ||
    !passphrase ||
    !returnUrl ||
    !cancelUrl ||
    !notifyUrl
  ) {
    throw new PaymentProviderConfigurationError("PayFast");
  }

  const fields = [
    ["merchant_id", merchantId],
    ["merchant_key", merchantKey],
    ["return_url", returnUrl],
    ["cancel_url", cancelUrl],
    ["notify_url", notifyUrl],
    ["m_payment_id", orderId],
    ["amount", amount.toFixed(2)],
    ["item_name", itemName.slice(0, 100)],
  ];
  const query = fields
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  const signature = createHash("md5")
    .update(`${query}&passphrase=${encodeURIComponent(passphrase)}`)
    .digest("hex");
  const baseUrl =
    process.env.PAYFAST_BASE_URL ?? "https://www.payfast.co.za/eng/process";
  return `${baseUrl}?${query}&signature=${signature}`;
}

export const commerceStore = new CommerceStore();