import { Cashfree } from "npm:cashfree-pg-sdk@1.0.0";

// Pull Cashfree credentials from environment variables (set in Supabase Dashboard)
const CASHFREE_APP_ID = Deno.env.get("CASHFREE_APP_ID") ?? "";
const CASHFREE_SECRET_KEY = Deno.env.get("CASHFREE_SECRET_KEY") ?? "";

// Initialise the SDK client. If credentials are missing, the SDK will throw when used.
const cashfree = new Cashfree({
  appId: CASHFREE_APP_ID,
  secretKey: CASHFREE_SECRET_KEY,
});

console.info("get-payments edge function started");

Deno.serve(async (req: Request) => {
  try {
    // Expect the order ID as a query parameter: /get-payments?orderId=abc123
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Missing required query param: orderId" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Use the Cashfree SDK to fetch payment details for the given order.
    // The SDK method name may differ; adjust according to the library's API.
    const paymentInfo = await cashfree.payment.getByOrderId(orderId);

    return new Response(JSON.stringify(paymentInfo), {
      status: 200,
      headers: { "Content-Type": "application/json", "Connection": "keep-alive" },
    });
  } catch (err) {
    console.error("Error fetching payments for order:", err);
    return new Response(
      JSON.stringify({ error: err?.message || String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});