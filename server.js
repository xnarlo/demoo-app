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
  secret: "secret-key", // 🔐 You can move this to .env
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

// 🔍 AJAX Endpoint: Search STN
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

// 📤 Page: Text Client SMS Sender
app.get("/textclient", ensureAuthenticated, (req, res) => {
  const { number, message } = req.session;

  // Clear session values after use
  req.session.number = null;
  req.session.message = null;

  res.render("textclient", {
    number: number || "",
    message: message || "",
    fullName: req.session.user.full_name
  });
});

// 🚀 Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
