// This file is responsible for connecting to the MySQL database using mysql2 package
// and exporting the connection object for use in other modules.
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'P@zzword1',
    database: 'ER506'
});

db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed:", err);
    } else {
        console.log("✅ Connected to MySQL Database");
    }
});

module.exports = db;

