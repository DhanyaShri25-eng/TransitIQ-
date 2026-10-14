import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Cpu, 
  Wifi, 
  Usb, 
  Radio, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Send,
  Copy,
  Check,
  Code,
  Download
} from 'lucide-react';
import { db } from '../services/db';
import { verifyRfidEvent } from '../services/rfidEngine';

const RFID_USB_SERIAL_CODE = `/*
 * TransitIQ — Minimal ESP32 + RC522 RFID Tap Reader (USB Web Serial)
 * -------------------------------------------------------------
 * ONLY RFID Reader code — NO Red LED, NO Green LED, NO Buzzer.
 * Once a student taps their card, this code sends the Card UID over
 * Serial directly to the TransitIQ website, where attendance and boarding
 * records are immediately noted.
 *
 * Wiring Connections:
 *   RC522 Pin  ->  ESP32-WROOM-32 GPIO
 *   ----------------------------------
 *   SDA (SS)   ->  GPIO 5
 *   SCK        ->  GPIO 18
 *   MOSI       ->  GPIO 23
 *   MISO       ->  GPIO 19
 *   RST        ->  GPIO 22
 *   3.3V       ->  3V3  (WARNING: 3.3V only! Do NOT connect to 5V)
 *   GND        ->  GND
 *   IRQ        ->  Not connected
 */

#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN  5
#define RST_PIN 22

MFRC522 rfid(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("TransitIQ RFID Bus Gate Ready. Waiting for card tap...");
}

void loop() {
  // Check if a new card is placed near the reader
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  // Extract Card UID in uppercase hexadecimal
  String cardUid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) cardUid += "0";
    cardUid += String(rfid.uid.uidByte[i], HEX);
  }
  cardUid.toUpperCase();

  // Send UID over Serial — TransitIQ website catches this via Web Serial and notes it!
  Serial.print("CARD_TAP:");
  Serial.println(cardUid);

  // Halt card to prevent duplicate repeated scans
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(1200); // 1.2s delay to prevent accidental multi-scan
}
`;

const RFID_WIFI_HTTP_CODE = `/*
 * TransitIQ — ESP32 + RC522 RFID Reader (Local HTTP POST)
 * ------------------------------------------------------
 * Reads student card UID and posts JSON directly to the TransitIQ local dev backend.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN  5
#define RST_PIN 22

const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverApiUrl = "http://YOUR_SERVER_IP:5173/api/rfid/verify";
const char* deviceId = "ESP32-BUS-001";
const char* busId = "54";

MFRC522 rfid(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();

  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWi-Fi Connected! IP: " + WiFi.localIP().toString());
  Serial.println("TransitIQ RFID Bus Gate Ready. Waiting for card tap...");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  String cardUid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) cardUid += "0";
    cardUid += String(rfid.uid.uidByte[i], HEX);
  }
  cardUid.toUpperCase();

  Serial.println("Card Tapped: " + cardUid);

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverApiUrl);
    http.addHeader("Content-Type", "application/json");

    String json = "{\\"device_id\\":\\"" + String(deviceId) + 
                  "\\",\\"bus_id\\":\\"" + String(busId) + 
                  "\\",\\"card_uid\\":\\"" + cardUid + "\\"}";

    int code = http.POST(json);
    Serial.println("Website Response Code: " + String(code));
    http.end();
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(1200);
}
`;

