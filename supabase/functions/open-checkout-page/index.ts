import { Hono } from "npm:hono@4.2.1";
import { Cashfree } from "npm:cashfree-pg-sdk-nodejs@2.1.0";

const CASHFREE_CLIENT_ID = Deno.env.get("CASHFREE_CLIENT_ID") ?? "";
const CASHFREE_CLIENT_SECRET = Deno.env.get("CASHFREE_CLIENT_SECRET") ?? "";
const CASHFREE_ENV = Deno.env.get("CASHFREE_ENV") ?? "sandbox";

const cf = new Cashfree({
  client_id: CASHFREE_CLIENT_ID,
  client_secret: CASHFREE_CLIENT_SECRET,
  environment: CASHFREE_ENV,
});

const app = new Hono();

/**
 * GET /cashfree/open-checkout/:orderId
 * Returns { checkout_url: "..."} that the frontend can redirect to.
 */
app.get("/cashfree/open-checkout/:orderId", async (c) => {
  try {
    const { orderId } = c.req.param();

    // Fetch order details – the response includes checkout_page_url
    const order = await cf.order.get(orderId);

    if (!order.checkout_page_url) {
      return c.json({ error: "Checkout URL not available" }, 400);
    }

    return c.json({ checkout_url: order.checkout_page_url }, 200);
  } catch (err) {
    console.error("Open checkout error:", err);
    return c.json({ error: err?.message ?? "Internal server error" }, 500);
  }
});

Deno.serve(app.fetch);