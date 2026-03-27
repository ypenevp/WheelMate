#include <Arduino.h>
// #include <BLEDevice.h>
// #include <BLEUtils.h>
// #include <BLEServer.h>
#include <TinyGPSPlus.h>
#include <Wire.h>
#include <MPU6050.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "secrets.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include "Adafruit_VL53L0X.h"

// VL53L0X
Adafruit_VL53L0X lox = Adafruit_VL53L0X();
#define SAVE_DISTANCE 200

// display
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
bool navigationActive = false;
String direction = "STRAIGHT";
int distance_m = 0;
unsigned long lastDisplayUpdate = 0;
const int TIME_ZONE_OFFSET = 2;

// UART gsm
#define SIM_RX_PIN 16
#define SIM_TX_PIN 17
HardwareSerial sim(1);

// UART gps
#define GPS_RX_PIN 18
#define GPS_TX_PIN 19
HardwareSerial gpsSerial(2);
TinyGPSPlus gps;

// Panic button module setup
#define PANIC_BUTTON_PIN 4
#define DEACTIVATE_BUTTON_PIN 5
#define LED_PIN 42
#define BUZZER_PIN 2

// I2C
#define MPU_SDA_PIN 8
#define MPU_SCL_PIN 9

// MPU-6050
const bool ENABLE_GYRO = true;
MPU6050 mpu;
bool mpuReady = false;

#define ACCEL_SCALE 16384.0f
#define GYRO_SCALE 131.0f

#define IMPACT_G_THRESHOLD 6.0f
#define FREEFALL_G_THRESHOLD 0.05f
#define FLIP_AZ_THRESHOLD -0.7f
#define SEVERE_TILT_THRESHOLD 0.8f
#define ROLL_RATE_THRESHOLD 400.0f

#define FALL_CONFIRM_COUNT 4
static int fallCounter = 0;

float Ax = 0, Ay = 0, Az = 1;
float Gx = 0, Gy = 0, Gz = 0;

// #define SERVICE_UUID "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
// #define CHARACTERISTIC_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"
// #define CHARACTERISTIC_RX "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"

// BLECharacteristic *pTxCharacteristic;
// bool deviceConnected = false;
// bool sendGPSData = false;
// unsigned long lastBLEUpdate = 0;
//float targetLat = 0.0;
// float targetLon = 0.0;
// bool targetReceived = false;
// 

String emergencyNumbers[] = {"+359897406640", "+359887265727"};
int numEmergencyContacts = 2;

bool alertTriggered = false;
unsigned long alertStartTime = 0;
const unsigned long ALERT_DELAY_MS = 10000; // 10s cooldown

// stats
bool simReady = false;
bool lockdown = false;
volatile bool userInchair = false; //!!!


unsigned long panicDebounceTime = 0;
unsigned long deactivateDebounceTime = 0;
const unsigned long DEBOUNCE_MS = 50;
bool lastPanicState = HIGH;
bool lastDeactivateState = HIGH;

unsigned long lastWiFiSend = 0;
const unsigned long WIFI_SEND_INTERVAL = 5000;

struct HttpTaskData
{
    double lat;
    double lng;
    float speed;
    bool hasGps;
    bool panicStatus;
    bool userInchair;
};

QueueHandle_t httpQueue;

#include <ArduinoJson.h>

const char* GET_URL = "http://192.168.1.100:8080/api/navigation/get/1"; // Replace with your IP

void fetchNavigationData() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(GET_URL);
        
        int httpResponseCode = http.GET();
        if (httpResponseCode == 200) {
            String payload = http.getString();
            
            StaticJsonDocument<200> doc;
            DeserializationError error = deserializeJson(doc, payload);
            
            if (!error) {
                const char* pos = doc["position"];
                double dist = doc["distance"];
                
                direction = String(pos);
                distance_m = (int)dist;
                
                if (direction == "ARRIVE" || distance_m < 0) {
                     navigationActive = false; 
                } else {
                     navigationActive = true;
                }
            } else {
                Serial.print("deserializeJson() failed: ");
                Serial.println(error.c_str());
            }
        } else {
            Serial.print("Error code: ");
            Serial.println(httpResponseCode);
        }
        
        http.end();
    }
}


//////////////////////////////////////////////////////////////////////////////////////////
// display manage functions

