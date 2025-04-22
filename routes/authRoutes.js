const express = require("express");
const router = express.Router();
const db = require("../db");

// Render login form
router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// Process login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM user_accounts WHERE username = ? AND password = ?",
    [username, password],
    (err, results) => {
      if (err) {
        console.error("❌ Login query error:", err);
        return res.render("login", { error: "An error occurred. Please try again." });
      }

      if (results.length === 1) {
        req.session.user = {
          id: results[0].id,
          full_name: results[0].full_name,
          username: results[0].username
        };
        res.redirect("/textclient");
      } else {
        res.render("login", { error: "Invalid username or password." });
      }
    }
  );
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("⚠️ Logout error:", err);
    res.redirect("/login");
  });
});

module.exports = router;
