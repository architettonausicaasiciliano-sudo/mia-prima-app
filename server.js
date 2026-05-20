const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Stripe server running");
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      line_items: [
        {
          price: "price_1TYTaOHyr3eYjbnKkAMSxY5A", // <-- METTI QUI IL TUO STRIPE PRICE ID
          quantity: 1
        }
      ],

      success_url: "http://localhost:3000/success?paid=1",
      cancel_url: "http://localhost:3000"
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stripe error" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});