// #include <Arduino.h>
// #include <BLEDevice.h>
// #include <BLEUtils.h>
// #include <BLEServer.h>
// #include <TinyGPSPlus.h>
// #include "secrets.h" // Ensure you have your WiFi/other secrets here if needed later

// // ==========================================
// // 1. PIN DEFINITIONS & HARDWARE SERIALS
// // ==========================================
// // SIM800L Pins
// #define SIM_RX_PIN 16
// #define SIM_TX_PIN 17
// HardwareSerial sim(1);

// // GPS Pins (Changed to avoid conflict with SIM)
// #define GPS_RX_PIN 18
// #define GPS_TX_PIN 19
// HardwareSerial gpsSerial(2);
// TinyGPSPlus gps;

// // Button Pins
// #define PANIC_BUTTON_PIN 4
// #define DEACTIVATE_BUTTON_PIN 5

// //LED Pin
// #define LED_PIN 42

// //Buzzer Pin
// #define BUZZER_PIN 2

// // ==========================================
// // 2. BLE SETTINGS & VARIABLES
// // ==========================================
// #define SERVICE_UUID        "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
// #define CHARACTERISTIC_TX   "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"
// #define CHARACTERISTIC_RX   "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"

// BLECharacteristic *pTxCharacteristic;
// bool deviceConnected = false;
// bool sendGPSData = false;
// unsigned long lastBLEUpdate = 0;

// // Received destination coordinates
// float targetLat = 0.0;
// float targetLon = 0.0;
// bool targetReceived = false;

// // ==========================================
// // 3. EMERGENCY & ALERT VARIABLES
// // ==========================================
// // NOTE: Remove "112" during testing phases!
// String emergencyNumbers[] = {"+359888123456", "+359888654321"}; 
// int numEmergencyContacts = 2;

// bool alertTriggered = false;
// unsigned long alertStartTime = 0;
// const unsigned long ALERT_DELAY_MS = 10000; // 10 seconds

// // ==========================================
// // 4. BLE CALLBACKS
// // ==========================================
// void parseCoordinates(String data) {
//     int latIndex = data.indexOf("LAT:");
//     int lonIndex = data.indexOf("LON:");

//     if (latIndex != -1 && lonIndex != -1) {
//         String latStr = data.substring(latIndex + 4, data.indexOf(",", latIndex));
//         String lonStr = data.substring(lonIndex + 4);

//         targetLat = latStr.toFloat();
//         targetLon = lonStr.toFloat();
//         targetReceived = true;

//         Serial.println("Target received:");
//         Serial.print("Lat: "); Serial.println(targetLat, 6);
//         Serial.print("Lon: "); Serial.println(targetLon, 6);
//     }
// }

// class MyCallbacks: public BLECharacteristicCallbacks {
//     void onWrite(BLECharacteristic *pCharacteristic) {
//         std::string rxValue = pCharacteristic->getValue();
//         if (rxValue.length() > 0) {
//             String received = String(rxValue.c_str());
//             Serial.print("BLE Received: ");
//             Serial.println(received);

//             if (received == "SEND") {
//                 sendGPSData = true;
//             } else {
//                 parseCoordinates(received);
//             }
//         }
//     }
// };

// class MyServerCallbacks: public BLEServerCallbacks {
//     void onConnect(BLEServer* pServer) { deviceConnected = true; };
//     void onDisconnect(BLEServer* pServer) { deviceConnected = false; }
// };

// // ==========================================
// // 5. SIM800L HELPER FUNCTIONS
// // ==========================================
// String sendATRead(const char* cmd, int timeout = 2000) {
//     while (sim.available()) { sim.read(); delay(1); }
//     sim.println(cmd);
//     String resp = "";
//     long t = millis();
//     while (millis() - t < timeout) {
//         while (sim.available()) resp += (char)sim.read();
//         if (resp.indexOf("OK") != -1 || resp.indexOf("ERROR") != -1 || resp.indexOf("+CME") != -1) {
//             delay(100);
//             while (sim.available()) resp += (char)sim.read();
//             break;
//         }
//     }
//     resp.trim();
//     return resp;
// }

// bool sendAT(const char* cmd, const char* expected, int timeout = 2000) {
//     String r = sendATRead(cmd, timeout);
//     return r.indexOf(expected) != -1;
// }

// bool sendSMS(String number, String message) {
//     Serial.println("Sending SMS to: " + number);
//     if (!sendAT("AT+CMGF=1", "OK", 3000)) return false;
//     sendAT("AT+CSCS=\"GSM\"", "OK", 3000);

//     sim.println("AT+CMGS=\"" + number + "\"");
//     delay(1000);