void drawArrow(String dir)
{
    int cx = 64;
    int cy = 34;

    if (dir == "STRAIGHT")
    {
        display.fillTriangle(cx, cy - 10, cx - 8, cy - 2, cx + 8, cy - 2, WHITE);
        display.fillRect(cx - 3, cy - 2, 6, 10, WHITE);
    }
    else if (dir == "LEFT")
    {
        display.fillTriangle(cx - 12, cy, cx - 2, cy - 8, cx - 2, cy + 8, WHITE);
        display.fillRect(cx - 2, cy - 3, 14, 6, WHITE);
    }
    else if (dir == "RIGHT")
    {
        display.fillTriangle(cx + 12, cy, cx + 2, cy - 8, cx + 2, cy + 8, WHITE);
        display.fillRect(cx - 12, cy - 3, 14, 6, WHITE);
    }
    else if (dir == "UTURN")
    {
        display.drawCircle(cx, cy + 2, 8, WHITE);
        display.fillRect(cx - 10, cy + 2, 20, 10, BLACK);
        display.fillTriangle(cx - 8, cy + 2, cx - 12, cy - 4, cx - 4, cy - 4, WHITE);
    }
    else if (dir == "ARRIVE")
    {
        // Chequered flag / destination pin
        display.drawCircle(cx, cy - 4, 10, WHITE);
        display.fillCircle(cx, cy - 4, 6, WHITE);
        display.fillCircle(cx, cy - 4, 3, BLACK);
        // Stem
        display.fillRect(cx - 1, cy + 6, 3, 8, WHITE);
    }
}

void drawClock()
{
    String timeStr = "--:--";
    String dateStr = "WAITING GPS";

    if (gps.time.isValid() && gps.date.isValid())
    {
        int hour = gps.time.hour() + TIME_ZONE_OFFSET;
        if (hour >= 24)
            hour -= 24;
        else if (hour < 0)
            hour += 24;

        int minute = gps.time.minute();
        int day = gps.date.day();
        int month = gps.date.month();

        char tBuffer[10];
        char dBuffer[15];
        sprintf(tBuffer, "%02d:%02d", hour, minute);
        sprintf(dBuffer, "%02d/%02d/%04d", day, month, gps.date.year());

        timeStr = String(tBuffer);
        dateStr = String(dBuffer);
    }

    display.setTextSize(1);
    display.setCursor(35, 5);
    display.print(dateStr);

    display.setTextSize(3);
    display.setCursor(20, 25);
    display.print(timeStr);
}

void updateDisplay()
{
    display.clearDisplay();
    display.setTextColor(WHITE);

    if (lockdown || alertTriggered)
    {
        display.setTextSize(2);
        display.setCursor(10, 25);
        display.print("SOS ALERT!");
    }
    else if (navigationActive)
    {
        display.setTextSize(2);
        
        // Center the direction text
        int16_t x1, y1;
        uint16_t w, h;
        display.getTextBounds(direction, 0, 0, &x1, &y1, &w, &h);
        display.setCursor((SCREEN_WIDTH - w) / 2, 0);
        
        display.print(direction);

        drawArrow(direction);

        display.setTextSize(2);
        
        String distStr = String(distance_m) + "m";
        display.getTextBounds(distStr, 0, 0, &x1, &y1, &w, &h);
        display.setCursor((SCREEN_WIDTH - w) / 2, 50);
        
        display.print(distStr);
    }
    else
    {
        drawClock();
    }

    display.display();
}

//////////////////////////////////////////////////////////////////////////////////////////

// void parseCoordinates(String data)
// {
//     int latIndex = data.indexOf("LAT:");
//     int lonIndex = data.indexOf("LON:");

//     if (latIndex != -1 && lonIndex != -1)
//     {
//         String latStr = data.substring(latIndex + 4, data.indexOf(",", latIndex));
//         String lonStr = data.substring(lonIndex + 4);
//         targetLat = latStr.toFloat();
//         targetLon = lonStr.toFloat();
//         targetReceived = true;
//         Serial.print("Target Lat: ");
//         Serial.println(targetLat, 6);
//         Serial.print("Target Lon: ");
//         Serial.println(targetLon, 6);
//     }
// }

