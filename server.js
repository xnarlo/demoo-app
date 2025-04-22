require("dotenv").config();
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

// 📦 Routes and DB
const smsRoutes = require("./routes/smsRoutes");
const authRoutes = require("./routes/authRoutes");
const db = require("./db");
const { ensureAuthenticated } = require("./middleware/authMiddleware");

// 📡 Serial initialization (Arduino)
require("./serial/serial");

// 📂 Middleware
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
  secret: "secret-key", // 🔐 For security, move this to .env in production
  resave: false,
  saveUninitialized: true
}));

// 🎨 View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// 🛣️ Routes
app.use("/", authRoutes);  // /login, /logout
app.use("/", smsRoutes);   // /send-sms, /textclient-pass, /textclient

// 📝 Page: Pickup Notification Generator
app.get("/pickup", ensureAuthenticated, (req, res) => {
  res.render("pickup");
});

// 🔍 AJAX: Pickup STN Search
app.get("/pickup-search", ensureAuthenticated, (req, res) => {
  const { stn } = req.query;
  if (!stn) return res.json({ success: false });

  db.query("SELECT * FROM jo_database WHERE stn = ?", [stn], (err, results) => {
    if (err || results.length === 0) {
      return res.json({ success: false });
    }
    res.json({ success: true, details: results[0] });
  });
});

// 📤 Page: Text Client SMS Sender (Corrected)
app.get("/textclient", ensureAuthenticated, (req, res) => {
  const number = req.session.number;
  const message = req.session.message;
  const fullName = req.session.user?.full_name || "Guest";

  console.log("🧪 Rendering /textclient with session:");
  console.log("   - number:", number);
  console.log("   - message:", message);
  console.log("   - user:", fullName);

  res.render("textclient", {
    number: number || "",
    message: message || "",
    fullName
  });

  // ✅ Clear the session only AFTER rendering
  req.session.number = null;
  req.session.message = null;
  req.session.save();
});


// 📛 Page: Forfeiture Notification Generator
app.get("/forfeiture", ensureAuthenticated, (req, res) => {
  res.render("forfeiture");
});

// 🔍 AJAX: Forfeiture STN Search
app.get("/forfeiture-search", ensureAuthenticated, (req, res) => {
  const { stn } = req.query;
  if (!stn) return res.json({ success: false });

  db.query("SELECT * FROM jo_database WHERE stn = ?", [stn], (err, results) => {
    if (err || results.length === 0) {
      return res.json({ success: false, message: "No matching data found." });
    }

    res.json({ success: true, details: results[0] });
  });
});

// 🚀 Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