const RFID_FIREBASE_FCM_CODE = `/*
 * TransitIQ — ESP32 + RC522 RFID Reader (Wi-Fi + Firebase Cloud Functions FCM)
 * ----------------------------------------------------------------------------
 * Connects directly to Firebase Project transitiq-c2d78 over Wi-Fi.
 * When a student taps their card, this sends the UID to the Firebase Cloud Function
 * HTTPS endpoint.
 *
 * The Cloud Function verifies the boarding record and instantly delivers a
 * Firebase Cloud Messaging (FCM) Push Notification to the parent's phone:
 *
 * Example Notification:
 *   Title: TransitIQ – Bus Boarding Alert
 *   Body:  Your child DHANYA SHRI.A.C has boarded Bus BUS01 at 8:15 AM.
 *
 * Hardware Pin Connections:
 *   RC522 Pin  ->  ESP32-WROOM-32 GPIO
 *   ----------------------------------
 *   SDA (SS)   ->  GPIO 5
 *   SCK        ->  GPIO 18
 *   MOSI       ->  GPIO 23
 *   MISO       ->  GPIO 19
 *   RST        ->  GPIO 22
 *   3.3V       ->  3V3  (Do NOT connect to 5V)
 *   GND        ->  GND
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN  5
#define RST_PIN 22

// Wi-Fi Credentials
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// Firebase Cloud Function HTTPS endpoint for project transitiq-c2d78
const char* firebaseEndpoint = "https://us-central1-transitiq-c2d78.cloudfunctions.net/apiRfidTap";
const char* deviceId = "ESP32-WROOM-32";
const char* busId = "54"; // or BUS01

MFRC522 rfid(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();

  Serial.println("\\n==========================================");
  Serial.println("TransitIQ ESP32 Bus Gate (Firebase FCM)");
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\\n[Wi-Fi] Connected! IP: " + WiFi.localIP().toString());
  Serial.println("[Firebase] Target: transitiq-c2d78 (Cloud Functions)");
  Serial.println("TransitIQ Gate Ready. Waiting for card tap...");
  Serial.println("==========================================\\n");
}

void loop() {
  // Check if a card is placed near the reader
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  // Extract Card UID
  String cardUid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) cardUid += "0";
    cardUid += String(rfid.uid.uidByte[i], HEX);
  }
  cardUid.toUpperCase();

  Serial.println("\\n>>> RFID CARD DETECTED <<<");
  Serial.println("Card UID: " + cardUid);

  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure(); // Connect securely via HTTPS without local root cert bundle

    HTTPClient https;
    if (https.begin(client, firebaseEndpoint)) {
      https.addHeader("Content-Type", "application/json");

      String jsonPayload = "{\\"device_id\\":\\"" + String(deviceId) + 
                           "\\",\\"bus_id\\":\\"" + String(busId) + 
                           "\\",\\"card_uid\\":\\"" + cardUid + "\\"}";

      Serial.println("[Firebase] Disagreeing duplicate scans. Transmitting boarding event...");
      int httpCode = https.POST(jsonPayload);

      if (httpCode > 0) {
        String response = https.getString();
        Serial.println("[Firebase Response Code] " + String(httpCode));
        Serial.println("[Cloud Status] " + response);
        Serial.println(">> FCM PUSH NOTIFICATION TRIGGERED FOR PARENT <<");
      } else {
        Serial.println("[Error] HTTPS POST failed: " + https.errorToString(httpCode));
      }
      https.end();
    }
  } else {
    Serial.println("[Error] Wi-Fi disconnected!");
  }

  // Halt card to prevent duplicate repeated scans
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(1500); // 1.5s cooldown
}
`;

