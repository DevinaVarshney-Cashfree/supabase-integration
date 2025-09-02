import { Hono } from "npm:hono@4.2.1";
import { createClient } from "npm:@supabase/supabase-js@2.42.4";
import { Cashfree } from "npm:cashfree-pg-sdk-nodejs@2.1.0";

const CASHFREE_CLIENT_ID = Deno.env.get("CASHFREE_CLIENT_ID") ?? "";
const CASHFREE_CLIENT_SECRET = Deno.env.get("CASHFREE_CLIENT_SECRET") ?? "";
const CASHFREE_ENV = Deno.env.get("CASHFREE_ENV") ?? "sandbox";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const cf = new Cashfree({
  client_id: CASHFREE_CLIENT_ID,
  client_secret: CASHFREE_CLIENT_SECRET,
  environment: CASHFREE_ENV,
});

const app = new Hono();

app.post("/cashfree/create-order", async (c) => {
  try {
    const payload = await c.req.json();
    if (!payload?.order_id) {
      return c.json({ error: "order_id is required" }, 400);
    }

    // Create order in Cashfree
    const cfResponse = await cf.order.create(payload);

    // Store mapping for later steps
    await supabase.from("cashfree_orders").upsert({
      order_id: payload.order_id,
      cashfree_order_id: cfResponse.order_id,
      status: cfResponse.order_status ?? "created",
      amount: payload.order_amount,
      currency: payload.order_currency ?? "INR",
    });

    return c.json(cfResponse, 200);
  } catch (err) {
    console.error("Create order error:", err);
    return c.json({ error: err?.message ?? "Internal server error" }, 500);
  }
});

Deno.serve(app.fetch);