void parseNavigation(String data)
{
    if (data.startsWith("NAV:"))
    {
        String payload = data.substring(4);
        int comma = payload.indexOf(',');
        if (comma > 0)
        {
            direction = payload.substring(0, comma);
            distance_m = payload.substring(comma + 1).toInt();
            navigationActive = true;
        }
    }
    else if (data == "IDLE")
    {
        navigationActive = false;
    }
}

// class MyCallbacks : public BLECharacteristicCallbacks
// {
//     void onWrite(BLECharacteristic *pCharacteristic)
//     {
//         std::string rxValue = pCharacteristic->getValue();
//         if (rxValue.length() > 0)
//         {
//             String received = String(rxValue.c_str());
//             Serial.print("BLE Received: ");
//             Serial.println(received);

//             if (received == "SEND")
//             {
//                 sendGPSData = true;
//             }
//             else if (received.startsWith("NAV:") || received == "IDLE")
//             {
//                 parseNavigation(received);
//             }
//             else
//             {
//                 parseCoordinates(received);
//             }
//         }
//     }
// };

// class MyServerCallbacks : public BLEServerCallbacks
// {
//     void onConnect(BLEServer *pServer) { deviceConnected = true; }
//     void onDisconnect(BLEServer *pServer) { deviceConnected = false; }
// };

//////////////////////////////////////////////////////////////////////////////////////////
// MPU-6050 control

void readMPU()
{
    if (!mpuReady || !ENABLE_GYRO)
        return;
    int16_t ax, ay, az, gx, gy, gz;
    mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
    Ax = ax / ACCEL_SCALE;
    Ay = ay / ACCEL_SCALE;
    Az = az / ACCEL_SCALE;
    Gx = gx / GYRO_SCALE;
    Gy = gy / GYRO_SCALE;
    Gz = gz / GYRO_SCALE;
}

String getFallReason()
{
    float totalG = sqrt(Ax * Ax + Ay * Ay + Az * Az);
    if (totalG > IMPACT_G_THRESHOLD)
        return "HIGH IMPACT (" + String(totalG, 2) + "g)";
    if (totalG < FREEFALL_G_THRESHOLD)
        return "FREEFALL (" + String(totalG, 2) + "g)";
    if (Az < FLIP_AZ_THRESHOLD)
        return "FLIPPED (Az=" + String(Az, 2) + ")";
    if (fabs(Ax) > SEVERE_TILT_THRESHOLD)
        return "SEVERE TILT Ax=" + String(Ax, 2);
    if (fabs(Ay) > SEVERE_TILT_THRESHOLD)
        return "SEVERE TILT Ay=" + String(Ay, 2);
    if (fabs(Gx) > ROLL_RATE_THRESHOLD)
        return "RAPID ROLL X " + String(Gx, 1) + " deg/s";
    if (fabs(Gy) > ROLL_RATE_THRESHOLD)
        return "RAPID ROLL Y " + String(Gy, 1) + " deg/s";
    return "";
}

bool checkFallDetection()
{
    if (!mpuReady || !ENABLE_GYRO)
        return false;
    float totalG = sqrt(Ax * Ax + Ay * Ay + Az * Az);
    bool instantFall = (totalG > IMPACT_G_THRESHOLD) ||
                       (totalG < FREEFALL_G_THRESHOLD) ||
                       (Az < FLIP_AZ_THRESHOLD) ||
                       (fabs(Ax) > SEVERE_TILT_THRESHOLD) ||
                       (fabs(Ay) > SEVERE_TILT_THRESHOLD) ||
                       (fabs(Gx) > ROLL_RATE_THRESHOLD) ||
                       (fabs(Gy) > ROLL_RATE_THRESHOLD);

    if (instantFall)
    {
        fallCounter++;
        Serial.printf("[FALL?] counter=%d  totalG=%.2f  Ay=%.2f\n", fallCounter, totalG, Ay);
    }
    else
    {
        fallCounter = 0;
    }
    return (fallCounter >= FALL_CONFIRM_COUNT);
}

//////////////////////////////////////////////////////////////////////////////////////////

String sendATRead(const char *cmd, int timeout = 2000)
{
    while (sim.available())
    {
        sim.read();
        delay(1);
    }
    sim.println(cmd);
    String resp = "";
    long t = millis();
    while (millis() - t < timeout)
    {
        while (sim.available())
            resp += (char)sim.read();
        if (resp.indexOf("OK") != -1 || resp.indexOf("ERROR") != -1 || resp.indexOf("+CME") != -1)
        {
            delay(100);
            while (sim.available())
                resp += (char)sim.read();
            break;
        }
    }
    resp.trim();
    return resp;
}