//     long t = millis();
//     bool gotPrompt = false;
//     while (millis() - t < 5000) {
//         if (sim.available() && sim.read() == '>') {
//             gotPrompt = true;
//             break;
//         }
//     }

//     if (!gotPrompt) {
//         sim.write(27); // ESC
//         return false;
//     }

//     sim.print(message);
//     delay(500);
//     sim.write(26); // CTRL+Z

//     String resp = "";
//     t = millis();
//     while (millis() - t < 15000) {
//         while (sim.available()) resp += (char)sim.read();
//         if (resp.indexOf("+CMGS:") != -1) {
//             Serial.println(" -> SMS sent successfully!");
//             return true;
//         }
//         if (resp.indexOf("ERROR") != -1) break;
//     }
//     Serial.println(" -> SMS failed.");
//     return false;
// }

// // ==========================================
// // 6. SETUP
// // ==========================================
// void setup() {
//     Serial.begin(115200);
    
//     // Initialize Pins
//     pinMode(PANIC_BUTTON_PIN, INPUT_PULLUP);
//     pinMode(DEACTIVATE_BUTTON_PIN, INPUT_PULLUP);

//     //Initialize LED Pin
//     pinMode(LED_PIN, OUTPUT);

//     //Initialize Buzzer Pin
//     pinMode(BUZZER_PIN, OUTPUT);

//     // Initialize GPS
//     gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

//     // Initialize BLE
//     BLEDevice::init("Wheelchair-Nav");
//     BLEServer *pServer = BLEDevice::createServer();
//     pServer->setCallbacks(new MyServerCallbacks());
//     BLEService *pService = pServer->createService(SERVICE_UUID);
//     pTxCharacteristic = pService->createCharacteristic(CHARACTERISTIC_TX, BLECharacteristic::PROPERTY_NOTIFY);
//     BLECharacteristic *pRxCharacteristic = pService->createCharacteristic(CHARACTERISTIC_RX, BLECharacteristic::PROPERTY_WRITE);
//     pRxCharacteristic->setCallbacks(new MyCallbacks());
//     pService->start();
//     BLEDevice::getAdvertising()->start();
//     Serial.println("BLE Started. Waiting for connections...");

//     // Initialize SIM800L
//     sim.begin(9600, SERIAL_8N1, SIM_RX_PIN, SIM_TX_PIN);
//     Serial.println("Initializing SIM800L...");
//     sim.println("AT+CFUN=1,1"); // Soft reset
//     delay(3000);
    
//     // Basic SIM diagnostic loop
//     if(sendAT("AT", "OK", 1000)) {
//         sendAT("ATE0", "OK");
//         Serial.println("SIM Module Responding.");
//     } else {
//         Serial.println("SIM Module NOT Responding - Check wiring/power.");
//     }
// }

// // ==========================================
// // 7. PLACEHOLDER FOR ACCELEROMETER
// // ==========================================
// bool checkFallDetection() {
//     // TODO: Add MPU6050/IMU logic here to detect high G or rapid roll
//     // Return true if a crash/fall is detected
//     return false; 
// }

// // ==========================================
// // 8. MAIN LOOP
// // ==========================================
// void loop() {
//     digitalWrite(LED_PIN, LOW);
//     digitalWrite(BUZZER_PIN, LOW);
//     // A. Feed the GPS
//     while (gpsSerial.available()) {
//         gps.encode(gpsSerial.read());
//     }

//     // B. Check for Triggers (Panic Button or Fall Detection)
//     if ((digitalRead(PANIC_BUTTON_PIN) == LOW || checkFallDetection()) && !alertTriggered) {
//         alertTriggered = true;
//         alertStartTime = millis();
//         Serial.println("!!! ALERT TRIGGERED !!! You have 10 seconds to deactivate.");
//         digitalWrite(BUZZER_PIN, HIGH);
//         digitalWrite(LED_PIN, HIGH);

//         delay(200); // Simple debounce
//     }

//     // C. Handle the Alert State Machine
//     if (alertTriggered) {
//         // Check for deactivation
//         if (digitalRead(DEACTIVATE_BUTTON_PIN) == LOW) {
//             alertTriggered = false;
//             Serial.println("Alert DEACTIVATED by user.");
//             delay(200); // Simple debounce
//         } 
//         // If not deactivated and 10 seconds have passed
//         else if (millis() - alertStartTime >= ALERT_DELAY_MS) {
//             Serial.println("10 seconds elapsed! Discarding GPS tasks to send SOS SMS...");
            
