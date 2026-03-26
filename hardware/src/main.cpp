#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <TinyGPSPlus.h>
#include <Wire.h>
#include <MPU6050.h>
#include "secrets.h"

#define SIM_RX_PIN 16
#define SIM_TX_PIN 17
HardwareSerial sim(1);

#define GPS_RX_PIN 18
#define GPS_TX_PIN 19
HardwareSerial gpsSerial(2);
TinyGPSPlus gps;

#define PANIC_BUTTON_PIN 4
#define DEACTIVATE_BUTTON_PIN 5
#define LED_PIN 42
#define BUZZER_PIN 2

#define MPU_SDA_PIN 8
#define MPU_SCL_PIN 9

const bool ENABLE_GYRO = true; // MPU enable

MPU6050 mpu;
bool mpuReady = false;

#define ACCEL_SCALE 16384.0f
#define GYRO_SCALE 131.0f


// ── Thresholds ──────────
#define IMPACT_G_THRESHOLD     6.0f 
#define FREEFALL_G_THRESHOLD   0.05f
#define FLIP_AZ_THRESHOLD     -0.7f 
#define SEVERE_TILT_THRESHOLD  0.8f 
#define ROLL_RATE_THRESHOLD  400.0f 

#define FALL_CONFIRM_COUNT     4    
static int fallCounter = 0;

float Ax = 0, Ay = 0, Az = 1;
float Gx = 0, Gy = 0, Gz = 0;


#define SERVICE_UUID "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_RX "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"

BLECharacteristic *pTxCharacteristic;
bool deviceConnected = false;
bool sendGPSData = false;
unsigned long lastBLEUpdate = 0;

float targetLat = 0.0;
float targetLon = 0.0;
bool targetReceived = false;

String emergencyNumbers[] = {"+359897406640", "+359887265727"};
int numEmergencyContacts = 2;

bool alertTriggered = false;
unsigned long alertStartTime = 0;
const unsigned long ALERT_DELAY_MS = 10000; // countdown

bool simReady = false;
bool lockdown = false;

unsigned long panicDebounceTime = 0;
unsigned long deactivateDebounceTime = 0;
const unsigned long DEBOUNCE_MS = 50;
bool lastPanicState = HIGH;
bool lastDeactivateState = HIGH;


unsigned long lastBeepToggle = 0;
const unsigned long BEEP_INTERVAL_MS = 500;

void parseCoordinates(String data)
{
    int latIndex = data.indexOf("LAT:");
    int lonIndex = data.indexOf("LON:");

    if (latIndex != -1 && lonIndex != -1)
    {
        String latStr = data.substring(latIndex + 4, data.indexOf(",", latIndex));
        String lonStr = data.substring(lonIndex + 4);
        targetLat = latStr.toFloat();
        targetLon = lonStr.toFloat();
        targetReceived = true;
        Serial.print("Target Lat: ");
        Serial.println(targetLat, 6);
        Serial.print("Target Lon: ");
        Serial.println(targetLon, 6);
    }
}

class MyCallbacks : public BLECharacteristicCallbacks
{
    void onWrite(BLECharacteristic *pCharacteristic)
    {
        std::string rxValue = pCharacteristic->getValue();
        if (rxValue.length() > 0)
        {
            String received = String(rxValue.c_str());
            Serial.print("BLE Received: ");
            Serial.println(received);
            if (received == "SEND")
            {
                sendGPSData = true;
            }
            else
            {
                parseCoordinates(received);
            }
        }
    }
};

class MyServerCallbacks : public BLEServerCallbacks
{
    void onConnect(BLEServer *pServer) { deviceConnected = true; }
    void onDisconnect(BLEServer *pServer) { deviceConnected = false; }
};

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

    //Serial.printf("Ax=%.3f Ay=%.3f Az=%.3f | Gx=%.2f Gy=%.2f Gz=%.2f\n", Ax, Ay, Az, Gx, Gy, Gz);
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

    bool instantFall = (totalG > IMPACT_G_THRESHOLD)  ||
                       (totalG < FREEFALL_G_THRESHOLD) ||
                       (Az < FLIP_AZ_THRESHOLD)        ||
                       (fabs(Ax) > SEVERE_TILT_THRESHOLD) ||
                       (fabs(Ay) > SEVERE_TILT_THRESHOLD) ||
                       (fabs(Gx) > ROLL_RATE_THRESHOLD)   ||
                       (fabs(Gy) > ROLL_RATE_THRESHOLD);

    if (instantFall)
    {
        fallCounter++;
        Serial.printf("[FALL?] counter=%d  totalG=%.2f  Ay=%.2f\n",
                       fallCounter, totalG, Ay);
    }
    else
    {
        fallCounter = 0; // reset при нормално движение
    }

    return (fallCounter >= FALL_CONFIRM_COUNT);
}

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
        if (resp.indexOf("OK") != -1 ||
            resp.indexOf("ERROR") != -1 ||
            resp.indexOf("+CME") != -1)
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