bool sendAT(const char *cmd, const char *expected, int timeout = 2000)
{
    String r = sendATRead(cmd, timeout);
    Serial.println("[AT] " + String(cmd) + " -> " + r);
    return r.indexOf(expected) != -1;
}

void resetModule()
{
    Serial.println("\n>> Soft Reset (AT+CFUN=1,1)...");
    sim.println("AT+CFUN=1,1");
    delay(5000);
    while (sim.available())
    {
        sim.read();
    }
}

//////////////////////////////////////////////////////////////////////////////////////////
// Sim checks

bool checkModuleAlive()
{
    Serial.println("\n>> Step 1: Check Module");
    sim.write(27);
    delay(100);
    sim.println("AT");
    for (int i = 0; i < 5; i++)
    {
        if (sendAT("AT", "OK", 1000))
        {
            Serial.println("   Module responding!");
            sendAT("ATE0", "OK");
            return true;
        }
        Serial.println("   Attempt " + String(i + 1) + "/5...");
        delay(1000);
    }
    Serial.println("   Module NOT responding.");
    return false;
}

bool checkSIM()
{
    Serial.println("\n>> Step 2: Check SIM");
    for (int i = 0; i < 10; i++)
    {
        String resp = sendATRead("AT+CPIN?", 3000);
        Serial.println("   [SIM] Attempt (" + String(i + 1) + "/10): " + resp);
        if (resp.indexOf("READY") != -1)
        {
            Serial.println("   SIM ready!");
            return true;
        }
        else if (resp.indexOf("SIM PIN") != -1)
        {
            Serial.println("   SIM locked, unlocking...");
            if (sendAT("AT+CPIN=\"0000\"", "OK", 10000))
            {
                Serial.println("   SIM unlocked!");
                delay(10000);
                return true;
            }
            Serial.println("   Wrong PIN!");
            return false;
        }
        else if (resp.indexOf("SIM PUK") != -1)
        {
            Serial.println("   SIM blocked with PUK!");
            return false;
        }
        delay(3000);
    }
    return false;
}

bool checkNetwork()
{
    Serial.println("\n>> Step 3: Check Network");
    Serial.println("   [Operator] " + sendATRead("AT+COPS?", 5000));
    Serial.println("   [Signal]   " + sendATRead("AT+CSQ", 3000));
    for (int i = 0; i < 15; i++)
    {
        String reg = sendATRead("AT+CREG?", 3000);
        Serial.println("   [CREG] " + reg);
        if (reg.indexOf(",1") != -1 || reg.indexOf(",5") != -1)
        {
            Serial.println("   Registered on GSM network!");
            return true;
        }
        if (reg.indexOf(",3") != -1)
        {
            Serial.println("   Registration denied!");
            return false;
        }
        delay(2000);
    }
    return false;
}

//////////////////////////////////////////////////////////////////////////////////////////

bool sendSMS(String number, String message)
{
    if (!simReady)
    {
        Serial.println("SMS skipped — SIM not ready.");
        return false;
    }
    Serial.println("\n>> Sending SMS to: " + number);
    if (!sendAT("AT+CMGF=1", "OK", 3000))
        return false;
    sendAT("AT+CSCS=\"GSM\"", "OK", 3000);
    sim.println("AT+CMGS=\"" + number + "\"");
    delay(1000);

    long t = millis();
    bool gotPrompt = false;
    while (millis() - t < 5000)
    {
        if (sim.available() && sim.read() == '>')
        {
            gotPrompt = true;
            break;
        }
    }
    if (!gotPrompt)
    {
        sim.write(27);
        Serial.println("   No prompt.");
        return false;
    }
    sim.print(message);
    delay(500);
    sim.write(26);

    String resp = "";
    t = millis();
    while (millis() - t < 15000)
    {
        while (sim.available())
            resp += (char)sim.read();
        if (resp.indexOf("+CMGS:") != -1)
        {
            Serial.println("   SMS sent!");
            return true;
        }
        if (resp.indexOf("ERROR") != -1)
            break;
    }
    Serial.println("   SMS failed.");
    return false;
}

