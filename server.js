require("dotenv").config();
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");

const app = express();
const httpServer = http.createServer(app); // Required for socket.io

// 📦 Routes and DB
const smsRoutes = require("./routes/smsRoutes");
const authRoutes = require("./routes/authRoutes");
const callRoutes = require("./routes/callRoutes");
const db = require("./db");
const { ensureAuthenticated } = require("./middleware/authMiddleware");

// 📡 Serial initialization (Arduino) with WebSocket
const { attachSocket } = require("./serial/serial");
attachSocket(httpServer); // Attach socket.io

// 📂 Middleware
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
  secret: "secret-key", // 🔐 Replace with process.env.SECRET in production
  resave: false,
  saveUninitialized: true
}));

// 📤 Make session available in all EJS views
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// 🎨 View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// 🛣️ Routes
app.use("/", authRoutes);   // /login, /logout
app.use("/", smsRoutes);    // /send-sms, /textclient-pass, /textclient
app.use("/", callRoutes);   // /callclient, /call, /endcall

// 📝 Pickup Notification
app.get("/pickup", ensureAuthenticated, (req, res) => {
  res.render("pickup");
});

app.get("/pickup-search", ensureAuthenticated, (req, res) => {
  const { stn } = req.query;
  if (!stn) return res.json({ success: false });

  db.query("SELECT * FROM jo_database WHERE stn = ?", [stn], (err, results) => {
    if (err || results.length === 0) return res.json({ success: false });
    res.json({ success: true, details: results[0] });
  });
});

// 💬 Text Client
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

  req.session.number = null;
  req.session.message = null;
  req.session.save();
});

// 📛 Forfeiture Notification
app.get("/forfeiture", ensureAuthenticated, (req, res) => {
  res.render("forfeiture");
});

app.get("/forfeiture-search", ensureAuthenticated, (req, res) => {
  const { stn } = req.query;
  if (!stn) return res.json({ success: false });

  db.query("SELECT * FROM jo_database WHERE stn = ?", [stn], (err, results) => {
    if (err || results.length === 0)
      return res.json({ success: false, message: "No matching data found." });

    res.json({ success: true, details: results[0] });
  });
});

// 📄 Quotation Notification
app.get("/quotation", ensureAuthenticated, (req, res) => {
  res.render("quotation");
});

app.get("/quotation-search", ensureAuthenticated, (req, res) => {
  const { stn } = req.query;
  if (!stn) return res.json({ success: false });

  db.query("SELECT * FROM jo_database WHERE stn = ?", [stn], (err, results) => {
    if (err || results.length === 0)
      return res.json({ success: false, message: "No matching data found." });

    res.json({ success: true, details: results[0] });
  });
});


//SMS Logs 

app.get("/smslogs", ensureAuthenticated, (req, res) => {
  let limit = parseInt(req.query.limit) || 10;
  let page = parseInt(req.query.page) || 1;

  // Validate
  if (![10, 25, 50].includes(limit)) limit = 10;
  if (page < 1) page = 1;

  const offset = (page - 1) * limit;

  // First, count total entries
  const countQuery = `SELECT COUNT(*) AS total FROM saved_messages`;
  db.query(countQuery, (countErr, countResult) => {
    if (countErr) {
      console.error("❌ Count error:", countErr);
      return res.render("smslogs", { logs: [], limit, page, totalPages: 1 });
    }

    const totalRows = countResult[0].total;
    const totalPages = Math.ceil(totalRows / limit);

    const query = `
      SELECT * FROM saved_messages
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.query(query, [limit, offset], (err, results) => {
      if (err) {
        console.error("❌ Query error:", err);
        return res.render("smslogs", { logs: [], limit, page, totalPages });
      }

      res.render("smslogs", {
        logs: results,
        limit,
        page,
        totalPages
      });
    });
  });
});



// 🚀 Launch server with socket.io support
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