void setup()
{
    Serial.begin(115200);
    delay(1000);

    pinMode(PANIC_BUTTON_PIN, INPUT_PULLUP);
    pinMode(DEACTIVATE_BUTTON_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);

    Serial.println("\n>> Initializing MPU6050...");

    if (ENABLE_GYRO)
    {
        Wire.begin(MPU_SDA_PIN, MPU_SCL_PIN);
        Wire.setClock(100000); 
        delay(1000);

        mpu.initialize();
        delay(1000);

        Serial.print("WHO_AM_I: 0x");
        Serial.println(mpu.getDeviceID(), HEX);

        uint8_t id = mpu.getDeviceID();
        if (id == 0x34 || id == 0x38) // very important !!!
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
        Serial.println("   MPU6050 skipped via software flag — fall detection offline.");
        mpuReady = false;
    }

    Serial.print("WHO_AM_I: ");
    Serial.println(mpu.getDeviceID(), HEX);

    gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

    BLEDevice::init("Wheelchair-Nav");
    BLEServer *pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());
    BLEService *pService = pServer->createService(SERVICE_UUID);
    pTxCharacteristic = pService->createCharacteristic(CHARACTERISTIC_TX, BLECharacteristic::PROPERTY_NOTIFY);
    BLECharacteristic *pRxCharacteristic = pService->createCharacteristic(CHARACTERISTIC_RX, BLECharacteristic::PROPERTY_WRITE);
    pRxCharacteristic->setCallbacks(new MyCallbacks());
    pService->start();
    BLEDevice::getAdvertising()->start();
    Serial.println("BLE Started.");

    Serial.println("\n>> SIM800L Init Start");
    sim.begin(9600, SERIAL_8N1, SIM_RX_PIN, SIM_TX_PIN);
    delay(2000);
    resetModule();

    if (!checkModuleAlive())
    {
        Serial.println("!! SIM: Module failed.");
        return;
    }
    if (!checkSIM())
    {
        simReady = false;
        return;
    }
    if (!checkNetwork())
    {
        simReady = false;
        return;
    }

    simReady = true;
    Serial.println("\n>> SIM800L Ready.");
}

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
        return;
    }


    readMPU();

    while (gpsSerial.available())
    {
        gps.encode(gpsSerial.read());
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
        {
            Serial.println("!!! FALL DETECTED: " + getFallReason());
        }
        else
        {
            Serial.println("!!! PANIC BUTTON PRESSED !!!");
        }
        Serial.println("    Countdown: 10 seconds to deactivate.");

        digitalWrite(LED_PIN, HIGH);
        digitalWrite(BUZZER_PIN, HIGH);
    }

    if (alertTriggered)
    {

        if (deactivatePressed)
        {
            alertTriggered = false;
            digitalWrite(BUZZER_PIN, LOW);
            digitalWrite(LED_PIN, LOW);
            Serial.println("Alert DEACTIVATED by user.");

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

    if (millis() - lastBLEUpdate > 5000)
    {
        lastBLEUpdate = millis();
        sendGPSData = true;
    }

    if (deviceConnected && sendGPSData)
    {
        String gpsData = "LAT:N/A,LON:N/A,SPD:N/A";
        if (gps.location.isValid())
        {
            gpsData = "LAT:" + String(gps.location.lat(), 6);
            gpsData += ",LON:" + String(gps.location.lng(), 6);
            gpsData += gps.speed.isValid()
                           ? ",SPD:" + String(gps.speed.kmph(), 1)
                           : ",SPD:0.0";
        }
        pTxCharacteristic->setValue(gpsData.c_str());
        pTxCharacteristic->notify();
        Serial.println("BLE Sent: " + gpsData);
        sendGPSData = false;
    }

    while (sim.available())
        Serial.write(sim.read());
    while (Serial.available())
        sim.write(Serial.read());
}

///////////////////////////////////////////////////// -- test MPU 

// #include <Arduino.h>
// #include <Wire.h>
// #include <MPU6050.h> // only this library

// MPU6050 mpu;

// #define ACCEL_SCALE 16384.0
// #define GYRO_SCALE 131.0

// void setup()
// {
//   Serial.begin(115200);
//   delay(1000);

//   Wire.begin(8, 9);
//   delay(500);

//   mpu.initialize();

//   if (mpu.testConnection())
//     Serial.println("MPU6050 connected!");
//   else
//     Serial.println("MPU6050 connection failed!");
// }
// void loop()
// {
//   int16_t ax, ay, az, gx, gy, gz;
//   mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

//   float Ax = ax / ACCEL_SCALE;
//   float Ay = ay / ACCEL_SCALE;
//   float Az = az / ACCEL_SCALE;

//   float Gx = gx / GYRO_SCALE;
//   float Gy = gy / GYRO_SCALE;
//   float Gz = gz / GYRO_SCALE;

//   Serial.println("─────────────────────────────");
//   Serial.printf("Accel  X: %+6.3f g\n", Ax);
//   Serial.printf("Accel  Y: %+6.3f g\n", Ay);
//   Serial.printf("Accel  Z: %+6.3f g\n", Az);

//   if (Ax > 0.5)
//     Serial.println(">> Наклонен НАДЯСНО");
//   else if (Ax < -0.5)
//     Serial.println(">> Наклонен НАЛЯВО");
//   else if (Ay > 0.5)
//     Serial.println(">> Наклонен НАПРЕД");
//   else if (Ay < -0.5)
//     Serial.println(">> Наклонен НАЗАД");
//   else if (Az < 0.0)
//     Serial.println(">> ОБЪРНАТ НАДОЛУ");
//   else
//     Serial.println(">> Хоризонтален");

//   Serial.println("─────────────────────────────");
//   Serial.printf("Gyro   X: %+8.2f deg/s\n", Gx);
//   Serial.printf("Gyro   Y: %+8.2f deg/s\n", Gy);
//   Serial.printf("Gyro   Z: %+8.2f deg/s\n", Gz);

//   if (fabs(Gz) > 30)
//     Serial.println(">> Въртене около Z!");
//   if (fabs(Gx) > 30)
//     Serial.println(">> Въртене около X!");
//   if (fabs(Gy) > 30)
//     Serial.println(">> Въртене около Y!");

//   Serial.println();
//   delay(200);
// }