// panic button indication LED and BUZZ
void alertSignalBlinkLED()
{
    static unsigned long lastToggle = 0;
    const unsigned long INTERVAL = 500;
    if (millis() - lastToggle > INTERVAL)
    {
        lastToggle = millis();
        bool state = !digitalRead(LED_PIN);
        digitalWrite(LED_PIN, state);
        digitalWrite(BUZZER_PIN, state);
    }
}

void sendToBackend(bool panicStatus)
{
    HttpTaskData data;
    data.panicStatus = panicStatus;
     data.userInchair = userInchair;
    // data.userInchair = userInChair;

    if (gps.location.isValid())
    {
        data.lat = gps.location.lat();
        data.lng = gps.location.lng();
        data.hasGps = true;
    }
    else
    {
        data.hasGps = false;
    }

    if (gps.speed.isValid())
    {
        data.speed = gps.speed.kmph();
    }
    else
    {
        data.speed = 0.0;
    }

    if (httpQueue != NULL)
    {
        xQueueSend(httpQueue, &data, (TickType_t)0);
    }
}

void httpTask(void *pvParameters)
{
    HttpTaskData data;
    for (;;)
    {
        if (xQueueReceive(httpQueue, &data, portMAX_DELAY) == pdPASS)
        {
            if (WiFi.status() == WL_CONNECTED)
            {
                HTTPClient http;
                http.begin(BACKEND_URL);
                http.addHeader("Content-Type", "application/json");

                String payload = "{";

                // GPS
                if (data.hasGps)
                {
                    payload += "\"gpsCoordinate\":\"";
                    payload += String(data.lat, 6) + " " + String(data.lng, 6);
                    payload += "\",";
                }
                else
                {
                    payload += "\"gpsCoordinate\":null,";
                }

                      // Speed
                payload += "\"speed\":" + String(data.speed, 1) + ",";

                // Token 
                payload += "\"token\":\"" + String(DEVICE_TOKEN) + "\",";

                // Panic status
                payload += "\"panicStatus\":";
                payload += (data.panicStatus ? "true" : "false");
                payload += ","; // <--- ВАЖНО: добави запетая тук!

                // User in chair
                payload += "\"userInchair\":";
                payload += (data.userInchair ? "true" : "false");

                payload += "}";

                Serial.println("Sending to backend from Task:");
                Serial.println(payload);

                int httpResponseCode = http.sendRequest("PATCH", payload);

                Serial.println("Backend response code: " + String(httpResponseCode));

                if (httpResponseCode > 0)
                {
                    String responseBody = http.getString();
                    Serial.println("Backend response body:");
                    Serial.println(responseBody);
                }
                else
                {
                    Serial.println("Error sending request. Code: " + String(httpResponseCode));
                }

                http.end();
            }
            else
            {
                Serial.println("WiFi not connected, skipped send (Task).");
            }
        }
    }
}

