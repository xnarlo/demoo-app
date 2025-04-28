void setup() {
    Serial.begin(115200);   // Communication with PC (debugging)
    Serial1.begin(9600);    // Communication with GSM module
  
    Serial.println("✅ Arduino Ready!");
    delay(1000);
  }
  
  void loop() {
    if (Serial.available()) {
      String receivedData = Serial.readStringUntil('\n'); // Read incoming data from web app
      receivedData.trim(); // Remove trailing newline or spaces
  
      Serial.print("🔍 Received Data: ");
      Serial.println(receivedData);
  
      if (receivedData.startsWith("MAKE_CALL")) {
        Serial.println("🔄 Processing Call Command...");
  
        int firstComma = receivedData.indexOf(',');
        if (firstComma == -1) {
          Serial.println("❌ Invalid format received!");
          return;
        }
        String phoneNumber = receivedData.substring(firstComma + 1);
        Serial.print("📞 Making Call - Number: ");
        Serial.println(phoneNumber);
        makeCall(phoneNumber);
        
      } else if (receivedData.startsWith("SEND_SMS")) {
        Serial.println("🔄 Processing SMS Command...");
  
        int firstComma = receivedData.indexOf(',');
        int secondComma = receivedData.indexOf(',', firstComma + 1);
        if (firstComma == -1 || secondComma == -1) {
          Serial.println("❌ Invalid format received!");
          return;
        }
        String phoneNumber = receivedData.substring(firstComma + 1, secondComma);
        String message = receivedData.substring(secondComma + 1);
        Serial.print("📡 Sending SMS - Number: ");
        Serial.print(phoneNumber);
        Serial.print(", Message: ");
        Serial.println(message);
        sendSMS(phoneNumber, message);
        
      } else if (receivedData.startsWith("END_CALL")) {
        Serial.println("🔄 Processing End Call Command...");
        endCall();
        
      } else {
        Serial.println("❌ Unknown command received!");
      }
    }
  }
  
  void sendSMS(String number, String message) {
    Serial.print("🔄 GSM Module: Sending SMS to ");
    Serial.println(number);
  
    // Flush any pending data from Serial1
    while (Serial1.available()) {
      Serial1.read();
    }
  
    Serial1.println("AT"); // Check if GSM module is responding
    delay(1000);
    
    Serial1.println("AT+CMGF=1"); // Set SMS mode to TEXT
    delay(1000);
    
    Serial1.print("AT+CMGS=\"");
    Serial1.print(number);
    Serial1.println("\"");
    delay(1000);
    
    Serial1.print(message); // Send the actual message
    delay(500);
    
    Serial1.write(26); // CTRL+Z to send the message
    delay(2000); // Increased delay to allow GSM module to process the message
  
    // Wait for GSM response (increased timeout if necessary)
    String response = waitForResponse(15000);
  
    Serial.print("Response: ");
    Serial.println(response);
  
    // Consider the SMS sent successfully if either "+CMGS:" or "OK" is found
    if (response.indexOf("+CMGS:") != -1 || response.indexOf("OK") != -1) {
      Serial.println("✅ SMS Sent Successfully!");
      Serial.println("SMS_SENT");
    } else {
      Serial.println("❌ SMS Sending Failed!");
      Serial.println("SMS_FAILED");
    }
  }
  
  // Function to wait for GSM module response
  String waitForResponse(unsigned long timeout) {
    unsigned long startTime = millis();
    String response = "";
  
    while (millis() - startTime < timeout) {
      while (Serial1.available()) {
        char c = Serial1.read();
        response += c;
      }
      
      response.trim();
  
      if (response.indexOf("+CMGS:") != -1 || response.indexOf("OK") != -1) {
        return response; // Success
      }
      if (response.indexOf("ERROR") != -1) {
        return response; // Failure
      }
    }
  
    return "TIMEOUT"; // No response within timeout period
  }
  
  void makeCall(String number) {
    Serial.print("🔄 GSM Module: Making call to ");
    Serial.println(number);
  
    Serial1.println("AT"); // Test if the module is responding
    delay(1000);
    Serial1.println("ATD" + number + ";"); // Dial the number
    delay(1000);
  
    Serial.println("✅ Call Initiated Successfully!");
    Serial.println("CALL_STARTED"); // Notify web app that call has started
  }
  
  void endCall() {
    Serial.println("🔄 GSM Module: Ending call");
  
    Serial1.println("ATH"); // Hang up the call
    delay(1000);
  
    Serial.println("✅ Call Terminated Successfully!");
    Serial.println("CALL_ENDED"); // Notify web app that call has ended
  }
  