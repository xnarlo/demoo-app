const express = require("express");
const router = express.Router();
const { sendSMS } = require("../util/sendSMS");

// ✅ POST: Receive number and message from pickup.ejs
router.post("/textclient-pass", (req, res) => {
  const { number, message } = req.body;

  req.session.number = number;
  req.session.message = message;

  console.log("✅ Received in /textclient-pass:");
  console.log("   - number:", number);
  console.log("   - message:", message);

  req.session.save((err) => {
    if (err) {
      console.error("❌ Error saving session:", err);
      return res.redirect("/pickup");
    }
    console.log("✅ Session saved. Redirecting to /textclient");
    res.redirect("/textclient");
  });
});

// ✅ GET: View that loads message + number from session into form
router.get("/textclient", (req, res) => {
  const number = req.session.number;
  const message = req.session.message;
  const fullName = req.session.user?.full_name || "Guest";

  console.log("🧪 Rendering /textclient with session:");
  console.log("   - number:", number);
  console.log("   - message:", message);
  console.log("   - fullName:", fullName);

  res.render("textclient", {
    number: number || "",
    message: message || "",
    fullName
  });

  // ✅ Delay clearing until after response is sent
  // req.session.number = null;
  // req.session.message = null;

  req.session.save(); // trigger session store update safely
});


// ✅ POST: Send SMS (called by textclient.ejs)
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
    res.json({ status: `❌ ${err.message}` });
  }
});

module.exports = router;
