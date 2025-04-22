const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

// ℹ️ Update COM port & baud rate as needed
const portPath = "COM3";
const baudRate = 115200;

// 📡 Open serial port to Arduino
const serialPort = new SerialPort({
  path: portPath,
  baudRate: baudRate,
  autoOpen: true
});

// 🧾 Parse incoming data line-by-line
const parser = serialPort.pipe(new ReadlineParser({ delimiter: "\r\n" }));

// 🔌 Log port status
serialPort.on("open", () => {
  console.log(`📡 Serial port open on ${portPath}`);
});

// 🧠 Global socket.io instance (set later by attachSocket)
let io = null;

// 🧩 Link Socket.IO to HTTP server instance (called from server.js)
function attachSocket(server) {
  io = require("socket.io")(server);

  io.on("connection", (socket) => {
    console.log("🧠 WebSocket connected");
    socket.on("disconnect", () => {
      console.log("🛑 WebSocket disconnected");
    });
  });
}

// 📥 Listen to parsed data from Arduino and emit to browser if needed
parser.on("data", (line) => {
  const trimmed = line.trim();
  console.log("📥 Arduino says:", trimmed);

  // Emit call status to clients
  if (io) {
    if (trimmed === "CALL_STARTED") {
      io.emit("call_status", "CALL_STARTED");
    } else if (trimmed === "CALL_ENDED") {
      io.emit("call_status", "CALL_ENDED");
    }
  }

  // Other messages like SMS_SENT / SMS_FAILED are handled in sendSMS.js
});

// 🧰 Exported for use in smsRoutes.js, callRoutes.js, sendSMS.js, etc.
module.exports = {
  serialPort,
  parser,
  attachSocket
};