//             // Build emergency message with location
//             String sosMsg = "EMERGENCY! Wheelchair alert triggered. Location: ";
//             if (gps.location.isValid()) {
//                 sosMsg += "https://maps.google.com/?q=";
//                 sosMsg += String(gps.location.lat(), 6) + ",";
//                 sosMsg += String(gps.location.lng(), 6);
//             } else {
//                 sosMsg += "GPS Location Unavailable.";
//             }

//             // Loop through numbers and send
//             for (int i = 0; i < numEmergencyContacts; i++) {
//                 sendSMS(emergencyNumbers[i], sosMsg);
//             }

//             // Reset alert state so it doesn't spam infinitely
//             alertTriggered = false; 
//         }
//     }

//     // D. BLE Data Transmission (Every 5 seconds)
//     if (millis() - lastBLEUpdate > 5000) {
//         lastBLEUpdate = millis();
//         sendGPSData = true;
//     }

//     if (deviceConnected && sendGPSData) {
//         String gpsData = "LAT:N/A,LON:N/A,SPD:N/A"; // Default fallback
        
//         if (gps.location.isValid()) {
//             gpsData = "LAT:" + String(gps.location.lat(), 6) + 
//                       ",LON:" + String(gps.location.lng(), 6);
//             if(gps.speed.isValid()) {
//                 gpsData += ",SPD:" + String(gps.speed.kmph(), 1);
//             } else {
//                 gpsData += ",SPD:0.0";
//             }
//         }

//         pTxCharacteristic->setValue(gpsData.c_str());
//         pTxCharacteristic->notify();
//         Serial.println("BLE Sent: " + gpsData);
//         sendGPSData = false;
//     }
// }

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <TinyGPSPlus.h>
#include "secrets.h"

// ==========================================
// 1. PIN DEFINITIONS & HARDWARE SERIALS
// ==========================================
// SIM800L Pins
#define SIM_RX_PIN 16
#define SIM_TX_PIN 17
HardwareSerial sim(1);

// GPS Pins
#define GPS_RX_PIN 18
#define GPS_TX_PIN 19
HardwareSerial gpsSerial(2);
TinyGPSPlus gps;

// Button Pins
#define PANIC_BUTTON_PIN 4
#define DEACTIVATE_BUTTON_PIN 5

// LED Pin
#define LED_PIN 42

// Buzzer Pin
#define BUZZER_PIN 2

// ==========================================
// 2. BLE SETTINGS & VARIABLES
// ==========================================
#define SERVICE_UUID        "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_TX   "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_RX   "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"

BLECharacteristic *pTxCharacteristic;
bool deviceConnected = false;
bool sendGPSData = false;
unsigned long lastBLEUpdate = 0;

// Received destination coordinates
float targetLat = 0.0;
float targetLon = 0.0;
bool targetReceived = false;

// ==========================================
// 3. EMERGENCY & ALERT VARIABLES
// ==========================================
String emergencyNumbers[] = {"+359897406640", "+359887265727"};
int numEmergencyContacts = 2;

bool alertTriggered = false;
unsigned long alertStartTime = 0;
const unsigned long ALERT_DELAY_MS = 10000; // 10 seconds

bool simReady = false; // Tracks whether GSM init succeeded

// ==========================================
// 4. BLE CALLBACKS
// ==========================================
void parseCoordinates(String data) {
    int latIndex = data.indexOf("LAT:");
    int lonIndex = data.indexOf("LON:");

    if (latIndex != -1 && lonIndex != -1) {
        String latStr = data.substring(latIndex + 4, data.indexOf(",", latIndex));
        String lonStr = data.substring(lonIndex + 4);

        targetLat = latStr.toFloat();
        targetLon = lonStr.toFloat();
        targetReceived = true;

        Serial.println("Target received:");
        Serial.print("Lat: "); Serial.println(targetLat, 6);
        Serial.print("Lon: "); Serial.println(targetLon, 6);
    }
}

class MyCallbacks : public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
        std::string rxValue = pCharacteristic->getValue();
        if (rxValue.length() > 0) {
            String received = String(rxValue.c_str());
            Serial.print("BLE Received: ");
            Serial.println(received);

            if (received == "SEND") {
                sendGPSData = true;
            } else {
                parseCoordinates(received);
            }
        }
    }
};

class MyServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer* pServer)    { deviceConnected = true; }
    void onDisconnect(BLEServer* pServer) { deviceConnected = false; }
};

