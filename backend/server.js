const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.get("/", (req,res) => {
  res.send("API running");
});

/* SAVE SCORE */
app.post("/save-assessment", async (req,res) => {
  const { score, scores } = req.body;

  await supabase.from("assessments").insert([
    {
      preparedness_score: score,
      water_score: scores?.[0],
      food_score: scores?.[1],
      energy_score: scores?.[2],
      comms_score: scores?.[3]
    }
  ]);

  res.json({ ok: true });
});

/* STRIPE */
app.post("/create-checkout-session", async (req,res) => {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{
      price: process.env.STRIPE_PRICE_ID,
      quantity: 1
    }],
    success_url: process.env.FRONTEND_URL,
    cancel_url: process.env.FRONTEND_URL
  });

  res.json({ url: session.url });
});

app.listen(process.env.PORT || 3000);