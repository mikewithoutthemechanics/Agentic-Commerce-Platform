import { createInterface } from "node:readline";

type JsonRpcRequest = {
  id?: number | string;
  method: string;
  params?: Record<string, unknown>;
};

const apiBaseUrl = (process.env.API_BASE_URL ?? "http://127.0.0.1:5000/api").replace(
  /\/$/,
  "",
);

const tools = [
  {
    name: "get_live_inventory",
    description: "Read current inventory for a catalog product.",
    inputSchema: {
      type: "object",
      properties: { product_id: { type: "string", format: "uuid" } },
      required: ["product_id"],
    },
  },
  {
    name: "get_estimated_delivery_dates",
    description: "Get the estimated delivery window for a product and postal code.",
    inputSchema: {
      type: "object",
      properties: {
        product_id: { type: "string", format: "uuid" },
        postal_code: { type: "string" },
      },
      required: ["product_id", "postal_code"],
    },
  },
  {
    name: "verify_compatibility_specs",
    description: "Compare product specifications with agent requirements.",
    inputSchema: {
      type: "object",
      properties: {
        product_id: { type: "string", format: "uuid" },
        requirements: { type: "object", additionalProperties: { type: "string" } },
      },
      required: ["product_id", "requirements"],
    },
  },
];

const requestSchema = {
  get_live_inventory: (args: Record<string, unknown>) => {
    const productId = String(args.product_id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(productId)) {
      throw new Error("product_id must be a UUID.");
    }
    return { path: `/products/${productId}/inventory`, init: { method: "GET" } };
  },
  get_estimated_delivery_dates: (args: Record<string, unknown>) => {
    const productId = String(args.product_id ?? "");
    const postalCode = String(args.postal_code ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(productId) || postalCode.length < 2) {
      throw new Error("product_id and postal_code are required.");
    }
    return {
      path: `/delivery-estimates?productId=${encodeURIComponent(productId)}&postalCode=${encodeURIComponent(postalCode)}`,
      init: { method: "GET" },
    };
  },
  verify_compatibility_specs: (args: Record<string, unknown>) => {
    const productId = String(args.product_id ?? "");
    const requirements = args.requirements;
    if (!/^[0-9a-f-]{36}$/i.test(productId) || typeof requirements !== "object" || requirements === null) {
      throw new Error("product_id and requirements are required.");
    }
    return {
      path: "/compatibility/verify",
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, requirements }),
      },
    };
  },
};

async function callTool(name: string, args: Record<string, unknown>) {
  const builder = requestSchema[name as keyof typeof requestSchema];
  if (!builder) {
    throw new Error(`Unknown tool: ${name}`);
  }

  const request = builder(args);
  const response = await fetch(`${apiBaseUrl}${request.path}`, request.init);
  const body = await response.text();
  if (!response.ok) {
    throw new Error(body || `Commerce API returned ${response.status}.`);
  }

  return {
    content: [{ type: "text", text: body }],
  };
}

function write(message: unknown) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

const input = createInterface({ input: process.stdin });
input.on("line", async (line) => {
  let request: JsonRpcRequest;
  try {
    request = JSON.parse(line) as JsonRpcRequest;
  } catch {
    write({ jsonrpc: "2.0", error: { code: -32700, message: "Invalid JSON." } });
    return;
  }

  if (request.method === "notifications/initialized") {
    return;
  }

  if (request.method === "initialize") {
    write({
      jsonrpc: "2.0",
      id: request.id,
      result: {
        protocolVersion: "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "nexus-market", version: "0.1.0" },
      },
    });
    return;
  }

  if (request.method === "tools/list") {
    write({ jsonrpc: "2.0", id: request.id, result: { tools } });
    return;
  }

  if (request.method === "tools/call") {
    const name = String(request.params?.name ?? "");
    const args = (request.params?.arguments ?? {}) as Record<string, unknown>;
    try {
      const result = await callTool(name, args);
      write({ jsonrpc: "2.0", id: request.id, result });
    } catch (error) {
      write({
        jsonrpc: "2.0",
        id: request.id,
        result: {
          isError: true,
          content: [{ type: "text", text: error instanceof Error ? error.message : "Tool failed." }],
        },
      });
    }
  }
});