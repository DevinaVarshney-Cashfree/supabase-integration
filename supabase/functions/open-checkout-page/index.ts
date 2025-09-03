import { Cashfree } from "npm:cashfree-pg-sdk@1.0.0";

const CASHFREE_APP_ID = Deno.env.get("CASHFREE_APP_ID") ?? "";
const CASHFREE_SECRET_KEY = Deno.env.get("CASHFREE_SECRET_KEY") ?? "";

const cashfree = new Cashfree({
  appId: CASHFREE_APP_ID,
  secretKey: CASHFREE_SECRET_KEY,
});

console.info("load-checkout edge function started");

Deno.serve(async (req: Request) => {
  try {
    // Expect orderId as query param: /load-checkout?orderId=xyz
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");
    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId query param required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // Fetch the checkout page link from Cashfree
    const response = await cashfree.checkout.get(orderId);
    // The SDK typically returns an object containing the checkout URL
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json", "Connection": "keep-alive" },
    });
  } catch (err) {
    console.error("Error loading checkout page:", err);
    return new Response(JSON.stringify({ error: err?.message || String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});