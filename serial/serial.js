const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const serialPort = new SerialPort({
  path: "COM3",
  baudRate: 115200
});

const parser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));

serialPort.on("open", () => console.log("📡 Serial port open on COM3"));
parser.on("data", (data) => console.log("🛰 Arduino says:", data.trim()));

module.exports = { serialPort, parser };