//////////////////////////////////////////////////////////////////////////////////////////

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Wire.begin(MPU_SDA_PIN, MPU_SCL_PIN);
    Wire.setClock(100000);

    // setup display
    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C))
    {
        Serial.println(F("SSD1306 allocation failed!"));
    }
    else
    {
        display.clearDisplay();
        display.display();
    }

    // setup panic button indication
    pinMode(PANIC_BUTTON_PIN, INPUT_PULLUP);
    pinMode(DEACTIVATE_BUTTON_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);
    pinMode(BUZZER_PIN, OUTPUT);

    digitalWrite(LED_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);

    // setuo MPU-6050
    Serial.println("\n>> Initializing MPU6050...");
    if (ENABLE_GYRO)
    {
        delay(500);
        mpu.initialize();
        delay(500);
        uint8_t id = mpu.getDeviceID();
        if (id == 0x34 || id == 0x38) // !!!
        {
            Serial.printf("   MPU6050 OK (id=0x%02X)\n", id);
            mpu.setSleepEnabled(false);
            mpuReady = true;
        }
        else
        {
            Serial.printf("   MPU6050 FAILED (id=0x%02X)\n", id);
            mpuReady = false;
        }
    }
    else
    {
        Serial.println("   MPU6050 skipped flag.");
        mpuReady = false;
    }

    // VL53L0X setup
    Serial.println("Adafruit VL53L0X test.");

    if (!lox.begin(0x29, false, &Wire)) // 0x29
    {
        Serial.println(F("Failed to boot VL53L0X"));
        while (1)
            ;
    }

    Serial.println(F("VL53L0X ready!"));
    lox.startRangeContinuous();

    gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

    // BLEDevice::init("Wheelchair-Nav");
    // BLEServer *pServer = BLEDevice::createServer();
    // pServer->setCallbacks(new MyServerCallbacks());
    // BLEService *pService = pServer->createService(SERVICE_UUID);
    // pTxCharacteristic = pService->createCharacteristic(CHARACTERISTIC_TX, BLECharacteristic::PROPERTY_NOTIFY);
    // BLECharacteristic *pRxCharacteristic = pService->createCharacteristic(CHARACTERISTIC_RX, BLECharacteristic::PROPERTY_WRITE);
    // pRxCharacteristic->setCallbacks(new MyCallbacks());
    // pService->start();
    // BLEDevice::getAdvertising()->start();
    // Serial.println("BLE Started.");

    // setup GSM
    Serial.println("\n>> SIM800L Init Start");
    sim.begin(9600, SERIAL_8N1, SIM_RX_PIN, SIM_TX_PIN);
    delay(2000);
    resetModule();

    if (!checkModuleAlive() || !checkSIM() || !checkNetwork())
    {
        simReady = false;
        Serial.println("!! SIM: Init failed. Proceeding without Cellular.");
    }
    else
    {
        simReady = true;
        Serial.println("\n>> SIM800L Ready.");
    }

    // setup Wi-Fi
    Serial.println("\n>> Connecting to WiFi..");
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    int wifiRetries = 0;
    while (WiFi.status() != WL_CONNECTED && wifiRetries < 15) // try 15 times
    {
        delay(500);
        Serial.print(".");
        wifiRetries++;
    }

    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.println("\nWiFi connected!!!");
        Serial.println(WiFi.localIP());
    }
    else
    {
        Serial.println("\nWiFi FAILED!");
    }

    httpQueue = xQueueCreate(10, sizeof(HttpTaskData));

    if (httpQueue != NULL)
    {
        xTaskCreatePinnedToCore(
            httpTask,
            "HTTP Task",
            8192,
            NULL,
            1,
            NULL,
            0);
    }
}

//////////////////////////////////////////////////////////////////////////////////////////

