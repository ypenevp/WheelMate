// #include <Arduino.h>
// #include "secrets.h"

// void setup() {
//   Serial.begin(115200);
// }

// void loop() {

// }


#include <Arduino.h>
#include <TinyGPSPlus.h>

#define RX 17
#define TX 16

HardwareSerial gpsSerial(2);
TinyGPSPlus gps;

void setup()
{
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, RX, TX);
}

void loop()
{
  while (gpsSerial.available())
    gps.encode(gpsSerial.read());

  Serial.println("══════════════════════════════");

  if (gps.location.isValid())
  {
    Serial.printf("Latitude:   %.6f\n", gps.location.lat());
    Serial.printf("Longitude:  %.6f\n", gps.location.lng());
    Serial.printf("Age:        %lu ms\n", gps.location.age());
  }
  else Serial.println("Location:   N/A");

  if (gps.date.isValid())
    Serial.printf("Date:       %02d/%02d/%04d\n",
                  gps.date.day(), gps.date.month(), gps.date.year());
  else Serial.println("Date:       N/A");

  if (gps.time.isValid())
    Serial.printf("Time (UTC): %02d:%02d:%02d.%02d\n",
                  gps.time.hour(), gps.time.minute(),
                  gps.time.second(), gps.time.centisecond());
  else Serial.println("Time:       N/A");

  if (gps.speed.isValid())
  {
    Serial.printf("Speed:      %.2f km/h\n", gps.speed.kmph());
    Serial.printf("Speed:      %.2f knots\n", gps.speed.knots());
    Serial.printf("Speed:      %.2f m/s\n",  gps.speed.mps());
  }
  else Serial.println("Speed:      N/A");

  if (gps.course.isValid())
    Serial.printf("Course:     %.2f deg\n", gps.course.deg());
  else Serial.println("Course:     N/A");

  if (gps.altitude.isValid())
  {
    Serial.printf("Altitude:   %.2f m\n",   gps.altitude.meters());
    Serial.printf("Altitude:   %.2f ft\n",  gps.altitude.feet());
    Serial.printf("Altitude:   %.2f mi\n",  gps.altitude.miles());
  }
  else Serial.println("Altitude:   N/A");

  if (gps.satellites.isValid())
    Serial.printf("Satellites: %d\n", gps.satellites.value());
  else Serial.println("Satellites: N/A");

  if (gps.hdop.isValid())
    Serial.printf("HDOP:       %.2f\n", gps.hdop.hdop());
  else Serial.println("HDOP:       N/A");


  Serial.println("══════════════════════════════\n");
  delay(1000);
}