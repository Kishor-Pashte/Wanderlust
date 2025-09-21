// routes/payment.js
const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// === Utility functions for storing orders in JSON ===
const ordersFile = path.join(__dirname, "../orders.json");

const readData = () => {
  if (fs.existsSync(ordersFile)) {
    const data = fs.readFileSync(ordersFile);
    return JSON.parse(data);
  }
  return [];
};

const writeData = (data) => {
  fs.writeFileSync(ordersFile, JSON.stringify(data, null, 2));
};

if (!fs.existsSync(ordersFile)) {
  writeData([]);
}

// === Routes ===

// Create Razorpay order
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;

    const options = {
      amount: Number(amount) * 100, // convert to paise
      currency,
      receipt,
      notes,
    };

    const order = await razorpay.orders.create(options);

    // Save order locally
    const orders = readData();
    orders.push({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: "created",
    });
    writeData(orders);

    res.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).send("Error creating order");
  }
});

// Verify payment
router.post("/verify-payment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    const orders = readData();
    const order = orders.find((o) => o.order_id === razorpay_order_id);
    if (order) {
      order.status = "paid";
      order.payment_id = razorpay_payment_id;
      writeData(orders);
    }
    res.json({ status: "ok" });
    console.log("Payment verification successful");
  } else {
    res.status(400).json({ status: "verification_failed" });
    console.log("Payment verification failed");
  }
});

module.exports = router;
