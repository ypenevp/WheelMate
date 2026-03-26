#include <Arduino.h>
#include "secrets.h"

#define SIM_RX_PIN 16
#define SIM_TX_PIN 17
#define BAUD_RATE 9600
#define BUTTON_PIN 4


HardwareSerial sim(1);

String sendATRead(const char* cmd, int timeout = 2000)
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
        while (sim.available()) resp += (char)sim.read();

        if (resp.indexOf("OK") != -1 ||
            resp.indexOf("ERROR") != -1 ||
            resp.indexOf("+CME") != -1)
        {
            delay(100);
            while (sim.available()) resp += (char)sim.read();
            break;
        }
    }
    resp.trim();
    return resp;
}

bool sendAT(const char* cmd, const char* expected, int timeout = 2000)
{
    String r = sendATRead(cmd, timeout);
    Serial.println("[AT] " + String(cmd) + " -> " + r);
    return r.indexOf(expected) != -1;
}

void resetModule()
{
    Serial.println("\n Soft Reset (AT+CFUN=1,1)...");
    sim.println("AT+CFUN=1,1");
    delay(3000);
}

bool checkModuleAlive()
{
    Serial.println("\n Step 1: Check Module");

    sim.write(27);
    delay(100);
    sim.println("AT");

    for (int i = 0; i < 5; i++)
    {
        if (sendAT("AT", "OK", 1000))
        {
            Serial.println(" Module responding!");
            sendAT("ATE0", "OK");
            return true;
        }
        Serial.println("   Attempt " + String(i + 1) + "/5...");
        delay(1000);
    }

    Serial.println(" Module not responding.");
    return false;
}

bool checkSIM()
{
    Serial.println("\n Step 2: Check SIM");

    for (int i = 0; i < 10; i++)
    {
        String resp = sendATRead("AT+CPIN?", 3000);
        Serial.println("[SIM] Attempt (" + String(i + 1) + "/10): " + resp);

        if (resp.indexOf("READY") != -1)
        {
            Serial.println(" SIM card ready!");
            return true;
        }
        else if (resp.indexOf("SIM PIN") != -1)
        {
            Serial.println(" SIM locked with PIN! Unlocking...");

            if (sendAT("AT+CPIN=\"0000\"", "OK", 10000))
            {
                Serial.println(" SIM unlocked!");
                delay(10000);
                return true;
            }
            else
            {
                Serial.println(" Wrong PIN!");
                return false;
            }
        }
        else if (resp.indexOf("SIM PUK") != -1)
        {
            Serial.println(" SIM blocked with PUK!");
            return false;
        }

        delay(3000);
    }

    return false;
}

bool checkNetwork()
{
    Serial.println("\n Step 3: Check Network");

    String oper = sendATRead("AT+COPS?", 5000);
    Serial.println("[Operator] " + oper);

    String csq = sendATRead("AT+CSQ", 3000);
    Serial.println("[Signal] " + csq);

    Serial.println("Waiting for registration...");
    for (int i = 0; i < 15; i++)
    {
        String reg = sendATRead("AT+CREG?", 3000);
        Serial.println("   [CREG] " + reg);

        if (reg.indexOf(",1") != -1 || reg.indexOf(",5") != -1)
        {
            Serial.println(" Registered on GSM network!");
            return true;
        }
        if (reg.indexOf(",3") != -1)
        {
            Serial.println(" Registration denied!");
            return false;
        }
        delay(2000);
    }

    return false;
}

bool sendSMS(const char* number, const char* message)
{
    Serial.println("\n Step 4: Sending SMS");
    Serial.println("   To: " + String(number));

    if (!sendAT("AT+CMGF=1", "OK", 3000)) return false;
    sendAT("AT+CSCS=\"GSM\"", "OK", 3000);

    sim.println("AT+CMGS=\"" + String(number) + "\"");
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
        return false;
    }

    sim.print(message);
    delay(500);
    sim.write(26);

    String resp = "";
    t = millis();
    while (millis() - t < 15000)
    {
        while (sim.available()) resp += (char)sim.read();
        if (resp.indexOf("+CMGS:") != -1)
        {
            Serial.println(" SMS sent successfully!");
            return true;
        }
        if (resp.indexOf("ERROR") != -1) break;
    }
    return false;
}

void setup()
{
    Serial.begin(115200);
    delay(1000);

    pinMode(BUTTON_PIN, INPUT_PULLUP);

    Serial.println("\n SIM800L Diagnostic Start");

    sim.begin(BAUD_RATE, SERIAL_8N1, SIM_RX_PIN, SIM_TX_PIN);
    delay(2000);

    resetModule();

    if (!checkModuleAlive())
    {
        Serial.println("\n STOP: Module communication issue");
        return;
    }

    if (!checkSIM()) return;
    if (!checkNetwork()) return;

    Serial.println("Ready to send SMS on button press.");
}

void loop()
{
    if (digitalRead(BUTTON_PIN) == LOW)
    {
        Serial.println("\n WARNING: Panic button pressed!");

        bool success = sendSMS(ALARM_PHONE, "POMOSHT! Panik butonut e natisnat! Izprashtam lokaciya...");

        if (success)
        {
            Serial.println(" Alarm SMS sent successfully.");
        }
        else
        {
            Serial.println(" Error sending alarm SMS.");
        }

        delay(5000);
    }

    while (sim.available())  Serial.write(sim.read());
    while (Serial.available()) sim.write(Serial.read());
}

