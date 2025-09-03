import { Cashfree } from "npm:cashfree-pg-sdk@1.0.0";

// Environment variables set in Supabase Edge Functions
const CASHFREE_APP_ID = Deno.env.get("CASHFREE_APP_ID") ?? "";
const CASHFREE_SECRET_KEY = Deno.env.get("CASHFREE_SECRET_KEY") ?? "";

if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
  console.error("Cashfree credentials not set");
  // Edge Functions should still start; errors will be returned per request
}

// Initialize the Cashfree SDK client
const cashfree = new Cashfree({
  appId: CASHFREE_APP_ID,
  secretKey: CASHFREE_SECRET_KEY,
});

console.info("create-order edge function started");

Deno.serve(async (req: Request) => {
  try {
    const { orderId, orderAmount, orderCurrency, orderNote, customerEmail, customerPhone } = await req.json();

    if (!orderId || !orderAmount || !orderCurrency) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const payload = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: orderCurrency,
      order_note: orderNote,
      customer_details: {
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
    };

    const response = await cashfree.order.create(payload);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json", "Connection": "keep-alive" },
    });
  } catch (err) {
    console.error("Error creating order:", err);
    return new Response(JSON.stringify({ error: err?.message || String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});