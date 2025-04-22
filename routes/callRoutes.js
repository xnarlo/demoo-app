const express = require("express");
const router = express.Router();
const { serialPort } = require("../serial/serial");


// View: Call Client
router.get("/callclient", (req, res) => {
  res.render("callclient");
});

// Action: Make Call
router.post("/call", (req, res) => {
  const { number } = req.body;
  serialPort.write(`MAKE_CALL,${number}\n`);
  res.send("📞 Call command sent");
});

// Action: End Call
router.post("/endcall", (req, res) => {
  serialPort.write("END_CALL\n");
  res.send("📴 End Call command sent");
});

module.exports = router;
