const { serialPort, parser } = require("../serial/serial");
const db = require("../db");

let smsStatus = null;
let isProcessing = false;

parser.on("data", (data) => {
  const trimmed = data.trim();
  if (["SMS_SENT", "SMS_FAILED"].includes(trimmed)) smsStatus = trimmed;
});

function waitForSmsSent() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("⏱ Timeout waiting for SMS_SENT")), 10000);
    const interval = setInterval(() => {
      if (smsStatus === "SMS_SENT") {
        clearTimeout(timeout);
        clearInterval(interval);
        smsStatus = null;
        resolve();
      } else if (smsStatus === "SMS_FAILED") {
        clearTimeout(timeout);
        clearInterval(interval);
        smsStatus = null;
        reject(new Error("❌ SMS_FAILED received from Arduino"));
      }
    }, 500);
  });
}

function splitMessage(message, maxLen = 150) {
  const words = message.split(" ");
  const parts = [];
  let current = "";
  for (const word of words) {
    if ((current + word).length > maxLen) {
      parts.push(current.trim());
      current = word + " ";
    } else {
      current += word + " ";
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

async function sendSMS(number, message, sender = "System") {
  if (isProcessing) throw new Error("⚠️ SMS sending already in progress.");
  isProcessing = true;
  let retried = false;

  try {
    const parts = splitMessage(message);
    const isMultipart = parts.length > 1;

    for (let i = 0; i < parts.length; i++) {
      const header = isMultipart ? `(${i + 1}/${parts.length}) ` : "";
      const fullMessage = `${header}${parts[i]}`;
      const command = `SEND_SMS,${number},${fullMessage}\n`;

      let sent = false, attempts = 0;
      while (!sent && attempts < 3) {
        serialPort.write(command);
        try {
          await waitForSmsSent();
          sent = true;
        } catch {
          attempts++;
          retried = true;
        }
      }
      if (!sent) throw new Error("Sending message failed. Check signal or load.");
      await new Promise(r => setTimeout(r, 2000));
    }

    // Log to DB
    db.query("INSERT INTO saved_messages (contact_number, message, sender_full_name) VALUES (?, ?, ?)",
      [number, message, sender],
      (err) => err && console.error("❌ Logging failed:", err));

    return { success: true, parts: parts.length, retried };
  } finally {
    isProcessing = false;
  }
}

module.exports = { sendSMS };