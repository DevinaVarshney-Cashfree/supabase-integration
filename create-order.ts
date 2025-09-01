import { Hono } from "npm:hono@4.2.1";
import { createClient } from "npm:@supabase/supabase-js@2.42.4";
import { Cashfree } from "npm:cashfree-pg-sdk-nodejs@2.1.0"; // adjust version if needed

// ----- Environment variables (set in Supabase dashboard) -----
const CASHFREE_CLIENT_ID = Deno.env.get("CASHFREE_CLIENT_ID") ?? "";
const CASHFREE_CLIENT_SECRET = Deno.env.get("CASHFREE_CLIENT_SECRET") ?? "";
const CASHFREE_ENV = Deno.env.get("CASHFREE_ENV") ?? "sandbox"; // "sandbox" | "production"
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Initialise Supabase (service‑role) – used to persist order mapping
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Initialise Cashfree SDK
const cf = new Cashfree({
  client_id: CASHFREE_CLIENT_ID,
  client_secret: CASHFREE_CLIENT_SECRET,
  environment: CASHFREE_ENV,
});

const app = new Hono();

/**
 * POST /cashfree/create-order
 * Expected JSON payload (all fields required unless noted):
 * {
 *   "order_id": "your‑internal‑order‑id",
 *   "order_amount": number,
 *   "order_currency": "INR" (default),
 *   "customer_details": {
 *     "customer_name": "John Doe",
 *     "customer_email": "john@example.com",
 *     "customer_phone": "9876543210"
 *   }
 * }
 *
 * Returns the full Cashfree order response and stores a mapping in the
 * `cashfree_orders` table (create this table if it does not exist).
 */
app.post("/cashfree/create-order", async (c) => {
  try {
    const payload = await c.req.json();
    if (!payload?.order_id) {
      return c.json({ error: "order_id is required" }, 400);
    }

    // Create order via Cashfree SDK
    const cfResponse = await cf.order.create(payload);

    // Persist mapping for later verification / status checks
    await supabase.from("cashfree_orders").upsert({
      order_id: payload.order_id,
      cashfree_order_id: cfResponse.order_id,
      status: cfResponse.order_status ?? "created",
      amount: payload.order_amount,
      currency: payload.order_currency ?? "INR",
    });

    return c.json(cfResponse, 200);
  } catch (err) {
    console.error("Cashfree create order error", err);
    return c.json({ error: err?.message || "Internal server error" }, 500);
  }
});

// Export the Edge Function
Deno.serve(app.fetch);