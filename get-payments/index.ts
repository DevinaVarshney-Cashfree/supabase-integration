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
 * GET /cashfree/payments/:orderId
 * Returns the list of payment objects for the given order.
 */
app.get("/cashfree/:orderId/payments", async (c) => {
  try {
    const { orderId } = c.req.param();

    // Retrieve all payments for this Cashfree order
    const payments = await cf.payment.getPaymentsByOrderId(orderId);

    return c.json({ payments }, 200);
  } catch (err) {
    console.error("Get payments error:", err);
    return c.json({ error: err?.message ?? "Internal server error" }, 500);
  }
});

Deno.serve(app.fetch);