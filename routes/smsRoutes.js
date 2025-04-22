const express = require("express");
const router = express.Router();
const { sendSMS } = require("../util/sendSMS");

// ✅ POST: Receive number and message from another view (e.g., pickup, forfeiture)
router.post("/textclient-pass", (req, res) => {
  const { number, message } = req.body;
  req.session.number = number;
  req.session.message = message;

  console.log("✅ Session set in /textclient-pass:");
  console.log("   - number:", number);
  console.log("   - message:", message);

  req.session.save((err) => {
    if (err) {
      console.error("❌ Session save error:", err);
      return res.redirect("back"); // fallback to referring page
    }
    res.redirect("/textclient");
  });
});

// ✅ POST: Send SMS via Arduino + log to database
router.post("/send-sms", async (req, res) => {
  const { number, message } = req.body;
  const sender = req.session.user?.full_name || "Anonymous";

  try {
    const result = await sendSMS(number, message, sender);

    const statusMsg = result.success
      ? result.retried
        ? "✅ Message sent successfully, but some parts required retrying."
        : `✅ Message sent successfully (${result.parts} part${result.parts > 1 ? "s" : ""})`
      : "⚠️ Message could not be sent.";

    res.json({ status: statusMsg });
  } catch (err) {
    console.error("❌ sendSMS failed:", err);
    res.json({ status: `❌ ${err.message}` });
  }
});

module.exports = router;