// ==========================================
// 5. SIM800L HELPER FUNCTIONS (from working code)
// ==========================================
String sendATRead(const char* cmd, int timeout = 2000) {
    while (sim.available()) { sim.read(); delay(1); }
    sim.println(cmd);
    String resp = "";
    long t = millis();
    while (millis() - t < timeout) {
        while (sim.available()) resp += (char)sim.read();
        if (resp.indexOf("OK")    != -1 ||
            resp.indexOf("ERROR") != -1 ||
            resp.indexOf("+CME")  != -1) {
            delay(100);
            while (sim.available()) resp += (char)sim.read();
            break;
        }
    }
    resp.trim();
    return resp;
}

bool sendAT(const char* cmd, const char* expected, int timeout = 2000) {
    String r = sendATRead(cmd, timeout);
    Serial.println("[AT] " + String(cmd) + " -> " + r); // Verbose logging kept from working code
    return r.indexOf(expected) != -1;
}

void resetModule() {
    Serial.println("\n>> Soft Reset (AT+CFUN=1,1)...");
    sim.println("AT+CFUN=1,1");
    delay(5000); // Give it a full 5s to reboot, not 3s
    while (sim.available()) { sim.read(); } // Drain boot chatter (RDY, Call Ready, etc.)
}

bool checkModuleAlive() {
    Serial.println("\n>> Step 1: Check Module");
    sim.write(27); // ESC to clear any stuck state
    delay(100);
    sim.println("AT");

    for (int i = 0; i < 5; i++) {
        if (sendAT("AT", "OK", 1000)) {
            Serial.println("   Module responding!");
            sendAT("ATE0", "OK"); // Disable echo
            return true;
        }
        Serial.println("   Attempt " + String(i + 1) + "/5...");
        delay(1000);
    }

    Serial.println("   Module NOT responding.");
    return false;
}

bool checkSIM() {
    Serial.println("\n>> Step 2: Check SIM");

    for (int i = 0; i < 10; i++) {
        String resp = sendATRead("AT+CPIN?", 3000);
        Serial.println("   [SIM] Attempt (" + String(i + 1) + "/10): " + resp);

        if (resp.indexOf("READY") != -1) {
            Serial.println("   SIM card ready!");
            return true;
        } else if (resp.indexOf("SIM PIN") != -1) {
            Serial.println("   SIM locked, unlocking...");
            if (sendAT("AT+CPIN=\"0000\"", "OK", 10000)) {
                Serial.println("   SIM unlocked!");
                delay(10000);
                return true;
            } else {
                Serial.println("   Wrong PIN!");
                return false;
            }
        } else if (resp.indexOf("SIM PUK") != -1) {
            Serial.println("   SIM blocked with PUK!");
            return false;
        }
        delay(3000);
    }
    return false;
}

bool checkNetwork() {
    Serial.println("\n>> Step 3: Check Network");

    String oper = sendATRead("AT+COPS?", 5000);
    Serial.println("   [Operator] " + oper);

    String csq = sendATRead("AT+CSQ", 3000);
    Serial.println("   [Signal] " + csq);

    Serial.println("   Waiting for registration...");
    for (int i = 0; i < 15; i++) {
        String reg = sendATRead("AT+CREG?", 3000);
        Serial.println("   [CREG] " + reg);

        if (reg.indexOf(",1") != -1 || reg.indexOf(",5") != -1) {
            Serial.println("   Registered on GSM network!");
            return true;
        }
        if (reg.indexOf(",3") != -1) {
            Serial.println("   Registration denied!");
            return false;
        }
        delay(2000);
    }
    return false;
}

bool sendSMS(String number, String message) {
    if (!simReady) {
        Serial.println("SMS skipped — SIM not ready.");
        return false;
    }

    Serial.println("\n>> Sending SMS to: " + number);
    if (!sendAT("AT+CMGF=1", "OK", 3000)) return false;
    sendAT("AT+CSCS=\"GSM\"", "OK", 3000);

    sim.println("AT+CMGS=\"" + number + "\"");
    delay(1000);

    long t = millis();
    bool gotPrompt = false;
    while (millis() - t < 5000) {
        if (sim.available() && sim.read() == '>') {
            gotPrompt = true;
            break;
        }
    }

    if (!gotPrompt) {
        sim.write(27); // ESC
        Serial.println("   No prompt received.");
        return false;
    }

    sim.print(message);
    delay(500);
    sim.write(26); // CTRL+Z

    String resp = "";
    t = millis();
    while (millis() - t < 15000) {
        while (sim.available()) resp += (char)sim.read();
        if (resp.indexOf("+CMGS:") != -1) {
            Serial.println("   SMS sent successfully!");
            return true;
        }
        if (resp.indexOf("ERROR") != -1) break;
    }
    Serial.println("   SMS failed.");
    return false;
}