void loop()
{
    if (lockdown)
    {
        digitalWrite(LED_PIN, HIGH);
        digitalWrite(BUZZER_PIN, HIGH);
        while (gpsSerial.available())
        {
            gps.encode(gpsSerial.read());
        }
        while (sim.available())
            Serial.write(sim.read());
        while (Serial.available())
            sim.write(Serial.read());

        if (millis() - lastDisplayUpdate > 500)
        {
            updateDisplay();
            lastDisplayUpdate = millis();
        }

        if (millis() - lastWiFiSend > WIFI_SEND_INTERVAL)
        {
            lastWiFiSend = millis();
            sendToBackend(true);
        }
        return;
    }

    readMPU();

    // check if userInchair
    if (lox.isRangeComplete())
    {
        int dist = lox.readRange();
        if (dist < 8190)
        {
            userInchair = (dist <= SAVE_DISTANCE);
            Serial.println(userInchair ? "userinchair: true" : "userinchair: false");
        }
    }
    while (gpsSerial.available())
    {
        gps.encode(gpsSerial.read());
    }

    if (Serial.available())
    {
        String input = Serial.readStringUntil('\n');
        input.trim();
        if (input.startsWith("NAV:") || input == "IDLE")
        {
            parseNavigation(input);
        }
    }

    bool rawPanic = (digitalRead(PANIC_BUTTON_PIN) == LOW);
    bool rawDeactivate = (digitalRead(DEACTIVATE_BUTTON_PIN) == LOW);

    if (rawPanic != lastPanicState)
    {
        panicDebounceTime = millis();
        lastPanicState = rawPanic;
    }
    bool panicPressed = (millis() - panicDebounceTime > DEBOUNCE_MS) && rawPanic;

    if (rawDeactivate != lastDeactivateState)
    {
        deactivateDebounceTime = millis();
        lastDeactivateState = rawDeactivate;
    }
    bool deactivatePressed = (millis() - deactivateDebounceTime > DEBOUNCE_MS) && rawDeactivate;

    bool fallDetected = checkFallDetection();

    if ((panicPressed || fallDetected) && !alertTriggered)
    {
        alertTriggered = true;
        alertStartTime = millis();

        if (fallDetected)
            Serial.println("!!! FALL DETECTED: " + getFallReason());
        else
            Serial.println("!!! PANIC BUTTON PRESSED !!!");

        Serial.println("    Countdown: 10 seconds to deactivate.");
        digitalWrite(LED_PIN, HIGH);
        digitalWrite(BUZZER_PIN, HIGH);

        updateDisplay();
        sendToBackend(true);
    }

    if (alertTriggered)
    {
        if (deactivatePressed)
        {
            alertTriggered = false;
            digitalWrite(BUZZER_PIN, LOW);
            digitalWrite(LED_PIN, LOW);
            Serial.println("Alert DEACTIVATED by user.");
            sendToBackend(false);
        }
        else if (millis() - alertStartTime >= ALERT_DELAY_MS)
        {
            Serial.println("10 seconds elapsed! Sending SOS...");
            digitalWrite(BUZZER_PIN, LOW);
            digitalWrite(LED_PIN, LOW);

            String sosMsg = "EMERGENCY! Wheelchair alert triggered";
            if (mpuReady && ENABLE_GYRO)
            {
                String reason = getFallReason();
                if (reason.length() > 0)
                    sosMsg += " [" + reason + "]";
            }
            sosMsg += ". Location: ";
            if (gps.location.isValid())
            {
                sosMsg += "https://maps.google.com/?q=";
                sosMsg += String(gps.location.lat(), 6) + ",";
                sosMsg += String(gps.location.lng(), 6);
            }
            else
            {
                sosMsg += "GPS Unavailable.";
            }

            for (int i = 0; i < numEmergencyContacts; i++)
            {
                sendSMS(emergencyNumbers[i], sosMsg);
            }

            alertTriggered = false;
            lockdown = true;
        }
        else
        {
            alertSignalBlinkLED();
        }
    }

    if (millis() - lastDisplayUpdate > 500)
    {
        updateDisplay();
        lastDisplayUpdate = millis();
    }

    static unsigned long lastNavFetch = 0;
    if (millis() - lastNavFetch > 2000)
    {
        lastNavFetch = millis();
        fetchNavigationData();
    }

    if (millis() - lastWiFiSend > WIFI_SEND_INTERVAL)
    {
        lastWiFiSend = millis();
        sendToBackend(alertTriggered);
    }

    // if (deviceConnected && sendGPSData)
    // {
    //     String gpsData = "LAT:N/A,LON:N/A,SPD:N/A";
    //     if (gps.location.isValid())
    //     {
    //         gpsData = "LAT:" + String(gps.location.lat(), 6);
    //         gpsData += ",LON:" + String(gps.location.lng(), 6);
    //         gpsData += gps.speed.isValid() ? ",SPD:" + String(gps.speed.kmph(), 1) : ",SPD:0.0";
    //     }
    //     //pTxCharacteristic->setValue(gpsData.c_str());
    //     //pTxCharacteristic->notify();
    //     Serial.println("BLE Sent: " + gpsData);
    //     sendGPSData = false;
    // }

    while (sim.available())
        Serial.write(sim.read());
    while (Serial.available())
        sim.write(Serial.read());
}

////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
// test GPS

// #include <Arduino.h> //gps #include <TinyGPSPlus.h>

// #define RXD2 18 
// #define TXD2 19

// HardwareSerial gpsSerial(2);

// int baudRates[] = {4800, 9600, 19200, 38400, 57600, 115200}; int numRates = sizeof(baudRates) / sizeof(baudRates[0]);

// void setup() { Serial.begin(115200); delay(2000); Serial.println("GPS Baud Rate Tester"); }

// void loop() {

// for (int i = 0; i < numRates; i++) {

// int currentBaud = baudRates[i];

// Serial.print("\nTesting baud rate: ");
// Serial.println(currentBaud);

// gpsSerial.end();
// delay(200);

// gpsSerial.begin(currentBaud, SERIAL_8N1, RXD2, TXD2);

// unsigned long startTime = millis();

// while (millis() - startTime < 3000) {
//   if (gpsSerial.available()) {

//     char c = gpsSerial.read();
//     Serial.print(c);

  
//     if (c == '$') {
//       Serial.println("\nPossible correct baud rate detected!");
//     }
//   }
// }
// }

// Serial.println("\nTest finished. Restarting..."); delay(5000); }


////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////


