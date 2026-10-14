# TransitIQ (SmartPassFlow) 🚌💳
### Smart College Bus Pass & Transport Management System Using RFID, IoT (ESP32), and Cloud Technology

TransitIQ is a full-stack, responsive IoT and cloud-powered transport management platform engineered for colleges and institutions. It automates bus boarding verification, enforces fee compliance, manages routes, and sends instant automated SMS notifications to parents when students board.

---

## 🌟 Key Features

- **⚡ Hardware-Integrated RFID Verification**: Real-time card scanning using physical **ESP32-WROOM-32** DevKit and **MFRC522** RFID reader over SPI.
- **📱 Instant Parent SMS Notifications**: Automated SMS dispatch to parent mobile numbers immediately upon card tap at the bus boarding point.
- **🚌 Bus Fleet & Occupancy Tracking**: Live monitoring of assigned buses (e.g., Bus 54 & Bus 67), route stops, capacity limits (124 total seats), and real-time boarding tallies.
- **🛡️ 7-Point Fraud Prevention**:
  - Unregistered RFID card detection
  - Wrong-bus boarding alerts
  - Duplicate tap suppression within configurable time window
  - Unpaid pass restrictions & fee balance warnings
  - Expired / suspended pass alerts
  - Offline SD card batch sync with conflict reconciliation
- **💬 Real-Time Firebase Fleet Dispatch Chat**: Live communication channels connecting transport coordinators, drivers, and campus security.
- **🔌 Web Serial Direct Hardware Bridge**: Direct USB serial connection in browser (Chrome/Edge) to read live serial logs from the ESP32 at 115200 baud.

---

## 🛠️ Hardware Setup & Wiring Pinout

### Components Used:
- **Microcontroller**: ESP32-WROOM-32 DevKit (30 pins)
- **RFID Module**: MFRC522 (13.56 MHz SPI Reader)
- **Passive Cards / Keyfobs**: Mifare Classic 1K / S50 (13.56 MHz)
*(No Buzzer, No Red LED, and No Green LED needed — all verification & attendance is logged on the TransitIQ website)*

### SPI Pinout Mapping:
| RFID RC522 Pin | ESP32-WROOM-32 GPIO | Description / Notes |
|:---|:---|:---|
| **SDA (SS)** | **GPIO 5** | SPI Chip Select |
| **SCK** | **GPIO 18** | SPI Clock |
| **MOSI** | **GPIO 23** | SPI Master Out Slave In |
| **MISO** | **GPIO 19** | SPI Master In Slave Out |
| **RST** | **GPIO 22** | Hardware Reset Pin |
| **GND** | **GND** | Common Ground |
| **3.3V** | **3V3** | ⚠️ Connect to 3.3V only (not 5V) |
| **IRQ** | *Unconnected* | Not required |

---

## 📲 Parent SMS Notification Flow

1. **Student Taps Card**: Student touches their RFID card to the bus-mounted RC522 scanner.
2. **ESP32 Ingestion**: ESP32 reads the Card UID (e.g., `E2000019`) and posts JSON to `/api/rfid/verify`:
   ```json
   {
     "device_id": "ESP32-WROOM-32",
     "bus_id": "54",
     "card_uid": "E2000019"
   }
   ```
3. **Cloud Database Match**: The server matches the card to the registered student and retrieves parent contact metadata.
4. **Instant SMS Delivery**: Server fires an SMS via gateway (Fast2SMS / Twilio) to the parent's phone:
   > *"Dear CHINNASAMY.A, your ward DHANYA SHRI.A.C (732224AI020) has safely boarded College Bus 54 at Periyaar Nagar at 08:15 AM. - TransitIQ"*

---

## 💻 Tech Stack

- **Frontend**: React 18, Vite 6, Modern Vanilla CSS Design System
- **Icons**: Lucide React
- **Hardware Integration**: Web Serial API, Web Audio API (Synthesizer), Arduino C++
- **Real-Time Backend**: Firebase Realtime Chat & Webhooks
- **Data Persistence**: Authoritative LocalStorage State Engine with schema migration

---

## 🚀 Getting Started

### Prerequisites:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Arduino IDE](https://www.arduino.cc/en/software) (with ESP32 board support and `MFRC522` library installed)

### Running the Web Platform:
```bash
# Clone the repository
git clone https://github.com/DhanyaShri25-eng/TransitIQ-.git
cd TransitIQ-

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 👥 Transport Roster

| Student ID | Full Name | Department | Bus | Route / Stop | Fee Status | Parent Contact |
|---|---|---|---|---|---|---|
| `732224AI020` | DHANYA SHRI.A.C | B.Tech AI&DS | Bus 54 | Periyaar Nagar | Unpaid | CHINNASAMY.A · 9944847680 |
| `732224AI054` | KAVIYAN.V | B.Tech AI&DS | Bus 67 | Mettur | Paid | Vijay.R · 7010615946 |

---

## 📜 License
Developed for Institutional Fleet Management. All rights reserved.
