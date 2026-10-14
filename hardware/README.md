# TransitIQ — ESP32 Hardware Firmware (Firebase Cloud Messaging Edition)

This directory contains the production Arduino C++ program to flash your **ESP32-WROOM-32** hardware rig with **RC522 RFID reader**.

When a student taps their physical RFID card, the ESP32 connects to Wi-Fi, communicates with **Google Firebase Project `transitiq-c2d78`**, verifies boarding against the student record, and triggers an immediate **Firebase Cloud Messaging (FCM) Push Notification** to the parent's registered mobile device.

---

## 1. Hardware Pinout & Wiring

Connect the **MFRC522 RFID module** to your **ESP32 DevKit (30-pin or 38-pin)** using standard female-to-female jumper wires as shown below:

| RC522 RFID Pin | ESP32 GPIO Pin | Wire Color (Recommended) | Description |
| :--- | :--- | :--- | :--- |
| **SDA (SS)** | **GPIO 5** | White / Purple | SPI Chip Select |
| **SCK** | **GPIO 18** | Blue | SPI Clock |
| **MOSI** | **GPIO 23** | Green | SPI Master Out Slave In |
| **MISO** | **GPIO 19** | Yellow | SPI Master In Slave Out |
| **RST** | **GPIO 22** | Orange | Reset Pin |
| **3.3V (VCC)** | **3V3** | Red | **CRITICAL: Connect to 3.3V ONLY! (5V will burn the RC522 chip)** |
| **GND** | **GND** | Black | Ground |
| **IRQ** | *Unconnected* | — | Not required |

> [!CAUTION]
> **Power Warning:** Never connect the RC522 `3.3V` pin to the ESP32 `VIN` or `5V` pin. Always use the `3V3` pin.

---

## 2. Software Requirements & Arduino IDE Setup

1. **Install Arduino IDE**:
   - Download and install [Arduino IDE 2.x](https://www.arduino.cc/en/software).
2. **Add ESP32 Board Package**:
   - In Arduino IDE, go to **File > Preferences**.
   - In **Additional boards manager URLs**, add:
     ```text
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to **Tools > Board > Boards Manager...**, search for `esp32` by *Espressif Systems*, and click **Install**.
3. **Install Required Libraries**:
   - Go to **Tools > Manage Libraries...**
   - Search for **`MFRC522`** by *GithubCommunity* and click **Install**.
   - `WiFi`, `HTTPClient`, and `WiFiClientSecure` are already built into the ESP32 core.

---

## 3. How to Feed / Flash the Program to ESP32

1. Open the file [TransitIQ_ESP32_Firebase.ino](file:///c:/Users/sanga/OneDrive/Makeathon/Desktop/TransitIQ/hardware/TransitIQ_ESP32_Firebase/TransitIQ_ESP32_Firebase.ino) in Arduino IDE.
2. In the code, set your Wi-Fi name and password:
   ```cpp
   const char* WIFI_SSID     = "YOUR_WIFI_HOTSPOT_NAME";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   ```
3. Connect your ESP32 to your PC using a micro-USB cable.
4. In Arduino IDE:
   - Select **Tools > Board > esp32 > DOIT ESP32 DEVKIT V1** (or **ESP32 Dev Module**).
   - Select **Tools > Port** and pick your ESP32 COM port (e.g. `COM3`, `COM4`, etc.).
   - Set **Upload Speed** to `115200` or `921600`.
5. Click **Upload** (the right-arrow button in Arduino IDE).
   *(If the IDE says "Connecting......", press and hold the **BOOT** button on your ESP32 for 2 seconds until uploading starts).*

---

## 4. Testing & Serial Monitor Output

1. Open **Tools > Serial Monitor** and set the baud rate to **115200**.
2. Press the **EN / RESET** button on the ESP32.
3. You will see:
   ```text
   ========================================================
      TRANSITIQ — SMART BUS BOARDING RFID HARDWARE RIG    
      Firebase Cloud Messaging (FCM) Push Architecture    
   ========================================================
   Device ID : ESP32-WROOM-32
   Bus Gate  : Bus 54
   Firebase  : transitiq-c2d78
   --------------------------------------------------------
   [Hardware] RC522 RFID Firmware Version: 0x92
   [Hardware] RC522 RFID Reader Initialized Successfully.
   [Wi-Fi] Connecting to: MyCampusHotspot...
   [Wi-Fi] CONNECTED! IP: 192.168.1.54
   [Status] System Ready. Waiting for Student RFID Card Tap...
   ```
4. Place the student card (e.g. UID `E2000019` for **DHANYA SHRI.A.C**) on the RC522 reader:
   ```text
   >>>>> [RFID CARD TAPPED] <<<<<
   Card UID        : E2000019
   Reader Bus ID   : 54
   Reader Device   : ESP32-WROOM-32
   ==================================================
   [Firebase] Preparing HTTPS POST to Firebase Cloud Function...
   HTTP Status Code : 200
   Response Body    : {"success":true,"status":"VALID","student_name":"DHANYA SHRI.A.C","bus_id":"54",...}

   >>> SUCCESS: RFID TAP VALIDATED BY FIREBASE! <<<
   >>> PUSH NOTIFICATION DISPATCHED TO PARENT'S DEVICE! <<<
   Title: TransitIQ – Bus Boarding Alert
   ```
5. The parent's mobile phone or registered browser will immediately ring and show:
   > **TransitIQ – Bus Boarding Alert**  
   > *Your child DHANYA SHRI.A.C has boarded Bus BUS01 at 8:15 AM.*
