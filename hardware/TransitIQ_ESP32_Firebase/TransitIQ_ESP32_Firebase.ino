/*
 ==============================================================================
  TransitIQ — Official ESP32 Hardware Firmware (Firebase Cloud Messaging Edition)
 ==============================================================================
  Target Board : ESP32 Dev Module / DOIT ESP32 DEVKIT V1 (30-pin or 38-pin)
  RFID Reader  : RC522 (MFRC522 13.56MHz SPI)
  Backend      : Google Firebase Project [ transitiq-c2d78 ]
  Trigger      : Firebase Cloud Function -> FCM Push Notification to Parent Device

  ==============================================================================
  PHYSICAL PIN CONNECTIONS (RC522 -> ESP32-WROOM-32)
  ==============================================================================
    RC522 Pin  | ESP32 GPIO Pin | Wire Color (Typical) | Notes
   ------------|----------------|----------------------|-----------------------
    SDA (SS)   | GPIO 5         | Purple / White       | SPI Slave Select
    SCK        | GPIO 18        | Blue                 | SPI Clock
    MOSI       | GPIO 23        | Green                | Master Out Slave In
    MISO       | GPIO 19        | Yellow               | Master In Slave Out
    RST        | GPIO 22        | Orange               | Reset Pin
    3.3V (VCC) | 3V3            | Red                  | WARNING: 3.3V ONLY! (5V damages RC522)
    GND        | GND            | Black                | Ground
    IRQ        | Not Connected  | —                    | Leave Unconnected
  ==============================================================================

  REQUIRED ARDUINO LIBRARIES:
  1. MFRC522 by GithubCommunity (install via Arduino Library Manager)
  2. WiFi & HTTPClient (built into ESP32 Arduino Board package)
  3. WiFiClientSecure (built into ESP32 Arduino Board package)
 ==============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <SPI.h>
#include <MFRC522.h>

// ======================== HARDWARE PIN DEFINITIONS ========================
#define SS_PIN  5    // GPIO 5  -> RC522 SDA
#define RST_PIN 22   // GPIO 22 -> RC522 RST

// ======================== WI-FI CONFIGURATION =============================
// Change these to your actual Wi-Fi hotspot or campus router credentials
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ======================== FIREBASE CONFIGURATION ==========================
// Firebase Project: transitiq-c2d78
// HTTPS Endpoint of your deployed Firebase Cloud Function:
const char* FIREBASE_URL  = "https://us-central1-transitiq-c2d78.cloudfunctions.net/apiRfidTap";

// Bus & IoT Device Identification
const char* DEVICE_ID     = "ESP32-WROOM-32";
const char* BUS_ID        = "54"; // Matches Bus 54 assigned to DHANYA SHRI.A.C

// ======================== HARDWARE INSTANCES ==============================
MFRC522 rfid(SS_PIN, RST_PIN);

// Track last card tap time to prevent accidental double-scanning
unsigned long lastTapTime = 0;
const unsigned long TAP_DEBOUNCE_MS = 2000; // 2-second debounce between scans
String lastScannedUid = "";

// ==============================================================================
//  Wi-Fi Connection Helper (with Auto-Reconnect)
// ==============================================================================
void connectToWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println("\n--------------------------------------------------");
  Serial.print("[Wi-Fi] Connecting to: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] CONNECTED!");
    Serial.print("[Wi-Fi] ESP32 IP Address : ");
    Serial.println(WiFi.localIP());
    Serial.print("[Wi-Fi] Signal Strength  : ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n[Wi-Fi] WARNING: Connection failed! Will retry during loop.");
  }
  Serial.println("--------------------------------------------------");
}

// ==============================================================================
//  Transmit RFID Tap to Firebase Cloud Function (Triggers Parent FCM Push)
// ==============================================================================
bool sendTapToFirebase(String cardUid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Error] Cannot send: Wi-Fi is disconnected. Attempting reconnect...");
    connectToWiFi();
    if (WiFi.status() != WL_CONNECTED) return false;
  }

  Serial.println("\n[Firebase] Preparing HTTPS POST to Firebase Cloud Function...");
  Serial.print("[Endpoint] ");
  Serial.println(FIREBASE_URL);

  WiFiClientSecure client;
  client.setInsecure(); // Connect over TLS without requiring local root certificate bundle

  HTTPClient https;
  if (!https.begin(client, FIREBASE_URL)) {
    Serial.println("[Error] Unable to initialize HTTPS connection.");
    return false;
  }

  https.addHeader("Content-Type", "application/json");
  https.setTimeout(8000); // 8-second network timeout

  // Build JSON payload matching TransitIQ Cloud Function requirements
  String jsonPayload = "{";
  jsonPayload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  jsonPayload += "\"bus_id\":\"" + String(BUS_ID) + "\",";
  jsonPayload += "\"card_uid\":\"" + cardUid + "\"";
  jsonPayload += "}";

  Serial.print("[Payload] ");
  Serial.println(jsonPayload);

  int httpCode = https.POST(jsonPayload);

  if (httpCode > 0) {
    String response = https.getString();
    Serial.println("\n================ FIREBASE RESPONSE ================");
    Serial.print("HTTP Status Code : ");
    Serial.println(httpCode);
    Serial.print("Response Body    : ");
    Serial.println(response);

    if (httpCode == 200) {
      Serial.println("\n>>> SUCCESS: RFID TAP VALIDATED BY FIREBASE! <<<");
      Serial.println(">>> PUSH NOTIFICATION DISPATCHED TO PARENT'S DEVICE! <<<");
      Serial.println("Title: TransitIQ – Bus Boarding Alert");
      Serial.println("===================================================\n");
      https.end();
      return true;
    } else {
      Serial.print("[Notice] Firebase returned status code: ");
      Serial.println(httpCode);
    }
  } else {
    Serial.print("[Error] HTTPS POST failed, error: ");
    Serial.println(https.errorToString(httpCode).c_str());
  }

  https.end();
  return false;
}

// ==============================================================================
//  SETUP
// ==============================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n");
  Serial.println("========================================================");
  Serial.println("   TRANSITIQ — SMART BUS BOARDING RFID HARDWARE RIG    ");
  Serial.println("   Firebase Cloud Messaging (FCM) Push Architecture    ");
  Serial.println("========================================================");
  Serial.println("Device ID : " + String(DEVICE_ID));
  Serial.println("Bus Gate  : Bus " + String(BUS_ID));
  Serial.println("Firebase  : transitiq-c2d78");
  Serial.println("--------------------------------------------------------");

  // 1. Initialize SPI bus
  SPI.begin();

  // 2. Initialize MFRC522 RFID reader
  rfid.PCD_Init();
  delay(50);

  // Check reader communication
  byte version = rfid.PCD_ReadRegister(rfid.VersionReg);
  Serial.print("[Hardware] RC522 RFID Firmware Version: 0x");
  Serial.println(version, HEX);

  if (version == 0x00 || version == 0xFF) {
    Serial.println("[CRITICAL WARNING] RC522 Reader NOT detected! Check your wiring connections!");
    Serial.println("Make sure 3.3V is connected to 3V3, GND to GND, and SDA to GPIO 5.");
  } else {
    Serial.println("[Hardware] RC522 RFID Reader Initialized Successfully.");
  }

  // 3. Connect to Wi-Fi
  connectToWiFi();

  Serial.println("\n[Status] System Ready. Waiting for Student RFID Card Tap...\n");
}

// ==============================================================================
//  MAIN LOOP
// ==============================================================================
void loop() {
  // Maintain Wi-Fi connectivity
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  // Check if a new card is placed near the reader
  if (!rfid.PICC_IsNewCardPresent()) {
    return;
  }

  // Read card serial number
  if (!rfid.PICC_ReadCardSerial()) {
    return;
  }

  // Extract Card UID in Hexadecimal format (e.g., E2000019)
  String cardUid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) cardUid += "0";
    cardUid += String(rfid.uid.uidByte[i], HEX);
  }
  cardUid.toUpperCase();

  unsigned long currentMillis = millis();

  // Debounce check: Prevent rapid multi-reads of the same card
  if (cardUid == lastScannedUid && (currentMillis - lastTapTime < TAP_DEBOUNCE_MS)) {
    // Halt card and ignore duplicate tap within 2 seconds
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }

  lastScannedUid = cardUid;
  lastTapTime = currentMillis;

  Serial.println("\n==================================================");
  Serial.println(">>>>> [RFID CARD TAPPED] <<<<<");
  Serial.print("Card UID        : ");
  Serial.println(cardUid);
  Serial.print("Reader Bus ID   : ");
  Serial.println(BUS_ID);
  Serial.print("Reader Device   : ");
  Serial.println(DEVICE_ID);
  Serial.println("==================================================");

  // Send to Firebase Cloud Function
  sendTapToFirebase(cardUid);

  // Halt card & stop crypto to save power and ready reader for next card
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  delay(500); // Short stabilization delay
}
