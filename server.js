const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config(); // 👈 DEVE essere PRIMA di usare process.env

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

app.use(cors());
app.use(express.json());

// Health check (utile per debug)
app.get("/", (req, res) => {
  res.send("Server Stripe attivo");
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({
        error: "Missing Stripe secret key in .env",
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Full Preparedness Report",
            },
            unit_amount: 99, // €0.99
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: "Stripe error" });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});