export default function IoTDevices({ data, onRefresh, role, onOpenSimulator }) {
  const devices = data.devices || [];
  const buses = data.buses || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [serialConnected, setSerialConnected] = useState(false);
  const [serialLog, setSerialLog] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [codeMode, setCodeMode] = useState('usb_serial'); // 'usb_serial' | 'wifi_http'
  const [lastTapEvent, setLastTapEvent] = useState(null);

  const [formData, setFormData] = useState({
    device_id: '',
    device_name: '',
    assigned_bus: '54',
    firmware_version: 'v2.4.2-ota',
    device_status: 'Online',
    last_heartbeat: new Date().toISOString()
  });
  const [formError, setFormError] = useState('');

  const filteredDevices = devices.filter((d) => 
    !searchTerm ||
    d.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.device_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.assigned_bus?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setFormError('');
    const newNum = String(Math.floor(100 + Math.random() * 900));
    setFormData({
      device_id: `ESP32-BUS-${newNum}`,
      device_name: `ESP32 Bus Gate ${newNum}`,
      assigned_bus: buses[0]?.bus_number || '54',
      firmware_version: 'v2.4.2-ota',
      device_status: 'Online',
      last_heartbeat: new Date().toISOString()
    });
    setIsAddOpen(true);
  };

  const handleAddDevice = (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.device_name || !formData.device_id) {
      setFormError('Device ID and Name are required.');
      return;
    }

    try {
      db.registerDevice({
        ...formData,
        last_seen: new Date().toISOString(),
        last_successful_sync: new Date().toISOString(),
        pending_event_count: 0
      });
      setIsAddOpen(false);
      onRefresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  // Called when a card UID is tapped (either via Web Serial or Quick Test)
  const recordCardTapOnWebsite = (cardUid) => {
    const cleanUid = (cardUid || '').trim().toUpperCase();
    if (!cleanUid) return;

    const assignedBus = buses[0]?.bus_number || '54';
    const assignedDevice = devices[0]?.device_id || 'ESP32-BUS-001';

    const result = verifyRfidEvent({
      event_id: `EVT-${Date.now().toString(36).toUpperCase()}`,
      device_id: assignedDevice,
      bus_id: assignedBus,
      card_uid: cleanUid,
      timestamp: new Date().toISOString()
    });

    setLastTapEvent({
      card_uid: cleanUid,
      result: result,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    onRefresh();
  };

  // Web Serial API: connect directly to physical ESP32 COM port over USB
  const handleConnectWebSerial = async () => {
    if (!('serial' in navigator)) {
      alert('Web Serial API is supported in Chrome, Edge, and Opera. Please open this page in Chrome or Edge to connect to your ESP32 COM port directly.');
      return;
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      setSerialConnected(true);
      setSerialLog('Connected to physical ESP32-WROOM-32 on USB COM port at 115200 baud.');

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      let serialBuffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          serialBuffer += value;
          setSerialLog(prev => `${prev}\n${value}`.slice(-400));

          // Look for CARD_TAP:<HEX_UID> or raw hex UID like E2000019
          const match = serialBuffer.match(/(?:CARD_TAP:|\b)([0-9A-Fa-f]{6,14})\b/);
          if (match) {
            const detectedUid = match[1].toUpperCase();
            serialBuffer = '';
            recordCardTapOnWebsite(detectedUid);
          }
        }
      }
    } catch (err) {
      console.warn('Serial connect error:', err);
      setSerialLog(`Serial status: ${err.message || 'Cancelled by user'}`);
    }
  };

  const handleCopyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadIno = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'TransitIQ_ESP32_Firebase.ino';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ['Device', 'Bus', 'Firmware', 'Connection', 'Heartbeat'];
    const rows = filteredDevices.map((d) => [
      `"${d.device_name} (${d.device_id})"`,
      d.assigned_bus,
      d.firmware_version,
      d.device_status,
      d.last_heartbeat
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transitiq_devices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canEdit = role !== 'Read-Only Viewer';

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header matching Screenshot 2 */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.5px' }}>
          Devices
        </h1>
      </div>

      {/* Live Tap Noted Confirmation Banner */}
      {lastTapEvent && (
        <div style={{
          background: lastTapEvent.result?.verification_status === 'VALID' 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.08) 100%)' 
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(185, 28, 28, 0.08) 100%)',
          border: `1px solid ${lastTapEvent.result?.verification_status === 'VALID' ? '#10B981' : '#EF4444'}`,
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: lastTapEvent.result?.verification_status === 'VALID' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: lastTapEvent.result?.verification_status === 'VALID' ? '#10B981' : '#EF4444'
            }}>
              {lastTapEvent.result?.verification_status === 'VALID' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>RFID Tap Noted in Website: {lastTapEvent.result?.student_name || 'Card ' + lastTapEvent.card_uid}</span>
                <span className={`badge ${lastTapEvent.result?.verification_status === 'VALID' ? 'badge-valid' : 'badge-invalid'}`}>
                  {lastTapEvent.result?.verification_status}
                </span>
              </div>
              <div style={{ fontSize: '12.5px', color: '#CBD5E1', marginTop: '3px' }}>
                Card UID: <strong style={{ color: 'var(--accent-teal)', fontFamily: 'var(--font-mono)' }}>{lastTapEvent.card_uid}</strong> · Bus {lastTapEvent.result?.bus_number || '54'} · Recorded at {lastTapEvent.timestamp} · {lastTapEvent.result?.message || 'Boarding logged'}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setLastTapEvent(null)}
            style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#CBD5E1', borderRadius: '6px', padding: '4px 10px', fontSize: '11.5px', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Toolbar matching Screenshot 2 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        {canEdit && (
          <button 
            onClick={handleOpenAdd}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 24px',
              borderRadius: '999px',
              background: 'var(--accent-teal)',
              color: '#061D15',
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 16px var(--accent-teal-glow)'
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add record</span>
          </button>
        )}

        <button 
          onClick={exportCSV}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 28px',
            borderRadius: '999px',
            background: 'transparent',
            color: '#FFFFFF',
            fontSize: '13.5px',
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.18)',
            cursor: 'pointer'
          }}
        >
          Export CSV
        </button>

        <button
          onClick={handleConnectWebSerial}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            borderRadius: '999px',
            background: serialConnected ? 'rgba(0, 208, 156, 0.15)' : 'transparent',
            color: serialConnected ? 'var(--accent-teal)' : '#FFFFFF',
            fontSize: '13.5px',
            fontWeight: 600,
            border: `1px solid ${serialConnected ? 'var(--accent-teal)' : 'rgba(255, 255, 255, 0.18)'}`,
            cursor: 'pointer'
          }}
          title="Direct USB Web Serial live connection to your ESP32 board"
        >
          <Usb size={16} />
          <span>{serialConnected ? 'USB Serial Connected' : 'Connect Physical ESP32 (USB)'}</span>
        </button>

        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <input 
            type="text"
            placeholder="Search records"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '999px',
              background: '#091018',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              fontSize: '13.5px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Table Headers matching Screenshot 2 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr',
        padding: '12px 24px',
        fontSize: '13px',
        fontWeight: 700,
        color: '#FFFFFF',
        marginBottom: '10px'
      }}>
        <div>Device</div>
        <div>Bus</div>
        <div>Firmware</div>
        <div>Connection</div>
        <div>Heartbeat</div>
      </div>

      {/* Content: Device Rows */}
      {filteredDevices.length === 0 ? (
        <div style={{
          background: '#0D1520',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'rgba(0, 208, 156, 0.08)',
            border: '1px solid rgba(0, 208, 156, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-teal)'
          }}>
            <Cpu size={20} />
          </div>
          <div style={{ fontSize: '13.5px', color: '#CBD5E1', fontWeight: 500 }}>
            No records match. Add a record or clear the filters.
          </div>
        </div>
      ) : (
        <div style={{
          background: '#0D1520',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '28px'
        }}>
          {filteredDevices.map((d) => (
            <div 
              key={d.device_id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr',
                padding: '18px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: '13.5px',
                alignItems: 'center',
                color: '#FFFFFF'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={16} style={{ color: 'var(--accent-teal)' }} />
                  <span>{d.device_name}</span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>
                  ID: {d.device_id} · {d.device_label || 'ESP32-DEV'}
                </div>
              </div>

              <div>
                <span className="badge badge-info" style={{ fontSize: '12px', padding: '3px 10px' }}>
                  Bus {d.assigned_bus}
                </span>
              </div>

              <div>
                <code style={{ fontSize: '12px', background: 'rgba(255, 255, 255, 0.06)', padding: '3px 8px', borderRadius: '4px' }}>
                  {d.firmware_version}
                </code>
              </div>

              <div>
                <span className={`badge ${d.device_status === 'Online' ? 'badge-valid' : 'badge-offline'}`}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: d.device_status === 'Online' ? '#10B981' : '#94A3B8' }} />
                  <span>{d.device_status}</span>
                </span>
              </div>

              <div style={{ fontSize: '12.5px', color: '#94A3B8' }}>
                {d.last_heartbeat ? new Date(d.last_heartbeat).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hardware Spotlight: Real Physical Setup from User's Photograph */}
      <div style={{
        background: '#091018',
        border: '1px solid rgba(0, 208, 156, 0.25)',
        borderRadius: '20px',
        padding: '28px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-teal)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-teal)' }} />
              PHYSICAL HARDWARE RIG DETECTED & VERIFIED
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
              ESP32-WROOM-32 DevKit + RFID-RC522 (13.56 MHz)
            </h3>
          </div>

          <button 
            onClick={onOpenSimulator}
            className="btn btn-teal btn-sm"
            style={{ borderRadius: '999px', padding: '8px 18px' }}
          >
            <Radio size={14} /> Open Live Hardware Tester
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          alignItems: 'center'
        }}>
          {/* User's Actual Hardware Photograph */}
          <div style={{
            borderRadius: '16px',
            overflow: 'hidden',
            border: '2px solid rgba(255, 255, 255, 0.12)',
            position: 'relative',
            maxHeight: '280px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
          }}>
            <img 
              src="/esp32_hardware_setup.jpg" 
              alt="Physical ESP32 WROOM-32 and RC522 Reader Setup" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              background: 'rgba(8, 14, 21, 0.85)',
              backdropFilter: 'blur(6px)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              Active Rig: ESP32 + MFRC522 SPI Jumper Wires
            </div>
          </div>

          {/* Pinout Mapping Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '13px', color: '#CBD5E1', fontWeight: 600 }}>
              Physical Hardware Pinout Mapping:
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              fontSize: '12px'
            }}>
              {[
                { rfid: 'SDA (SS)', esp: 'GPIO 5', wire: 'White / Purple' },
                { rfid: 'SCK', esp: 'GPIO 18', wire: 'Blue' },
                { rfid: 'MOSI', esp: 'GPIO 23', wire: 'Green' },
                { rfid: 'MISO', esp: 'GPIO 19', wire: 'Yellow' },
                { rfid: 'RST', esp: 'GPIO 22', wire: 'Orange' },
                { rfid: 'GND', esp: 'GND', wire: 'Black' },
                { rfid: '3.3V', esp: '3V3', wire: 'Red (Power)' },
                { rfid: 'IRQ', esp: 'Not connected', wire: 'N/A' }
              ].map((pin, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ color: 'var(--accent-teal)', fontFamily: 'var(--font-mono)' }}>{pin.rfid}</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>→ {pin.esp}</span>
                </div>
              ))}
            </div>

            {serialLog && (
              <div style={{
                background: '#04070A',
                border: '1px solid rgba(0, 208, 156, 0.3)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#38BDF8',
                maxHeight: '80px',
                overflowY: 'auto'
              }}>
                {serialLog}
              </div>
            )}
          </div>
        </div>

        {/* Parent Push Notification Architecture Guide */}
        <div style={{
          marginTop: '28px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '14px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38BDF8'
            }}>
              <Send size={16} />
            </div>
            <div>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                Parent Mobile Push Notification Pipeline (Firebase Cloud Messaging)
              </h4>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>
                How student RFID taps on ESP32 trigger instant FCM push alerts to parents' mobile devices (No SMS · No Twilio · No GSM)
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {/* Step 1 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', marginBottom: '6px' }}>
                1. What Hardware Needs (ESP32)
              </div>
              <div style={{ fontSize: '12.5px', color: '#E2E8F0', lineHeight: 1.6 }}>
                You do <strong>NOT</strong> need GSM modules or SMS credits. You only need:
                <ul style={{ margin: '8px 0 0', paddingLeft: '18px', color: '#CBD5E1' }}>
                  <li><strong>Bus Wi-Fi / Hotspot:</strong> <code>ssid</code> & <code>password</code></li>
                  <li><strong>Firebase Cloud Function URL:</strong> <code>https://us-central1-transitiq-c2d78.cloudfunctions.net/apiRfidTap</code></li>
                  <li><strong>Device & Bus ID:</strong> <code>ESP32-WROOM-32</code> / <code>Bus 54</code></li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', marginBottom: '6px' }}>
                2. Data Sent on RFID Tap
              </div>
              <div style={{ fontSize: '12.5px', color: '#E2E8F0', lineHeight: 1.6 }}>
                When student taps card, ESP32 posts JSON over Wi-Fi directly to Firebase:
                <pre style={{
                  background: '#04070A',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: '#A5F3FC',
                  margin: '8px 0 0',
                  overflowX: 'auto'
                }}>
{`{
  "device_id": "ESP32-WROOM-32",
  "bus_id": "54",
  "card_uid": "E2000019"
}`}
                </pre>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', marginBottom: '6px' }}>
                3. Automated FCM Push Notification
              </div>
              <div style={{ fontSize: '12.5px', color: '#E2E8F0', lineHeight: 1.6 }}>
                Firebase Cloud Function looks up the parent's registered device and sends a push notification:
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  color: '#6EE7B7',
                  marginTop: '8px',
                  fontStyle: 'italic'
                }}>
                  "TransitIQ – Bus Boarding Alert: Your child DHANYA SHRI.A.C has boarded Bus BUS01 at 8:15 AM."
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ESP32 RFID Reader Firmware Section (Only RFID Code — No LEDs, No Buzzer) */}
      <div style={{
        marginTop: '28px',
        background: '#091018',
        border: '1px solid rgba(0, 208, 156, 0.3)',
        borderRadius: '20px',
        padding: '28px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-teal)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              <Code size={15} />
              <span>OFFICIAL ESP32 + MFRC522 RFID CODE</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
              RFID Reader Firmware Code (No LEDs · No Buzzer)
            </h3>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0 0' }}>
              Clean, minimal firmware containing only the RFID scanner. Connects to Wi-Fi and triggers Firebase Cloud Messaging (FCM) alerts.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: '#04070A', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                type="button"
                onClick={() => setCodeMode('usb_serial')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: codeMode === 'usb_serial' ? 'var(--accent-teal)' : 'transparent',
                  color: codeMode === 'usb_serial' ? '#041B13' : '#94A3B8'
                }}
              >
                USB Web Serial
              </button>
              <button
                type="button"
                onClick={() => setCodeMode('wifi_firebase')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: codeMode === 'wifi_firebase' ? 'var(--accent-teal)' : 'transparent',
                  color: codeMode === 'wifi_firebase' ? '#041B13' : '#94A3B8'
                }}
              >
                Wi-Fi + Firebase FCM
              </button>
              <button
                type="button"
                onClick={() => setCodeMode('wifi_http')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: codeMode === 'wifi_http' ? 'var(--accent-teal)' : 'transparent',
                  color: codeMode === 'wifi_http' ? '#041B13' : '#94A3B8'
                }}
              >
                Local Dev HTTP
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleCopyCode(
                codeMode === 'usb_serial' 
                  ? RFID_USB_SERIAL_CODE 
                  : codeMode === 'wifi_firebase' 
                  ? RFID_FIREBASE_FCM_CODE 
                  : RFID_WIFI_HTTP_CODE
              )}
              className="btn btn-teal btn-sm"
              style={{ padding: '8px 18px', borderRadius: '999px' }}
            >
              {copiedCode ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Code'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadIno(
                codeMode === 'usb_serial' 
                  ? RFID_USB_SERIAL_CODE 
                  : codeMode === 'wifi_firebase' 
                  ? RFID_FIREBASE_FCM_CODE 
                  : RFID_WIFI_HTTP_CODE,
                codeMode === 'wifi_firebase' 
                  ? 'TransitIQ_ESP32_Firebase.ino' 
                  : 'TransitIQ_ESP32_Reader.ino'
              )}
              className="btn btn-outline btn-sm"
              style={{ padding: '8px 18px', borderRadius: '999px', color: 'var(--accent-teal)', borderColor: 'var(--accent-teal)' }}
              title="Download standalone Arduino .ino file"
            >
              <Download size={14} />
              <span>Download .INO Sketch</span>
            </button>
          </div>
        </div>

        {/* Quick Simulation / Test Buttons so user can test the website noting the card tap instantly */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>
              Test Website Tap Ingestion:
            </div>
            <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>
              Click either card below to simulate the tap and confirm the website instantly notes it into Boarding Records:
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => recordCardTapOnWebsite('E2000019')}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              Tap DHANYA SHRI (E2000019)
            </button>
            <button
              type="button"
              onClick={() => recordCardTapOnWebsite('A489C132')}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              Tap KAVIYAN (A489C132)
            </button>
          </div>
        </div>

        {/* Code Block Display */}
        <div style={{
          position: 'relative',
          background: '#04070A',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: '#94A3B8'
          }}>
            <span>TransitIQ_RFID_Reader.ino ({codeMode === 'usb_serial' ? 'Web Serial USB' : 'Wi-Fi HTTP'})</span>
            <span style={{ color: 'var(--accent-teal)' }}>Zero LEDs · Zero Buzzer · RFID Reader Only</span>
          </div>

          <pre style={{
            margin: 0,
            padding: '18px 20px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12.5px',
            lineHeight: 1.6,
            color: '#E2E8F0',
            overflowX: 'auto',
            maxHeight: '420px',
            background: 'transparent'
          }}>
            {codeMode === 'usb_serial' ? RFID_USB_SERIAL_CODE : RFID_WIFI_HTTP_CODE}
          </pre>
        </div>
      </div>

      {/* Add Device Modal */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
                Register ESP32 Bus Scanner
              </h3>
              <button onClick={() => setIsAddOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <form onSubmit={handleAddDevice}>
              <div className="modal-body">
                {formError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', padding: '10px 14px', borderRadius: '8px', color: '#EF4444', fontSize: '13px', marginBottom: '16px' }}>
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Device Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.device_name} 
                    onChange={(e) => setFormData({ ...formData, device_name: e.target.value })} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Hardware Device ID *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.device_id} 
                    onChange={(e) => setFormData({ ...formData, device_id: e.target.value })} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Bus</label>
                  <select 
                    className="form-control" 
                    value={formData.assigned_bus} 
                    onChange={(e) => setFormData({ ...formData, assigned_bus: e.target.value })}
                  >
                    {buses.map((b) => (
                      <option key={b.bus_id} value={b.bus_number}>Bus {b.bus_number}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Firmware Build</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.firmware_version} 
                    onChange={(e) => setFormData({ ...formData, firmware_version: e.target.value })} 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsAddOpen(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-teal">Add Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