// ==========================================
// 6. SETUP
// ==========================================
void setup() {
    Serial.begin(115200);
    delay(1000);

    // Initialize Pins
    pinMode(PANIC_BUTTON_PIN, INPUT_PULLUP);
    pinMode(DEACTIVATE_BUTTON_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);
    pinMode(BUZZER_PIN, OUTPUT);

    // Initialize GPS
    gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

    // Initialize BLE
    BLEDevice::init("Wheelchair-Nav");
    BLEServer *pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());
    BLEService *pService = pServer->createService(SERVICE_UUID);
    pTxCharacteristic = pService->createCharacteristic(CHARACTERISTIC_TX, BLECharacteristic::PROPERTY_NOTIFY);
    BLECharacteristic *pRxCharacteristic = pService->createCharacteristic(CHARACTERISTIC_RX, BLECharacteristic::PROPERTY_WRITE);
    pRxCharacteristic->setCallbacks(new MyCallbacks());
    pService->start();
    BLEDevice::getAdvertising()->start();
    Serial.println("BLE Started. Waiting for connections...");

    // Initialize SIM800L (using the full working diagnostic sequence)
    Serial.println("\n>> SIM800L Init Start");
    sim.begin(9600, SERIAL_8N1, SIM_RX_PIN, SIM_TX_PIN);
    delay(2000);

    resetModule();

    if (!checkModuleAlive()) {
        Serial.println("\n!! STOP: Module communication failed. Check wiring/power.");
        simReady = false;
        return;
    }

    if (!checkSIM())     { simReady = false; return; }
    if (!checkNetwork()) { simReady = false; return; }

    simReady = true;
    Serial.println("\n>> SIM800L Ready.");
}

// ==========================================
// 7. PLACEHOLDER FOR ACCELEROMETER
// ==========================================
bool checkFallDetection() {
    // TODO: Add MPU6050/IMU logic here
    return false;
}

// ==========================================
// 8. MAIN LOOP
// ==========================================
void loop() {
    digitalWrite(LED_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);

    // A. Feed the GPS
    while (gpsSerial.available()) {
        gps.encode(gpsSerial.read());
    }

    // B. Check for Triggers (Panic Button or Fall Detection)
    if ((digitalRead(PANIC_BUTTON_PIN) == LOW || checkFallDetection()) && !alertTriggered) {
        alertTriggered = true;
        alertStartTime = millis();
        Serial.println("!!! ALERT TRIGGERED !!! You have 10 seconds to deactivate.");
        digitalWrite(BUZZER_PIN, HIGH);
        digitalWrite(LED_PIN, HIGH);
        delay(200); // Debounce
    }

    // C. Handle the Alert State Machine
    if (alertTriggered) {
        if (digitalRead(DEACTIVATE_BUTTON_PIN) == LOW) {
            alertTriggered = false;
            digitalWrite(BUZZER_PIN, LOW);
            digitalWrite(LED_PIN, LOW);
            Serial.println("Alert DEACTIVATED by user.");
            delay(200); // Debounce
        } else if (millis() - alertStartTime >= ALERT_DELAY_MS) {
            Serial.println("10 seconds elapsed! Sending SOS SMS...");

            String sosMsg = "EMERGENCY! Wheelchair alert triggered. Location: ";
            if (gps.location.isValid()) {
                sosMsg += "https://maps.google.com/?q=";
                sosMsg += String(gps.location.lat(), 6) + ",";
                sosMsg += String(gps.location.lng(), 6);
            } else {
                sosMsg += "GPS Location Unavailable.";
            }

            for (int i = 0; i < numEmergencyContacts; i++) {
                sendSMS(emergencyNumbers[i], sosMsg);
            }

            alertTriggered = false;
        }
    }

    // D. BLE Data Transmission (Every 5 seconds)
    if (millis() - lastBLEUpdate > 5000) {
        lastBLEUpdate = millis();
        sendGPSData = true;
    }

    if (deviceConnected && sendGPSData) {
        String gpsData = "LAT:N/A,LON:N/A,SPD:N/A";

        if (gps.location.isValid()) {
            gpsData = "LAT:" + String(gps.location.lat(), 6) +
                      ",LON:" + String(gps.location.lng(), 6);
            gpsData += gps.speed.isValid()
                       ? ",SPD:" + String(gps.speed.kmph(), 1)
                       : ",SPD:0.0";
        }

        pTxCharacteristic->setValue(gpsData.c_str());
        pTxCharacteristic->notify();
        Serial.println("BLE Sent: " + gpsData);
        sendGPSData = false;
    }

    // E. Pass-through for manual AT testing via Serial Monitor
    while (sim.available())    Serial.write(sim.read());
    while (Serial.available()) sim.write(Serial.read());
}