const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

// IMPORTANT: webhook raw body MUST come before json
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send("Webhook error");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const email = session.customer_details?.email;

    if (email) {
      await supabase.from("users").upsert({
        email: email,
        is_premium: true,
        stripe_customer_id: session.customer
      });
    }
  }

  res.json({ received: true });
});

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// health check
app.get("/", (req, res) => {
  res.send("SaaS backend running");
});

// Stripe checkout
app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: "price_1TYTaOHyr3eYjbnKkAMSxY5A",
          quantity: 1
        }
      ],
      success_url: "https://mia-prima-app.vercel.app/?success=1",
      cancel_url: "https://mia-prima-app.vercel.app/"
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stripe error" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});