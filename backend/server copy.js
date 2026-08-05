const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const db = require("./db");

const app = express();

/* =====================================================
CORS
===================================================== */

app.use(cors());

/* =====================================================
STRIPE WEBHOOK
DEVE STARE PRIMA DI express.json()
===================================================== */

app.post(
"/webhook",
express.raw({ type: "application/json" }),
async (req, res) => {
const signature = req.headers["stripe-signature"];

let event;

try {
  event = stripe.webhooks.constructEvent(
    req.body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
} catch (error) {
  console.error(
    "WEBHOOK ERROR:",
    error.message
  );

  return res
    .status(400)
    .send("Webhook Error: " + error.message);
}

console.log(
  "STRIPE EVENT:",
  event.type
);

/* =================================================
   CHECKOUT COMPLETATO
================================================= */

if (
  event.type ===
  "checkout.session.completed"
) {
  const session = event.data.object;

  const email =
    session.customer_email ||
    (
      session.customer_details &&
      session.customer_details.email
    );

  if (email) {
    console.log(
      "CHECKOUT COMPLETED:",
      email
    );

    db.run(
      "UPDATE users SET premium = 1 WHERE email = ?",
      [email],
      (error) => {
        if (error) {
          console.error(
            "PREMIUM UPDATE ERROR:",
            error
          );
        } else {
          console.log(
            "PREMIUM ENABLED:",
            email
          );
        }
      }
    );
  }
}

/* =================================================
   INVOICE PAGATA
================================================= */

if (
  event.type ===
  "invoice.paid"
) {
  const invoice = event.data.object;

  if (invoice.customer_email) {
    console.log(
      "INVOICE PAID:",
      invoice.customer_email
    );

    db.run(
      "UPDATE users SET premium = 1 WHERE email = ?",
      [invoice.customer_email],
      (error) => {
        if (error) {
          console.error(
            "PREMIUM UPDATE ERROR:",
            error
          );
        } else {
          console.log(
            "PREMIUM ACTIVE:",
            invoice.customer_email
          );
        }
      }
    );
  }
}

/* =================================================
   PAGAMENTO FALLITO
================================================= */

if (
  event.type ===
  "invoice.payment_failed"
) {
  const invoice = event.data.object;

  if (invoice.customer_email) {
    console.log(
      "INVOICE PAYMENT FAILED:",
      invoice.customer_email
    );

    db.run(
      "UPDATE users SET premium = 0 WHERE email = ?",
      [invoice.customer_email],
      (error) => {
        if (error) {
          console.error(
            "PREMIUM DISABLE ERROR:",
            error
          );
        } else {
          console.log(
            "PREMIUM DISABLED:",
            invoice.customer_email
          );
        }
      }
    );
  }
}

/* =================================================
   ABBONAMENTO CANCELLATO
================================================= */

if (
  event.type ===
  "customer.subscription.deleted"
) {
  const subscription =
    event.data.object;

  console.log(
    "SUBSCRIPTION DELETED:",
    subscription.id
  );

  try {
    const customer =
      await stripe.customers.retrieve(
        subscription.customer
      );

    if (
      customer &&
      !customer.deleted &&
      customer.email
    ) {
      db.run(
        "UPDATE users SET premium = 0 WHERE email = ?",
        [customer.email],
        (error) => {
          if (error) {
            console.error(
              "PREMIUM DISABLE ERROR:",
              error
            );
          } else {
            console.log(
              "PREMIUM DISABLED:",
              customer.email
            );
          }
        }
      );
    }
  } catch (error) {
    console.error(
      "CUSTOMER LOOKUP ERROR:",
      error
    );
  }
}

res.json({
  received: true
});

}
);

/* =====================================================
JSON
===================================================== */

app.use(express.json());

/* =====================================================
FRONTEND STATICO
===================================================== */

app.use(
express.static(
path.join(
__dirname,
"../frontend"
)
)
);

/* =====================================================
HEALTH CHECK
===================================================== */

app.get(
"/api",
(req, res) => {
res.json({
status: "ok"
});
}
);

/* =====================================================
   CREATE START PAYMENT
   0,69 € OGGI
   7 GIORNI DI PROVA
   35 €/MESE
===================================================== */

app.post("/create-start-payment", async (req, res) => {
  try {
    const { email, variant, score } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "missing_email"
      });
    }

    db.run(
      "INSERT OR IGNORE INTO users (email, premium) VALUES (?, 0)",
      [email],
      (error) => {
        if (error) {
          console.error("DATABASE INSERT ERROR:", error);
        }
      }
    );

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],

      customer_email: email,

      subscription_data: {
        trial_period_days: 7,

        metadata: {
          email: email,
          variant: variant || "A",
          score: score || "0"
        }
      },

      success_url:
        process.env.FRONTEND_URL + "/success.html",

      cancel_url:
        process.env.FRONTEND_URL + "/cancel.html"
    });

    console.log("CHECKOUT CREATED:", session.id);

    res.json({
      url: session.url
    });

  } catch (error) {
    console.error("START PAYMENT ERROR:", error);

    res.status(500).json({
      error: "stripe_error"
    });
  }
});

/* =====================================================
   CHECK USER STATUS
===================================================== */

app.get("/api/user", (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({
      error: "missing_email"
    });
  }

  db.get(
    "SELECT premium FROM users WHERE email = ?",
    [email],
    (error, row) => {
      if (error) {
        return res.status(500).json({
          error: error.message
        });
      }

      res.json({
        premium: row ? row.premium === 1 : false
      });
    }
  );
});

/* =====================================================
   START SERVER
===================================================== */

const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    "SaaS SERVER ON PORT " + PORT
  );
});